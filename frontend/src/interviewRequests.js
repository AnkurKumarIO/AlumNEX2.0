// Interview requests — backed by Supabase directly from frontend
// Falls back to localStorage when Supabase is unreachable

import { createRequest as dbCreateRequest, getRequestsForAlumni as dbGetRequestsForAlumni, getRequestsForStudent, updateRequest as dbUpdateRequest, createNotification } from './lib/db';
import { emitRealtimeSync } from './lib/realtimeSync';
import { api } from './api';

const STORAGE_KEY = 'alumnex_interview_requests';
const NOTIF_KEY   = 'alumniconnect_student_notifications';

// ── localStorage helpers (fallback) ──────────────────────────────────────────
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveLocal(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  emitRealtimeSync({ type: 'requests_updated' });
}
function pushLocalNotif({ studentName, type, title, message, requestId, roomId }) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    all.unshift({ id: `notif-${Date.now()}`, studentName, type, title, message, requestId, roomId: roomId || null, read: false, createdAt: new Date().toISOString() });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    emitRealtimeSync({ type: 'student_notifications_updated', studentName });
  } catch {}
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function getStudentNotifications(studentName) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    return all.filter(n => n.studentName === studentName);
  } catch { return []; }
}

export async function markStudentNotifsRead(studentName, studentId) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    const updated = all.map(n => n.studentName === studentName ? { ...n, read: true } : n);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    emitRealtimeSync({ type: 'student_notifications_updated', studentName });
    
    // Also sync to DB if we have the ID
    let realStudentId = studentId;
    if (!realStudentId) {
      const authUser = JSON.parse(localStorage.getItem('alumnex_user') || '{}');
      if (authUser.id && authUser.name === studentName) realStudentId = authUser.id;
    }
    if (realStudentId && !String(realStudentId).startsWith('stu-')) {
      const { markNotificationsRead } = await import('./lib/db');
      await markNotificationsRead(realStudentId);
    }
  } catch {}
}

// ── Send a request (student → alumni) ────────────────────────────────────────

export async function sendRequest({ studentName, studentId, alumniName, alumniRole, topic, message, studentProfile, alumniId }) {
  // Get the real student UUID from auth context
  let realStudentId = studentId;
  try {
    const authUser = JSON.parse(localStorage.getItem('alumnex_user') || '{}');
    if (authUser.id && !authUser.id.startsWith('stu-') && !authUser.id.startsWith('alm-')) {
      realStudentId = authUser.id;
    }
  } catch {}

  // Smart ID resolution: If we have a mock alumniId but no real UUID, 
  // try to find the real alumni record in the DB by name.
  let finalAlumniId = alumniId;
  if (!finalAlumniId || String(finalAlumniId).startsWith('alm-')) {
    try {
      const { getAllAlumni } = await import('./lib/db');
      const list = await getAllAlumni();
      const match = list.find(a => a.name === alumniName);
      if (match) finalAlumniId = match.id;
    } catch {}
  }

  let mergedStudentProfile = studentProfile || null;
  try {
    if (realStudentId && !String(realStudentId).startsWith('stu-') && !String(realStudentId).startsWith('alm-')) {
      const { getUserById } = await import('./lib/db');
      const user = await getUserById(realStudentId);
      const dbProfile = user?.profile_data || {};
      mergedStudentProfile = { ...dbProfile, ...(studentProfile || {}) };
    }
  } catch {}

  const hasRealIds = realStudentId && finalAlumniId &&
    !String(realStudentId).startsWith('stu-') && !String(finalAlumniId).startsWith('alm-');

  if (hasRealIds) {
    try {
      // Use Backend API for centralized handling (notifications, etc)
      const result = await api.createRequest({
        studentId: realStudentId,
        alumniId:  finalAlumniId,
        topic:    topic   || 'Mock Interview',
        message:  message || '',
        studentProfileSnapshot: mergedStudentProfile || null,
      });

      if (result?.request_id || result?.id) {
        const reqId = result.request_id || result.id;
        const local = loadLocal();
        local.push({
          id:            reqId,
          studentName,
          studentId:     realStudentId,
          alumniName,
          alumniId:      finalAlumniId,
          alumni_id:     finalAlumniId,
          alumniRole,
          topic:         result.topic || topic,
          message:       result.message || message,
          status:        'pending',
          scheduledTime: null,
          roomId:        null,
          createdAt:     result.created_at || new Date().toISOString(),
          studentProfile: mergedStudentProfile,
        });
        saveLocal(local);
        return { ...result, id: reqId };
      }
    } catch (e) {
      console.warn('sendRequest: Backend failed, falling back to direct Supabase', e.message);

      try {
        const result = await dbCreateRequest({
          studentId: realStudentId,
          alumniId:  finalAlumniId,
          topic:    topic   || 'Mock Interview',
          message:  message || '',
          studentProfileSnapshot: mergedStudentProfile || null,
        });
        if (result?.request_id) {
          const local = loadLocal();
          local.push({
            id:            result.request_id,
            studentName,
            studentId:     realStudentId,
            alumniName,
            alumniId:      finalAlumniId,
            alumni_id:     finalAlumniId,
            alumniRole,
            topic:         result.topic,
            message:       result.message || '',
            status:        'pending',
            scheduledTime: null,
            roomId:        null,
            createdAt:     result.created_at || new Date().toISOString(),
            studentProfile: mergedStudentProfile,
          });
          saveLocal(local);
          return result;
        }
      } catch (dbErr) {
        console.warn('sendRequest: Supabase also failed', dbErr.message);
      }
    }
  } else {
    console.warn('sendRequest: missing real UUIDs — studentId:', realStudentId, 'alumniId:', finalAlumniId);
  }

  // Fallback — localStorage only
  const local = loadLocal();
  const req = {
    id:            `req-${Date.now()}`,
    studentName,
    studentId:     realStudentId || studentId,
    alumniName,
    alumniId:      alumniId || '',
    alumni_id:     alumniId || '',
    alumniRole,
    topic:         topic   || 'Mock Interview',
    message:       message || '',
    status:        'pending',
    scheduledTime: null,
    roomId:        null,
    createdAt:     new Date().toISOString(),
    studentProfile: mergedStudentProfile || null,
  };
  local.push(req);
  saveLocal(local);
  return req;
}

