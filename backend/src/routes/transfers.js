import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';
import { notify } from '../lib/notifications.js';

const router = Router();

const DEPT_TABLE = 'departments';
const ITEM_MAP = {
  employee: 'employees',
  machinery: 'machinery',
  resource: 'resources',
};

/**
 * Enrich transfers rows with human-readable names (item, from/to department,
 * who performed the transfer, who reviewed it) so the frontend tables can
 * render directly.
 */
async function enrichTransfers(rows) {
  const out = rows || [];
  const orgId = out[0]?.organization_id;

  // Batch fetch departments involved.
  const deptIds = [
    ...new Set(out.flatMap((t) => [t.from_department_id, t.to_department_id]).filter(Boolean)),
  ];

  // Batch fetch transferring users.
  const userIds = [...new Set(out.map((t) => t.transferred_by).filter(Boolean))];

  // Batch fetch reviewer (admin) names.
  const reviewerIds = [...new Set(out.map((t) => t.reviewed_by).filter(Boolean))];

  // Run all enrichment lookups in parallel.
  const [deptRes, userRes, reviewerRes] = await Promise.all([
    deptIds.length && orgId
      ? supabaseAdmin.from(DEPT_TABLE).select('id, name').in('id', deptIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabaseAdmin.from('profiles').select('id, full_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    reviewerIds.length
      ? supabaseAdmin.from('profiles').select('id, full_name').in('id', reviewerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const deptNames = (deptRes.data || []).reduce((acc, d) => {
    acc[d.id] = d.name;
    return acc;
  }, {});
  const userNames = (userRes.data || []).reduce((acc, u) => {
    acc[u.id] = u.full_name;
    return acc;
  }, {});
  const reviewerNames = (reviewerRes.data || []).reduce((acc, u) => {
    acc[u.id] = u.full_name;
    return acc;
  }, {});

  // Batch fetch item names, grouped by type (parallel across types).
  const itemNames = {};
  await Promise.all(
    Object.keys(ITEM_MAP).map(async (type) => {
      const ids = [...new Set(out.filter((t) => t.item_type === type).map((t) => t.item_id))];
      if (!ids.length) return;
      const { data } = await supabaseAdmin
        .from(ITEM_MAP[type])
        .select('id, name')
        .in('id', ids);
      (data || []).forEach((d) => {
        itemNames[d.id] = d.name;
      });
    }),
  );

  return out.map((t) => ({
    ...t,
    item_name: itemNames[t.item_id] || null,
    from_name: t.from_department_id ? deptNames[t.from_department_id] || null : null,
    to_name: t.to_department_id ? deptNames[t.to_department_id] || null : null,
    transferred_by_name: t.transferred_by ? userNames[t.transferred_by] || null : null,
    reviewed_by_name: t.reviewed_by ? reviewerNames[t.reviewed_by] || null : null,
  }));
}

// ---------------------------------------------------------------
// GET /transfers — list history. Filterable by ?department_id / ?item_type / ?status.
// Dept heads only see transfers touching their own department.
// ---------------------------------------------------------------
router.get(
  '/transfers',
  catchAsync(async (req, res) => {
    let query = supabaseAdmin
      .from('transfers')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('transferred_at', { ascending: false });

    if (req.user.role !== 'admin') {
      const dept = req.user.department_id;
      const { data: touching } = await supabaseAdmin
        .from('transfers')
        .select('id')
        .or(`from_department_id.eq.${dept},to_department_id.eq.${dept}`)
        .eq('organization_id', req.user.organization_id);
      const ids = (touching || []).map((t) => t.id);
      if (!ids.length) return res.json([]);
      query = query.in('id', ids);
    } else if (req.query.department_id) {
      query = query.or(
        `from_department_id.eq.${req.query.department_id},to_department_id.eq.${req.query.department_id}`,
      );
    }

    if (req.query.item_type) {
      if (!['employee', 'machinery', 'resource'].includes(req.query.item_type)) {
        return fail(res, 400, 'Invalid item_type filter');
      }
      query = query.eq('item_type', req.query.item_type);
    }

    if (req.query.status) {
      if (!['pending', 'approved', 'rejected'].includes(req.query.status)) {
        return fail(res, 400, 'Invalid status filter');
      }
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return res.json(await enrichTransfers(data || []));
  }),
);

// ---------------------------------------------------------------
// POST /transfers — create a transfer.
//   * Admin: moves the item immediately (approved) via transfer_item RPC.
//   * Dept head: records a PENDING request (item stays put) awaiting admin
//     approval — approval endpoint actually performs the move.
// ---------------------------------------------------------------
router.post(
  '/transfers',
  catchAsync(async (req, res) => {
    const { item_type, item_id, to_department_id, reason } = req.body || {};
    if (!item_type || !item_id || !to_department_id) {
      return fail(res, 400, 'item_type, item_id and to_department_id are required');
    }
    if (!['employee', 'machinery', 'resource'].includes(item_type)) {
      return fail(res, 400, 'Invalid item_type');
    }

    // to_department must belong to the caller's organization.
    const { data: toDept } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .eq('id', to_department_id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!toDept) return fail(res, 400, 'Target department not found in your organization');

    // Fetch the item's current department to enforce dept-head scope.
    const table = ITEM_MAP[item_type];
    const { data: item } = await supabaseAdmin
      .from(table)
      .select('id, department_id, name')
      .eq('id', item_id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!item) return fail(res, 404, `${item_type} not found in your organization`);
    if (item.department_id === to_department_id) {
      return fail(res, 400, 'Cannot transfer to the same department');
    }
    if (req.user.role !== 'admin' && item.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only transfer items out of your own department');
    }

    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      // Admin: move immediately + log as approved.
      const { data, error } = await supabaseAdmin.rpc('transfer_item', {
        p_organization_id: req.user.organization_id,
        p_item_type: item_type,
        p_item_id: item_id,
        p_to_department_id: to_department_id,
        p_reason: reason || null,
        p_transferred_by: req.user.id,
      });
      if (error) return fail(res, 400, error.message || 'Transfer failed');
      const [enriched] = await enrichTransfers([data]);
      const row = enriched || data;
      notify({
        organization_id: req.user.organization_id,
        actor: req.user,
        type: 'transfer.moved',
        title: 'Item transferred',
        message: `"${row.item_name || item.name}" moved from ${row.from_name || 'source'} to ${row.to_name || toDept.name}.`,
        entity_type: 'transfer',
        entity_id: data.id,
        link: '/transfers',
      });
      return res.status(201).json(row);
    }

    // Dept head: create a PENDING request; item does NOT move yet.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('transfers')
      .insert({
        organization_id: req.user.organization_id,
        item_type,
        item_id,
        from_department_id: item.department_id,
        to_department_id,
        transferred_by: req.user.id,
        reason: reason || null,
        status: 'pending',
      })
      .select()
      .single();
    if (insertError) return fail(res, 500, insertError.message);

    const [enriched] = await enrichTransfers([inserted]);
    const row = enriched || inserted;
    const fromDeptName =
      row.from_name ||
      (await supabaseAdmin
        .from('departments')
        .select('name')
        .eq('id', item.department_id)
        .maybeSingle()).data?.name;
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: 'transfer.requested',
      title: 'Transfer request',
      message: `Requested to move "${row.item_name || item.name}" from ${fromDeptName || 'source'} to ${row.to_name || toDept.name} — pending approval.`,
      entity_type: 'transfer',
      entity_id: inserted.id,
      link: '/transfers',
    });
    return res.status(201).json(row);
  }),
);

// ---------------------------------------------------------------
// POST /transfers/:id/approve — admin approves a pending transfer.
// Moves the item to the target department + marks approved (atomic).
// ---------------------------------------------------------------
router.post(
  '/transfers/:id/approve',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { note } = req.body || {};
    const { data, error } = await supabaseAdmin.rpc('approve_transfer', {
      p_transfer_id: req.params.id,
      p_organization_id: req.user.organization_id,
      p_reviewed_by: req.user.id,
      p_review_note: note || null,
    });
    if (error) return fail(res, 400, error.message || 'Approval failed');
    const [enriched] = await enrichTransfers([data]);
    const row = enriched || data;
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: 'transfer.approved',
      title: 'Transfer approved',
      message: `Approved moving "${row.item_name || 'item'}" from ${row.from_name || 'source'} to ${row.to_name || 'target'}.`,
      entity_type: 'transfer',
      entity_id: req.params.id,
      link: '/transfers',
    });
    return res.json(row);
  }),
);

// ---------------------------------------------------------------
// POST /transfers/:id/reject — admin rejects a pending transfer.
// Item stays where it is; transfer marked rejected.
// ---------------------------------------------------------------
router.post(
  '/transfers/:id/reject',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { note } = req.body || {};
    const { data, error } = await supabaseAdmin.rpc('reject_transfer', {
      p_transfer_id: req.params.id,
      p_organization_id: req.user.organization_id,
      p_reviewed_by: req.user.id,
      p_review_note: note || null,
    });
    if (error) return fail(res, 400, error.message || 'Rejection failed');
    const [enriched] = await enrichTransfers([data]);
    const row = enriched || data;
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: 'transfer.rejected',
      title: 'Transfer rejected',
      message: `Rejected moving "${row.item_name || 'item'}" from ${row.from_name || 'source'} to ${row.to_name || 'target'}.`,
      entity_type: 'transfer',
      entity_id: req.params.id,
      link: '/transfers',
    });
    return res.json(row);
  }),
);

export { router as transfersRouter };