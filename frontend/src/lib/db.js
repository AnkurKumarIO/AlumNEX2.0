/**
 * Direct Supabase data layer — used when backend is unreachable.
 * Handles: user registration, login lookup, profile save, requests, notifications.
 */
import { supabase } from './supabaseClient';

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getUserByEmail(email) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (!data) return null;
  
  // Parse profile_data JSON string if it exists
  if (data.profile_data && typeof data.profile_data === 'string') {
    try {
      data.profile_data = JSON.parse(data.profile_data);
    } catch (e) {
      console.warn('getUserByEmail: Failed to parse profile_data:', e.message);
      data.profile_data = {};
    }
  }
  
  return data;
}

export async function getUserById(id) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (!data) return null;
  
  // Parse profile_data JSON string if it exists
  if (data.profile_data && typeof data.profile_data === 'string') {
    try {
      data.profile_data = JSON.parse(data.profile_data);
    } catch (e) {
      console.warn('getUserById: Failed to parse profile_data:', e.message);
      data.profile_data = {};
    }
  }
  
  return data;
}

export async function createUser({ id, role, name, email, department, college, year, username, password }) {
  // Must be signed in for RLS to allow insert (auth.uid() = id)
  if (password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.warn('createUser signIn error:', error.message);
  }

  // Small delay to ensure session is set
  await new Promise(r => setTimeout(r, 300));

  const { data, error } = await supabase
    .from('users')
    .insert({
      id,
      role,
      name,
      email,
      department: department || 'General',
      verification_status: 'VERIFIED',
      profile_data: JSON.stringify({ college, year, username }),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  
  // Parse profile_data before returning
  if (data && data.profile_data && typeof data.profile_data === 'string') {
    try {
      data.profile_data = JSON.parse(data.profile_data);
    } catch (e) {
      console.warn('createUser: Failed to parse profile_data:', e.message);
      data.profile_data = {};
    }
  }
  
  return data;
}

export async function updateUserProfile(userId, profileData) {
  // Ensure profile_data is stringified for database storage
  const profileDataString = typeof profileData === 'string' 
    ? profileData 
    : JSON.stringify(profileData);
  
  // Try update first
  const { data, error } = await supabase
    .from('users')
    .update({ 
      profile_data: profileDataString, 
      ...(profileData.department ? { department: profileData.department } : {}),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    // If row doesn't exist, try upsert
    if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
      const { data: upserted, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          profile_data: profileDataString,
          name: profileData.name || 'User',
          email: profileData.email || '',
          role: profileData.role || 'STUDENT',
          department: profileData.department || 'General',
          verification_status: 'VERIFIED',
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
      if (upsertError) {
        console.warn('updateUserProfile upsert error:', upsertError.message);
        throw upsertError;
      }
      if (upserted?.profile_data && typeof upserted.profile_data === 'string') {
        try { upserted.profile_data = JSON.parse(upserted.profile_data); } catch { upserted.profile_data = {}; }
      }
      return upserted;
    }
    console.warn('updateUserProfile error:', error.message);
    throw error;
  }
  
  // Parse profile_data before returning
  if (data && data.profile_data && typeof data.profile_data === 'string') {
    try {
      data.profile_data = JSON.parse(data.profile_data);
    } catch (e) {
      console.warn('updateUserProfile: Failed to parse returned profile_data:', e.message);
      data.profile_data = {};
    }
  }
  
  return data;
}

export async function getAllAlumni() {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const res = await fetch(`${API_URL}/alumni`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('getAllAlumni backend fetch failed:', err.message);
  }

  // Fallback: Query Supabase directly
  try {
    console.log('Fetching alumni list directly from Supabase...');
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, department, profile_data, company, batch_year')
      .eq('role', 'ALUMNI')
      .eq('verification_status', 'VERIFIED');
    
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      profile_data: typeof u.profile_data === 'string' ? JSON.parse(u.profile_data) : (u.profile_data || {})
    }));
  } catch (err) {
    console.error('getAllAlumni Supabase fallback error:', err);
    return [];
  }
}

// ── Interview Requests ────────────────────────────────────────────────────────

