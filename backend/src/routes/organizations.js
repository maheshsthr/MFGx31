import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';

const router = Router();

// ---------------------------------------------------------------
// GET /organizations — current org + its owners/partners.
// The signup partners flow requires owner rows managed here too.
// ---------------------------------------------------------------
router.get(
  '/organizations',
  catchAsync(async (req, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) return fail(res, 403, 'You are not part of an organization yet');

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    if (orgError) return fail(res, 500, orgError.message);

    const { data: owners, error: ownersError } = await supabaseAdmin
      .from('organization_owners')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (ownersError) return fail(res, 500, ownersError.message);

    return res.json({ ...org, owners: owners || [] });
  }),
);

// ---------------------------------------------------------------
// PATCH /organizations — update org settings (admin only).
// ---------------------------------------------------------------
router.patch(
  '/organizations',
  requireAdmin,
  catchAsync(async (req, res) => {
    const orgId = req.user.organization_id;
    if (!orgId) return fail(res, 403, 'You are not part of an organization yet');

    const { name, industry_type, logo_url, ownership_type } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (industry_type !== undefined) updates.industry_type = industry_type;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (ownership_type !== undefined) updates.ownership_type = ownership_type;

    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

// -------- Owners / partners -------------------------------------------------

// POST /organizations/owners — add a partner (admin only).
router.post(
  '/organizations/owners',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { full_name, name, email, role, ownership_share, phone } = req.body || {};
    if (!(full_name || name)?.trim()) return fail(res, 400, 'Owner name is required');
    if (ownership_share !== undefined && (Number(ownership_share) < 0 || Number(ownership_share) > 100)) {
      return fail(res, 400, 'Ownership share must be between 0 and 100');
    }
    const { data, error } = await supabaseAdmin
      .from('organization_owners')
      .insert({
        organization_id: req.user.organization_id,
        full_name: (full_name || name).trim(),
        email: email || null,
        role: role || 'Partner',
        ownership_share: Number(ownership_share) || 0,
        phone: phone || null,
      })
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.status(201).json(data);
  }),
);

// PATCH /organizations/owners/:id — update a partner (admin only).
router.patch(
  '/organizations/owners/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { full_name, name, email, role, ownership_share, phone, is_primary } = req.body || {};
    const updates = {};
    if (full_name !== undefined || name !== undefined) updates.full_name = (full_name || name);
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (ownership_share !== undefined) updates.ownership_share = Number(ownership_share);
    if (phone !== undefined) updates.phone = phone;
    if (is_primary !== undefined) updates.is_primary = Boolean(is_primary);

    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error } = await supabaseAdmin
      .from('organization_owners')
      .update(updates)
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

// DELETE /organizations/owners/:id — remove a partner (admin only).
router.delete(
  '/organizations/owners/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('organization_owners')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    return res.json(data);
  }),
);

export { router as organizationsRouter };