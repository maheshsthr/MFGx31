import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';

const router = Router();

async function enrichDocuments(rows) {
  const userIds = [...new Set((rows || []).map((d) => d.uploaded_by).filter(Boolean))];
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
  return (rows || []).map((d) => ({
    ...d,
    uploaded_by_name: d.uploaded_by ? names[d.uploaded_by] || null : null,
  }));
}

// ---------------------------------------------------------------
// GET /documents — org wide + department documents. Dept heads see
// their own department plus org-wide (department_id null).
// ---------------------------------------------------------------
router.get(
  '/documents',
  catchAsync(async (req, res) => {
    let query = supabaseAdmin
      .from('documents')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('uploaded_at', { ascending: false });

    if (req.user.role !== 'admin') {
      query = query.or(`department_id.is.null,department_id.eq.${req.user.department_id}`);
    } else if (req.query.department_id) {
      if (req.query.include_orgwide === 'true') {
        query = query.or(`department_id.is.null,department_id.eq.${req.query.department_id}`);
      } else {
        query = query.eq('department_id', req.query.department_id);
      }
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    return res.json(await enrichDocuments(data || []));
  }),
);

// ---------------------------------------------------------------
// GET /documents/:id
// ---------------------------------------------------------------
router.get(
  '/documents/:id',
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id);
    if (error) return fail(res, 500, error.message);
    const row = (data || [])[0];
    if (!row) return fail(res, 404, 'Document not found');
    if (
      req.user.role !== 'admin' &&
      row.department_id !== null &&
      row.department_id !== req.user.department_id
    ) {
      return fail(res, 403, 'You can only view your own department or org-wide documents');
    }
    const [enriched] = await enrichDocuments([row]);
    return res.json(enriched);
  }),
);

// ---------------------------------------------------------------
// POST /documents — create (admin only). department_id null = org-wide.
// title + file_url (Supabase Storage URL) are stored directly.
// ---------------------------------------------------------------
router.post(
  '/documents',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { title, file_url, department_id } = req.body || {};
    if (!title?.trim()) return fail(res, 400, 'Document title is required');

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
      .from('documents')
      .insert({
        organization_id: req.user.organization_id,
        department_id: department_id || null,
        title: title.trim(),
        file_url: file_url || null,
        uploaded_by: req.user.id,
      })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.status(201).json(data);
  }),
);

// ---------------------------------------------------------------
// PATCH /documents/:id — update (admin only).
// ---------------------------------------------------------------
router.patch(
  '/documents/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { title, file_url, department_id } = req.body || {};
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (file_url !== undefined) updates.file_url = file_url;
    if (department_id !== undefined) updates.department_id = department_id || null;
    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error } = await supabaseAdmin
      .from('documents')
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
// DELETE /documents/:id — remove (admin only).
// ---------------------------------------------------------------
router.delete(
  '/documents/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

export { router as documentsRouter };