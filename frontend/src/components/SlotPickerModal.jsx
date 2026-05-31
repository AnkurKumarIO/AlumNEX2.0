import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function SlotPickerModal({ alumni, onClose, onBooked }) {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/alumni/${alumni.id}/availability`)
      .then(res => {
        setAvailability(res.data.availability || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch availability error:', err);
        setLoading(false);
      });
  }, [alumni.id]);

  const generateDateSlots = () => {
    const slots = [];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();

    // Generate slots for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dayName = days[date.getDay()];

      const dayAvailability = availability.filter(a => a.day_of_week === dayName);

      dayAvailability.forEach(avail => {
        const [startH, startM] = avail.start_time.split(':').map(Number);
        const [endH, endM] = avail.end_time.split(':').map(Number);

        let current = new Date(date);
        current.setHours(startH, startM, 0, 0);

        const end = new Date(date);
        end.setHours(endH, endM, 0, 0);

        // Add 15 min buffer to slot duration
        const durationWithBuffer = avail.slot_duration + 15;

        while (current.getTime() + avail.slot_duration * 60000 <= end.getTime() + 30 * 60000) { // allow slight extension
          const slotEnd = new Date(current.getTime() + avail.slot_duration * 60000);
          slots.push({
            start: new Date(current),
            end: slotEnd,
            displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            displayTime: `${current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          });
          current = new Date(current.getTime() + durationWithBuffer * 60000);
        }
      });
    }
    return slots;
  };

  const allSlots = generateDateSlots();
  const groupedSlots = allSlots.reduce((groups, slot) => {
    const date = slot.displayDate;
    if (!groups[date]) groups[date] = [];
    groups[date].push(slot);
    return groups;
  }, {});

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setError('');

    try {
      // First, create the request if it doesn't exist, or use the current one
      // For AlumNEX, we usually send the request first.
      // But in this new flow, we want to book the slot AS part of sending the request or right after.
      // Based on Phase 6A, student picks slot BEFORE sending.

      onBooked(selectedSlot);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book slot');
      setBooking(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#dae2fd' }}>Pick a Time Slot</h3>
            <p style={{ fontSize: '0.85rem', color: '#c7c4d8', marginTop: 4 }}>Select a time to meet with {alumni.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#c7c4d8' }}>Loading slots...</div>
        ) : allSlots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.2, display: 'block', marginBottom: 12 }}>calendar_today</span>
            <p>No availability set by this alumni yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(groupedSlots).map(([date, slots]) => (
              <div key={date}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>{date}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                  {slots.map((slot, i) => {
                    const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '0.6rem',
                          background: isSelected ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#222a3d',
                          color: isSelected ? '#1d00a5' : '#dae2fd',
                          border: `1px solid ${isSelected ? 'transparent' : 'rgba(195,192,255,0.1)'}`,
                          borderRadius: 10,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {slot.displayTime}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button
            disabled={!selectedSlot || booking}
            onClick={handleConfirm}
            style={{
              flex: 2, padding: '0.75rem',
              background: (!selectedSlot || booking) ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)',
              color: (!selectedSlot || booking) ? '#c7c4d8' : '#1d00a5',
              border: 'none', borderRadius: 10, fontWeight: 700,
              cursor: (!selectedSlot || booking) ? 'not-allowed' : 'pointer'
            }}
          >
            {booking ? 'Confirming...' : 'Confirm Slot'}
          </button>
        </div>
      </div>
    </div>
  );
}
