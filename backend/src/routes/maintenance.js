import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';
import { notify } from '../lib/notifications.js';

const router = Router();

const VALID_WORK = ['maintenance', 'repair', 'inspection'];
const VALID_STATUS = ['scheduled', 'in_progress', 'completed'];

async function machineInScope(req, machineryId) {
  const { data } = await supabaseAdmin
    .from('machinery')
    .select('id, name, department_id')
    .eq('id', machineryId)
    .eq('organization_id', req.user.organization_id)
    .maybeSingle();
  if (!data) return { error: 'Machinery not found in this organization' };
  if (req.user.role !== 'admin' && data.department_id !== req.user.department_id) {
    return { error: 'You can only access your own department' };
  }
  return { machine: data };
}

async function recordInScope(req, machineryId, mid) {
  const { data, error } = await supabaseAdmin
    .from('machine_maintenance')
    .select('*')
    .eq('id', mid)
    .eq('machinery_id', machineryId)
    .eq('organization_id', req.user.organization_id)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: 'Maintenance record not found' };
  if (req.user.role !== 'admin' && data.department_id !== req.user.department_id) {
    return { error: 'You can only access your own department' };
  }
  return { record: data };
}

async function setMachineMaintenanceStatus(machine, keepWorking) {
  const { error } = await supabaseAdmin
    .from('machinery')
    .update({ status: keepWorking ? 'working' : 'maintenance' })
    .eq('id', machine.id)
    .eq('organization_id', machine.organization_id);
  if (error) console.error('setMachineMaintenanceStatus failed:', error.message);
}

// ---------------------------------------------------------------
// GET /machinery/:id/maintenance -- full history for one machine
// ---------------------------------------------------------------
router.get(
  '/machinery/:id/maintenance',
  catchAsync(async (req, res) => {
    const { machine, error } = await machineInScope(req, req.params.id);
    if (error) return fail(res, 403, error);

    const { data, error: err } = await supabaseAdmin
      .from('machine_maintenance')
      .select('*')
      .eq('machinery_id', machine.id)
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: false });
    if (err) return fail(res, 500, err.message);
    return res.json(data || []);
  }),
);

// ---------------------------------------------------------------
// POST /machinery/:id/maintenance -- add a maintenance/repair record
// ---------------------------------------------------------------
router.post(
  '/machinery/:id/maintenance',
  catchAsync(async (req, res) => {
    const { machine, error } = await machineInScope(req, req.params.id);
    if (error) return fail(res, 403, error);

    const { work_type, title, description, cost, scheduled_date, completed_date, status } = req.body || {};
    if (!title?.trim()) return fail(res, 400, 'Title is required');
    if (work_type && !VALID_WORK.includes(work_type)) return fail(res, 400, 'Invalid work type');
    if (status && !VALID_STATUS.includes(status)) return fail(res, 400, 'Invalid status');

    const { data, error: err } = await supabaseAdmin
      .from('machine_maintenance')
      .insert({
        organization_id: req.user.organization_id,
        department_id: machine.department_id,
        machinery_id: machine.id,
        work_type: work_type || 'maintenance',
        title: title.trim(),
        description: description || null,
        cost: cost != null && cost !== '' ? cost : null,
        scheduled_date: scheduled_date || null,
        completed_date: completed_date || null,
        status: status || 'scheduled',
        created_by: req.user.id,
      })
      .select()
      .single();
    if (err) return fail(res, 500, err.message);

    if ((data.status || 'scheduled') !== 'completed') {
      await setMachineMaintenanceStatus({ id: machine.id, organization_id: req.user.organization_id }, false);
    }

    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: req.user.role === 'admin' ? 'maintenance.created.admin' : 'maintenance.created',
      title: 'Maintenance scheduled',
      message: `"${machine.name}" — ${data.title}.`,
      entity_type: 'machinery',
      entity_id: machine.id,
      link: `/machinery`,
    });

    return res.status(201).json(data);
  }),
);

// ---------------------------------------------------------------
// PATCH /machinery/:id/maintenance/:mid -- update record
// ---------------------------------------------------------------
router.patch(
  '/machinery/:id/maintenance/:mid',
  catchAsync(async (req, res) => {
    const { record, error } = await recordInScope(req, req.params.id, req.params.mid);
    if (error) return fail(res, 404, error);

    const { work_type, title, description, cost, scheduled_date, completed_date, status } = req.body || {};
    const updates = {};
    if (work_type !== undefined) {
      if (!VALID_WORK.includes(work_type)) return fail(res, 400, 'Invalid work type');
      updates.work_type = work_type;
    }
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (cost !== undefined) updates.cost = cost === '' ? null : cost;
    if (scheduled_date !== undefined) updates.scheduled_date = scheduled_date || null;
    if (completed_date !== undefined) updates.completed_date = completed_date || null;
    if (status !== undefined) {
      if (!VALID_STATUS.includes(status)) return fail(res, 400, 'Invalid status');
      updates.status = status;
    }
    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error: err } = await supabaseAdmin
      .from('machine_maintenance')
      .update(updates)
      .eq('id', req.params.mid)
      .eq('machinery_id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (err) return fail(res, 500, err.message);

    const finalStatus = data.status || 'scheduled';
    const { data: activeCount } = await supabaseAdmin
      .from('machine_maintenance')
      .select('id', { count: 'exact', head: true })
      .eq('machinery_id', req.params.id)
      .in('status', ['scheduled', 'in_progress']);
    if (activeCount > 0) {
      await setMachineMaintenanceStatus({ id: req.params.id, organization_id: req.user.organization_id }, false);
    } else if (finalStatus === 'completed') {
      await setMachineMaintenanceStatus({ id: req.params.id, organization_id: req.user.organization_id }, true);
    }

    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: req.user.role === 'admin' ? 'maintenance.updated.admin' : 'maintenance.updated',
      title: 'Maintenance updated',
      message: `"${data.title}" updated.`,
      entity_type: 'machinery',
      entity_id: req.params.id,
      link: `/machinery`,
    });

    return res.json(data);
  }),
);

// ---------------------------------------------------------------
// DELETE /machinery/:id/maintenance/:mid -- remove a record
// ---------------------------------------------------------------
router.delete(
  '/machinery/:id/maintenance/:mid',
  catchAsync(async (req, res) => {
    const { error } = await recordInScope(req, req.params.id, req.params.mid);
    if (error) return fail(res, 404, error);

    const { data, error: err } = await supabaseAdmin
      .from('machine_maintenance')
      .delete()
      .eq('id', req.params.mid)
      .eq('machinery_id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (err) return fail(res, 500, err.message);

    const { data: activeCount } = await supabaseAdmin
      .from('machine_maintenance')
      .select('id', { count: 'exact', head: true })
      .eq('machinery_id', req.params.id)
      .in('status', ['scheduled', 'in_progress']);
    if (activeCount === 0) {
      await setMachineMaintenanceStatus({ id: req.params.id, organization_id: req.user.organization_id }, true);
    }

    return res.json(data);
  }),
);

export { router as maintenanceRouter };
