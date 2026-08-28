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
// GET /resources — list (org scoped; dept heads see only their own).
// ---------------------------------------------------------------
router.get(
  '/resources',
  catchAsync(async (req, res) => {
    let query = supabaseAdmin
      .from('resources')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('last_updated', { ascending: false });

    if (req.user.role !== 'admin') {
      query = query.eq('department_id', req.user.department_id);
    } else if (req.query.department_id) {
      query = query.eq('department_id', req.query.department_id);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return res.json(data || []);
  }),
);

// ---------------------------------------------------------------
// GET /resources/:id
// ---------------------------------------------------------------
router.get(
  '/resources/:id',
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id);
    if (error) return fail(res, 500, error.message);
    const row = (data || [])[0];
    if (!row) return fail(res, 404, 'Resource not found');
    if (req.user.role !== 'admin' && row.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only access your own department');
    }
    return res.json(row);
  }),
);

// ---------------------------------------------------------------
// POST /resources — create. Dept heads can only add to their own dept.
// ---------------------------------------------------------------
router.post(
  '/resources',
  catchAsync(async (req, res) => {
    const { name, category, quantity, unit, department_id } = req.body || {};
    if (!name?.trim()) return fail(res, 400, 'Resource name is required');

    const dept = await resolveCreateDept(req, department_id);
    if (dept.error) return fail(res, 403, dept.error);
    if (!dept.id) return fail(res, 400, 'department_id is required');

    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert({
        organization_id: req.user.organization_id,
        department_id: dept.id,
        name: name.trim(),
        category: category || null,
        quantity: quantity === undefined ? 0 : Number(quantity),
        unit: unit || null,
      })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    const dName = await deptName(dept.id);
    const actorIsAdmin = req.user.role === 'admin';
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: actorIsAdmin ? 'resource.created.admin' : 'resource.created',
      title: 'Resource added',
      message: actorIsAdmin
        ? `Resource "${data.name}" added to ${dName}.`
        : `${dName} added resource "${data.name}".`,
      entity_type: 'resource',
      entity_id: data.id,
      link: '/resources',
    });

    return res.status(201).json(data);
  }),
);

// ---------------------------------------------------------------
// PATCH /resources/:id — update (scoped). Moves go through /transfers.
// ---------------------------------------------------------------
router.patch(
  '/resources/:id',
  catchAsync(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('resources')
      .select('department_id, name')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!existing) return fail(res, 404, 'Resource not found');
    if (req.user.role !== 'admin' && existing.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only edit your own department');
    }

    const { name, category, quantity, unit } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (unit !== undefined) updates.unit = unit;
    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');
    updates.last_updated = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('resources')
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
      type: actorIsAdmin ? 'resource.updated.admin' : 'resource.updated',
      title: 'Resource updated',
      message: `${actor} updated resource "${data.name || existing.name}".`,
      entity_type: 'resource',
      entity_id: data.id,
      link: '/resources',
    });

    return res.json(data);
  }),
);

// ---------------------------------------------------------------
// DELETE /resources/:id — remove (scoped).
// ---------------------------------------------------------------
router.delete(
  '/resources/:id',
  catchAsync(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('resources')
      .select('department_id, name')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!existing) return fail(res, 404, 'Resource not found');
    if (req.user.role !== 'admin' && existing.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only delete from your own department');
    }

    const dName = await deptName(existing.department_id);
    const actorIsAdmin = req.user.role === 'admin';
    const actor = actorIsAdmin ? 'An admin' : `${dName}`;
    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: actorIsAdmin ? 'resource.deleted.admin' : 'resource.deleted',
      title: 'Resource removed',
      message: `${actor} removed resource "${existing.name}".`,
      entity_type: 'resource',
      entity_id: req.params.id,
      link: '/resources',
    });

    const { data, error } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

export { router as resourcesRouter };