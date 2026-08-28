import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { catchAsync, fail } from '../middleware/catchAsync.js';

const router = Router();

// ---------------------------------------------------------------
// GET /notifications — current user's notifications (newest first)
// ---------------------------------------------------------------
router.get(
  '/notifications',
  catchAsync(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const { data, error, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return fail(res, 500, error.message);

    const { count: unread, error: uErr } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_user_id', req.user.id)
      .eq('read', false);
    if (uErr) return fail(res, 500, uErr.message);

    return res.json({ notifications: data || [], total: count || 0, unread: unread || 0 });
  }),
);

// ---------------------------------------------------------------
// GET /notifications/unread-count
// ---------------------------------------------------------------
router.get(
  '/notifications/unread-count',
  catchAsync(async (req, res) => {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_user_id', req.user.id)
      .eq('read', false);
    if (error) return fail(res, 500, error.message);
    return res.json({ count: count || 0 });
  }),
);

// ---------------------------------------------------------------
// PATCH /notifications/:id/read — mark a single one read
// ---------------------------------------------------------------
router.patch(
  '/notifications/:id/read',
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('recipient_user_id', req.user.id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    if (!data) return fail(res, 404, 'Notification not found');
    return res.json(data);
  }),
);

// ---------------------------------------------------------------
// PATCH /notifications/read-all — mark every one of the user's read
// ---------------------------------------------------------------
router.patch(
  '/notifications/read-all',
  catchAsync(async (req, res) => {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('recipient_user_id', req.user.id)
      .eq('read', false);
    if (error) return fail(res, 500, error.message);
    return res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------
// DELETE /notifications — clear ALL of the user's notifications
// ---------------------------------------------------------------
router.delete(
  '/notifications',
  catchAsync(async (req, res) => {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('recipient_user_id', req.user.id);
    if (error) return fail(res, 500, error.message);
    return res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------
// DELETE /notifications/:id — clear a single notification
// ---------------------------------------------------------------
router.delete(
  '/notifications/:id',
  catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('recipient_user_id', req.user.id)
      .select()
      .single();
    if (error) return fail(res, 500, error.message);
    if (!data) return fail(res, 404, 'Notification not found');
    return res.json({ ok: true });
  }),
);

export { router as notificationsRouter };
