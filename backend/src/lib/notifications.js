import { supabaseAdmin } from './supabase.js';

/**
 * Resolve who should receive a notification for an action performed by `actor`.
 *
 * Delivery rules (per product requirements):
 *  - Admin actor  -> all department heads (core admin activity) AND all admins
 *                    (the acting admin gets their own activity logged too).
 *  - Dept-head    -> only the org admin(s). Sibling departments are never
 *                    notified about another department's activity.
 */
export async function resolveRecipients(organizationId, actorRole) {
  const targetRole = actorRole === 'admin' ? 'department_head' : 'admin';
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role', targetRole);

  const ids = new Set((data || []).map((p) => p.id));

  // Admins also see their own (and each other's) admin activity.
  if (actorRole === 'admin') {
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'admin');
    (admins || []).forEach((p) => ids.add(p.id));
  }

  return [...ids];
}

/**
 * Insert a notification row for every resolved recipient.
 * Fails silently on DB error (notifications must never break the main flow).
 */
export async function notify({
  organization_id,
  actor,
  type,
  title,
  message = '',
  entity_type = null,
  entity_id = null,
  link = null,
  recipients = null, // optional explicit list of user ids
}) {
  let ids = recipients;
  if (!ids || !ids.length) {
    ids = await resolveRecipients(organization_id, actor?.role);
  }
  if (!ids.length) return;

  const now = new Date().toISOString();
  const rows = ids.map((recipient_user_id) => ({
    organization_id,
    recipient_user_id,
    actor_user_id: actor?.id || null,
    actor_name: actor?.full_name || actor?.name || null,
    type: type || null,
    title: title || '',
    message: message || null,
    entity_type: entity_type || null,
    entity_id: entity_id || null,
    link: link || null,
    read: false,
    created_at: now,
  }));

  const { error } = await supabaseAdmin.from('notifications').insert(rows);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[notify] insert failed:', error.message);
  }
}