export async function createRequest({ studentId, alumniId, topic, message, studentProfileSnapshot }) {
  // Ensure we have an active Supabase session before inserting (RLS requires auth.uid() = student_id)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('createRequest: No active Supabase session — RLS may block insert');
  }

  // Stringify student profile snapshot if it's an object
  const profileSnapshotString = studentProfileSnapshot 
    ? (typeof studentProfileSnapshot === 'string' 
        ? studentProfileSnapshot 
        : JSON.stringify(studentProfileSnapshot))
    : null;

  const requestId = crypto.randomUUID();
  const { data, error } = await supabase
    .from('interview_requests')
    .insert({
      request_id: requestId,
      student_id: studentId,
      alumni_id:  alumniId,
      topic:      topic   || 'Mock Interview',
      message:    message || '',
      student_profile_snapshot: profileSnapshotString,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('createRequest error:', error.message, error.details);
    throw error;
  }
  
  // Parse student_profile_snapshot before returning
  if (data && data.student_profile_snapshot && typeof data.student_profile_snapshot === 'string') {
    try {
      data.student_profile_snapshot = JSON.parse(data.student_profile_snapshot);
    } catch (e) {
      console.warn('createRequest: Failed to parse student_profile_snapshot:', e.message);
      data.student_profile_snapshot = null;
    }
  }
  
  return data;
}

export async function getRequestsForAlumni(alumniId) {
  const { data } = await supabase
    .from('interview_requests')
    .select(`
      *,
      student:users!interview_requests_student_id_fkey(id, name, email, profile_data)
    `)
    .eq('alumni_id', alumniId)
    .order('createdAt', { ascending: false });

  return (data || []).map(r => {
    // Parse student profile_data if it's a string
    if (r.student?.profile_data && typeof r.student.profile_data === 'string') {
      try {
        r.student.profile_data = JSON.parse(r.student.profile_data);
      } catch (e) {
        console.warn('getRequestsForAlumni: Failed to parse student profile_data:', e.message);
        r.student.profile_data = {};
      }
    }
    
    // Parse student_profile_snapshot if it's a string
    if (r.student_profile_snapshot && typeof r.student_profile_snapshot === 'string') {
      try {
        r.student_profile_snapshot = JSON.parse(r.student_profile_snapshot);
      } catch (e) {
        console.warn('getRequestsForAlumni: Failed to parse student_profile_snapshot:', e.message);
        r.student_profile_snapshot = null;
      }
    }
    
    return {
      ...r,
      student_name: r.student?.name || '',
    };
  });
}

export async function getRequestsForStudent(studentId) {
  const { data } = await supabase
    .from('interview_requests')
    .select(`
      *,
      alumni:users!interview_requests_alumni_id_fkey(id, name, email, company, profile_data)
    `)
    .eq('student_id', studentId)
    .order('createdAt', { ascending: false });

  return (data || []).map(r => {
    // Parse alumni profile_data if it's a string
    if (r.alumni?.profile_data && typeof r.alumni.profile_data === 'string') {
      try {
        r.alumni.profile_data = JSON.parse(r.alumni.profile_data);
      } catch (e) {
        console.warn('getRequestsForStudent: Failed to parse alumni profile_data:', e.message);
        r.alumni.profile_data = {};
      }
    }
    
    // Parse student_profile_snapshot if it's a string
    if (r.student_profile_snapshot && typeof r.student_profile_snapshot === 'string') {
      try {
        r.student_profile_snapshot = JSON.parse(r.student_profile_snapshot);
      } catch (e) {
        console.warn('getRequestsForStudent: Failed to parse student_profile_snapshot:', e.message);
        r.student_profile_snapshot = null;
      }
    }
    
    return {
      ...r,
      alumni_name: r.alumni?.name || '',
    };
  });
}

