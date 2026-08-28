import { supabaseAdmin } from '../lib/supabase.js';
import { getProfile } from '../lib/profiles.js';
import { fail } from './catchAsync.js';

/**
 * Verifies the Bearer JWT and attaches the caller's profile + public user to
 * req.user. Because we use the service-role key (which bypasses RLS), every
 * downstream route MUST respect req.user.organization_id / department_id / role.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return fail(res, 401, 'No token provided');
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return fail(res, 401, 'Invalid or expired token');
    }

    const profile = await getProfile(data.user.id);
    if (!profile) {
      return fail(res, 401, 'User profile not found');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      full_name: profile.full_name,
      role: profile.role,
      organization_id: profile.organization_id,
      department_id: profile.department_id,
      profile,
    };

    return next();
  } catch (err) {
    return fail(res, 401, 'Authentication failed');
  }
}

/** Middleware that rejects non-admin callers with 403. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return fail(res, 403, 'Admin access required');
  }
  return next();
}

/**
 * Build the base query scoping object shared by org-scoped resource routes.
 * Admins see the whole organization; dept heads see only their department.
 */
export function orgScope(req) {
  const filter = { organization_id: req.user.organization_id };
  if (req.user.role !== 'admin') {
    filter.department_id = req.user.department_id;
  }
  return filter;
}