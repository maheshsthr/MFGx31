import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';
import { notify } from '../lib/notifications.js';

const router = Router();

async function deptName(deptId) {
  if (!deptId) return 'Department';
  const { data } = await supabaseAdmin
    .from('departments')
    .select('name')
    .eq('id', deptId)
    .maybeSingle();
  return data?.name || 'Department';
}

async function departmentInOrg(deptId, orgId) {
  const { data } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('id', deptId)
    .eq('organization_id', orgId)
    .maybeSingle();
  return !!data;
}

async function resolveCreateDept(req, deptId) {
  if (req.user.role !== 'admin') {
    if (deptId && deptId !== req.user.department_id) {
      return { error: 'You can only add to your own department' };
    }
    return { id: req.user.department_id };
  }
  if (!deptId) return { error: 'department_id is required' };
  if (!(await departmentInOrg(deptId, req.user.organization_id))) {
    return { error: 'Invalid department' };
  }
  return { id: deptId };
}

// ---------------------------------------------------------------
// GET /machinery — list (org scoped; dept heads see only their own).
// ---------------------------------------------------------------
router.get(
  '/machinery',
  catchAsync(async (req, res) => {
    let query = supabaseAdmin
      .from('machinery')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: false });

    if (req.user.role !== 'admin') {
      query = query.eq('department_id', req.user.department_id);
    } else if (req.query.department_id) {
      query = query.eq('department_id', req.query.department_id);
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return res.json(data || []);
  }),
);

// ---------------------------------------------------------------
// GET /machinery/:id
// ---------------------------------------------------------------
router.get(
  '/machinery/:id',
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('machinery')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id);
    if (error) return fail(res, 500, error.message);
    const row = (data || [])[0];
    if (!row) return fail(res, 404, 'Machinery not found');
    if (req.user.role !== 'admin' && row.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only access your own department');
    }
    return res.json(row);
  }),
);

// ---------------------------------------------------------------
// POST /machinery — create. Dept heads can only add to their own dept.
// ---------------------------------------------------------------
router.post(
  '/machinery',
  catchAsync(async (req, res) => {
    const { name, type, status, purchase_date, notes, department_id } = req.body || {};
    if (!name?.trim()) return fail(res, 400, 'Machinery name is required');

    const dept = await resolveCreateDept(req, department_id);
    if (dept.error) return fail(res, 403, dept.error);
    if (!dept.id) return fail(res, 400, 'department_id is required');

    const { data, error } = await supabaseAdmin
      .from('machinery')
      .insert({
        organization_id: req.user.organization_id,
        department_id: dept.id,
        name: name.trim(),
        type: type || null,
        status: status || 'working',
        purchase_date: purchase_date || null,
        notes: notes || null,
      })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    const dName = await deptName(dept.id);
    const actorIsAdmin = req.user.role === 'admin';
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: actorIsAdmin ? 'machinery.created.admin' : 'machinery.created',
      title: 'Machinery added',
      message: actorIsAdmin
        ? `Machinery "${data.name}" added to ${dName}.`
        : `${dName} added machinery "${data.name}".`,
      entity_type: 'machinery',
      entity_id: data.id,
      link: '/machinery',
    });

    return res.status(201).json(data);
  }),
);

// ---------------------------------------------------------------
// PATCH /machinery/:id — update (scoped). Moves go through /transfers.
// ---------------------------------------------------------------
router.patch(
  '/machinery/:id',
  catchAsync(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('machinery')
      .select('department_id, name')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!existing) return fail(res, 404, 'Machinery not found');
    if (req.user.role !== 'admin' && existing.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only edit your own department');
    }

    const { name, type, status, purchase_date, notes } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (purchase_date !== undefined) updates.purchase_date = purchase_date;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) {
      if (!['working', 'maintenance', 'idle'].includes(status)) {
        return fail(res, 400, 'Invalid status');
      }
      updates.status = status;
    }
    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error } = await supabaseAdmin
      .from('machinery')
      .update(updates)
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    const dName = await deptName(existing.department_id);
    const actorIsAdmin = req.user.role === 'admin';
    const actor = actorIsAdmin ? 'An admin' : `${dName}`;
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: actorIsAdmin ? 'machinery.updated.admin' : 'machinery.updated',
      title: 'Machinery updated',
      message: `${actor} updated machinery "${data.name || existing.name}".`,
      entity_type: 'machinery',
      entity_id: data.id,
      link: '/machinery',
    });

    return res.json(data);
  }),
);

// ---------------------------------------------------------------
// DELETE /machinery/:id — remove (scoped).
// ---------------------------------------------------------------
router.delete(
  '/machinery/:id',
  catchAsync(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('machinery')
      .select('department_id, name')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!existing) return fail(res, 404, 'Machinery not found');
    if (req.user.role !== 'admin' && existing.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only delete from your own department');
    }

    const dName = await deptName(existing.department_id);
    const actorIsAdmin = req.user.role === 'admin';
    const actor = actorIsAdmin ? 'An admin' : `${dName}`;
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: actorIsAdmin ? 'machinery.deleted.admin' : 'machinery.deleted',
      title: 'Machinery removed',
      message: `${actor} removed machinery "${existing.name}".`,
      entity_type: 'machinery',
      entity_id: req.params.id,
      link: '/machinery',
    });

    const { data, error } = await supabaseAdmin
      .from('machinery')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

export { router as machineryRouter };