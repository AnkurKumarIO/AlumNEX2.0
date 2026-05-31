import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlumNexLogo from '../AlumNexLogo';
import { getRequests, acceptRequestOnly, bookSlot, rescheduleSlot, declineRequest, formatScheduledTime } from '../interviewRequests';
import { api, SOCKET_URL } from '../api';
import { getAllAlumni, getRequestsForAlumni, getUserById } from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import { io } from 'socket.io-client';
import { useInterviewRequests } from '../hooks/useInterviewRequests';
import { useNotifications } from '../hooks/useNotifications';
import SettingsPage from './SettingsPage';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import { subscribeRealtimeSync, emitRealtimeSync } from '../lib/realtimeSync';
import { toUtcDate } from '../utils/dateUtils';

// Helper to parse dates and return components in Asia/Kolkata (IST) timezone
// Uses Intl.DateTimeFormat for correct timezone handling (avoids manual offset bugs)
const getISTComponents = (dateOrString) => {
  const d = toUtcDate(dateOrString);
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = {};
    formatter.formatToParts(d).forEach(p => { parts[p.type] = p.value; });
    return {
      year: parseInt(parts.year, 10),
      month: parseInt(parts.month, 10) - 1,  // JS months are 0-indexed
      date: parseInt(parts.day, 10),
      day: d.getUTCDay(), // Day of week stays the same
      hours: parseInt(parts.hour, 10),
      minutes: parseInt(parts.minute, 10),
    };
  } catch (e) {
    console.warn('[AlumniDashboard] getISTComponents failed:', e);
    // Fallback: return UTC components (not ideal but prevents crashes)
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      date: d.getUTCDate(),
      day: d.getUTCDay(),
      hours: d.getUTCHours(),
      minutes: d.getUTCMinutes(),
    };
  }
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function buildISTIsoString(year, monthIndex, day, hours24, minutes) {
  // Create a date using IST components and convert to UTC ISO string
  // We create a fake UTC date with the IST values, then subtract the offset to get the actual UTC time
  const fakeUTC = Date.UTC(year, monthIndex, day, hours24, minutes);
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const utcMs = fakeUTC - istOffsetMs;
  return new Date(utcMs).toISOString();
}

function getEventEndMs(scheduledTime, durationMinutes = 120) {
  const startMs = toUtcDate(scheduledTime).getTime();
  if (!Number.isFinite(startMs)) return Number.POSITIVE_INFINITY;
  return startMs + durationMinutes * 60 * 1000;
}

function getRequestCreatedAt(request) {
  return request?.createdAt || request?.created_at || null;
}

function getRequestScheduledTime(request) {
  return request?.scheduledTime || request?.scheduled_time || null;
}

