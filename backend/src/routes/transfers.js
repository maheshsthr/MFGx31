import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';

const router = Router();

const DEPT_TABLE = 'departments';
const ITEM_MAP = {
  employee: 'employees',
  machinery: 'machinery',
  resource: 'resources',
};

/**
 * Enrich transfers rows with human-readable names (item, from/to department,
 * who performed the transfer) so the frontend tables can render directly,
 * matching the shape the dummy data used (item_name/from_name/to_name/...).
 */
async function enrichTransfers(rows) {
  const out = rows || [];
  const orgId = out[0]?.organization_id;

  // Batch fetch departments involved.
  const deptIds = [
    ...new Set(out.flatMap((t) => [t.from_department_id, t.to_department_id]).filter(Boolean)),
  ];
  let deptNames = {};
  if (deptIds.length && orgId) {
    const { data } = await supabaseAdmin
      .from(DEPT_TABLE)
      .select('id, name')
      .in('id', deptIds);
    deptNames = (data || []).reduce((acc, d) => {
      acc[d.id] = d.name;
      return acc;
    }, {});
  }

  // Batch fetch transferring users.
  const userIds = [...new Set(out.map((t) => t.transferred_by).filter(Boolean))];
  let userNames = {};
  if (userIds.length) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    userNames = (data || []).reduce((acc, u) => {
      acc[u.id] = u.full_name;
      return acc;
    }, {});
  }

  // Batch fetch item names, grouped by type.
  const itemNames = {};
  for (const type of Object.keys(ITEM_MAP)) {
    const ids = [...new Set(out.filter((t) => t.item_type === type).map((t) => t.item_id))];
    if (!ids.length) continue;
    const { data } = await supabaseAdmin
      .from(ITEM_MAP[type])
      .select('id, name')
      .in('id', ids);
    (data || []).forEach((d) => {
      itemNames[d.id] = d.name;
    });
  }

  return out.map((t) => ({
    ...t,
    item_name: itemNames[t.item_id] || null,
    from_name: t.from_department_id ? deptNames[t.from_department_id] || null : null,
    to_name: t.to_department_id ? deptNames[t.to_department_id] || null : null,
    transferred_by_name: t.transferred_by ? userNames[t.transferred_by] || null : null,
  }));
}

// ---------------------------------------------------------------
// GET /transfers — list history. Filterable by ?department_id / ?item_type.
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

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return res.json(await enrichTransfers(data || []));
  }),
);

// ---------------------------------------------------------------
// POST /transfers — create a transfer. Atomic via the transfer_item RPC:
// updates the item's department_id AND inserts the audit row in one call.
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

    const { data, error } = await supabaseAdmin.rpc('transfer_item', {
      p_organization_id: req.user.organization_id,
      p_item_type: item_type,
      p_item_id: item_id,
      p_to_department_id: to_department_id,
      p_reason: reason || null,
      p_transferred_by: req.user.id,
    });

    if (error) {
      return fail(res, 400, error.message || 'Transfer failed');
    }

    const [enriched] = await enrichTransfers([data]);
    return res.status(201).json(enriched || data);
  }),
);

export { router as transfersRouter };