// Normalize DB status (PENDING/ACCEPTED/SLOT_BOOKED/DECLINED) → local (pending/accepted/slot_booked/declined)
function normalizeStatus(status) {
  if (!status) return 'pending';
  return status.toLowerCase();
}

// ── Get all requests (for alumni dashboard) ───────────────────────────────────

export async function getRequestsFromDB(alumniId) {
  try {
    if (alumniId) {
      const data = await dbGetRequestsForAlumni(alumniId);
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return loadLocal();
}

// ── Sync local requests from DB for a student ─────────────────────────────────

export async function syncStudentRequests(studentId) {
  try {
    if (studentId) {
      const data = await getRequestsForStudent(studentId);
      if (Array.isArray(data)) {
        const local = loadLocal();
        data.forEach(dbReq => {
          const idx = local.findIndex(r => r.id === dbReq.request_id);
          const mapped = {
            id:            dbReq.request_id,
            studentName:   dbReq.student_name || '',
            studentId:     dbReq.student_id,
            alumniName:    dbReq.alumni_name  || '',
            alumniId:      dbReq.alumni_id,
            alumni_id:     dbReq.alumni_id,
            alumniRole:    '',
            topic:         dbReq.topic,
            message:       dbReq.message,
            status:        (dbReq.status || 'PENDING').toLowerCase(),
            scheduledTime: dbReq.scheduled_time || null,
            roomId:        dbReq.room_id || null,
            createdAt:     dbReq.created_at,
            studentProfile: dbReq.student_profile_snapshot || null,
          };
          if (idx === -1) local.push(mapped);
          else local[idx] = { ...local[idx], ...mapped };
        });
        saveLocal(local);
      }
    }
  } catch {}
}

// ── localStorage-based reads (used by BookButton, etc.) ──────────────────────

export function getRequests() { return loadLocal(); }

export function getRequestsForAlumni(alumniName) {
  return loadLocal().filter(r => r.alumniName === alumniName && r.status === 'pending');
}

export function getRequestsByStudent(studentName) {
  return loadLocal().filter(r => r.studentName === studentName);
}

// ── Accept (alumni) ───────────────────────────────────────────────────────────

export async function acceptRequestOnly(requestId) {
  try {
    await api.updateRequest(requestId, { status: 'ACCEPTED' });
  } catch (e) {
    console.warn('acceptRequestOnly Backend error, trying Supabase:', e.message);
    try {
      await dbUpdateRequest(requestId, { status: 'ACCEPTED' });
    } catch (dbErr) {
      console.warn('acceptRequestOnly Supabase error:', dbErr.message);
    }
  }

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status: 'accepted' };
  saveLocal(requests);

  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        'accepted',
    title:       'Interview Request Accepted! 🎉',
    message:     'Your interview request has been accepted. The alumni will book a slot shortly.',
    requestId,
  });
  return requests[idx];
}

