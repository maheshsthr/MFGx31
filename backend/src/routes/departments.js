import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';
import { notify } from '../lib/notifications.js';

const router = Router();

/** Find an auth user by email (server-side Auth Admin lookup). Returns the user or null. */
async function getUserByEmail(email) {
  const target = (email || '').trim().toLowerCase();
  if (!target) return null;
  let page = 1;
  const perPage = 1000;
  while (page <= 5) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data?.users || [];
    // eslint-disable-next-line no-await-in-loop
    const hit = users.find((u) => (u.email || '').toLowerCase() === target);
    if (hit) return hit;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

// ---------------------------------------------------------------
// GET /departments — list. Admins see the whole org; dept heads
// only their own department (to keep it simple on the list API).
// ---------------------------------------------------------------
router.get(
  '/departments',
  catchAsync(async (req, res) => {
    // ?targets=1 or ?targets=true returns all org departments (id, name) for
    // transfer targeting, even for dept heads (they need to see every
    // department they can send to).
    if (req.query.targets === 'true' || req.query.targets === '1') {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('id, name')
        .eq('organization_id', req.user.organization_id)
        .order('name', { ascending: true });
      if (error) return fail(res, 500, error.message);
      return res.json(data || []);
    }

    let query = supabaseAdmin
      .from('departments')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: true });

    if (req.user.role !== 'admin' && req.user.department_id) {
      query = query.eq('id', req.user.department_id);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);

    // Attach head profile name if present.
    const deptIds = (data || []).filter((d) => d.head_profile_id).map((d) => d.head_profile_id);
    let headNames = {};
    if (deptIds.length) {
      const { data: heads } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', deptIds);
      headNames = (heads || []).reduce((acc, h) => {
        acc[h.id] = h;
        return acc;
      }, {});
    }
    const result = (data || []).map((d) => ({
      ...d,
      head: d.head_profile_id ? headNames[d.head_profile_id] || null : null,
    }));

    return res.json(result);
  }),
);

// ---------------------------------------------------------------
// GET /departments/:id — a single department.
// ---------------------------------------------------------------
router.get(
  '/departments/:id',
  catchAsync(async (req, res) => {
    if (req.user.role !== 'admin' && req.user.department_id !== req.params.id) {
      return fail(res, 403, 'You can only view your own department');
    }
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .single();
    if (error) return fail(res, 404, 'Department not found');
    return res.json(data);
  }),
);

// ---------------------------------------------------------------
// POST /departments — create (admin only). Optionally provisions a
// department-head auth account with the allotted email/password.
// ---------------------------------------------------------------
router.post(
  '/departments',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { name, description, address, head_name, head_email, head_password } = req.body || {};
    if (!name?.trim()) return fail(res, 400, 'Department name is required');

    let headProfileId = null;

    // Provision a department-head account out-of-band (server-side Auth Admin).
    if (head_email && head_password) {
      try {
        const existingUser = await getUserByEmail(head_email);
        if (existingUser) {
          return fail(
            res,
            409,
            'A user with this email already exists. Use a different email to provision this department head.',
          );
        }
      } catch (e) {
        return fail(res, 500, e.message);
      }
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: head_email.trim(),
        password: head_password,
        email_confirm: true,
        user_metadata: { full_name: head_name?.trim() || name?.trim() },
      });
      if (createError) return fail(res, 400, createError.message);
      headProfileId = created.user.id;
    }

    // Create the department.
    const { data: dept, error: deptError } = await supabaseAdmin
      .from('departments')
      .insert({
        organization_id: req.user.organization_id,
        name: name.trim(),
        description: description || null,
        address: address || null,
        head_profile_id: headProfileId,
      })
      .select()
      .single();
    if (deptError) {
      if (headProfileId) await supabaseAdmin.auth.admin.deleteUser(headProfileId).catch(() => {});
      return fail(res, 500, deptError.message);
    }

    // If a head account was created, wire its profile to this department.
    if (headProfileId) {
      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({
          organization_id: req.user.organization_id,
          role: 'department_head',
          department_id: dept.id,
          full_name: head_name?.trim() || name.trim(),
        })
        .eq('id', headProfileId);
      if (profError) return fail(res, 500, profError.message);
    }

    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: 'department.created',
      title: 'Department created',
      message: `Department "${name.trim()}" was created.`,
      entity_type: 'department',
      entity_id: dept.id,
      link: '/departments',
    });

    return res.status(201).json(dept);
  }),
);

// ---------------------------------------------------------------
// PATCH /departments/:id — update (admin only). Supports assigning/
// replacing a head via head_email+head_password or head_profile_id.
// ---------------------------------------------------------------
router.patch(
  '/departments/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { name, description, address, head_name, head_email, head_password, head_profile_id } = req.body || {};
    const orgId = req.user.organization_id;

    const { data: existing, error: existError } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', orgId)
      .single();
    if (existError) return fail(res, 404, 'Department not found');
    if (existing.head_profile_id && (head_email || head_profile_id)) {
      return fail(res, 400, 'This department already has a head. Remove it before reassigning.');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (address !== undefined) updates.address = address;

    // Provision a new head if the caller supplied an email+password.
    if (head_email && head_password) {
      try {
        const existingUser = await getUserByEmail(head_email);
        if (existingUser) {
          return fail(
            res,
            409,
            'A user with this email already exists. Use a different email to provision this department head.',
          );
        }
      } catch (e) {
        return fail(res, 500, e.message);
      }
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: head_email.trim(),
        password: head_password,
        email_confirm: true,
        user_metadata: { full_name: head_name?.trim() || name?.trim() || existing.name },
      });
      if (createError) return fail(res, 400, createError.message);
      updates.head_profile_id = created.user.id;
      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({
          organization_id: orgId,
          role: 'department_head',
          department_id: req.params.id,
          full_name: head_name?.trim() || name?.trim() || existing.name,
        })
        .eq('id', created.user.id);
      if (profError) return fail(res, 500, profError.message);
    } else if (head_profile_id) {
      updates.head_profile_id = head_profile_id;
      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({ organization_id: orgId, role: 'department_head', department_id: req.params.id })
        .eq('id', head_profile_id);
      if (profError) return fail(res, 500, profError.message);
    }

    if (Object.keys(updates).length === 0) return fail(res, 400, 'Nothing to update');

    const { data, error } = await supabaseAdmin
      .from('departments')
      .update(updates)
      .eq('id', req.params.id)
      .eq('organization_id', orgId)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    notify({
      organization_id: orgId,
      actor: req.user,
      type: 'department.updated',
      title: 'Department updated',
      message: `Department "${data?.name || existing.name}" was updated.`,
      entity_type: 'department',
      entity_id: req.params.id,
      link: '/departments',
    });

    return res.json(data);
  }),
);

// ---------------------------------------------------------------
// DELETE /departments/:id — remove (admin only).
// ---------------------------------------------------------------
router.delete(
  '/departments/:id',
  requireAdmin,
  catchAsync(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('departments')
      .select('name')
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .maybeSingle();
    if (!existing) return fail(res, 404, 'Department not found');

    const { data, error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);

    notify({
      organization_id: req.user.organization_id,
      actor: req.user,
      type: 'department.deleted',
      title: 'Department deleted',
      message: `Department "${existing.name}" was deleted.`,
      entity_type: 'department',
      entity_id: req.params.id,
      link: '/departments',
    });

    return res.json(data);
  }),
);

export { router as departmentsRouter };