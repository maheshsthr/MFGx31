import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';

const router = Router();

async function enrichEvents(rows) {
  const userIds = [...new Set((rows || []).map((e) => e.created_by).filter(Boolean))];
  let names = {};
  if (userIds.length) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    names = (data || []).reduce((acc, u) => {
      acc[u.id] = u.full_name;
      return acc;
    }, {});
  }
  return (rows || []).map((e) => ({
    ...e,
    created_by_name: e.created_by ? names[e.created_by] || null : null,
  }));
}

// ---------------------------------------------------------------
// GET /events — org wide + department events. Dept heads see their
// own department events plus org-wide (department_id null) events.
// ---------------------------------------------------------------
router.get(
  '/events',
  catchAsync(async (req, res) => {
    let query = supabaseAdmin
      .from('events')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('event_date', { ascending: false });

    if (req.user.role !== 'admin') {
      query = query.or(`department_id.is.null,department_id.eq.${req.user.department_id}`);
    } else if (req.query.department_id) {
      query = query.eq('department_id', req.query.department_id);
      // treat "all"/null dept filter as org-wide too when explicitly requested
      if (req.query.include_orgwide === 'true') {
        query = query.or(`department_id.is.null,department_id.eq.${req.query.department_id}`);
      }
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return res.json(await enrichEvents(data || []));
  }),
);

// ---------------------------------------------------------------
// GET /events/:id
// ---------------------------------------------------------------
router.get(
  '/events/:id',
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id);
    if (error) return fail(res, 500, error.message);
    const row = (data || [])[0];
    if (!row) return fail(res, 404, 'Event not found');
    if (
      req.user.role !== 'admin' &&
      row.department_id !== null &&
      row.department_id !== req.user.department_id
    ) {
      return fail(res, 403, 'You can only view your own department or org-wide events');
    }
    const [enriched] = await enrichEvents([row]);
    return res.json(enriched);
  }),
);

// ---------------------------------------------------------------
// POST /events — create (admin only). department_id null = org-wide.
// ---------------------------------------------------------------
router.post(
  '/events',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { title, description, event_date, department_id } = req.body || {};
    if (!title?.trim()) return fail(res, 400, 'Event title is required');

    if (department_id) {
      const { data: dept } = await supabaseAdmin
        .from('departments')
        .select('id')
        .eq('id', department_id)
        .eq('organization_id', req.user.organization_id)
        .maybeSingle();
      if (!dept) return fail(res, 400, 'Invalid department');
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        organization_id: req.user.organization_id,
        department_id: department_id || null,
        title: title.trim(),
        description: description || null,
        event_date: event_date || null,
        created_by: req.user.id,
      })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.status(201).json(data);
  }),
);

// ---------------------------------------------------------------
// PATCH /events/:id — update (admin only).
// ---------------------------------------------------------------
router.patch(
  '/events/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { title, description, event_date, department_id } = req.body || {};
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (event_date !== undefined) updates.event_date = event_date;
    if (department_id !== undefined) updates.department_id = department_id || null;
    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error } = await supabaseAdmin
      .from('events')
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
// DELETE /events/:id — remove (admin only).
// ---------------------------------------------------------------
router.delete(
  '/events/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

export { router as eventsRouter };