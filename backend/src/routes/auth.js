import { Router } from 'express';
import { supabaseAdmin, supabaseAnon } from '../lib/supabase.js';
import { getProfile, toPublicUser } from '../lib/profiles.js';
import { requireAuth } from '../middleware/auth.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';

const router = Router();

// ---------------------------------------------------------------
// POST /auth/signup — create an Organization + the first Admin account.
// Public (no token). Works for solo owners and partnerships.
// ---------------------------------------------------------------
router.post(
  '/signup',
  catchAsync(async (req, res) => {
    const {
      company_name,
      industry,
      owner_name,
      owner_email,
      password,
      ownership_type,
      owners,
    } = req.body || {};

    if (!company_name?.trim()) return fail(res, 400, 'Company name is required');
    if (!owner_name?.trim()) return fail(res, 400, 'Owner name is required');
    if (!owner_email?.trim()) return fail(res, 400, 'Email is required');
    if (!password) return fail(res, 400, 'Password is required');
    if (password.length < 6) return fail(res, 400, 'Password must be at least 6 characters');

    // 1. Create the owner's Supabase auth user (trigger creates the profiles row).
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: owner_email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: owner_name.trim() },
    });
    if (createError) return fail(res, 400, createError.message);
    const authUserId = created.user.id;

    try {
      // 2. Create the organization.
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: company_name.trim(),
          industry_type: industry?.trim() || null,
          created_by: authUserId,
        })
        .select()
        .single();
      if (orgError) throw orgError;

      // 3. Wire the profile (created by the trigger) to the org + admin role.
      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({ organization_id: org.id, role: 'admin', full_name: owner_name.trim() })
        .eq('id', authUserId);
      if (profError) throw profError;

      // 4. Persist owners/partners (or the solo primary owner).
      const ownerRows = [];
      if (ownership_type === 'partnership' && Array.isArray(owners) && owners.length) {
        owners.forEach((o, idx) => {
          ownerRows.push({
            organization_id: org.id,
            full_name: o?.name || o?.full_name || '',
            email: o?.email || '',
            role: o?.role || 'Partner',
            ownership_share: Number(o?.ownership_share) || 0,
            is_primary: idx === 0,
          });
        });
      } else {
        ownerRows.push({
          organization_id: org.id,
          full_name: owner_name.trim(),
          email: owner_email.trim(),
          role: 'Owner',
          ownership_share: 100,
          is_primary: true,
        });
      }
      const { error: ownersError } = await supabaseAdmin
        .from('organization_owners')
        .insert(ownerRows);
      if (ownersError) throw ownersError;
// 5. Mint a session so the new admin is logged straight in.
      const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
        email: owner_email.trim(),
        password,
      });
      if (sessionError) throw sessionError;

      const profile = await getProfile(authUserId);
      const user = toPublicUser(profile, sessionData.user);

      return res.status(201).json({
        token: sessionData.session.access_token,
        user,
        organization:
          profile?.organizations || {
            id: org.id,
            name: org.name,
            industry_type: org.industry_type,
          },
      });
    } catch (err) {
      // Best-effort rollback of the auth user on partial failure.
      await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => {});
      return fail(res, 500, err.message || 'Signup failed');
    }
  }),
);

// ---------------------------------------------------------------
// POST /auth/login — email/password, returns token + user + organization.
// Public.
// ---------------------------------------------------------------
router.post(
  '/login',
  catchAsync(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return fail(res, 400, 'Email and password are required');

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data?.session) {
      return fail(res, 401, error?.message || 'Invalid email or password');
    }

    const profile = await getProfile(data.user.id);
    const user = toPublicUser(profile, data.user);

    return res.json({
      token: data.session.access_token,
      user,
      organization: profile?.organizations || null,
    });
  }),
);

// ---------------------------------------------------------------
// GET /auth/me — restore the session from a stored token.
// Authenticated (token in the Authorization header).
// ---------------------------------------------------------------
router.get(
  '/me',
  requireAuth,
  catchAsync(async (req, res) => {
    const p = req.user.profile;
    const user = toPublicUser(p, { id: req.user.id, email: req.user.email });
    return res.json({ user, organization: p?.organizations || null });
  }),
);

// ---------------------------------------------------------------
// POST /auth/logout — invalidate/revoke the current session token.
// Best-effort; the client also drops its stored token regardless.
// ---------------------------------------------------------------
router.post(
  '/logout',
  requireAuth,
  catchAsync(async (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      await supabaseAdmin.auth.admin.signOut(token).catch(() => {});
    }
    return res.json({ success: true });
  }),
);

export { router as authRouter };