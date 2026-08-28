import { supabaseAdmin } from './supabase.js';

/**
 * Fetch a user's profile row including their (nested) organization.
 * Returns null if the user has no profile.
 */
export async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, organizations(name, industry_type, logo_url, created_at)')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data || null;
}

/**
 * Build the "public user" shape the frontend expects, given a profile row
 * and an (optional) Supabase auth user object.
 */
export function toPublicUser(profile, authUser = {}) {
  return {
    id: profile?.id || authUser?.id || null,
    full_name: profile?.full_name || '',
    email: authUser?.email || profile?.email || '',
    role: profile?.role || 'admin',
    organization_id: profile?.organization_id || null,
    department_id: profile?.department_id || null,
    avatar_url: profile?.avatar_url || null,
  };
}