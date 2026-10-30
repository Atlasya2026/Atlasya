/* ============================================================
 * supabase-compat.js — طبقة توافق: بتخلّي كود Firebase (Firestore + Auth) الموجود في
 * index.html / admin.html يشتغل فوق Supabase من غير ما نعيد كتابة الموقع كله.
 * ============================================================ */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

const SPEC = {"spec": {"users": {"table": "profiles", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"email": {"c": "email", "t": null}, "firstName": {"c": "first_name", "t": null}, "lastName": {"c": "last_name", "t": null}, "phone": {"c": "phone", "t": null}, "academicLevel": {"c": "academic_level", "t": null}, "affiliate": {"c": "affiliate", "t": null}, "plan": {"c": "plan", "t": null}, "coins": {"c": "coins", "t": null}, "coinsEarnedTotal": {"c": "coins_earned_total", "t": null}, "coinsSpentTotal": {"c": "coins_spent_total", "t": null}, "referralCount": {"c": "referral_count", "t": null}, "referredBy": {"c": "referred_by", "t": null}, "uploadCount": {"c": "upload_count", "t": null}, "joinedAt": {"c": "joined_at", "t": "ts"}, "proStartAt": {"c": "pro_start_at", "t": "ts"}, "proExpiresAt": {"c": "pro_expires_at", "t": "ts"}, "wheelLastSpinAt": {"c": "wheel_last_spin_at", "t": "ts"}, "wheelExtraSpins": {"c": "wheel_extra_spins", "t": null}, "freeTrialUsed": {"c": "free_trial_used", "t": null}, "freeTrialClaimedAt": {"c": "free_trial_claimed_at", "t": "ts"}, "bio": {"c": "bio", "t": null}, "company": {"c": "company", "t": null}, "job": {"c": "job", "t": null}, "profileImg": {"c": "profile_img", "t": null}, "dailyDownloads": {"c": "daily_downloads", "t": "json"}, "tipsStartedAt": {"c": "tips_started_at", "t": null}, "tipsLastShownStage": {"c": "tips_last_shown_stage", "t": null}, "favoriteBooks": {"c": "favorite_books", "t": "json"}, "favoritePlaylists": {"c": "favorite_playlists", "t": "json"}, "savedPlaylists": {"c": "saved_playlists", "t": "json"}, "tipLikes": {"c": "tip_likes", "t": "json"}, "tipShares": {"c": "tip_shares", "t": "json"}, "tempProFeature": {"c": "temp_pro_feature", "t": "json"}, "coinBoost": {"c": "coin_boost", "t": "json"}, "suspended": {"c": "suspended", "t": null}, "role": {"c": "role", "t": null}, "permissions": {"c": "permissions", "t": "json"}, "giftSpinPending": {"c": "gift_spin_pending", "t": null}, "referralCoinsEarned": {"c": "referral_coins_earned", "t": null}, "referralRewarded": {"c": "referral_rewarded", "t": null}}}, "admins": {"table": "admins", "id": "user_id", "over": "xdata", "parents": [], "ro": false, "cols": {"role": {"c": "role", "t": null}, "name": {"c": "name", "t": null}, "firstName": {"c": "first_name", "t": null}, "lastName": {"c": "last_name", "t": null}, "email": {"c": "email", "t": null}, "permissions": {"c": "permissions", "t": "json"}, "org": {"c": "org", "t": null}, "createdBy": {"c": "created_by", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "username": {"c": "username", "t": null}}}, "companies": {"table": "companies", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"companyName": {"c": "company_name", "t": null}, "email": {"c": "email", "t": null}, "phone": {"c": "phone", "t": null}, "whatsapp": {"c": "whatsapp", "t": null}, "website": {"c": "website", "t": null}, "facebook": {"c": "facebook", "t": null}, "linkedin": {"c": "linkedin", "t": null}, "instagram": {"c": "instagram", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "coin_transactions": {"table": "coin_transactions", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"userId": {"c": "user_id", "t": null}, "type": {"c": "type", "t": null}, "amount": {"c": "amount", "t": null}, "reasonAR": {"c": "reason_ar", "t": null}, "reasonEN": {"c": "reason_en", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "isGift": {"c": "is_gift", "t": null}, "status": {"c": "status", "t": null}, "months": {"c": "months", "t": null}, "source": {"c": "source", "t": null}, "milestone": {"c": "milestone", "t": null}}}, "wheel_spins": {"table": "wheel_spins", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"userId": {"c": "user_id", "t": null}, "wheelType": {"c": "wheel_type", "t": null}, "resultType": {"c": "result_type", "t": null}, "coinsAwarded": {"c": "coins_awarded", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "userName": {"c": "user_name", "t": null}, "usedExtraSpin": {"c": "used_extra_spin", "t": null}, "extra": {"c": "extra", "t": "json"}}}, "coin_redemption_requests": {"table": "coin_redemption_requests", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"userId": {"c": "user_id", "t": null}, "status": {"c": "status", "t": null}, "requestedAt": {"c": "created_at", "t": "ts"}}}, "discount_codes": {"table": "discount_codes", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"code": {"c": "code", "t": null}, "userId": {"c": "user_id", "t": null}, "percent": {"c": "percent", "t": null}, "requiredMonths": {"c": "required_months", "t": null}, "expiresAt": {"c": "expires_at", "t": "ts"}, "createdAt": {"c": "created_at", "t": "ts"}, "usedAt": {"c": "used_at", "t": "ts"}, "used": {"c": "used", "t": null}}}, "daily_challenges": {"table": "daily_challenges", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"type": {"c": "type", "t": null}, "scheduledDate": {"c": "scheduled_date", "t": null}, "difficulty": {"c": "difficulty", "t": null}, "questionAR": {"c": "question_ar", "t": null}, "questionEN": {"c": "question_en", "t": null}, "optionsAR": {"c": "options_ar", "t": "json"}, "optionsEN": {"c": "options_en", "t": "json"}, "coins": {"c": "coins", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "daily_challenge_keys": {"table": "daily_challenge_keys", "id": "id", "over": null, "parents": [], "ro": false, "cols": {"correctIndex": {"c": "correct_index", "t": null}}}, "daily_challenge_attempts": {"table": "daily_challenge_attempts", "id": ["user_id", "question_id"], "over": null, "parents": [], "ro": true, "cols": {"userId": {"c": "user_id", "t": null}, "questionId": {"c": "question_id", "t": null}, "type": {"c": "type", "t": null}, "scheduledDate": {"c": "scheduled_date", "t": null}, "selectedIndex": {"c": "selected_index", "t": null}, "correct": {"c": "correct", "t": null}, "coinsAwarded": {"c": "coins_awarded", "t": null}, "answeredAt": {"c": "answered_at", "t": "ts"}}}, "weekly_challenge_claims": {"table": "weekly_challenge_claims", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"userId": {"c": "user_id", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "user_streaks": {"table": "user_streaks", "id": "user_id", "over": null, "parents": [], "ro": false, "cols": {"currentStreak": {"c": "current_streak", "t": null}, "longestStreak": {"c": "longest_streak", "t": null}, "lastActiveDate": {"c": "last_active_date", "t": null}, "totalActiveDays": {"c": "total_active_days", "t": null}, "activeDates": {"c": "active_dates", "t": "json"}, "claimedMilestones": {"c": "claimed_milestones", "t": "json"}, "badges": {"c": "badges", "t": "json"}, "pendingRewards": {"c": "pending_rewards", "t": "json"}, "updatedAt": {"c": "updated_at", "t": "ts"}}}, "upgrade_requests": {"table": "upgrade_requests", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"uid": {"c": "user_id", "t": null}, "firstName": {"c": "first_name", "t": null}, "lastName": {"c": "last_name", "t": null}, "email": {"c": "email", "t": null}, "phone": {"c": "phone", "t": null}, "username": {"c": "username", "t": null}, "paymentMethod": {"c": "payment_method", "t": null}, "amount": {"c": "amount", "t": null}, "paymentDate": {"c": "payment_date", "t": null}, "screenshot": {"c": "screenshot", "t": null}, "rejectionReason": {"c": "rejection_reason", "t": null}, "requestedAt": {"c": "requested_at", "t": "ts"}, "approvedMonths": {"c": "approved_months", "t": null}, "reviewedAt": {"c": "reviewed_at", "t": "ts"}, "status": {"c": "status", "t": null}, "months": {"c": "months", "t": null}, "discountCode": {"c": "discount_code", "t": null}, "discountPercent": {"c": "discount_percent", "t": null}}}, "support_tickets": {"table": "support_tickets", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"uid": {"c": "user_id", "t": null}, "studentName": {"c": "student_name", "t": null}, "studentEmail": {"c": "student_email", "t": null}, "type": {"c": "type", "t": null}, "message": {"c": "message", "t": null}, "screenshot": {"c": "screenshot", "t": null}, "reply": {"c": "reply", "t": null}, "rating": {"c": "rating", "t": null}, "repliedAt": {"c": "replied_at", "t": "ts"}, "ratedAt": {"c": "rated_at", "t": "ts"}, "createdAt": {"c": "created_at", "t": "ts"}, "status": {"c": "status", "t": null}, "ratingComment": {"c": "rating_comment", "t": null}}}, "mentorship_requests": {"table": "mentorship_requests", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"uid": {"c": "user_id", "t": null}, "status": {"c": "status", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "mentorship_bookings": {"table": "mentorship_bookings", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"uid": {"c": "user_id", "t": null}, "bookedAt": {"c": "created_at", "t": "ts"}}}, "mentorship_slots": {"table": "mentorship_slots", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"taken": {"c": "taken", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "cv_requests": {"table": "cv_requests", "id": "user_id", "over": "data", "parents": [], "ro": false, "cols": {"createdAt": {"c": "created_at", "t": "ts"}, "updatedAt": {"c": "updated_at", "t": "ts"}}}, "cv_files": {"table": "cv_files", "id": "user_id", "over": "data", "parents": [], "ro": false, "cols": {}}, "portfolio_items": {"table": "portfolio_items", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"title": {"c": "title", "t": null}, "desc": {"c": "description", "t": null}, "fileName": {"c": "file_name", "t": null}, "fileData": {"c": "file_data", "t": null}, "uid": {"c": "user_id", "t": null}, "authorName": {"c": "author_name", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "job_posts": {"table": "job_posts", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"title": {"c": "title", "t": null}, "company": {"c": "company", "t": null}, "desc": {"c": "description", "t": null}, "location": {"c": "location", "t": null}, "type": {"c": "type", "t": null}, "link": {"c": "link", "t": null}, "authorName": {"c": "author_name", "t": null}, "authorUid": {"c": "author_id", "t": null}, "authorEmail": {"c": "author_email", "t": null}, "isAdminPost": {"c": "is_admin_post", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "reviewedAt": {"c": "reviewed_at", "t": "ts"}, "status": {"c": "status", "t": null}}}, "courses": {"table": "courses", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"companyId": {"c": "company_id", "t": null}, "status": {"c": "status", "t": null}, "hidden": {"c": "hidden", "t": null}, "views": {"c": "views", "t": null}, "interestedCount": {"c": "interested_count", "t": null}, "reviewedAt": {"c": "reviewed_at", "t": "ts"}, "createdAt": {"c": "created_at", "t": "ts"}}}, "free_courses": {"table": "free_courses", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"title": {"c": "title", "t": null}, "description": {"c": "description", "t": null}, "youtubeUrl": {"c": "youtube_url", "t": null}, "enrollUrl": {"c": "enroll_url", "t": null}, "hours": {"c": "hours", "t": null}, "source": {"c": "source", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "library_books": {"table": "library_books", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"title": {"c": "title", "t": null}, "author": {"c": "author", "t": null}, "category": {"c": "category", "t": null}, "language": {"c": "language", "t": null}, "year": {"c": "year", "t": null}, "pages": {"c": "pages", "t": null}, "university": {"c": "university", "t": null}, "description": {"c": "description", "t": null}, "keywords": {"c": "keywords", "t": null}, "downloadUrl": {"c": "download_url", "t": null}, "hidden": {"c": "hidden", "t": null}, "coverData": {"c": "cover_data", "t": null}, "downloads": {"c": "downloads", "t": null}, "views": {"c": "views", "t": null}, "ratings": {"c": "ratings", "t": "json"}, "createdAt": {"c": "created_at", "t": "ts"}}}, "software_tools": {"table": "software_tools", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"name": {"c": "name", "t": null}, "nameEn": {"c": "name_en", "t": null}, "version": {"c": "version", "t": null}, "category": {"c": "category", "t": null}, "downloadUrl": {"c": "download_url", "t": null}, "requiresPrerequisite": {"c": "requires_prerequisite", "t": null}, "prerequisiteLabel": {"c": "prerequisite_label", "t": null}, "prerequisiteUrl": {"c": "prerequisite_url", "t": null}, "hidden": {"c": "hidden", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "notes": {"c": "notes", "t": null}, "downloads": {"c": "downloads", "t": null}}}, "spatial_datasets": {"table": "spatial_datasets", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"name": {"c": "name", "t": null}, "nameEn": {"c": "name_en", "t": null}, "category": {"c": "category", "t": null}, "region": {"c": "region", "t": null}, "fileType": {"c": "file_type", "t": null}, "coordSystem": {"c": "coord_system", "t": null}, "resolution": {"c": "resolution", "t": null}, "fileSize": {"c": "file_size", "t": null}, "updateDate": {"c": "update_date", "t": null}, "source": {"c": "source", "t": null}, "layers": {"c": "layers", "t": "json"}, "downloadUrl": {"c": "download_url", "t": null}, "projects": {"c": "projects", "t": "json"}, "hidden": {"c": "hidden", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "previewImage": {"c": "preview_image", "t": null}, "description": {"c": "description", "t": null}, "downloads": {"c": "downloads", "t": null}}}, "spatial_projects": {"table": "spatial_projects", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"hidden": {"c": "hidden", "t": null}}}, "playlists": {"table": "playlists", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"title": {"c": "title", "t": null}, "description": {"c": "description", "t": null}, "hidden": {"c": "hidden", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "videoCount": {"c": "video_count", "t": null}}}, "playlists/videos": {"table": "playlist_videos", "id": "id", "over": "xdata", "parents": ["playlist_id"], "ro": false, "cols": {"title": {"c": "title", "t": null}, "youtubeUrl": {"c": "youtube_url", "t": null}, "order": {"c": "sort_order", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "daily_tips": {"table": "daily_tips", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"likes": {"c": "likes", "t": null}, "shares": {"c": "shares", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "site_content": {"table": "site_content", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"updatedAt": {"c": "updated_at", "t": "ts"}}}, "settings": {"table": "settings", "id": "id", "over": "data", "parents": [], "ro": false, "cols": {"updatedAt": {"c": "updated_at", "t": "ts"}}}, "community_groups": {"table": "community_groups", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"name": {"c": "name", "t": null}, "description": {"c": "description", "t": null}, "type": {"c": "type", "t": null}, "conditions": {"c": "conditions", "t": null}, "rules": {"c": "rules", "t": null}, "memberCount": {"c": "member_count", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "updatedAt": {"c": "updated_at", "t": "ts"}}}, "community_groups/members": {"table": "community_members", "id": "member_id", "over": "xdata", "parents": ["group_id"], "ro": false, "cols": {"uid": {"c": "user_id", "t": null}, "name": {"c": "name", "t": null}, "email": {"c": "email", "t": null}, "isAdmin": {"c": "is_admin", "t": null}, "joinedAt": {"c": "joined_at", "t": "ts"}, "lastReadAt": {"c": "last_read_at", "t": "ts"}}}, "community_groups/messages": {"table": "community_messages", "id": "id", "over": "xdata", "parents": ["group_id"], "ro": false, "cols": {"uid": {"c": "user_id", "t": null}, "authorName": {"c": "author_name", "t": null}, "senderType": {"c": "sender_type", "t": null}, "text": {"c": "text", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "replyCount": {"c": "reply_count", "t": null}}}, "community_groups/messages/replies": {"table": "community_replies", "id": "id", "over": "xdata", "parents": ["group_id", "message_id"], "ro": false, "cols": {"uid": {"c": "user_id", "t": null}, "authorName": {"c": "author_name", "t": null}, "senderType": {"c": "sender_type", "t": null}, "text": {"c": "text", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "admin_notifications": {"table": "admin_notifications", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"title": {"c": "title", "t": null}, "body": {"c": "body", "t": null}, "sentBy": {"c": "sent_by", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}}}, "admin_alerts": {"table": "admin_alerts", "id": "id", "over": "xdata", "parents": [], "ro": false, "cols": {"toUid": {"c": "to_user_id", "t": null}, "message": {"c": "message", "t": null}, "sentBy": {"c": "sent_by", "t": null}, "createdAt": {"c": "created_at", "t": "ts"}, "read": {"c": "read", "t": null}}}}, "noop": ["challenge_clock", "daily_challenges_answers", "admin_team"]};
const NOOP = new Set(SPEC.noop);
const SP = SPEC.spec;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_COLS = new Set(['user_id', 'referred_by', 'author_id', 'to_user_id', 'company_id']);
const UUID_ID_SPECS = new Set(['users', 'companies', 'user_streaks', 'cv_requests', 'cv_files', 'admins']);

/* ───────────── Timestamp & FieldValues ───────────── */
export class Timestamp {
  constructor(seconds, nanoseconds) { this.seconds = seconds; this.nanoseconds = nanoseconds || 0; }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6); }
  static fromDate(d) { return Timestamp.fromMillis(d.getTime()); }
  static now() { return Timestamp.fromMillis(Date.now()); }
  toDate() { return new Date(this.toMillis()); }
  toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6); }
  isEqual(o) { return !!o && o.seconds === this.seconds && o.nanoseconds === this.nanoseconds; }
  toJSON() { return { __type: 'timestamp', value: this.toDate().toISOString() }; }
}
class FV { constructor(kind, v) { this.kind = kind; this.v = v; } }
export const serverTimestamp = () => new FV('ts');
export const increment = (n) => new FV('inc', n);
export const arrayUnion = (...a) => new FV('union', a);
export const arrayRemove = (...a) => new FV('remove', a);
export const deleteField = () => new FV('del');

function decode(v) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(decode);
  if (v.__type === 'timestamp' && v.value) return Timestamp.fromDate(new Date(v.value));
  const o = {}; for (const k in v) o[k] = decode(v[k]); return o;
}
const encJson = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v instanceof Date ? Timestamp.fromDate(v) : v)));
function toIso(v) {
  if (v == null || v === '') return null;
  if (v instanceof FV) return new Date().toISOString();
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object' && v.__type === 'timestamp') return v.value;
  return v;
}
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
const sameEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkErr(e, fallback) {
  if (!e) return new Error(fallback || 'error');
  const code = e.code || '';
  const err = new Error(e.message || fallback || 'error');
  if (code === '42501' || code === 'PGRST301' || /row-level security|permission denied|غير مسموح/i.test(e.message || '')) err.code = 'permission-denied';
  else if (code === 'P0001') err.code = (e.message || '').trim();
  else if (code === '23505') err.code = 'already-exists';
  else if (code === 'PGRST116') err.code = 'not-found';
  else if (e instanceof TypeError || /fetch|network/i.test(e.message || '')) err.code = 'unavailable';
  else err.code = e.code || (/^[a-z_-]+$/.test(e.message || '') ? e.message : 'unknown');
  err.original = e;
  return err;
}

/* ───────────── App ───────────── */
const apps = new Map();
export function initializeApp(config, name) {
  const key = name || '[DEFAULT]';
  const isTemp = key.startsWith('temp');
  const client = createClient(config.url, config.key, {
    auth: {
      persistSession: !isTemp, autoRefreshToken: !isTemp,
      detectSessionInUrl: key === '[DEFAULT]',
      storageKey: key === '[DEFAULT]' ? undefined : 'sb-' + key + '-auth',
    },
  });
  const app = { name: key, config, client, isTemp, channels: new Set() };
  app.auth = new Auth(app);
  app.db = { app, _c: client };
  apps.set(key, app);
  return app;
}
export async function deleteApp(app) {
  try { for (const ch of app.channels) app.client.removeChannel(ch); } catch (e) {}
  try { app.auth._dispose(); } catch (e) {}
  apps.delete(app.name);
}
export const getFirestore = (app) => app.db;
export const getAuth = (app) => app.auth;
export async function rpc(x, name, args) {
  const client = (x.client || x._c || x.app?.client);
  const { data, error } = await client.rpc(name, args || {});
  if (error) throw mkErr(error);
  return data;
}

/* ───────────── Auth ───────────── */
export class GoogleAuthProvider { constructor() { this.providerId = 'google'; } }
export class FacebookAuthProvider { constructor() { this.providerId = 'facebook'; } }
export const EmailAuthProvider = { credential: (email, password) => ({ email, password }) };

const AUTH_MAP = [
  [/invalid login credentials|invalid_credentials/i, 'auth/invalid-credential'],
  [/already registered|already been registered|user_already_exists/i, 'auth/email-already-in-use'],
  [/password.*(short|weak|least)|weak_password/i, 'auth/weak-password'],
  [/rate limit|too many|over_.*rate/i, 'auth/too-many-requests'],
  [/invalid.*email|email_address_invalid|unable to validate email/i, 'auth/invalid-email'],
  [/sign.?ups?.*(not allowed|disabled)|signup.*disabled/i, 'auth/operation-not-allowed'],
  [/banned|user.*disabled|account.*disabled/i, 'auth/user-disabled'],
  [/failed to fetch|network/i, 'auth/network-request-failed'],
];
function authErr(e) {
  const msg = (e && (e.message || e.code)) || 'error';
  let code = 'auth/internal-error';
  for (const [re, c] of AUTH_MAP) if (re.test(msg) || re.test(e?.code || '')) { code = c; break; }
  const err = new Error('Firebase: Error (' + code + '). ' + msg);   // نفس شكل رسائل Firebase القديمة عشان أكواد الواجهة تفضل شغالة
  err.code = code;
  return err;
}
const redirectUrl = () => location.origin + location.pathname;

class Auth {
  constructor(app) {
    this.app = app; this.client = app.client; this.currentUser = null;
    this._listeners = new Set(); this._ready = false; this._pending = null; this._lastKey = null;
    const { data } = this.client.auth.onAuthStateChange((event, session) => { setTimeout(() => this._handle(event, session), 0); });
    this._sub = data.subscription;
  }
  _dispose() { try { this._sub.unsubscribe(); } catch (e) {} this._listeners.clear(); }
  _wrap(u) {
    const self = this; const m = u.user_metadata || {};
    return {
      uid: u.id, email: u.email, emailVerified: !!u.email_confirmed_at,
      displayName: m.full_name || m.name || ((m.firstName || '') + ' ' + (m.lastName || '')).trim() || null,
      photoURL: m.avatar_url || m.picture || null, phoneNumber: u.phone || null,
      providerData: [{ providerId: u.app_metadata?.provider || 'password' }],
      metadata: { creationTime: u.created_at, lastSignInTime: u.last_sign_in_at }, _raw: u,
      reload: () => self._reload(), getIdToken: () => self._token(),
    };
  }
  async _token() { const { data } = await this.client.auth.getSession(); return data.session?.access_token || null; }
  _makePending(email, password, id) {
    const self = this;
    this._pending = { email, password };
    return { uid: id || 'pending', email, emailVerified: false, displayName: null, photoURL: null, providerData: [{ providerId: 'password' }],
      metadata: {}, _pending: true, reload: () => self._reload(), getIdToken: async () => null };
  }
  _set(user) {
    this.currentUser = user;
    const key = user ? user.uid + ':' + user.emailVerified : 'null';
    if (key === this._lastKey) return;
    this._lastKey = key;
    this._emit();
  }
  _emit() { for (const cb of [...this._listeners]) { try { cb(this.currentUser); } catch (e) { console.error(e); } } }
  _handle(event, session) {
    if (event === 'PASSWORD_RECOVERY' && this.app.name === '[DEFAULT]') showRecovery(this);
    if (session?.user) { this._pending = null; this._ready = true; this._set(this._wrap(session.user)); return; }
    if (this._pending && event !== 'SIGNED_OUT') { this._ready = true; return; }
    this._ready = true;
    if (event === 'INITIAL_SESSION' && this._lastKey === null) { this._lastKey = 'null'; this.currentUser = null; this._emit(); return; }
    this._set(null);
  }
  async _reload() {
    if (this._pending) {
      const now = Date.now();
      if (this._lastPendingTry && now - this._lastPendingTry < 8000) return;   // تجنّب ضرب الـ rate limit لو الواجهة بتعمل polling
      this._lastPendingTry = now;
      const { email, password } = this._pending;
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (!error && data.session) { this._pending = null; this._set(this._wrap(data.user)); }
      return;
    }
    const { data } = await this.client.auth.getUser();
    if (data?.user) this._set(this._wrap(data.user));
  }
}
export function onAuthStateChanged(auth, cb) {
  auth._listeners.add(cb);
  if (auth._ready || auth._lastKey !== null) setTimeout(() => { if (auth._listeners.has(cb)) cb(auth.currentUser); }, 0);
  return () => auth._listeners.delete(cb);
}
export async function signInWithEmailAndPassword(auth, email, password) {
  const { data, error } = await auth.client.auth.signInWithPassword({ email, password });
  if (error) {
    if (/not confirmed|email_not_confirmed/i.test(error.message + ' ' + (error.code || ''))) {
      const pu = auth._makePending(email, password); auth._ready = true; auth._set(pu); return { user: pu };
    }
    throw authErr(error);
  }
  auth._pending = null; const u = auth._wrap(data.user); auth._ready = true; auth._set(u); return { user: u };
}
export async function createUserWithEmailAndPassword(auth, email, password, meta) {
  const { data, error } = await auth.client.auth.signUp({ email, password, options: { data: meta || {}, emailRedirectTo: redirectUrl() } });
  if (error) throw authErr(error);
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) { const e = new Error('exists'); e.code = 'auth/email-already-in-use'; throw e; }
  if (data.session) { const u = auth._wrap(data.user); auth._set(u); return { user: u }; }
  if (auth.app.isTemp) return { user: { uid: data.user.id, email } };
  const pu = auth._makePending(email, password, data.user?.id); auth._ready = true; auth._set(pu); return { user: pu };
}
export async function signOut(auth) {
  auth._pending = null;
  try { await auth.client.auth.signOut({ scope: 'local' }); } catch (e) {}
  auth._ready = true; auth._set(null);
}
export async function sendEmailVerification(user) {
  const auth = [...apps.values()].map(a => a.auth).find(a => a.currentUser === user) || [...apps.values()][0].auth;
  const { error } = await auth.client.auth.resend({ type: 'signup', email: user.email, options: { emailRedirectTo: redirectUrl() } });
  if (error) throw authErr(error);
}
export async function sendPasswordResetEmail(auth, email) {
  const { error } = await auth.client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
  if (error) throw authErr(error);
}
export async function signInWithPopup(auth, provider) {
  const { error } = await auth.client.auth.signInWithOAuth({ provider: provider.providerId, options: { redirectTo: redirectUrl() } });
  if (error) throw authErr(error);
  // الصفحة بتتحوّل لجوجل/فيسبوك. لو التحويل اتمنع (بلوك/شبكة) نرفض بعد 30 ثانية بدل ما الواجهة تفضل معلّقة.
  return new Promise((_, reject) => setTimeout(() => { const e = new Error('Firebase: Error (auth/network-request-failed). redirect timeout'); e.code = 'auth/network-request-failed'; reject(e); }, 30000));
}
export async function reauthenticateWithCredential(user, cred) {
  const auth = [...apps.values()].map(a => a.auth).find(a => a.currentUser === user);
  const { error } = await auth.client.auth.signInWithPassword({ email: cred.email, password: cred.password });
  if (error) throw authErr(error);
}
export async function updatePassword(user, newPassword) {
  const auth = [...apps.values()].map(a => a.auth).find(a => a.currentUser === user);
  const { error } = await auth.client.auth.updateUser({ password: newPassword });
  if (error) throw authErr(error);
}
export async function deleteUser(user) {
  const auth = [...apps.values()].map(a => a.auth).find(a => a.currentUser === user);
  await rpc(auth, 'delete_my_account');
  await signOut(auth);
}
function showRecovery(auth) {
  if (document.getElementById('sbRecovery')) return;
  const d = document.createElement('div'); d.id = 'sbRecovery';
  d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Tajawal,sans-serif;direction:rtl';
  d.innerHTML = '<div style="background:#14202b;color:#fff;border-radius:16px;padding:26px;max-width:380px;width:100%"><h3 style="margin:0 0 6px">تعيين كلمة مرور جديدة</h3><p style="font-size:13px;opacity:.7;margin:0 0 14px">اكتب كلمة المرور الجديدة (6 أحرف على الأقل)</p><input id="sbNewPw" type="password" style="width:100%;padding:11px;border-radius:10px;border:1px solid #345;background:#0c141b;color:#fff;box-sizing:border-box" placeholder="كلمة المرور الجديدة"><div id="sbRecMsg" style="font-size:12px;color:#ff8a8a;min-height:18px;margin:8px 0"></div><button id="sbRecBtn" style="width:100%;padding:11px;border:0;border-radius:10px;background:#27a346;color:#fff;font-weight:700;cursor:pointer">حفظ</button></div>';
  document.body.appendChild(d);
  document.getElementById('sbRecBtn').onclick = async () => {
    const pw = document.getElementById('sbNewPw').value; const msg = document.getElementById('sbRecMsg');
    if (pw.length < 6) { msg.textContent = 'كلمة المرور قصيرة'; return; }
    const { error } = await auth.client.auth.updateUser({ password: pw });
    if (error) { msg.textContent = error.message; return; }
    d.remove(); alert('تم تغيير كلمة المرور ✅');
  };
}

/* ───────────── Firestore: refs ───────────── */
class ColRef { constructor(db, segs) { this.db = db; this.segs = segs; this.type = 'collection'; } get path() { return this.segs.join('/'); } }
class DocRef { constructor(db, segs, id) { this.db = db; this.segs = segs; this.id = id; this.type = 'document'; } get path() { return this.segs.join('/'); } }
const autoId = () => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; const a = crypto.getRandomValues(new Uint8Array(20)); for (const b of a) s += c[b % 62]; return s; };
function flat(a) { return a.flatMap(x => String(x).split('/').filter(Boolean)); }
export function collection(base, ...p) {
  const segs = base.segs ? [...base.segs, ...flat(p)] : flat(p);
  return new ColRef(base.segs ? base.db : base, segs);
}
export function doc(base, ...p) {
  const segs = base instanceof ColRef ? [...base.segs, ...flat(p)] : base.segs ? [...base.segs, ...flat(p)] : flat(p);
  const db = base.segs ? base.db : base;
  if (segs.length % 2 === 1) segs.push(autoId());
  return new DocRef(db, segs, segs[segs.length - 1]);
}
function resolve(ref) {
  const segs = ref.segs, names = [], ids = [];
  segs.forEach((s, i) => (i % 2 === 0 ? names : ids).push(s));
  const key = names.join('/');
  if (NOOP.has(names[0]) && names.length === 1) return { noop: true };
  const spec = SP[key];
  if (!spec) throw new Error('Unsupported collection: ' + key);
  const parents = {};
  (spec.parents || []).forEach((c, i) => { parents[c] = ids[i]; });
  const id = ref.type === 'document' ? ids[ids.length - 1] : null;
  return { spec, parents, id, key };
}
const idCols = (spec) => (Array.isArray(spec.id) ? spec.id : [spec.id]);
function idFilters(spec, id) {
  if (Array.isArray(spec.id)) { const i = id.indexOf('_'); return { [spec.id[0]]: id.slice(0, i), [spec.id[1]]: id.slice(i + 1) }; }
  return { [spec.id]: id };
}
function rowId(spec, row) { return Array.isArray(spec.id) ? spec.id.map(c => row[c]).join('_') : String(row[spec.id]); }

/* ───────────── Firestore: row <-> doc ───────────── */
function rowToData(spec, row) {
  const out = {};
  const ov = spec.over && row[spec.over];
  if (ov && typeof ov === 'object') Object.assign(out, decode(ov));
  for (const camel in spec.cols) {
    const { c, t } = spec.cols[camel];
    if (!(c in row)) continue;
    const v = row[c];
    if (v === null || v === undefined) { if (!(camel in out)) out[camel] = null; continue; }
    out[camel] = t === 'ts' ? Timestamp.fromDate(new Date(v)) : decode(v);
  }
  return out;
}
const mkDocSnap = (ref, spec, row) => ({
  id: rowId(spec, row), ref, exists: () => true,
  data: () => rowToData(spec, row),
});
const missingSnap = (ref) => ({ id: ref.id, ref, exists: () => false, data: () => undefined });

/* ───────────── queries ───────────── */
class Query { constructor(col, cons) { this.col = col; this.cons = cons; this.type = 'query'; } }
export const where = (field, op, value) => ({ k: 'where', field, op, value });
export const orderBy = (field, dir) => ({ k: 'order', field, dir: dir || 'asc' });
export const limit = (n) => ({ k: 'limit', n });
export const query = (col, ...cons) => new Query(col, [...(col.cons || []), ...cons]);
const baseCol = (q) => (q instanceof Query ? q.col : q);

function colFor(spec, field) {
  if (field === '__name__') return { c: idCols(spec)[0], t: null };
  if (spec.cols[field]) return spec.cols[field];
  if (spec.over) return { c: spec.over + '->>' + field, t: null, over: true };
  throw new Error('Unsupported field in query: ' + field);
}
function qVal(m, v) {
  if (v instanceof Timestamp || v instanceof Date) return toIso(v);
  return v;
}
function buildSelect(db, target, countOnly) {
  const col = baseCol(target); const info = resolve(col);
  if (info.noop) return { info, empty: true };
  const { spec, parents } = info;
  let q = db._c.from(spec.table).select('*');
  for (const p in parents) q = q.eq(p, parents[p]);
  const cons = target instanceof Query ? target.cons : [];
  let lim = null; const orders = [];
  for (const c of cons) {
    if (c.k === 'limit') lim = c.n;
    else if (c.k === 'order') orders.push(c);
    else if (c.k === 'where') {
      const m = colFor(spec, c.field); const v = qVal(m, c.value);
      switch (c.op) {
        case '==': q = v === null ? q.is(m.c, null) : q.eq(m.c, v); break;
        case '!=': q = q.neq(m.c, v); break;
        case '<': q = q.lt(m.c, v); break;
        case '<=': q = q.lte(m.c, v); break;
        case '>': q = q.gt(m.c, v); break;
        case '>=': q = q.gte(m.c, v); break;
        case 'in': q = q.in(m.c, v); break;
        case 'array-contains': q = q.contains(m.c, [v]); break;
        case 'array-contains-any': q = q.or(v.map(x => { const lit = JSON.stringify([x]); return /[,()\\"]/.test(String(x)) ? m.c + '.cs."' + lit.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"' : m.c + '.cs.' + lit; }).join(',')); break;
        default: throw new Error('Unsupported operator ' + c.op);
      }
    }
  }
  const clientSort = [];
  for (const o of orders) {
    const m = spec.cols[o.field] || (o.field === '__name__' ? { c: idCols(spec)[0] } : null);
    if (m) { q = q.order(m.c, { ascending: o.dir !== 'desc', nullsFirst: false }).not(m.c, 'is', null); }
    else clientSort.push(o);
  }
  return { info, q, lim, clientSort, orders };
}
function sortDocs(docs, sorts) {
  const key = (d, f) => { const v = d.data()[f]; return v && v.toMillis ? v.toMillis() : v; };
  return docs.sort((a, b) => { for (const s of sorts) { const x = key(a, s.field), y = key(b, s.field); if (x === y) continue; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : 1) * (s.dir === 'desc' ? -1 : 1); } return 0; });
}
export async function getDocs(target) {
  const db = baseCol(target).db;
  const b = buildSelect(db, target);
  if (b.empty) return mkQuerySnap(target, [], null);
  const { info, lim, clientSort } = b; let q = b.q;
  let rows = [];
  if (lim && !clientSort.length) { const { data, error } = await q.limit(lim); if (error) throw mkErr(error); rows = data; }
  else {
    for (const ic of idCols(info.spec)) q = q.order(ic, { ascending: true });   // ترتيب ثابت (tiebreaker) عشان الصفحات ماتكررش/تضيّع صفوف
    for (let from = 0; ; from += 1000) {
      const { data, error } = await q.range(from, from + 999); if (error) throw mkErr(error);
      rows = rows.concat(data); if (data.length < 1000) break;
    }
  }
  const col = baseCol(target);
  let docs = rows.map(r => mkDocSnap(new DocRef(db, [...col.segs, rowId(info.spec, r)], rowId(info.spec, r)), info.spec, r));
  if (clientSort.length) docs = sortDocs(docs, clientSort);
  if (lim) docs = docs.slice(0, lim);
  return mkQuerySnap(target, docs);
}
function mkQuerySnap(target, docs) {
  return { docs, size: docs.length, empty: docs.length === 0, forEach: (f) => docs.forEach(f), query: target, docChanges: () => [] };
}
export async function getDoc(ref) {
  const info = resolve(ref);
  if (info.noop) return missingSnap(ref);
  const { spec, parents, id } = info;
  if (UUID_ID_SPECS.has(info.key) && !UUID_RE.test(id)) return missingSnap(ref);
  let q = ref.db._c.from(spec.table).select('*');
  const f = { ...idFilters(spec, id), ...parents };
  for (const k in f) q = q.eq(k, f[k]);
  const { data, error } = await q.limit(1);
  if (error) { if (error.code === '22P02') return missingSnap(ref); throw mkErr(error); }
  return data.length ? mkDocSnap(ref, spec, data[0]) : missingSnap(ref);
}

/* ───────────── writes ───────────── */
function setNested(obj, path, val, del) {
  let o = obj;
  for (let i = 0; i < path.length - 1; i++) { if (o[path[i]] == null || typeof o[path[i]] !== 'object') o[path[i]] = {}; o = o[path[i]]; }
  if (del) delete o[path[path.length - 1]]; else o[path[path.length - 1]] = val;
}
const getNested = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);

// يحوّل بيانات المستند لتغييرات على الأعمدة + حقل overflow + عدّادات ذرّية
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
function deepMerge(a, b) {
  const o = { ...a };
  for (const k in b) o[k] = (isPlain(b[k]) && isPlain(a && a[k])) ? deepMerge(a[k], b[k]) : b[k];
  return o;
}
function compile(spec, data, cur, isInsert, merge) {
  const row = {}; const incs = [];
  let ov = spec.over ? clone((cur && cur[spec.over]) || {}) : null; let ovTouched = false;
  const colVals = {}; // json col working copies
  const getCol = (c) => (c in colVals ? colVals[c] : (colVals[c] = clone(cur ? cur[c] : null)));
  for (const key in data) {
    let v = data[key]; const path = key.includes('.') ? key.split('.') : [key];
    const root = path[0]; const m = spec.cols[root];
    const resolveVal = (existing) => {
      if (v instanceof FV) {
        if (v.kind === 'ts') return { val: Timestamp.now() };
        if (v.kind === 'del') return { del: true };
        if (v.kind === 'union') { const a = Array.isArray(existing) ? [...existing] : []; for (const x of v.v) if (!a.some(y => sameEq(y, x))) a.push(x); return { val: a }; }
        if (v.kind === 'remove') { const a = Array.isArray(existing) ? existing.filter(y => !v.v.some(x => sameEq(x, y))) : []; return { val: a }; }
        if (v.kind === 'inc') return { val: (Number(existing) || 0) + v.v, inc: v.v };
      }
      if (merge && isPlain(v) && isPlain(existing)) return { val: deepMerge(existing, v) };
      return { val: v };
    };
    if (m && path.length === 1) {
      if (v instanceof FV && v.kind === 'inc' && !isInsert) { incs.push({ col: m.c, delta: v.v }); continue; }
      const existing = cur ? (m.t === 'ts' ? null : decode(cur[m.c])) : null;
      const r = resolveVal(existing);
      if (r.del) { row[m.c] = null; continue; }
      let val = r.val;
      if (m.t === 'ts') val = toIso(val);
      else if (UUID_COLS.has(m.c)) val = val === '' || val === undefined ? null : val;
      else if (m.t === 'json') val = encJson(val);
      else if (val instanceof Timestamp) val = toIso(val);
      row[m.c] = val === undefined ? null : val;
    } else if (m && m.t === 'json') {
      const w = getCol(m.c) || {}; colVals[m.c] = w;
      const sub = path.slice(1); const r = resolveVal(getNested(w, sub));
      setNested(w, sub, r.val === undefined ? null : encJson(r.val), r.del); row[m.c] = w;
    } else if (spec.over) {
      if (path.length === 1 && v instanceof FV && v.kind === 'inc' && !isInsert) { incs.push({ over: spec.over, field: root, delta: v.v }); continue; }
      const r = resolveVal(getNested(ov, path)); ovTouched = true;
      setNested(ov, path, r.val === undefined ? null : encJson(r.val), r.del);
    } else console.warn('[compat] field dropped (no column):', spec.table, key);
  }
  if (ovTouched) row[spec.over] = ov;
  return { row, incs, needsOver: ovTouched };
}
function needsCur(spec, data, merge) {
  for (const key in data) {
    const v = data[key]; const root = key.split('.')[0]; const m = spec.cols[root];
    if (key.includes('.')) return true;
    if (v instanceof FV && (v.kind === 'union' || v.kind === 'remove')) return true;
    if (!m && spec.over) return true;
    if (merge && isPlain(v)) return true;
  }
  return false;
}
async function fetchRaw(ref, info) {
  const { spec, parents, id } = info;
  let q = ref.db._c.from(spec.table).select('*');
  const f = { ...idFilters(spec, id), ...parents };
  for (const k in f) q = q.eq(k, f[k]);
  const { data, error } = await q.limit(1); if (error) throw mkErr(error);
  return data[0] || null;
}
async function doWrite(ref, data, { merge, mustExist }) {
  const info = resolve(ref);
  if (info.noop) return;
  const { spec, parents, id } = info;
  if (spec.ro) { const e = new Error('permission-denied'); e.code = 'permission-denied'; throw e; }
  if (UUID_ID_SPECS.has(info.key) && !UUID_RE.test(id)) { const e = new Error('invalid id'); e.code = 'not-found'; throw e; }
  const cur = needsCur(spec, data, merge) ? await fetchRaw(ref, info) : undefined;
  const filt = { ...idFilters(spec, id), ...parents };
  const c = compile(spec, data, cur, false, merge);
  let updated = 0;
  if (Object.keys(c.row).length) {
    let q = ref.db._c.from(spec.table).update(c.row); for (const k in filt) q = q.eq(k, filt[k]);
    const { data: r, error } = await q.select(idCols(spec)[0]); if (error) throw mkErr(error);
    updated = r.length;
  } else {
    let q = ref.db._c.from(spec.table).select(idCols(spec)[0]); for (const k in filt) q = q.eq(k, filt[k]);
    const { data: r, error } = await q.limit(1); if (error) throw mkErr(error); updated = r.length;
  }
  if (!updated) {
    if (mustExist) { const e = new Error('No document to update (or permission denied): ' + ref.path); e.code = 'not-found'; throw e; }
    const ci = compile(spec, data, null, true);
    const ins = { ...ci.row, ...filt };
    if (spec.table === 'admins') ins.id = id;
    const { error } = await ref.db._c.from(spec.table).insert(ins);
    if (error) { const e = mkErr(error); if (e.code === 'already-exists') e.code = 'permission-denied'; throw e; }
    return;
  }
  for (const inc of c.incs) {
    const { error } = await ref.db._c.rpc('fs_increment', { p_table: spec.table, p_idcol: idCols(spec)[0], p_id: id, p_col: inc.col || inc.field, p_delta: inc.delta, p_over: inc.over || null });
    if (error) throw mkErr(error);
  }
}
export const setDoc = (ref, data, opts) => doWrite(ref, data, { merge: !!(opts && opts.merge) });
export const updateDoc = (ref, data) => doWrite(ref, data, { mustExist: true });
export async function addDoc(col, data) {
  const ref = doc(col);
  await doWrite(ref, data, {});
  return ref;
}
export async function deleteDoc(ref) {
  const info = resolve(ref); if (info.noop) return;
  const { spec, parents, id } = info;
  if (spec.ro) { const e = new Error('permission-denied'); e.code = 'permission-denied'; throw e; }
  if (UUID_ID_SPECS.has(info.key) && !UUID_RE.test(id)) return;
  let q = ref.db._c.from(spec.table).delete();
  const f = { ...idFilters(spec, id), ...parents }; for (const k in f) q = q.eq(k, f[k]);
  const { error } = await q; if (error) throw mkErr(error);
}
export function writeBatch(db) {
  const ops = [];
  const b = {
    set: (r, d, o) => { ops.push(() => setDoc(r, d, o)); return b; },
    update: (r, d) => { ops.push(() => updateDoc(r, d)); return b; },
    delete: (r) => { ops.push(() => deleteDoc(r)); return b; },
    commit: async () => { for (const f of ops) await f(); },
  };
  return b;
}
export async function runTransaction(db, fn) {
  const tx = { get: getDoc, set: (r, d, o) => setDoc(r, d, o), update: (r, d) => updateDoc(r, d), delete: (r) => deleteDoc(r) };
  return fn(tx);
}

/* ───────────── onSnapshot ───────────── */
export function onSnapshot(target, next, errCb) {
  const isDoc = target.type === 'document';
  const db = isDoc ? target.db : baseCol(target).db;
  let active = true, timer = null, busy = false, again = false;
  const run = async () => {
    if (!active) return; if (busy) { again = true; return; } busy = true;
    try { const snap = isDoc ? await getDoc(target) : await getDocs(target); if (active) next(snap); }
    catch (e) { if (active && errCb) errCb(e); }
    busy = false; if (again) { again = false; run(); }
  };
  const kick = () => { clearTimeout(timer); timer = setTimeout(run, 120); };
  run();
  let channel = null, poll = null;
  try {
    const info = resolve(isDoc ? target : baseCol(target));
    if (!info.noop) {
      let filter;
      if (isDoc) { const f = { ...idFilters(info.spec, info.id) }; const k = Object.keys(f)[0]; filter = k + '=eq.' + f[k]; }
      else { const p = Object.keys(info.parents)[0]; if (p) filter = p + '=eq.' + info.parents[p]; }
      const opts = { event: '*', schema: 'public', table: info.spec.table }; if (filter) opts.filter = filter;
      channel = db._c.channel('fs_' + autoId()).on('postgres_changes', opts, kick).subscribe();
      db.app.channels.add(channel);
      poll = setInterval(run, 45000);
    }
  } catch (e) { /* بدون realtime: polling بس */ poll = poll || setInterval(run, 15000); }
  return () => { active = false; clearTimeout(timer); clearInterval(poll); if (channel) { db._c.removeChannel(channel); db.app.channels.delete(channel); } };
}