function formatISTDateTime(value, options = {}) {
  const ms = toUtcDate(value).getTime();
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

function dedupeRequestsById(requests) {
  return Array.from(new Map((requests || []).map((request) => [request.id, request])).values());
}

// â”€â”€ Book Slot Calendar Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BookSlotModal({ request, onClose, onBooked }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeHH, setTimeHH]   = useState('10');
  const [timeMM, setTimeMM]   = useState('00');
  const [ampm, setAmpm]       = useState('AM');
  const [timeError, setTimeError] = useState('');
  const [step, setStep] = useState('calendar');
  const [booking, setBooking] = useState(false);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr   = today.toDateString();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };
  const isPast = (day) => new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const to24h = () => {
    let h = parseInt(timeHH, 10) || 12;
    const m = parseInt(timeMM, 10) || 0;
    if (ampm === 'AM') { if (h === 12) h = 0; }
    else { if (h !== 12) h += 12; }
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const handleBook = async () => {
    const h = parseInt(timeHH, 10);
    const m = parseInt(timeMM, 10);
    if (isNaN(h) || h < 1 || h > 12) { setTimeError('Hour must be 1-12'); return; }
    if (isNaN(m) || m < 0 || m > 59) { setTimeError('Minutes must be 00-59'); return; }
    setTimeError('');
    setBooking(true);
    const time24 = to24h();
    const [h24, m24] = time24.split(':').map(Number);
    const scheduledTime = buildISTIsoString(viewYear, viewMonth, selectedDate, h24, m24);
    const result = await bookSlot(request.id, scheduledTime);
    const roomId = result?.roomId || result?.room_id || null;
    setBooking(false);
    setStep('done');
    setTimeout(() => { onBooked(scheduledTime, roomId); onClose(); }, 1800);
  };

  const displayTime = () => `${String(timeHH).padStart(2,'0')}:${String(timeMM).padStart(2,'0')} ${ampm}`;

  const formattedSelected = selectedDate
    ? new Date(viewYear, viewMonth, selectedDate).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const inputStyle = {
    background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10,
    color: '#dae2fd', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center',
    width: '100%', padding: '0.6rem 0.25rem', outline: 'none', fontFamily: 'Inter, monospace',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, width: '100%', maxWidth: 520, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {step === 'done' ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📅</div>
            <h3 style={{ fontWeight: 700, color: '#4edea3', marginBottom: 8 }}>Slot Booked!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6 }}>{request.studentName} has been notified with the interview date and time.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Book Interview Slot</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>with {request.studentName}</h3>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
              {/* Month nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={prevMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
              </div>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7c4d8', padding: '0.25rem 0' }}>{d}</div>)}
              </div>
              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: '1.5rem' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const past = isPast(day);
                  const isToday = new Date(viewYear, viewMonth, day).toDateString() === todayStr;
                  const selected = selectedDate === day;
                  return (
                    <button key={day} onClick={() => !past && setSelectedDate(day)} disabled={past}
                      style={{ aspectRatio: '1', borderRadius: 8, border: 'none', cursor: past ? 'not-allowed' : 'pointer', fontWeight: selected ? 700 : 500, fontSize: '0.8rem', transition: 'all 0.15s',
                        background: selected ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : isToday ? 'rgba(78,222,163,0.15)' : 'transparent',
                        color: selected ? '#1d00a5' : past ? 'rgba(199,196,216,0.25)' : isToday ? '#4edea3' : '#dae2fd',
                        outline: isToday && !selected ? '1px solid rgba(78,222,163,0.4)' : 'none',
                      }}>{day}</button>
                  );
                })}
              </div>
              {/* Time input */}
              {selectedDate && (
                <>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: '0.75rem' }}>
                    Select Time — {formattedSelected}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: timeError ? 6 : '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hour</div>
                      <input type="number" min="1" max="12" value={timeHH}
                        onChange={e => { setTimeHH(e.target.value); setTimeError(''); }}
                        onBlur={e => { const v = Math.min(12, Math.max(1, parseInt(e.target.value)||1)); setTimeHH(String(v)); }}
                        style={inputStyle} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c3c0ff', paddingTop: 18 }}>:</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Min</div>
                      <input type="number" min="0" max="59" value={timeMM}
                        onChange={e => { setTimeMM(e.target.value); setTimeError(''); }}
                        onBlur={e => { const v = Math.min(59, Math.max(0, parseInt(e.target.value)||0)); setTimeMM(String(v).padStart(2,'0')); }}
                        style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
                      {['AM','PM'].map(p => (
                        <button key={p} onClick={() => setAmpm(p)} style={{ width: 52, padding: '0.4rem 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', background: ampm === p ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#222a3d', color: ampm === p ? '#1d00a5' : '#c7c4d8', transition: 'all 0.15s' }}>{p}</button>
                      ))}
                    </div>
                  </div>
                  {timeError && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginBottom: '1rem' }}>⚠ {timeError}</div>}
                  <div style={{ background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4edea3', marginBottom: 4 }}>Scheduled Slot</div>
                    <div style={{ fontWeight: 700, color: '#dae2fd', fontSize: '0.9rem' }}>{formattedSelected} at {displayTime()}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8', marginTop: 3 }}>A notification will be sent to {request.studentName}</div>
                  </div>
                  <button onClick={handleBook} disabled={booking} style={{ width: '100%', padding: '0.875rem', background: booking ? '#2d3449' : 'linear-gradient(135deg,#00a572,#4edea3)', color: booking ? '#c7c4d8' : '#003d29', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: booking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {booking ? (
                      <><div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating Meet Link...</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_available</span> Confirm & Notify Student</>
                    )}
                  </button>
                </>
              )}
              {!selectedDate && <div style={{ textAlign: 'center', padding: '0.5rem', color: '#c7c4d8', fontSize: '0.8rem', opacity: 0.6 }}>Select a date to set a time</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// â”€â”€ Reschedule Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RescheduleModal({ request, onClose, onRescheduled }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeHH, setTimeHH] = useState('10');
  const [timeMM, setTimeMM] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [timeError, setTimeError] = useState('');
  const [done, setDone] = useState(false);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toDateString();
  const isPast = (day) => new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const to24h = () => {
    let h = parseInt(timeHH, 10) || 12;
    const m = parseInt(timeMM, 10) || 0;
    if (ampm === 'AM') {
      if (h === 12) h = 0;
    } else if (h !== 12) {
      h += 12;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleReschedule = async () => {
    const h = parseInt(timeHH, 10);
    const m = parseInt(timeMM, 10);
    if (isNaN(h) || h < 1 || h > 12) { setTimeError('Hour must be 1-12'); return; }
    if (isNaN(m) || m < 0 || m > 59) { setTimeError('Minutes must be 00-59'); return; }
    setTimeError('');
    const [h24, m24] = to24h().split(':').map(Number);
    const newTime = buildISTIsoString(viewYear, viewMonth, selectedDate, h24, m24);
    try {
      await rescheduleSlot(request.id, newTime);
    } catch (e) {
      console.error('Reschedule failed:', e.message);
    }
    setDone(true);
    setTimeout(() => { onRescheduled(newTime); onClose(); }, 1600);
  };

  const formattedSelected = selectedDate ? new Date(viewYear, viewMonth, selectedDate).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null;
  const displayTime = () => `${String(timeHH).padStart(2, '0')}:${String(timeMM).padStart(2, '0')} ${ampm}`;

  const inputStyle = {
    background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10,
    color: '#dae2fd', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center',
    width: '100%', padding: '0.6rem 0.25rem', outline: 'none', fontFamily: 'Inter, monospace',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, width: '100%', maxWidth: 520, border: '1px solid rgba(255,185,95,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        {done ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔄</div>
            <h3 style={{ fontWeight: 700, color: '#ffb95f', marginBottom: 8 }}>Slot Rescheduled!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>{request.studentName} has been notified of the new time.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Reschedule Interview</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>with {request.studentName}</h3>
                {request.scheduledTime && <div style={{ fontSize: '0.72rem', color: '#c7c4d8', marginTop: 2 }}>Current: {toUtcDate(request.scheduledTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={prevMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#c7c4d8', padding: '0.25rem 0' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: '1.25rem' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const past = isPast(day); const isToday = new Date(viewYear, viewMonth, day).toDateString() === todayStr; const selected = selectedDate === day;
                  return <button key={day} onClick={() => !past && setSelectedDate(day)} disabled={past} style={{ aspectRatio: '1', borderRadius: 8, border: 'none', cursor: past ? 'not-allowed' : 'pointer', fontWeight: selected ? 700 : 500, fontSize: '0.8rem', background: selected ? 'linear-gradient(135deg,#e07b00,#ffb95f)' : isToday ? 'rgba(78,222,163,0.15)' : 'transparent', color: selected ? '#1d00a5' : past ? 'rgba(199,196,216,0.25)' : isToday ? '#4edea3' : '#dae2fd' }}>{day}</button>;
                })}
              </div>
              {selectedDate && (
                <>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: '0.75rem' }}>Select New Time — {formattedSelected}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: timeError ? 6 : '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hour</div>
                      <input type="number" min="1" max="12" value={timeHH}
                        onChange={e => { setTimeHH(e.target.value); setTimeError(''); }}
                        onBlur={e => { const v = Math.min(12, Math.max(1, parseInt(e.target.value) || 1)); setTimeHH(String(v)); }}
                        style={inputStyle} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffb95f', paddingTop: 18 }}>:</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Min</div>
                      <input type="number" min="0" max="59" value={timeMM}
                        onChange={e => { setTimeMM(e.target.value); setTimeError(''); }}
                        onBlur={e => { const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)); setTimeMM(String(v).padStart(2, '0')); }}
                        style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
                      {['AM', 'PM'].map(p => (
                        <button key={p} onClick={() => setAmpm(p)} style={{ width: 52, padding: '0.4rem 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', background: ampm === p ? 'linear-gradient(135deg,#e07b00,#ffb95f)' : '#222a3d', color: ampm === p ? '#1d00a5' : '#c7c4d8', transition: 'all 0.15s' }}>{p}</button>
                      ))}
                    </div>
                  </div>
                  {timeError && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginBottom: '1rem' }}>⚠ {timeError}</div>}
                  <div style={{ background: 'rgba(255,185,95,0.08)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb95f', marginBottom: 4 }}>New Slot</div>
                    <div style={{ fontWeight: 700, color: '#dae2fd', fontSize: '0.9rem' }}>{formattedSelected} at {displayTime()}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8', marginTop: 3 }}>A notification will be sent to {request.studentName}</div>
                  </div>
                  <button onClick={handleReschedule} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#e07b00,#ffb95f)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_repeat</span> Confirm Reschedule & Notify Student
                  </button>
                </>
              )}
              {!selectedDate && <div style={{ textAlign: 'center', padding: '0.5rem', color: '#c7c4d8', fontSize: '0.8rem', opacity: 0.6 }}>Select a new date to reschedule</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Modal to add an availability slot
function AddSlotModal({ onClose, onAdd }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: 400, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dae2fd' }}>Add Availability Slot</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Start Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { if (date && time) { onAdd({ date, time, duration }); onClose(); } }} disabled={!date || !time} style={{ flex: 1, padding: '0.75rem', background: date && time ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', color: date && time ? '#1d00a5' : '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: date && time ? 'pointer' : 'not-allowed' }}>Add Slot</button>
        </div>
      </div>
    </div>
  );
}

const SCHEDULE = [
  // Schedule entries are now dynamically populated from database via interview requests
  // and extraSlots state (managed through the slot booking flow)
];
const NAV_ITEMS = [
  { icon: 'dashboard',     label: 'Dashboard',        tab: 'home' },
  { icon: 'calendar_today',label: 'Schedule',         tab: 'schedule' },
  { icon: 'chat_bubble',   label: 'Requests',         tab: 'requests' },
  { icon: 'history',       label: 'Session History',  tab: 'history' },
  { icon: 'settings',      label: 'Settings',         tab: 'settings' },
];

// ── Student Full Profile Modal (read-only, mirrors My Profile tab) ──────────────
// Fetches the student's live profile_data from the DB so alumni always
// see the latest version — resume, links, projects, bio, etc.
function StudentFullProfileModal({ request, onClose, onAccept, onDecline }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!request) return;
    const load = async () => {
      setLoading(true);
      try {
        // Use snapshot directly - it has everything including photo and resume
        let snap = request.studentProfile || request.student_profile_snapshot;
        console.log('[StudentFullProfileModal] Raw snapshot exists:', !!snap);
        
        if (typeof snap === 'string') { 
          try { 
            snap = JSON.parse(snap); 
          } catch (e) { 
            console.error('[StudentFullProfileModal] Failed to parse snapshot:', e);
            snap = null; 
          } 
        }
        
        // Use snapshot as-is
        const finalProfile = snap || { name: request.studentName };
        
        // Fetch real photo/resume if stored in DB
        if (request.studentId && !request.studentId.startsWith('stu-')) {
          try {
            const { getProfileAsset } = await import('../lib/profileAssetsAPI');
            if (!finalProfile.photoPreview || finalProfile.photoPreview === '__stored_in_database__' || finalProfile.photoPreview === '__stored_locally__') {
              console.log('[StudentFullProfileModal] Fetching photo from database...');
              const photoAsset = await getProfileAsset(request.studentId, 'photo');
              const photoSrc = photoAsset?.assetUrl || photoAsset?.fileData || null;
              if (photoSrc) {
                finalProfile.photoPreview = photoSrc;
                console.log('[StudentFullProfileModal] ✓ Photo loaded from database');
              } else {
                console.log('[StudentFullProfileModal] No photo in database');
              }
            }
            if (!finalProfile.resumeUrl || finalProfile.resumeUrl === '__stored_in_database__' || finalProfile.resumeUrl === '__stored_locally__') {
              console.log('[StudentFullProfileModal] Fetching resume from database...');
              const resumeAsset = await getProfileAsset(request.studentId, 'resume');
              const resumeSrc = resumeAsset?.assetUrl || resumeAsset?.fileData || null;
              if (resumeSrc) {
                finalProfile.resumeUrl = resumeSrc;
                finalProfile.resumeName = resumeAsset.fileName || finalProfile.resumeName;
                console.log('[StudentFullProfileModal] ✓ Resume loaded from database');
              } else {
                console.log('[StudentFullProfileModal] No resume in database');
              }
            }
          } catch(e) {
             console.error('[StudentFullProfileModal] Failed to load profile assets', e);
          }
        }

        console.log('[StudentFullProfileModal] Setting final profile, has photo:', !!finalProfile.photoPreview);
        setProfile(finalProfile);
      } catch (err) {
        console.error('[StudentFullProfileModal] Error loading profile:', err);
        setProfile({ name: request.studentName });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [request]);

  if (!request) return null;

  const p = profile || {};
  const validProjects = (p.projects || []).filter(pr => pr && pr.title);
  const resumeHref = p.resumeUrl || p.resume_url || '';

  const sectionHead = (icon, text) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c3c0ff' }}>{icon}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{text}</span>
    </div>
  );

  const handleAccept = () => {
    setAccepting(true);
    setTimeout(() => {
      acceptRequestOnly(request.id);
      setDone(true);
      setTimeout(() => {
        if (onAccept) onAccept();
        onClose();
      }, 1400);
    }, 600);
  };

  const handleDecline = () => {
    if (onDecline) onDecline();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#0b1326', borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg,rgba(79,70,229,0.25),rgba(11,19,38,0.9))', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: p.photoPreview ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem', color: '#1d00a5', flexShrink: 0, border: '2px solid rgba(195,192,255,0.2)' }}>
              {p.photoPreview ? (
                <img 
                  src={p.photoPreview} 
                  alt="avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    console.error('[StudentFullProfileModal] Image failed to load');
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span style="font-size: 1.3rem; font-weight: 700; color: #1d00a5;">${(p.name || request.studentName || 'S').charAt(0).toUpperCase()}</span>`;
                  }}
                />
              ) : (
                (p.name || request.studentName || 'S').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>Student Profile</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: 2 }}>{p.name || request.studentName}</h2>
              <div style={{ fontSize: '0.78rem', color: '#c7c4d8' }}>
                {[p.department || p.branch, p.year ? `Year ${p.year}` : null, p.college].filter(Boolean).join(' • ')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: '#c7c4d8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.4, animation: 'spin 1s linear infinite' }}>progress_activity</span>
              Loading profile...
            </div>
          ) : done ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'scaleUp 0.3s ease' }}>✅</div>
              <h3 style={{ fontWeight: 800, color: '#4edea3', marginBottom: 8, fontSize: '1.4rem' }}>Request Accepted!</h3>
              <p style={{ fontSize: '0.9rem', color: '#c7c4d8', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                {request.studentName} has been notified. You can now book an interview slot with them in the dashboard.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Academics */}
                <div style={{ background: 'rgba(23,31,51,0.7)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                  {sectionHead('school', 'Academics & Status')}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.875rem', borderRadius: 10, border: '1px solid rgba(195,192,255,0.05)' }}>
                      <div style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.6, marginBottom: 4 }}>CGPA</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4edea3' }}>{p.cgpa ? `${p.cgpa} / 10` : 'Not Set'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.875rem', borderRadius: 10, border: '1px solid rgba(195,192,255,0.05)' }}>
                      <div style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.6, marginBottom: 4 }}>Graduation</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', paddingTop: 2 }}>{p.gradMonth && p.gradYear ? `${p.gradMonth} ${p.gradYear}` : 'Not Set'}</div>
                    </div>
                  </div>
                  {p.openTo?.length > 0 && (
                    <>
                      <div style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.6, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open To</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.openTo.map((s, i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.65rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(78,222,163,0.1)', color: '#4edea3', border: '1px solid rgba(78,222,163,0.2)' }}><span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>{s}</span>)}
                      </div>
                    </>
                  )}
                </div>

                {/* Skills */}
                {p.skills?.length > 0 && (
                  <div style={{ background: 'rgba(23,31,51,0.7)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                    {sectionHead('psychology', 'Skills & Expertise')}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {p.skills.map((sk, i) => <span key={i} style={{ padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(195,192,255,0.06)', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.1)' }}>{sk}</span>)}
                    </div>
                  </div>
                )}

                {/* Resume & Links */}
                <div style={{ background: 'rgba(23,31,51,0.7)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                  {sectionHead('description', 'Documents & Links')}
                  {/* Resume */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.875rem', borderRadius: 10, border: '1px solid rgba(195,192,255,0.05)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#ffb95f' }}>article</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Resume</div>
                        <div style={{ fontSize: '0.62rem', color: '#c7c4d8', opacity: 0.6 }}>{p.resumeName || 'No resume uploaded'}</div>
                      </div>
                    </div>
                    {resumeHref && (
                      <button 
                        onClick={() => {
                          if (!resumeHref) return;
                          if (resumeHref.startsWith('http')) {
                            window.open(resumeHref, '_blank', 'noopener,noreferrer');
                          } else if (resumeHref.startsWith('data:')) {
                            const byteString = atob(resumeHref.split(',')[1]);
                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                            const blob = new Blob([ab], { type: 'application/pdf' });
                            window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
                          }
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.875rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.25)', borderRadius: 8, color: '#4edea3', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span> View
                      </button>
                    )}
                  </div>
                  {/* Social links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {p.linkedin && <a href={p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 0.875rem', borderRadius: 10, background: 'rgba(10,102,194,0.1)', border: '1px solid rgba(10,102,194,0.2)', color: '#60a5fa', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>link</span>LinkedIn Profile</a>}
                    {p.github && <a href={p.github.startsWith('http') ? p.github : `https://${p.github}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 0.875rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>code</span>GitHub Repository</a>}
                    {p.portfolio && <a href={p.portfolio.startsWith('http') ? p.portfolio : `https://${p.portfolio}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 0.875rem', borderRadius: 10, background: 'rgba(195,192,255,0.05)', border: '1px solid rgba(195,192,255,0.1)', color: '#c3c0ff', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>language</span>Portfolio Website</a>}
                    {!p.linkedin && !p.github && !p.portfolio && <div style={{ fontSize: '0.82rem', color: '#c7c4d8', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>No links added</div>}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Bio */}
                <div style={{ background: 'rgba(23,31,51,0.7)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                  {sectionHead('person', 'About')}
                  <p style={{ fontSize: '0.875rem', color: '#dae2fd', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
                    {p.bio || 'No bio provided.'}
                  </p>
                </div>

                {/* Career Goals */}
                {(p.targetRoles?.length > 0 || p.preferredCompanies?.length > 0) && (
                  <div style={{ background: 'rgba(23,31,51,0.7)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                    {sectionHead('explore', 'Career Goals')}
                    {p.targetRoles?.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.6, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Roles</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.targetRoles.map((r, i) => <span key={i} style={{ padding: '0.3rem 0.65rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(195,192,255,0.06)', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.1)' }}>{r}</span>)}
                        </div>
                      </div>
                    )}
                    {p.preferredCompanies?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.6, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred Companies</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.preferredCompanies.map((c, i) => <span key={i} style={{ padding: '0.3rem 0.65rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(78,222,163,0.06)', color: '#4edea3', border: '1px solid rgba(78,222,163,0.1)' }}>{c}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Projects */}
                {validProjects.length > 0 && (
                  <div style={{ background: 'rgba(23,31,51,0.7)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                    {sectionHead('folder', 'Projects')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {validProjects.map((proj, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(195,192,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>{proj.title}</h4>
                            {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" style={{ color: '#c3c0ff', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}><span className="material-symbols-outlined" style={{ fontSize: 17 }}>open_in_new</span></a>}
                          </div>
                          {proj.desc && <p style={{ fontSize: '0.78rem', color: '#c7c4d8', lineHeight: 1.5, margin: '0 0 8px 0' }}>{proj.desc}</p>}
                          {proj.stack && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {proj.stack.split(',').map((t, ti) => <span key={ti} style={{ padding: '0.15rem 0.45rem', borderRadius: 4, fontSize: '0.62rem', fontWeight: 600, background: 'rgba(195,192,255,0.05)', color: '#c3c0ff' }}>{t.trim()}</span>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Request Context */}
                {request.message && (
                  <div style={{ background: 'rgba(23,31,51,0.7)', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                    {sectionHead('chat_bubble', "Student's Message")}
                    <div style={{ background: 'rgba(45,52,73,0.5)', borderLeft: '2px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem' }}>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(218,226,253,0.85)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>"{request.message}"</p>
                    </div>
                    <div style={{ marginTop: 8, fontSize: '0.65rem', color: 'rgba(199,196,216,0.5)' }}>Topic: <strong style={{ color: '#c3c0ff' }}>{request.topic}</strong></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!done && request.status === 'pending' && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(70,69,85,0.2)', display: 'flex', gap: 10, flexShrink: 0, background: '#0a0f1d' }}>
            <button onClick={handleDecline} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2a334a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#222a3d'; }}>
              Decline
            </button>
            <button onClick={handleAccept} disabled={accepting} style={{ flex: 2, padding: '0.75rem', background: accepting ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: accepting ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: accepting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.2s' }}
              onMouseEnter={e => { if (!accepting) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { if (!accepting) e.currentTarget.style.opacity = '1'; }}>
              {accepting ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Accepting...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span> Accept Request</>
              )}
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}


// ── Alumni Session History ──────────────────────────────────────────────────
function AlumniSessionHistory({ userId, userName }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    
    Promise.all([
      api.getUserFeedback(userId).catch(() => []),
      getRequestsForAlumni(userId).catch(() => [])
    ]).then(([feedbackData, requestsData]) => {
      const fbList = Array.isArray(feedbackData) ? feedbackData : [];
      const reqList = (Array.isArray(requestsData) ? requestsData : []).filter(r => r.status?.toUpperCase() === 'COMPLETED');
      
      const mergedMap = new Map();
      
      // Seed with completed requests
      reqList.forEach(r => {
         mergedMap.set(r.request_id, {
            id: r.request_id, // we use request_id as the canonical ID
            room_id: r.room_id,
            student_name: r.student?.name || r.student_name || 'Student',
            student_id: r.student_id,
            topic: r.topic,
            createdAt: r.scheduled_time || r.created_at,
            student_rating: null,
            student_feedback: null,
            alumni_rating: null,
            alumni_feedback: null
         });
      });
      
      // Merge feedback in
      fbList.forEach(fb => {
         let matchedKey = fb.id;
         
         // Try to find the matching request: either by request_id OR meet link
         const matchingReq = reqList.find(r => r.request_id === fb.room_id || r.room_id === fb.room_id);
         
         if (matchingReq) {
            matchedKey = matchingReq.request_id;
         } else if (mergedMap.has(fb.room_id)) {
            matchedKey = fb.room_id;
         }
         
         const existing = mergedMap.get(matchedKey) || {};
         mergedMap.set(matchedKey, {
            ...fb,
            ...existing, // Prefer request data for names/topic
            student_rating: fb.student_rating || existing.student_rating,
            student_feedback: fb.student_feedback || existing.student_feedback,
            alumni_rating: fb.alumni_rating || existing.alumni_rating,
            alumni_feedback: fb.alumni_feedback || existing.alumni_feedback,
            id: matchedKey, // ensure ID doesn't get overridden
         });
      });
      
      const finalList = Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(finalList);
      setLoading(false);
    });
  }, [userId]);

  const myRatings = sessions.map(s => s.student_rating).filter(r => r != null && r > 0);
  const avgRating = myRatings.length ? (myRatings.reduce((a, b) => a + b, 0) / myRatings.length).toFixed(1) : '—';

  // ── Improved Rating Chart ─────────────────────────────────────────────────
  // Use last 10 rated sessions, map to date labels
  const ratedSessions = sessions.filter(s => s.student_rating != null && s.student_rating > 0).slice(0, 10).reverse();
  const chartW = 800, chartH = 220, padL = 40, padR = 20, padT = 20, padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const n = ratedSessions.length;

  const getX = (i) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const getY = (rating) => padT + innerH - ((rating / 5) * innerH);

  // Smooth bezier path
  const makePath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = (pts[i - 1][0] + pts[i][0]) / 2;
      const cp1y = pts[i - 1][1];
      const cp2x = (pts[i - 1][0] + pts[i][0]) / 2;
      const cp2y = pts[i][1];
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts[i][0]} ${pts[i][1]}`;
    }
    return d;
  };

  const pts = ratedSessions.map((s, i) => [getX(i), getY(s.student_rating)]);
  const linePath = makePath(pts);
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length - 1][0]} ${padT + innerH} L ${pts[0][0]} ${padT + innerH} Z`
    : '';

  const fmtLabel = (iso) => {
    try {
      const d = toUtcDate(iso);
      return d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#c7c4d8', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.4, animation: 'spin 1s linear infinite' }}>progress_activity</span>
      Loading session history...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12 }}>
          Session <span style={{ background: 'linear-gradient(135deg,#c3c0ff,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>History</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', lineHeight: 1.6 }}>Review your past mentorship sessions and student feedback.</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Average Rating (from students)', val: avgRating !== '—' ? `${avgRating} ★` : '—', color: '#ffb95f' },
          { label: 'Total Sessions', val: String(sessions.length), sub: 'Completed', color: '#c3c0ff' },
          { label: 'Latest Feedback', val: sessions[0]?.student_feedback || 'No feedback yet', highlight: true },
        ].map((m, i) => (
          <div key={i} style={{ background: '#171f33', borderRadius: 12, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)', position: 'relative', overflow: 'hidden' }}>
            {m.highlight && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#c3c0ff' }} />}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>{m.label}</div>
            <span style={{ fontSize: m.highlight ? '1rem' : '2.5rem', fontWeight: 900, color: m.color || '#ffb95f', lineHeight: m.highlight ? 1.5 : 1 }}>{m.val}</span>
            {m.sub && <span style={{ fontSize: '0.8rem', color: '#c7c4d8', marginLeft: 8 }}>{m.sub}</span>}
          </div>
        ))}
      </div>

      {/* Chart — Real-time Rating Trend */}
      <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Student Rating Trend</h2>
            <p style={{ fontSize: '0.72rem', color: '#c7c4d8', opacity: 0.7 }}>Ratings given by students after each session</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {avgRating !== '—' && (
              <div style={{ background: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 10, padding: '0.35rem 0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffb95f' }}>{avgRating}</span>
                <span style={{ color: '#ffb95f', fontSize: '0.85rem' }}>★</span>
                <span style={{ fontSize: '0.6rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg</span>
              </div>
            )}
            <span style={{ padding: '0.25rem 0.75rem', background: '#2d3449', borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{ratedSessions.length} Rated</span>
          </div>
        </div>

        {ratedSessions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, opacity: 0.5 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#c7c4d8' }}>bar_chart</span>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Complete sessions with students to see your rating trend</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', minWidth: 300 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffb95f" />
                  <stop offset="100%" stopColor="#c3c0ff" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffb95f" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Y-axis grid lines and labels */}
              {[1,2,3,4,5].map(rating => {
                const y = getY(rating);
                return (
                  <g key={rating}>
                    <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray={rating === 5 ? '0' : '4 4'} />
                    <text x={padL - 8} y={y + 4} textAnchor="end" fill="rgba(199,196,216,0.5)" fontSize="11" fontWeight="600">{rating}★</text>
                  </g>
                );
              })}

              {/* Area fill */}
              {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

              {/* Line */}
              {linePath && <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Data points + tooltips */}
              {pts.map(([x, y], i) => {
                const s = ratedSessions[i];
                const label = fmtLabel(s.createdAt || s.created_at);
                return (
                  <g key={i}>
                    {/* Vertical tick */}
                    <line x1={x} y1={padT + innerH} x2={x} y2={padT + innerH + 5} stroke="rgba(199,196,216,0.3)" strokeWidth="1" />
                    {/* Date label */}
                    <text x={x} y={chartH - 4} textAnchor="middle" fill="rgba(199,196,216,0.45)" fontSize="10" fontWeight="600">{label}</text>
                    {/* Point glow */}
                    <circle cx={x} cy={y} r="8" fill="rgba(255,185,95,0.12)" />
                    {/* Point */}
                    <circle cx={x} cy={y} r="5" fill="#ffb95f" stroke="#0b1326" strokeWidth="2" />
                    {/* Rating label */}
                    <text x={x} y={y - 12} textAnchor="middle" fill="#ffb95f" fontSize="11" fontWeight="800">{s.student_rating}★</text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div style={{ background: '#171f33', borderRadius: 12, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.1)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Past Sessions</h2>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#c7c4d8', opacity: 0.5 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>videocam_off</span>
            <p style={{ fontSize: '0.8rem' }}>No sessions yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map(s => {
              const isExp = expanded === s.id;
              return (
                <div key={s.id} style={{ background: isExp ? '#222a3d' : '#131b2e', borderRadius: 12, overflow: 'hidden', border: isExp ? '1px solid rgba(195,192,255,0.2)' : '1px solid transparent' }}>
                  <button onClick={() => setExpanded(isExp ? null : s.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dae2fd' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.student_name || 'Student'}</div>
                      <div style={{ fontSize: '0.65rem', color: '#c7c4d8', marginTop: 2 }}>{s.topic || 'Mock Interview'}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.4)', marginTop: 2 }}>
                        {toUtcDate(s.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.student_rating && <span style={{ color: '#ffb95f', fontWeight: 700, fontSize: '0.85rem' }}>{'★'.repeat(s.student_rating)}</span>}
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c7c4d8' }}>{isExp ? 'expand_less' : 'expand_more'}</span>
                    </div>
                  </button>
                  {isExp && (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      {s.student_rating && (
                        <div style={{ background: 'rgba(255,185,95,0.06)', border: '1px solid rgba(255,185,95,0.15)', borderRadius: 10, padding: '0.75rem', marginBottom: 8 }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb95f', marginBottom: 4 }}>Student Rating</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffb95f' }}>{s.student_rating}/5</span>
                            <span style={{ color: '#ffb95f' }}>{'★'.repeat(s.student_rating)}{'☆'.repeat(5 - s.student_rating)}</span>
                          </div>
                          {s.student_feedback && <p style={{ fontSize: '0.75rem', color: '#c7c4d8', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>"{s.student_feedback}"</p>}
                        </div>
                      )}
                      {s.alumni_rating && (
                        <div style={{ background: 'rgba(195,192,255,0.06)', border: '1px solid rgba(195,192,255,0.15)', borderRadius: 10, padding: '0.75rem' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', marginBottom: 4 }}>Your Rating</div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c3c0ff' }}>{s.alumni_rating}/5 ★</span>
                          {s.alumni_feedback && <p style={{ fontSize: '0.75rem', color: '#c7c4d8', fontStyle: 'italic', marginTop: 4 }}>"{s.alumni_feedback}"</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlumniDashboard() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => subscribeRealtimeSync(() => setLocalRefresh(v => v + 1)), []);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [extraSlots, setExtraSlots] = useState([]);
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null); // request obj for full student profile modal
  const [bookingRequest, setBookingRequest] = useState(null);
  const [reschedulingRequest, setReschedulingRequest] = useState(null);
  const [liveRequests, setLiveRequests] = useState([]);
  const [declinedToast, setDeclinedToast] = useState(null);
  const [acceptedToast, setAcceptedToast] = useState(null); // { name }
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Session data for home tab stats (real-time from DB) ───────────────────
  const [dashSessions, setDashSessions] = useState([]);
  useEffect(() => {
    if (!user?.id) return;
    api.getUserFeedback(user.id).then(data => {
      if (Array.isArray(data)) setDashSessions(data);
    }).catch(() => {});
  }, [user?.id]);
  const dashRatings = dashSessions.map(s => s.student_rating).filter(r => r != null && r > 0);
  const dashAvgRating = dashRatings.length
    ? (dashRatings.reduce((a, b) => a + b, 0) / dashRatings.length).toFixed(1)
    : null;
  const dashTotalSessions = dashSessions.length;

  // Motivational quotes — cycles every 8 seconds
  const QUOTES = [
    { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
    { text: "Mentorship is a brain to pick, an ear to listen, and a push in the right direction.", author: "J.C. Crosby" },
    { text: "A mentor is someone who sees more talent and ability within you than you see in yourself.", author: "Bob Proctor" },
    { text: "Your knowledge is valuable only when it is shared.", author: "Anonymous" },
    { text: "The mediocre teacher tells. The good teacher explains. The great teacher inspires.", author: "William Arthur Ward" },
    { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
    { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
    { text: "One of the greatest values of mentors is the ability to see ahead what others cannot see yet.", author: "John C. Maxwell" },
    { text: "The delicate balance of mentoring someone is not creating them in your own image, but giving them the opportunity to create themselves.", author: "Steven Spielberg" },
  ];
  const dailyQuote = QUOTES[Math.floor(Date.now() / 8000) % QUOTES.length];

  // ── Real-time notifications for alumni ────────────────────────────────────
  const { notifications, unreadCount, markAsRead } = useNotifications(user?.id);

  // Profile dropdown
  const [showProfile, setShowProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const savedProfile = (() => {
    try { return JSON.parse(localStorage.getItem('alumnex_profile') || '{}'); } catch { return {}; }
  })();
  const [profileForm, setProfileForm] = useState({
    username: savedProfile.name || savedProfile.username || user?.name || '',
    email:    savedProfile.email    || user?.email || '',
    domain:   savedProfile.domain   || savedProfile.department || user?.department || '',
    experience: savedProfile.experience || '',
  });

  useEffect(() => {
    const latestProfile = (() => {
      try { return JSON.parse(localStorage.getItem('alumnex_profile') || '{}'); } catch { return {}; }
    })();
    setProfileForm({
      username: latestProfile.name || latestProfile.username || user?.name || '',
      email:    latestProfile.email    || user?.email || '',
      domain:   latestProfile.domain   || latestProfile.department || user?.department || '',
      experience: latestProfile.experience || '',
    });
  }, [editProfile, localRefresh, user]);

  // Notifications panel
  const [showNotifs, setShowNotifs] = useState(false);
  const [seenNotifIds, setSeenNotifIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alumni_seen_notifs') || '[]'); } catch { return []; }
  });

  if (!user) return <Navigate to="/" replace />;
  const firstName = (user?.name || user?.role || 'Alumni').split(' ')[0];

  // Sync profile data to resolve __stored_in_database__ and populate localStorage
  useEffect(() => {
    if (!user?.id) return;
    const fetchSelfProfile = async () => {
      try {
        const { getUserById } = await import('../lib/db');
        const { getProfileAsset } = await import('../lib/profileAssetsAPI');
        const { saveProfileToStorage } = await import('../lib/profilePersistence');
        const u = await getUserById(user.id);
        let rawPd = u?.profile_data;
        if (rawPd) {
          if (!rawPd.photoPreview || rawPd.photoPreview === '__stored_in_database__' || rawPd.photoPreview === '__stored_locally__') {
            const photoAsset = await getProfileAsset(user.id, 'photo');
            const photoSrc = photoAsset?.assetUrl || photoAsset?.fileData || null;
            if (photoSrc) rawPd.photoPreview = photoSrc;
          }
          if (!rawPd.resumeUrl || rawPd.resumeUrl === '__stored_in_database__' || rawPd.resumeUrl === '__stored_locally__') {
            const resumeAsset = await getProfileAsset(user.id, 'resume');
            const resumeSrc = resumeAsset?.assetUrl || resumeAsset?.fileData || null;
            if (resumeSrc) rawPd.resumeUrl = resumeSrc;
          }
          saveProfileToStorage({ ...rawPd, name: u.name, email: u.email, role: u.role, department: u.department });
          setLocalRefresh(v => v + 1);
        }
      } catch (e) {}
    };
    fetchSelfProfile();
  }, [user?.id]);

  // Load requests for this alumni from Supabase directly
  useEffect(() => {
    const load = async () => {
      let usedSupabase = false;
      try {
        let alumniId = user.id;
        const isMockId = !alumniId || String(alumniId).startsWith('alm-') || String(alumniId).startsWith('stu-');
        if (isMockId) {
          const { getAllAlumni } = await import('../lib/db');
          const alumniList = await getAllAlumni();
          const match = alumniList.find(a => a.name === user.name);
          if (match) alumniId = match.id;
        }
        if (alumniId && !String(alumniId).startsWith('alm-') && !String(alumniId).startsWith('stu-')) {
          const { getRequestsForAlumni: dbGetRequests } = await import('../lib/db');
          const data = await dbGetRequests(alumniId);
          const mapped = data.map(r => ({
            id:            r.request_id,
            studentName:   r.student_name || r.student?.name || '',
            studentId:     r.student_id,
            alumniName:    user.name,
            alumniRole:    '',
            topic:         r.topic,
            message:       r.message || '',
            status:        (r.status || 'PENDING').toLowerCase(),
            scheduledTime: r.scheduled_time || r.scheduledTime || null,
            roomId:        r.room_id || r.roomId || null,
            createdAt:     r.createdAt || r.created_at || null,
            studentProfile: (() => {
              const raw = r.student_profile_snapshot || r.student?.profile_data || null;
              if (!raw) return null;
              if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
              return raw;
            })(),
          }));
          const dedupedMapped = dedupeRequestsById(mapped);

          // Merge DB results with current optimistic state — don't overwrite local
          // status changes (accept/decline/book) that haven't propagated to DB yet.
          setLiveRequests(prev => {
            const prevMap = new Map(prev.map(r => [r.id, r]));
            const merged = dedupedMapped
              .filter(r => ['pending','accepted','slot_booked','completed'].includes(r.status))
              .map(dbReq => {
                const existing = prevMap.get(dbReq.id);
                if (!existing) return dbReq;
                // If local state has a "more advanced" status, keep it
                const statusOrder = { pending: 0, accepted: 1, slot_booked: 2, completed: 3 };
                const localRank = statusOrder[existing.status] ?? -1;
                const dbRank    = statusOrder[dbReq.status]    ?? -1;
                return localRank > dbRank ? existing : { ...dbReq, ...existing, status: dbReq.status, scheduledTime: dbReq.scheduledTime || existing.scheduledTime, roomId: dbReq.roomId || existing.roomId };
              });
            // Keep any locally-added requests not yet in DB (e.g. socket-prepended)
            prev.forEach(r => {
              if (!merged.find(m => m.id === r.id) && ['pending','accepted','slot_booked','completed'].includes(r.status)) {
                merged.push(r);
              }
            });
            return dedupeRequestsById(merged);
          });
          usedSupabase = true;
        }
      } catch (err) {
        console.warn('AlumniDashboard: Supabase failed, using localStorage', err.message);
      }
      if (!usedSupabase) {
        const all = getRequests();
        const mine = dedupeRequestsById(all.filter(r => r.alumniName === user.name || r.alumniId === user.id));
        setLiveRequests(mine.filter(r => ['pending','accepted','slot_booked','completed'].includes(r.status)));
      }
    };
    load();

    // Supabase Realtime — fires instantly on new/updated requests for this alumni
    let channel = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        let alumniId = user.id;
        const isMockId = !alumniId || String(alumniId).startsWith('alm-') || String(alumniId).startsWith('stu-');
        if (isMockId) {
          const alumniList = await getAllAlumni();
          const match = alumniList.find(a => a.name === user.name);
          if (match) alumniId = match.id;
        }
        if (!isMounted) return;

        if (alumniId && !String(alumniId).startsWith('alm-') && !String(alumniId).startsWith('stu-')) {
          channel = supabase
            .channel(`alumni-reqs-${alumniId}`)
            .on('postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'interview_requests', filter: `alumni_id=eq.${alumniId}` },
              () => { if (isMounted) load(); }
            )
            .on('postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'interview_requests', filter: `alumni_id=eq.${alumniId}` },
              () => { if (isMounted) load(); }
            );

          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`[Realtime] Subscribed to alumni-reqs-${alumniId}`);
            }
          });
        }
      } catch (e) {
        console.warn('Alumni Realtime setup failed:', e.message);
      }
    };

    setupRealtime();

    // Socket.io listener — backend emits 'new_request' on POST /requests
    // This lets us prepend the new card instantly without waiting for Supabase Realtime
    let socket = null;
    const alumniIdForSocket = user.id;
    const isMockIdForSocket = !alumniIdForSocket ||
      String(alumniIdForSocket).startsWith('alm-') ||
      String(alumniIdForSocket).startsWith('stu-');

    if (!isMockIdForSocket) {
      socket = io(`${SOCKET_URL}/notifications`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });
      socket.on('connect', () => {
        socket.emit('join', alumniIdForSocket);
      });
      socket.on('new_request', (newReq) => {
        if (!isMounted) return;
        setLiveRequests(prev => {
          if (prev.some(r => r.id === newReq.id)) return prev;
          return [newReq, ...prev];
        });
      });
    }

    return () => {
      isMounted = false;
      if (channel) {
        try { supabase.removeChannel(channel); } catch {}
      }
      if (socket) {
        socket.disconnect();
      }
    };
  // NOTE: localRefresh intentionally excluded — it fires on every localStorage write
  // (via realtimeSync storage listener) causing an infinite re-fetch loop that wipes
  // optimistic state. Supabase Realtime + socket handle live updates instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.name, user.id]);

  // Build notifications list: combine real-time notifications from DB + upcoming meetings
  const allScheduled = [...SCHEDULE, ...extraSlots];
  const now = Date.now();
  const upcomingMeetings = allScheduled.filter(s => {
    if (!s.scheduledTime) return false;
    const t = toUtcDate(s.scheduledTime).getTime();
    return t > now && t - now <= 24 * 60 * 60 * 1000;
  });

  // Convert DB notifications to display format and combine with upcoming meetings
  const dbNotifications = (notifications || []).map(n => ({
    id: n.id,
    type: n.type?.toLowerCase() || 'notification',
    title: n.title,
    desc: n.message,
    time: n.created_at || n.createdAt
  }));

  const allNotifications = [
    ...dbNotifications,  // Real-time notifications from DB
    ...upcomingMeetings.map(s => ({ id: `meet-${s.title}`, type: 'meeting', title: 'Meeting in 24h', desc: `${s.title} — ${s.when}`, time: s.scheduledTime })),
  ];

  const openNotifs = () => {
    setShowNotifs(v => !v);
    setShowProfile(false);
    // Mark all unread notifications as read
    notifications.forEach(n => {
      if (!n.read) {
        markAsRead(n.id);
      }
    });
    localStorage.setItem('alumni_seen_notifs', JSON.stringify(allNotifications.map(n => n.id)));
  };

  const saveProfileForm = async () => {
    const updated = {
      ...savedProfile,
      ...profileForm,
      name: user?.name || savedProfile.name || profileForm.username,
      email: user?.email || savedProfile.email || profileForm.email,
    };
    localStorage.setItem('alumnex_profile', JSON.stringify(updated));
    localStorage.setItem('alumniconnect_profile', JSON.stringify(updated));
    const updatedUser = {
      ...user,
      name: user?.name || profileForm.username
    };
    login(updatedUser, localStorage.getItem('alumnex_token') || localStorage.getItem('alumniconnect_token'));
    emitRealtimeSync({ type: 'profile_updated' });
    // Persist to DB so profile syncs across devices
    if (user?.id && !user.id.startsWith('alm-') && !user.id.startsWith('stu-')) {
      try {
        await api.saveProfile(user.id, updated);
      } catch (err) {
        console.warn('[AlumniDashboard] Profile save to DB failed:', err.message);
      }
    }
    setEditProfile(false);
  };

  const handleAddSlot = ({ date, time, duration }) => {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const isoTime = buildISTIsoString(y, m - 1, d, hh, mm);
    setExtraSlots(s => [...s, {
      when: formatScheduledTime(isoTime),
      title: `Open Slot (${duration} min)`,
      sub: 'Available for booking',
      active: false,
      isFreeSlot: true,
      scheduledTime: isoTime,
      duration: parseInt(duration),
    }]);
  };

  const handleDeclineRequest = (id) => {
    const req = liveRequests.find(r => r.id === id);
    declineRequest(id);
    setLiveRequests(prev => prev.filter(r => r.id !== id));
    if (req) {
      setDeclinedToast({ name: req.studentName });
      setTimeout(() => setDeclinedToast(null), 3000);
    }
  };

  const handleAccepted = (requestId) => {
    const req = liveRequests.find(r => r.id === requestId);
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));
    // Show accepted toast
    if (req) {
      setAcceptedToast({ name: req.studentName });
      setTimeout(() => setAcceptedToast(null), 3500);
    }
  };

  const handleSlotBooked = (requestId, scheduledTime, bookedRoomId) => {
    // bookSlot was already called inside BookSlotModal.handleBook — do NOT call it again.
    // Just update local state with the roomId that bookSlot already returned.
    const roomId = bookedRoomId || `room-${requestId.replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}`;
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'slot_booked', scheduledTime, roomId } : r));
    const formatted = formatScheduledTime(scheduledTime);
    const req = liveRequests.find(r => r.id === requestId);
    setExtraSlots(s => [...s, {
      when: formatted,
      title: `Mock Interview: ${req?.studentName || 'Student'}`,
      sub: req?.topic || 'Mock Interview',
      active: true,
      roomId,
      scheduledTime,
    }]);
  };

  // ── Instant Meet — start right now, notify student ────────────────────────
  const handleInstantMeet = async (req) => {
    const now = new Date().toISOString();

    // 1. Update request status to LIVE in backend
    // This triggers a real database-persisted notification for the student
    try {
      const result = await api.updateRequest(req.id, {
        status: 'LIVE',
        scheduledTime: now,
      });

      const roomId = result?.room_id || result?.roomId || result?.id || req.id;

      // 2. Update local state
      setLiveRequests(prev => prev.map(r => r.id === req.id ? {
        ...r,
        status: 'slot_booked', // Keep status 'slot_booked' locally for UI consistency
        scheduledTime: now,
        roomId
      } : r));

      // 3. Always navigate alumni to the internal interview room
      // Use the requestId as the base for the internal route
      navigate(`/interview/${req.id}?name=${encodeURIComponent(user?.name || 'Alumni')}`);
    } catch (err) {
      console.error('[AlumniDashboard] Instant meet failed:', err.message);
      // Fallback: navigation only
      navigate(`/interview/${req.id}?name=${encodeURIComponent(user?.name || 'Alumni')}`);
    }
  };

  const handleRescheduled = (requestId, newScheduledTime) => {
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, scheduledTime: newScheduledTime } : r));
    const formatted = formatScheduledTime(newScheduledTime);
    setExtraSlots(s => s.map(slot => {
      const req = liveRequests.find(r => r.id === requestId);
      if (req && slot.title === `Mock Interview: ${req.studentName}`) {
        return { ...slot, when: formatted, scheduledTime: newScheduledTime };
      }
      return slot;
    }));
  };

  // â”€â”€ Highlight matching text (like PDF search) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const highlight = (text, query) => {
    if (!text || !query) return text;
    const str = String(text);
    const idx = str.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return str;
    return (
      <>
        {str.slice(0, idx)}
        <mark style={{ background: 'rgba(195,192,255,0.35)', color: '#dae2fd', borderRadius: 3, padding: '0 2px' }}>{str.slice(idx, idx + query.length)}</mark>
        {str.slice(idx + query.length)}
      </>
    );
  };

  const renderSearchResults = (q) => {
    const ql = q.toLowerCase();

    // Search requests — include all statuses for this alumni
    const allRequests = (() => {
      try {
        return getRequests().filter(r => r.alumniName === user.name);
      } catch { return liveRequests; }
    })();

    const matchedRequests = allRequests.filter(r =>
      r.studentName?.toLowerCase().includes(ql) ||
      r.topic?.toLowerCase().includes(ql) ||
      r.message?.toLowerCase().includes(ql) ||
      r.studentProfile?.college?.toLowerCase().includes(ql) ||
      r.studentProfile?.department?.toLowerCase().includes(ql) ||
      r.studentProfile?.skills?.some(s => s.toLowerCase().includes(ql)) ||
      r.status?.toLowerCase().includes(ql)
    );

    // Search schedule
    const allSlots = [...SCHEDULE, ...extraSlots];
    const matchedSlots = allSlots.filter(s =>
      s.title?.toLowerCase().includes(ql) ||
      s.sub?.toLowerCase().includes(ql) ||
      s.when?.toLowerCase().includes(ql)
    );

    const total = matchedRequests.length + matchedSlots.length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 22 }}>search</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Search results for "<span style={{ color: '#c3c0ff' }}>{q}</span>"
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#c7c4d8', marginTop: 3 }}>{total} result{total !== 1 ? 's' : ''} found across requests and schedule</p>
          </div>
        </div>

        {total === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8', background: '#131b2e', borderRadius: 16, border: '1px solid rgba(70,69,85,0.15)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>search_off</span>
            <p style={{ fontWeight: 600 }}>No results found</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 4 }}>Try different keywords</p>
          </div>
        )}

        {/* Matched Requests */}
        {matchedRequests.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c3c0ff' }}>person</span>
              Interview Requests ({matchedRequests.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matchedRequests.map(r => (
                <div key={r.id} style={{ background: '#131b2e', borderRadius: 14, padding: '1rem 1.25rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: r.studentProfile?.photoPreview ? 'transparent' : 'linear-gradient(135deg,#222a3d,#2d3449)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0, border: '1px solid rgba(195,192,255,0.1)' }}>
                    {r.studentProfile?.photoPreview ? (
                      <img src={r.studentProfile.photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      r?.studentName ? r.studentName[0] : '?'
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{highlight(r.studentName, q)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>{highlight(r.topic, q)}</div>
                    {r.studentProfile?.college && <div style={{ fontSize: '0.68rem', color: 'rgba(199,196,216,0.5)', marginTop: 1 }}>{highlight(r.studentProfile.college, q)}</div>}
                    {r.message && <div style={{ fontSize: '0.7rem', color: '#c7c4d8', fontStyle: 'italic', marginTop: 4 }}>"{highlight(r.message.slice(0, 80), q)}{r.message.length > 80 ? '...' : ''}"</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                      background: r.status === 'accepted' ? 'rgba(255,185,95,0.15)' : r.status === 'slot_booked' ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.1)',
                      color: r.status === 'accepted' ? '#ffb95f' : r.status === 'slot_booked' ? '#4edea3' : '#c3c0ff',
                    }}>{r.status === 'slot_booked' ? '✓ Booked' : r.status === 'accepted' ? 'Accepted' : 'Pending'}</span>
                    {r.status === 'pending' && (
                      <button onClick={() => { setViewingStudentProfile(r); setGlobalSearch(''); }} style={{ padding: '0.3rem 0.7rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 7, fontSize: '0.6rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>View</button>
                    )}
                    {r.status === 'accepted' && (
                      <>
                        <button onClick={() => { setBookingRequest(r); setGlobalSearch(''); }} style={{ padding: '0.3rem 0.7rem', background: 'rgba(78,222,163,0.15)', color: '#4edea3', borderRadius: 7, fontSize: '0.6rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Book Slot</button>
                        <button onClick={() => handleInstantMeet(r)} style={{ padding: '0.3rem 0.7rem', background: 'rgba(255,68,68,0.15)', color: '#ff6b6b', borderRadius: 7, fontSize: '0.6rem', fontWeight: 700, border: '1px solid rgba(255,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>videocam</span>Instant Meet
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Schedule */}
        {matchedSlots.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4edea3' }}>calendar_today</span>
              Schedule ({matchedSlots.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matchedSlots.map((s, i) => (
                <div key={i} style={{ background: '#131b2e', borderRadius: 14, padding: '1rem 1.25rem', border: `1px solid ${s.active ? 'rgba(195,192,255,0.15)' : 'rgba(70,69,85,0.15)'}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: s.active ? 'rgba(195,192,255,0.1)' : '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.active ? '#c3c0ff' : '#c7c4d8' }}>event</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{highlight(s.title, q)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>{highlight(s.sub, q)}</div>
                    <div style={{ fontSize: '0.68rem', color: s.active ? '#c3c0ff' : 'rgba(199,196,216,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{highlight(s.when, q)}</div>
                  </div>
                  {s.active && s.roomId && (
                    <Link to={`/interview/${s.requestId || s.id || s.roomId}?name=${encodeURIComponent(user?.name || 'Alumni')}`} style={{ padding: '0.35rem 0.875rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'schedule') {
      const now = Date.now();
      const nowInIST = new Date(now + 5.5 * 60 * 60 * 1000);
      const dayOfWeek = nowInIST.getUTCDay();

      // Build Mon–Sun week in IST (represented by shifted dates)
      const monday = new Date(nowInIST);
      monday.setUTCDate(nowInIST.getUTCDate() - ((dayOfWeek + 6) % 7));
      monday.setUTCHours(0,0,0,0);
      
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + i);
        return d;
      });
      const todayIdx = (dayOfWeek + 6) % 7;

      // All events with ISO scheduledTime
      const bookedRequests = liveRequests.filter(r => (r.status === 'slot_booked' || r.status === 'completed') && r.scheduledTime);
      const allEvents = [
        ...bookedRequests.map(r => ({
          scheduledTime: r.scheduledTime,
          title: `Mock Interview: ${r.studentName}`,
          sub: r.topic,
          isFreeSlot: false,
          duration: 120,
          roomId: r.roomId,
          isCompleted: r.status === 'completed',
        })),
        ...extraSlots.filter(s => s.scheduledTime).map(s => ({
          scheduledTime: s.scheduledTime,
          title: s.title,
          sub: s.sub,
          isFreeSlot: true,
          duration: s.duration || 60,
        })),
      ].sort((a, b) => toUtcDate(a.scheduledTime) - toUtcDate(b.scheduledTime));

      const weekStartVal = monday.getTime() - 5.5 * 60 * 60 * 1000;
      const weekEndVal   = weekStartVal + 7 * 24 * 60 * 60 * 1000;
      const weekEvents = allEvents.filter(e => {
        const t = toUtcDate(e.scheduledTime).getTime();
        return t >= weekStartVal && t < weekEndVal;
      });

      // Group by day index Mon=0 in IST
      const eventsByDay = Array.from({ length: 7 }, () => []);
      weekEvents.forEach(e => {
        const ist = getISTComponents(e.scheduledTime);
        eventsByDay[(ist.day + 6) % 7].push(e);
      });

      const isEnded = (e) => e.isCompleted || Date.now() > getEventEndMs(e.scheduledTime, e.duration || 120);
      const fmtTime = (iso) => toUtcDate(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const fmtDate = (iso) => toUtcDate(iso).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' });

      // Unique sorted time labels for calendar rows
      const allTimes = [...new Set(weekEvents.map(e => {
        const ist = getISTComponents(e.scheduledTime);
        return `${String(ist.hours).padStart(2,'0')}:${String(ist.minutes).padStart(2,'0')}`;
      }))].sort();

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Weekly Schedule</h2>
            <button onClick={() => setShowSlotModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Add Slot
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: '#c7c4d8', flexWrap: 'wrap' }}>
            {[
              { color: 'rgba(195,192,255,0.2)', border: 'rgba(195,192,255,0.4)', label: 'Interview' },
              { color: 'rgba(78,222,163,0.15)', border: 'rgba(78,222,163,0.35)',  label: 'Free Slot' },
              { color: 'rgba(100,100,100,0.15)',border: 'rgba(100,100,100,0.3)', label: 'Ended' },
              { color: 'rgba(78,222,163,0.06)', border: 'rgba(78,222,163,0.2)',  label: 'Today' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: `1px solid ${l.border}` }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Calendar grid — only rows with events */}
          <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7,1fr)', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
              <div style={{ padding: '0.75rem', background: '#171f33' }} />
              {weekDays.map((d, i) => {
                const isToday = i === todayIdx;
                return (
                  <div key={i} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', background: isToday ? 'rgba(78,222,163,0.08)' : '#171f33', borderLeft: '1px solid rgba(70,69,85,0.15)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isToday ? '#4edea3' : '#c7c4d8' }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isToday ? '#4edea3' : '#dae2fd', marginTop: 2 }}>{d.getUTCDate()}</div>
                    {eventsByDay[i].length > 0 && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c3c0ff', margin: '3px auto 0' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Event-only time rows */}
            {allTimes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#c7c4d8', opacity: 0.5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>event_busy</span>
                No meetings this week
              </div>
            ) : allTimes.map(timeStr => (
              <div key={timeStr} style={{ display: 'grid', gridTemplateColumns: '64px repeat(7,1fr)', borderBottom: '1px solid rgba(70,69,85,0.08)', minHeight: 48 }}>
                <div style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(199,196,216,0.5)', background: '#131b2e' }}>{timeStr}</div>
                {weekDays.map((_, dayIdx) => {
                  const event = eventsByDay[dayIdx].find(e => {
                    const ist = getISTComponents(e.scheduledTime);
                    return `${String(ist.hours).padStart(2,'0')}:${String(ist.minutes).padStart(2,'0')}` === timeStr;
                  });
                  const ended = event && isEnded(event);
                  const isToday = dayIdx === todayIdx;
                  return (
                    <div key={dayIdx} style={{
                      padding: '0.25rem',
                      borderLeft: '1px solid rgba(70,69,85,0.1)',
                      background: event
                        ? (ended ? 'rgba(100,100,100,0.06)' : event.isFreeSlot ? 'rgba(78,222,163,0.06)' : 'rgba(195,192,255,0.06)')
                        : isToday ? 'rgba(78,222,163,0.02)' : 'transparent',
                      minHeight: 48,
                    }}>
                      {event && (
                        <div style={{
                          background: ended ? 'rgba(100,100,100,0.18)' : event.isFreeSlot ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.18)',
                          border: `1px solid ${ended ? 'rgba(100,100,100,0.3)' : event.isFreeSlot ? 'rgba(78,222,163,0.35)' : 'rgba(195,192,255,0.4)'}`,
                          borderRadius: 6, padding: '0.2rem 0.35rem',
                          fontSize: '0.55rem', fontWeight: 700,
                          color: ended ? '#6b7280' : event.isFreeSlot ? '#4edea3' : '#c3c0ff',
                          lineHeight: 1.4,
                        }}>
                          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {event.title.replace('Mock Interview: ','').replace(/Open Slot.*/, 'Free Slot')}
                          </div>
                          {ended && <div style={{ fontSize: '0.48rem', opacity: 0.8, marginTop: 1 }}>Ended</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sorted session list */}
          <div style={{ background: '#171f33', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.1)' }}>
            <div style={{ background: '#222a3d', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dad7ff' }}>All Sessions — Sorted by Time</span>
              <span style={{ fontSize: '0.6rem', color: '#c7c4d8' }}>{allEvents.length} total</span>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {allEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#c7c4d8', opacity: 0.5, fontSize: '0.875rem' }}>No sessions scheduled yet</div>
              )}
              {allEvents.map((e, i) => {
                const ended = isEnded(e);
                const accentColor = ended ? 'rgba(100,100,100,0.4)' : e.isFreeSlot ? '#4edea3' : '#c3c0ff';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: '#131b2e', borderRadius: 12, borderLeft: `3px solid ${accentColor}`, opacity: ended ? 0.65 : 1, gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: ended ? '#6b7280' : e.isFreeSlot ? '#4edea3' : '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                        {fmtDate(e.scheduledTime)} • {fmtTime(e.scheduledTime)}
                        {ended && <span style={{ marginLeft: 8, color: '#6b7280', fontWeight: 600 }}>— Ended</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: ended ? '#6b7280' : '#dae2fd' }}>{e.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{e.sub}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {e.isFreeSlot && (
                        <button
                          onClick={() => setExtraSlots(s => s.filter(x => x.scheduledTime !== e.scheduledTime))}
                          style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, color: '#ffb4ab', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span> Remove
                        </button>
                      )}
                      {!e.isFreeSlot && (
                        ended ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', background: 'rgba(100,100,100,0.15)', color: '#6b7280', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam_off</span> Ended
                          </div>
                        ) : (
                          <Link to={`/interview/${e.requestId || e.id || e.roomId || 'demo-room'}?name=${encodeURIComponent(user?.name || 'Alumni')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'requests') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Waiting List Section */}
      {liveRequests.filter(r => r.status === 'waiting').length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffb95f' }}>Waiting List</h2>
            <span style={{ background: 'rgba(255,185,95,0.1)', color: '#ffb95f', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {liveRequests.filter(r => r.status === 'waiting').length} Students
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#c7c4d8', marginTop: -10 }}>These students are waiting for a slot to open up. You'll be notified if you gain capacity.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
            {liveRequests.filter(r => r.status === 'waiting').map(r => (
              <div key={r.id} style={{ background: '#131b2e', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(255,185,95,0.2)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: r.studentProfile?.photoPreview ? 'transparent' : 'linear-gradient(135deg,#222a3d,#2d3449)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>
                  {r.studentProfile?.photoPreview ? <img src={r.studentProfile.photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : r.studentName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#dae2fd' }}>{r.studentName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>{r.topic}</div>
                </div>
                <button onClick={() => setViewingStudentProfile(r)} style={{ padding: '0.4rem 0.8rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>View</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Interview Requests</h2>
          {liveRequests.filter(r => r.status === 'completed').length > 0 && (
            <span style={{ background: 'rgba(100,100,100,0.15)', color: '#6b7280', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {liveRequests.filter(r => r.status === 'completed').length} Completed
            </span>
          )}
          <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {liveRequests.filter(r => r.status === 'pending').length} Pending
          </span>
          {liveRequests.filter(r => r.status === 'accepted').length > 0 && (
            <span style={{ background: 'rgba(255,185,95,0.1)', color: '#ffb95f', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {liveRequests.filter(r => r.status === 'accepted').length} Awaiting Slot
            </span>
          )}
        </div>

        {liveRequests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>task_alt</span>
            <p style={{ fontWeight: 600 }}>No pending requests</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 6 }}>New requests from students will appear here</p>
          </div>
        )}

        {liveRequests.filter(r => r.status !== 'waiting').map(r => (
          <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.25rem 1.5rem', border: `1px solid ${r.status === 'accepted' ? 'rgba(255,185,95,0.2)' : 'rgba(70,69,85,0.2)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = r.status === 'accepted' ? 'rgba(255,185,95,0.4)' : 'rgba(195,192,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = r.status === 'accepted' ? 'rgba(255,185,95,0.2)' : 'rgba(70,69,85,0.2)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div 
                style={{ width: 52, height: 52, borderRadius: '50%', background: r.studentProfile?.photoPreview ? 'transparent' : 'linear-gradient(135deg,#222a3d,#2d3449)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0, border: '2px solid transparent' }}
              >
                {r.studentProfile?.photoPreview ? (
                  <img src={r.studentProfile.photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  r.studentName[0]
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span 
                    onClick={() => setViewingStudentProfile(r)}
                    style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: '#dae2fd', transition: 'all 0.2s', paddingBottom: 2, borderBottom: '2px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#c3c0ff'; e.currentTarget.style.borderColor = '#c3c0ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#dae2fd'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >{r.studentName}</span>
                  {/* Status badge */}
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: r.status === 'completed' ? 'rgba(100,100,100,0.15)' : r.status === 'accepted' ? 'rgba(255,185,95,0.15)' : r.status === 'slot_booked' ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.1)',
                    color: r.status === 'completed' ? '#6b7280' : r.status === 'accepted' ? '#ffb95f' : r.status === 'slot_booked' ? '#4edea3' : '#c3c0ff',
                  }}>
                    {r.status === 'completed' ? '✓ Completed' : r.status === 'slot_booked' ? '📅 Booked' : r.status === 'accepted' ? '✓ Accepted' : 'Pending'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>{r.topic}</div>
                {r.studentId && (
                  <button
                    onClick={() => setViewingStudentProfile(r)}
                    style={{ marginTop: 3, padding: 0, background: 'none', border: 'none', color: '#c3c0ff', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Student ID: {r.studentId}
                  </button>
                )}
                {r.studentProfile?.college && <div style={{ fontSize: '0.68rem', color: 'rgba(199,196,216,0.5)', marginTop: 2 }}>{r.studentProfile.college} {r.studentProfile.department ? `• ${r.studentProfile.department}` : ''}</div>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setViewingStudentProfile(r)} style={{ padding: '0.45rem 0.875rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span> View Profile
                </button>
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => { handleDeclineRequest(r.id); }} style={{ padding: '0.45rem 0.75rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      Decline
                    </button>
                  </>
                )}
                {r.status === 'accepted' && (
                  <>
                    <button onClick={() => setBookingRequest(r)} style={{ padding: '0.45rem 1rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_month</span> Book Slot
                    </button>
                    <button onClick={() => handleInstantMeet(r)} style={{ padding: '0.45rem 0.875rem', background: 'rgba(255,68,68,0.15)', color: '#ff6b6b', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, border: '1px solid rgba(255,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Instant Meet
                    </button>
                  </>
                )}
                {r.status === 'completed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ padding: '0.45rem 1rem', background: 'rgba(100,100,100,0.12)', color: '#6b7280', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Session Complete
                    </div>
                    {r.scheduledTime && (
                      <div style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.4)' }}>
                        {formatISTDateTime(r.scheduledTime)}
                      </div>
                    )}
                  </div>
                )}
                {r.status === 'slot_booked' && (() => {
                  const now = Date.now();
                  const scheduledTime = getRequestScheduledTime(r);
                  const scheduledMs = toUtcDate(scheduledTime).getTime();
                  const endMs = getEventEndMs(scheduledTime, 120);
                  const isEnded = now > endMs;
                  const canJoin = Number.isFinite(scheduledMs) && !isEnded && now >= scheduledMs - 5 * 60 * 1000;
                  const joinUrl = `/interview/${r.id}?name=${encodeURIComponent(user?.name || 'Alumni')}`;
                  const isGoogleMeet = r.roomId?.includes('meet.google.com');
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      {isEnded ? (
                        <div style={{ padding: '0.45rem 1rem', background: 'rgba(100,100,100,0.12)', color: '#6b7280', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, opacity: 0.7 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam_off</span> Ended
                        </div>
                      ) : canJoin ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                          <Link to={joinUrl}
                            style={{ padding: '0.45rem 1rem', background: isGoogleMeet ? 'linear-gradient(135deg,#1a73e8,#4285f4)' : 'linear-gradient(135deg,#00a572,#4edea3)', color: '#fff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span>
                            {isGoogleMeet ? 'Start Meeting' : 'Join Now'}
                          </Link>
                          {isGoogleMeet && (
                            <div style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.5)', textAlign: 'right' }}>
                              You are the host — students wait until you join
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                          <div style={{ padding: '0.35rem 0.75rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, color: '#4edea3', textAlign: 'right' }}>
                            📅 {formatISTDateTime(scheduledTime)}
                          </div>
                          {isGoogleMeet && (
                            <a href={joinUrl} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '0.3rem 0.6rem', background: 'rgba(26,115,232,0.15)', border: '1px solid rgba(26,115,232,0.3)', color: '#60a5fa', borderRadius: 7, fontSize: '0.6rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span> Open Meet Link
                            </a>
                          )}
                        </div>
                      )}
                      <button onClick={() => setReschedulingRequest(r)} style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.25)', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>event_repeat</span> Reschedule
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Message preview */}
            {r.message && (
              <div style={{ marginTop: '0.875rem', padding: '0.6rem 0.875rem', background: 'rgba(45,52,73,0.4)', borderLeft: '2px solid rgba(195,192,255,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'rgba(218,226,253,0.7)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{r.message.length > 100 ? r.message.slice(0, 100) + '...' : r.message}"
              </div>
            )}

            {getRequestCreatedAt(r) && formatISTDateTime(getRequestCreatedAt(r)) && (
              <div style={{ marginTop: 8, fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)' }}>
                Sent {formatISTDateTime(getRequestCreatedAt(r))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    );

    if (activeTab === 'history') {
      return <AlumniSessionHistory userId={user?.id} userName={user?.name} />;
    }

    if (activeTab === 'settings') return <SettingsPage role="ALUMNI" />;

    // home
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
          <div style={{ ...glass, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '5rem' }}>auto_awesome</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome back, <span style={{ color: '#c3c0ff' }}>{firstName}</span></h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(195,192,255,0.7)', maxWidth: 400, lineHeight: 1.7, fontStyle: 'italic' }}>
              "{dailyQuote.text}" <span style={{ fontStyle: 'normal', fontWeight: 700, color: '#c3c0ff', opacity: 0.7 }}>— {dailyQuote.author}</span>
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12 }}>
              <button onClick={() => setActiveTab('requests')} style={btnOutline}>View Requests</button>
              <button onClick={() => setActiveTab('schedule')} style={btnOutline}>My Schedule</button>
            </div>
          </div>
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', borderLeft: '2px solid #c3c0ff' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 16 }}>Total Sessions</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{dashTotalSessions}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c7c4d8', marginBottom: 6 }}>Completed</span>
            </div>
          </div>
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', borderLeft: '2px solid #4edea3' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 16 }}>Average Rating</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {dashAvgRating ? (
                <>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{dashAvgRating}</span>
                  <span style={{ color: '#ffb95f', fontSize: '1rem', marginBottom: 6 }}>{'★'.repeat(Math.round(parseFloat(dashAvgRating)))}{'☆'.repeat(5 - Math.round(parseFloat(dashAvgRating)))}</span>
                </>
              ) : (
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(199,196,216,0.4)' }}>No ratings yet</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Requests preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Interview Requests</span>
                <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{liveRequests.filter(r => r.status === 'pending').length} Pending</span>
              </div>
              <button onClick={() => setActiveTab('requests')} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c7c4d8', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>View All</button>
            </div>
            {liveRequests.length === 0 ? (
              <div style={{ background: '#171f33', borderRadius: 16, padding: '2rem', textAlign: 'center', color: '#c7c4d8', border: '1px solid rgba(70,69,85,0.2)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3, display: 'block', marginBottom: 8 }}>inbox</span>
                <p style={{ fontSize: '0.875rem' }}>No pending requests</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 4 }}>Students can find you in the Alumni Directory</p>
              </div>
            ) : liveRequests.slice(0, 2).map(r => (
              <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.25rem 1.5rem', border: `1px solid ${r.status === 'completed' ? 'rgba(100,100,100,0.2)' : r.status === 'accepted' || r.status === 'slot_booked' ? 'rgba(78,222,163,0.15)' : 'rgba(70,69,85,0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: r.studentProfile?.photoPreview ? 'transparent' : 'linear-gradient(135deg,#222a3d,#2d3449)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0, border: '1px solid rgba(195,192,255,0.1)' }}>
                    {r.studentProfile?.photoPreview ? (
                      <img src={r.studentProfile.photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      r.studentName[0]
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{r.studentName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.topic}</div>
                  </div>

                  {/* Status-aware actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => setViewingStudentProfile(r)} style={{ padding: '0.4rem 0.875rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer' }}>
                          Accept
                        </button>
                        <button onClick={() => handleDeclineRequest(r.id)} style={{ padding: '0.4rem 0.75rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                          Decline
                        </button>
                      </>
                    )}
                    {(r.status === 'accepted' || r.status === 'slot_booked' || r.status === 'completed') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Status badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', background: r.status === 'completed' ? 'rgba(100,100,100,0.12)' : 'rgba(78,222,163,0.12)', border: `1px solid ${r.status === 'completed' ? 'rgba(100,100,100,0.25)' : 'rgba(78,222,163,0.25)'}`, borderRadius: 8 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: r.status === 'completed' ? '#6b7280' : '#4edea3', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: r.status === 'completed' ? '#6b7280' : '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {r.status === 'completed' ? 'Completed' : r.status === 'slot_booked' ? 'Booked' : 'Accepted'}
                          </span>
                        </div>
                        {/* Book Slot / View button / Ended label */}
                        {r.status === 'completed' && (
                          <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam_off</span> Ended
                          </div>
                        )}
                        {r.status === 'accepted' && (
                          <button onClick={() => setBookingRequest(r)} style={{ padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_month</span> Book Slot
                          </button>
                        )}
                        {r.status === 'slot_booked' && (() => {
                          const now = Date.now();
                          const scheduledTime = getRequestScheduledTime(r);
                          const scheduledMs = toUtcDate(scheduledTime).getTime();
                          const endMs = getEventEndMs(scheduledTime, 120);
                          const isEnded = now > endMs;
                          const canJoin = Number.isFinite(scheduledMs) && !isEnded && now >= scheduledMs - 5 * 60 * 1000;
                          const joinUrl = `/interview/${r.id}?name=${encodeURIComponent(user?.name || 'Alumni')}`;
                          return isEnded ? (
                            <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam_off</span> Ended
                            </div>
                          ) : canJoin ? (
                            <Link to={joinUrl} style={{ padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam</span> Join
                            </Link>
                          ) : (
                            <div style={{ fontSize: '0.65rem', color: '#4edea3', fontWeight: 600 }}>
                              📅 {formatISTDateTime(scheduledTime)}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                {r.message && r.status === 'pending' && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'rgba(218,226,253,0.6)', fontStyle: 'italic', lineHeight: 1.5, paddingLeft: 62 }}>
                    "{r.message.slice(0, 80)}{r.message.length > 80 ? '...' : ''}"
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Schedule sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>My Schedule</span>
              <button onClick={() => setActiveTab('schedule')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ color: '#c7c4d8' }}>calendar_month</span>
              </button>
            </div>
            <div style={{ background: '#171f33', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: '#222a3d', padding: '1rem 1.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dad7ff' }}>Upcoming Sessions</span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {SCHEDULE.map((s, i) => (
                  <div key={i} style={{ position: 'relative', paddingLeft: 24, borderLeft: `2px solid ${s.active ? '#c3c0ff' : 'rgba(70,69,85,0.3)'}` }}>
                    <div style={{ position: 'absolute', left: -5, top: 0, width: 8, height: 8, borderRadius: '50%', background: s.active ? '#c3c0ff' : '#464555' }} />
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: s.active ? '#c3c0ff' : '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.when}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowSlotModal(true)} style={{ width: '100%', padding: '1rem', background: '#222a3d', color: '#c3c0ff', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
                Manage Availability
              </button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#171f33)', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(195,192,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: 20 }}>tips_and_updates</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mentor's Edge</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#dad7ff', lineHeight: 1.6, opacity: 0.85 }}>
                Students are 40% more likely to succeed when mentors provide specific feedback on soft skills during mock interviews.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>
      {showSlotModal && <AddSlotModal onClose={() => setShowSlotModal(false)} onAdd={handleAddSlot} />}
      {viewingStudentProfile && (
        <StudentFullProfileModal
          request={viewingStudentProfile}
          onClose={() => setViewingStudentProfile(null)}
          onAccept={() => handleAccepted(viewingStudentProfile.id)}
          onDecline={() => handleDeclineRequest(viewingStudentProfile.id)}
        />
      )}
      {bookingRequest && (
        <BookSlotModal
          request={bookingRequest}
          onClose={() => setBookingRequest(null)}
          onBooked={(scheduledTime, roomId) => handleSlotBooked(bookingRequest.id, scheduledTime, roomId)}
        />
      )}
      {reschedulingRequest && (
        <RescheduleModal
          request={reschedulingRequest}
          onClose={() => setReschedulingRequest(null)}
          onRescheduled={(newTime) => handleRescheduled(reschedulingRequest.id, newTime)}
        />
      )}

      {/* Declined toast */}
      {declinedToast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#222a3d', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 12, padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: 10, zIndex: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'slideUp 0.3s ease' }}>
          <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 20 }}>cancel</span>
          <span style={{ fontSize: '0.875rem', color: '#dae2fd' }}>Request from <strong>{declinedToast.name}</strong> declined</span>
        </div>
      )}

      {/* Accepted toast */}
      {acceptedToast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#131b2e', border: '1px solid rgba(78,222,163,0.35)', borderRadius: 12, padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: 10, zIndex: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'slideUp 0.3s ease' }}>
          <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4edea3' }}>Request Accepted!</div>
            <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{acceptedToast.name} has been notified. Click "Book Slot" to schedule.</div>
          </div>
        </div>
      )}

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { logout(); navigate('/login'); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* â”€â”€ SIDEBAR â”€â”€ */}
      {/* Sidebar overlay */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 45 }} />}

      <aside style={{ width: 256, minHeight: '100vh', position: 'fixed', left: sidebarOpen ? 0 : -256, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 50, transition: 'left 0.3s ease' }}>
        <div style={{ marginBottom: '2rem' }}>
          {/* Logo row: logo left, collapse button right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <AlumNexLogo size="md" showSubtext={false} />
            <button 
              onClick={() => setSidebarOpen(false)} 
              title="Collapse Sidebar"
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '50%',
                cursor: 'pointer', 
                color: '#c7c4d8', 
                width: 28,
                height: 28,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(195,192,255,0.1)';
                e.currentTarget.style.color = '#c3c0ff';
                e.currentTarget.style.borderColor = 'rgba(195,192,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = '#c7c4d8';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_open</span>
            </button>
          </div>
          {/* Subtitle */}
          <div style={{ fontSize: '0.6rem', color: '#c7c4d8', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 10, textAlign: 'center', width: '100%' }}>Alumni Portal</div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ icon, label, tab }) => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 12, background: active ? '#222a3d' : 'transparent', color: active ? '#c3c0ff' : '#c7c4d8', fontWeight: active ? 600 : 400, fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>{label}
              </button>
            );
          })}
        </nav>
        {/* Only Sign Out at bottom — no "New Mentorship" button */}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => setShowLogoutConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#ffb4ab', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Sign Out
          </button>
        </div>
      </aside>

      {/* â”€â”€ MAIN â”€â”€ */}
      <main style={{ marginLeft: sidebarOpen ? 256 : 0, flex: 1, transition: 'margin-left 0.3s ease' }}>
        <header style={{ position: 'fixed', top: 0, left: sidebarOpen ? 256 : 0, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', transition: 'left 0.3s ease' }}>
          {/* Menu toggle */}
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 4, display: 'flex', alignItems: 'center', marginRight: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
            </button>
          )}
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#131b2e', padding: '0.4rem 1rem', borderRadius: 999, width: 300 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c7c4d8' }}>search</span>
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search anything — names, sessions, topics..."
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#dae2fd', fontSize: '0.75rem', width: '100%' }}
            />
            {globalSearch && (
              <button onClick={() => setGlobalSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 0, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

            {/* â”€â”€ NOTIFICATIONS â”€â”€ */}
            <div style={{ position: 'relative' }}>
              <button onClick={openNotifs} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: showNotifs ? '#c3c0ff' : '#c7c4d8', fontSize: 22, fontVariationSettings: showNotifs ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
                {/* Red dot for unread */}
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ff4444', border: '1.5px solid #0b1326' }} />
                )}
              </button>

              {showNotifs && (
                <>
                  <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 44, right: 0, width: 340, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                      <span style={{ fontSize: '0.65rem', color: '#c7c4d8' }}>{allNotifications.length} total</span>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                      {allNotifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#c7c4d8' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3, display: 'block', marginBottom: 8 }}>notifications_none</span>
                          <p style={{ fontSize: '0.875rem' }}>All caught up!</p>
                        </div>
                      ) : allNotifications.map((n, i) => (
                        <div key={n.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.1)', display: 'flex', gap: 12, alignItems: 'flex-start', background: i === 0 ? 'rgba(195,192,255,0.03)' : 'transparent' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: n.type === 'request' || n.type === 'new_request' ? 'rgba(195,192,255,0.12)' : 'rgba(78,222,163,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: n.type === 'request' || n.type === 'new_request' ? '#c3c0ff' : '#4edea3', fontVariationSettings: "'FILL' 1" }}>
                              {n.type === 'request' || n.type === 'new_request' ? 'person_add' : 'event'}
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 3 }}>{n.title}</div>
                            <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.4 }}>{n.desc}</div>
                            <div style={{ fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)', marginTop: 4 }}>
                              {toUtcDate(n.time).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {(n.type === 'request' || n.type === 'new_request') && (
                            <button onClick={() => { setShowNotifs(false); setActiveTab('requests'); }} style={{ padding: '0.25rem 0.6rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', border: 'none', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>View</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(70,69,85,0.3)' }} />

            {/* â”€â”€ PROFILE BUTTON â”€â”€ */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c3c0ff' }}>{user.name || 'Alumni'}</div>
                  <div style={{ fontSize: '0.6rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alumni</div>
                </div>
                {(() => {
                  const lp = (() => { try { return JSON.parse(localStorage.getItem('alumnex_profile') || '{}'); } catch { return {}; } })();
                  const photo = lp.photoPreview && lp.photoPreview !== '__stored_in_database__' && lp.photoPreview !== '__stored_locally__' ? lp.photoPreview : null;
                  return (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: photo ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.85rem', border: showProfile ? '2px solid #c3c0ff' : '2px solid transparent', transition: 'border 0.2s', flexShrink: 0 }}>
                      {photo ? <img src={photo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : firstName[0]}
                    </div>
                  );
                })()}
              </button>

              {/* Profile dropdown */}
              {showProfile && (
                <>
                  <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 48, right: 0, width: 320, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>

                    {!editProfile ? (() => {
                      // Read fresh profile data on every render
                      const liveProfile = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
                      const livePhoto = liveProfile.photoPreview && liveProfile.photoPreview !== '__stored_in_database__' && liveProfile.photoPreview !== '__stored_locally__' ? liveProfile.photoPreview : null;
                      return (
                        <>
                          {/* Profile view */}
                          <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(11,19,38,0.8))', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {(() => {
                                return (
                                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: livePhoto ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#1d00a5', flexShrink: 0 }}>
                                    {livePhoto ? <img src={livePhoto} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : firstName[0]}
                                  </div>
                                );
                              })()}
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#dae2fd' }}>{liveProfile.name || user.name || 'Alumni'}</div>
                                <div style={{ fontSize: '0.7rem', color: '#c3c0ff', marginTop: 2 }}>{liveProfile.currentTitle || liveProfile.domain || liveProfile.department || 'Alumni'}</div>
                                {liveProfile.company && <div style={{ fontSize: '0.65rem', color: '#c7c4d8', marginTop: 1 }}>{liveProfile.company}</div>}
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: '0.75rem 1rem' }}>
                            {[
                              { icon: 'mail',        label: 'Email',       val: liveProfile.email || '—' },
                              { icon: 'phone',       label: 'Phone',       val: liveProfile.phone || '—' },
                              { icon: 'work',        label: 'Domain',      val: liveProfile.domain || liveProfile.department || '—' },
                              { icon: 'business',    label: 'Company',     val: liveProfile.company || '—' },
                              { icon: 'badge',       label: 'Position',    val: liveProfile.currentTitle || '—' },
                              { icon: 'history_edu', label: 'Experience',  val: liveProfile.experience || '—' },
                              { icon: 'school',      label: 'Batch',       val: liveProfile.passOutYear || '—' },
                              { icon: 'link',        label: 'LinkedIn',    val: liveProfile.linkedin ? 'View Profile' : '—', href: liveProfile.linkedin },
                            ].filter(item => item.val !== '—').map(item => (
                              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.45rem 0', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#c3c0ff' }}>{item.icon}</span>
                                <span style={{ fontSize: '0.7rem', color: '#c7c4d8', flex: 1 }}>{item.label}</span>
                                {item.href ? (
                                  <a href={item.href} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#c3c0ff', fontWeight: 600, textDecoration: 'none' }}>{item.val}</a>
                                ) : (
                                  <span style={{ fontSize: '0.7rem', color: '#dae2fd', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.val}</span>
                                )}
                              </div>
                            ))}
                            {liveProfile.skills?.length > 0 && (
                              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {liveProfile.skills.slice(0, 5).map(s => (
                                  <span key={s} style={{ padding: '0.15rem 0.5rem', background: 'rgba(195,192,255,0.1)', borderRadius: 999, fontSize: '0.6rem', color: '#c3c0ff', fontWeight: 600 }}>{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(70,69,85,0.15)', display: 'flex', gap: 8 }}>
                            <button onClick={() => { setShowProfile(false); setActiveTab('settings'); }} style={{ flex: 1, padding: '0.5rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                              Edit Profile
                            </button>
                            <button onClick={() => setShowLogoutConfirm(true)} style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                              Sign Out
                            </button>
                          </div>
                        </>
                      );
                    })() : (
                      <>
                        {/* Edit profile form */}
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setEditProfile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 0, display: 'flex' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                          </button>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quick Edit</span>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {[
                            { key: 'username',     label: 'Name',        icon: 'alternate_email', placeholder: 'your name' },
                            { key: 'email',        label: 'Email',       icon: 'mail',            placeholder: 'you@company.com' },
                            { key: 'domain',       label: 'Domain',      icon: 'work',            placeholder: 'e.g. Software Engineering' },
                            { key: 'experience',   label: 'Experience',  icon: 'history_edu',     placeholder: 'e.g. 8 years at Google' },
                          ].map(field => (
                            <div key={field.key} style={{ marginBottom: '0.875rem' }}>
                              <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#c3c0ff' }}>{field.icon}</span>
                                {field.label}
                              </label>
                              <input
                                value={profileForm[field.key]}
                                onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                disabled={field.key === 'username' || field.key === 'email'}
                                style={{
                                  width: '100%',
                                  background: '#222a3d',
                                  border: '1px solid rgba(70,69,85,0.4)',
                                  borderRadius: 8,
                                  padding: '0.55rem 0.75rem',
                                  color: '#dae2fd',
                                  fontSize: '0.8rem',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  ...((field.key === 'username' || field.key === 'email') ? { opacity: 0.65, cursor: 'not-allowed' } : {})
                                }}
                              />
                            </div>
                          ))}
                          <button onClick={saveProfileForm} style={{ width: '100%', padding: '0.65rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                            Save Changes
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <section style={{ margin: '64px auto 0', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1280px', width: '100%', boxSizing: 'border-box' }}>
          {globalSearch.trim() ? renderSearchResults(globalSearch.trim()) : renderContent()}
        </section>
      </main>
      {/* FAB removed */}
    </div>
  );
}

const glass = { background: 'rgba(23,31,51,0.7)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: 16 };
const btnOutline = { padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid rgba(195,192,255,0.2)', color: '#c3c0ff', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' };