export async function updateRequest(requestId, updates) {
  const payload = {};
  if (updates.status)        payload.status         = updates.status.toUpperCase().replace('SLOT_BOOKED','SLOT_BOOKED');
  if (updates.scheduledTime) payload.scheduled_time = updates.scheduledTime;
  if (updates.roomId)        payload.room_id        = updates.roomId;
  payload.updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('interview_requests')
    .update(payload)
    .eq('request_id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function createNotification({ userId, type, title, message, requestId, roomId }) {
  await supabase.from('notifications').insert({
    notification_id: crypto.randomUUID(),
    user_id:    userId,
    type:       type.toUpperCase(),
    title,
    message,
    request_id: requestId || null,
    room_id:    roomId    || null,
  });
}

export async function getNotificationsForUser(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('createdAt', { ascending: false });
  return data || [];
}

export async function markNotificationsRead(userId) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

// ── Platform Stats ────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [s, a, i] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'STUDENT').eq('verification_status', 'VERIFIED'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'ALUMNI').eq('verification_status', 'VERIFIED'),
    supabase.from('interview_records').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
  ]);
  return { verified_students: s.count || 0, active_mentors: a.count || 0, mock_interviews: i.count || 0, scheduled_today: 0 };
}

export async function getPendingUsers() {
  const { data } = await supabase
    .from('users')
    .select('id, name, role, department, email, verification_status, createdAt')
    .in('role', ['STUDENT', 'ALUMNI'])
    .order('createdAt', { ascending: false })
    .limit(20);
  return data || [];
}

export async function verifyUser(id, status) {
  const { data } = await supabase
    .from('users')
    .update({ 
      verification_status: status,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  return data;
}

// ── Interview Records ─────────────────────────────────────────────────────────

// Task 3.1 — upsert a completed interview record (Student end-session)
export async function upsertInterviewRecord({ student_id, alumni_id, request_id, transcript, student_score, ai_action_items, status }) {
  const { data, error } = await supabase
    .from('interview_records')
    .upsert({
      student_id,
      alumni_id,
      request_id,
      transcript:      transcript      || '',
      student_score:   student_score   || 0,
      ai_action_items: ai_action_items || null,
      status:          status          || 'COMPLETED',
      updatedAt:       new Date().toISOString(),
    }, { onConflict: 'request_id' })
    .select()
    .single();
  return { data, error };
}

// Task 3.2 — update an existing interview record (Alumni rating save)
export async function updateInterviewRecord(interviewId, updates) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  try {
    const res = await fetch(`${API_URL}/interview-records/${interviewId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: { message: err.error || `HTTP ${res.status}` } };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    // Fallback: direct Supabase update if backend unreachable
    const { data, error } = await supabase
      .from('interview_records')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('interview_id', interviewId)
      .select()
      .single();
    return { data, error };
  }
}

// ── Room-ID Query Helpers ─────────────────────────────────────────────────────

// Task 4.1 — get SLOT_BOOKED requests for a student (includes room_id)
export async function getSlotBookedRequestsForStudent(studentId) {
  const { data, error } = await supabase
    .from('interview_requests')
    .select('request_id, room_id, scheduled_time, alumni_id, topic, alumni:users!interview_requests_alumni_id_fkey(name, company, profile_data)')
    .eq('student_id', studentId)
    .eq('status', 'SLOT_BOOKED')
    .order('scheduled_time', { ascending: true });
  if (error) { console.warn('getSlotBookedRequestsForStudent:', error.message); return []; }
  return (data || []).map(r => ({
    ...r,
    alumniName:    r.alumni?.name    || '',
    alumniCompany: r.alumni?.company || '',
  }));
}

// Task 4.2 — get SLOT_BOOKED requests for an alumni (includes room_id)
export async function getSlotBookedRequestsForAlumni(alumniId) {
  const { data, error } = await supabase
    .from('interview_requests')
    .select('request_id, room_id, scheduled_time, student_id, topic, student:users!interview_requests_student_id_fkey(name, profile_data)')
    .eq('alumni_id', alumniId)
    .eq('status', 'SLOT_BOOKED')
    .order('scheduled_time', { ascending: true });
  if (error) { console.warn('getSlotBookedRequestsForAlumni:', error.message); return []; }
  return (data || []).map(r => ({
    ...r,
    studentName: r.student?.name || '',
  }));
}
