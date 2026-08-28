import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing SUPABASE_PUBLISHABLE_KEY environment variable');
}
if (!SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY environment variable');
}

export const supabaseRec = {
  // re-usable shared options so we never persist sessions on the server
  options: { auth: { persistSession: false, autoRefreshToken: false } },
};

// Handles the *public* auth calls (sign in / sign up / mint sessions).
// Uses the publishable (anon) key — this is safe server-side too.
export const supabaseAnon = createClient(
  SUPABASE_URL,
  PUBLISHABLE_KEY,
  supabaseRec.options,
);

// Full server-side client. Uses the secret (service-role) key: bypasses RLS,
// so every route must enforce organization/department scoping itself.
// Used for CRUD, admin user provisioning and JWT verification.
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SECRET_KEY,
  supabaseRec.options,
);