// ── Book slot (alumni) ────────────────────────────────────────────────────────

export async function bookSlot(requestId, scheduledTime) {
  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const req = requests[idx];

  const authUser = JSON.parse(localStorage.getItem('alumnex_user') || '{}');
  const alumniId = authUser.role === 'ALUMNI' ? authUser.id : req.alumni_id;

  // Generate deterministic room ID for AlumNEX internal routing (chat, signaling)
  const deterministicRoomId = `room-${requestId.slice(-8)}`;

  // Use backend to generate the link (will handle Google Meet if connected)
  // We don't wait for it to block the status update if it's slow,
  // but we should try to get it to store in room_id if possible.
  let meetLink = null;
  try {
    const result = await api.createMeetLink(
      requestId, 
      `Interview: ${req.studentName} & ${req.alumniName}`,
      alumniId,
      scheduledTime
    );
    if (result?.success && result.meetLink) {
      meetLink = result.meetLink;
    }
  } catch (e) {
    console.warn('bookSlot Meet API call failed:', e.message);
  }

  const finalRoomId = meetLink || deterministicRoomId;

  try {
    await api.updateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime, roomId: finalRoomId });
  } catch (e) {
    console.warn('bookSlot Backend error, trying Supabase:', e.message);
    try {
      await dbUpdateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime, roomId: finalRoomId });
    } catch (dbErr) {
      console.warn('bookSlot Supabase error:', dbErr.message);
    }
  }

  requests[idx] = { ...requests[idx], status: 'slot_booked', scheduledTime, roomId: finalRoomId };
  saveLocal(requests);

  const formatted = new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const isInstant = Math.abs(new Date(scheduledTime).getTime() - Date.now()) < 60000;
  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        isInstant ? 'live' : 'slot_booked',
    title:       isInstant ? '🔴 Interview is Live Now!' : 'Interview Slot Confirmed! 📅',
    message:     isInstant
      ? 'Your mock interview is starting now. Click Join to enter the room.'
      : `Your interview is scheduled for ${formatted}.`,
    requestId,
    roomId: finalRoomId,
  });
  return requests[idx];
}

// ── Reschedule (alumni) ───────────────────────────────────────────────────────

export async function rescheduleSlot(requestId, newScheduledTime) {
  try {
    await api.updateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime: newScheduledTime });
  } catch (e) {
    console.warn('rescheduleSlot Backend error, trying Supabase:', e.message);
    try {
      await dbUpdateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime: newScheduledTime });
    } catch (dbErr) {
      console.warn('rescheduleSlot Supabase error:', dbErr.message);
    }
  }

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], scheduledTime: newScheduledTime };
  saveLocal(requests);

  const formatted = new Date(newScheduledTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        'slot_booked',
    title:       'Interview Rescheduled 🔄',
    message:     `Your interview has been rescheduled to ${formatted}.`,
    requestId,
  });
  return requests[idx];
}

// ── Decline (alumni) ──────────────────────────────────────────────────────────

export async function declineRequest(requestId) {
  try {
    await api.updateRequest(requestId, { status: 'DECLINED' });
  } catch (e) {
    console.warn('declineRequest Backend error, trying Supabase:', e.message);
    try {
      await dbUpdateRequest(requestId, { status: 'DECLINED' });
    } catch (dbErr) {
      console.warn('declineRequest Supabase error:', dbErr.message);
    }
  }

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return;
  const studentName = requests[idx].studentName;
  requests[idx] = { ...requests[idx], status: 'declined' };
  saveLocal(requests);

  pushLocalNotif({
    studentName,
    type:    'declined',
    title:   'Interview Request Update',
    message: 'Your request was not accepted this time. Try another mentor.',
    requestId,
  });
}

// ── Legacy compat ─────────────────────────────────────────────────────────────

export function acceptRequest(requestId, scheduledTime) {
  return bookSlot(requestId, scheduledTime);
}

export function isJoinable(scheduledTime) {
  if (!scheduledTime) return false;
  const scheduled = new Date(scheduledTime).getTime();
  const now = Date.now();
  return now >= scheduled - 5 * 60 * 1000 && now <= scheduled + 2 * 60 * 60 * 1000;
}

export function formatScheduledTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
export default {
  getStudentNotifications,
  markStudentNotifsRead,
  sendRequest,
  getRequestsFromDB,
  syncStudentRequests,
  getRequests,
  getRequestsForAlumni,
  getRequestsByStudent,
  acceptRequestOnly,
  bookSlot,
  rescheduleSlot,
  declineRequest,
  acceptRequest,
  isJoinable,
  formatScheduledTime,
};
