import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';

const router = Router();

/** Verify a department belongs to the caller's organization. */
async function departmentInOrg(deptId, orgId) {
  const { data } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('id', deptId)
    .eq('organization_id', orgId)
    .maybeSingle();
  return !!data;
}

/** Effective department id for a create: admin may choose; dept head forced to own. */
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
// GET /employees — list (org scoped; dept heads see only their own).
// ---------------------------------------------------------------
router.get(
  '/employees',
  catchAsync(async (req, res) => {
    let query = supabaseAdmin
      .from('employees')
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
// GET /employees/:id
// ---------------------------------------------------------------
router.get(
  '/employees/:id',
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id);
    if (error) return fail(res, 500, error.message);
    const row = (data || [])[0];
    if (!row) return fail(res, 404, 'Employee not found');
    if (req.user.role !== 'admin' && row.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only access your own department');
    }
    return res.json(row);
  }),
);

// ---------------------------------------------------------------
// POST /employees — create. Dept heads can only add to their own dept.
// ---------------------------------------------------------------
router.post(
  '/employees',
  catchAsync(async (req, res) => {
    const { name, designation, contact_number, joining_date, status, department_id } = req.body || {};
    if (!name?.trim()) return fail(res, 400, 'Employee name is required');

    const dept = await resolveCreateDept(req, department_id);
    if (dept.error) return fail(res, 403, dept.error);
    if (!dept.id) return fail(res, 400, 'department_id is required');

    const { data, error } = await supabaseAdmin
      .from('employees')
      .insert({
        organization_id: req.user.organization_id,
        department_id: dept.id,
        name: name.trim(),
        designation: designation || null,
        contact_number: contact_number || null,
        joining_date: joining_date || null,
        status: status || 'active',
      })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.status(201).json(data);
  }),
);

// ---------------------------------------------------------------
// PATCH /employees/:id — update (scoped). Department moves go through
// the /transfers endpoint, so department_id is intentionally ignored.
// ---------------------------------------------------------------
router.patch(
  '/employees/:id',
  catchAsync(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('employees')
      .select('department_id')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!existing) return fail(res, 404, 'Employee not found');
    if (req.user.role !== 'admin' && existing.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only edit your own department');
    }

    const { name, designation, contact_number, joining_date, status } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (designation !== undefined) updates.designation = designation;
    if (contact_number !== undefined) updates.contact_number = contact_number;
    if (joining_date !== undefined) updates.joining_date = joining_date;
    if (status !== undefined) {
      if (!['active', 'transferred', 'inactive'].includes(status)) {
        return fail(res, 400, 'Invalid status');
      }
      updates.status = status;
    }
    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error } = await supabaseAdmin
      .from('employees')
      .update(updates)
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

// ---------------------------------------------------------------
// DELETE /employees/:id — remove (scoped).
// ---------------------------------------------------------------
router.delete(
  '/employees/:id',
  catchAsync(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('employees')
      .select('department_id')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!existing) return fail(res, 404, 'Employee not found');
    if (req.user.role !== 'admin' && existing.department_id !== req.user.department_id) {
      return fail(res, 403, 'You can only delete from your own department');
    }

    const { data, error } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

export { router as employeesRouter };