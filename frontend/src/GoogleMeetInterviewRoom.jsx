import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { api } from './api';
import { AuthContext } from './context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function GoogleMeetInterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const myId = user?.name || user?.role || 'User';
  const myRole = user?.role || 'STUDENT';

  // Connection
  const [isConnected, setIsConnected] = useState(false);
  const [meetLink, setMeetLink] = useState('');
  const [meetLoading, setMeetLoading] = useState(true);
  const [peerName, setPeerName] = useState('Peer');
  const [peerPresent, setPeerPresent] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sidePanel, setSidePanel] = useState('chat');

  // Session state
  const [ended, setEnded] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [meetOpened, setMeetOpened] = useState(false);

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initialize Google Meet & Socket.io
  useEffect(() => {
    const initMeet = async () => {
      try {
        const data = await api.getMeetLink(roomId);
        if (data.success && data.meetLink) setMeetLink(data.meetLink);
      } catch (e) { console.error('[GoogleMeet] Error:', e); }
      finally { setMeetLoading(false); }
    };
    initMeet();

    const socket = io(`${SOCKET_URL}/interview`);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', roomId, myId);
    });
    socket.on('room-users', (users) => {
      if (users.length > 0) { setPeerName(users[0]); setPeerPresent(true); }
    });
    socket.on('user-connected', (uid) => { setPeerName(uid); setPeerPresent(true); });
    socket.on('user-disconnected', () => setPeerPresent(false));
    socket.on('chat_message', (msg) => setChatMessages(p => [...p, msg]));
    socket.on('session_ended', () => setEnded(true));

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    return () => {
      socket.disconnect();
      clearInterval(timerRef.current);
    };
  }, [roomId, myId]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = { from: myId, text: chatInput, time: new Date().toLocaleTimeString() };
    setChatMessages(p => [...p, msg]);
    socketRef.current?.emit('chat_message', roomId, msg);
    setChatInput('');
  };

  const endSession = () => {
    clearInterval(timerRef.current);
    socketRef.current?.emit('session_ended', roomId, myId);
    setEnded(true);
  };

  const submitFeedback = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const authUser = JSON.parse(localStorage.getItem('alumnex_user') || '{}');
      await api.submitFeedback({
        roomId,
        studentId: myRole === 'STUDENT' ? (authUser.id || user?.id) : (peerName || 'unknown'),
        alumniId: myRole === 'ALUMNI' ? (authUser.id || user?.id) : (peerName || 'unknown'),
        studentName: myRole === 'STUDENT' ? myId : peerName,
        alumniName: myRole === 'ALUMNI' ? myId : peerName,
        topic: 'Mock Interview',
        meetLink,
        role: myRole,
        rating,
        feedback: feedbackMsg || null,
      });
      setFeedbackSubmitted(true);
    } catch (e) { console.error('Feedback error:', e); }
    setSubmitting(false);
  };

  const openMeet = () => {
    window.open(meetLink, '_blank', 'noopener,noreferrer');
    setMeetOpened(true);
  };

  // ── Feedback Screen ──
  if (ended) {
    if (feedbackSubmitted) {
      return (
        <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
          <div style={{ maxWidth:480, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>✅</div>
            <h2 style={{ fontSize:'1.75rem', fontWeight:900, marginBottom:8 }}>Thank You!</h2>
            <p style={{ color:'#c7c4d8', marginBottom:'2rem', lineHeight:1.6 }}>Your feedback has been submitted successfully. It will help improve future sessions.</p>
            <button onClick={() => navigate('/dashboard')} style={{ width:'100%', padding:'1rem', background:'linear-gradient(135deg,#4f46e5,#c3c0ff)', color:'#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ maxWidth:520, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>📝</div>
            <h2 style={{ fontSize:'1.75rem', fontWeight:900, letterSpacing:'-0.03em' }}>Session Feedback</h2>
            <p style={{ color:'#c7c4d8', marginTop:8, lineHeight:1.6 }}>
              Session with <strong style={{ color:'#c3c0ff' }}>{peerName}</strong> — {fmt(elapsed)} elapsed
            </p>
          </div>

          {/* Star Rating */}
          <div style={{ background:'#131b2e', borderRadius:16, padding:'2rem', marginBottom:'1rem', border:'1px solid rgba(70,69,85,0.2)', textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'1rem' }}>Rate this session</div>
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:'1.5rem' }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:'2.5rem', color: s <= (hoverRating || rating) ? '#ffb95f' : 'rgba(70,69,85,0.5)', transition:'all 0.15s', transform: s <= (hoverRating || rating) ? 'scale(1.15)' : 'scale(1)' }}>
                  ★
                </button>
              ))}
            </div>
            <div style={{ fontSize:'0.8rem', color: rating > 0 ? '#ffb95f' : '#c7c4d8', fontWeight:600, marginBottom:'1.5rem' }}>
              {rating === 0 ? 'Click a star to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </div>

            <div>
              <label style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', display:'block', marginBottom:8, textAlign:'left' }}>
                Feedback Message <span style={{ opacity:0.5, fontWeight:400, textTransform:'none' }}>(optional)</span>
              </label>
              <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)}
                placeholder="Share your thoughts about the session..."
                rows={3}
                style={{ width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.4)', borderRadius:10, padding:'0.75rem', color:'#dae2fd', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', resize:'none', fontFamily:'Inter,sans-serif' }} />
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setFeedbackSubmitted(true); navigate('/dashboard'); }}
              style={{ flex:1, padding:'0.875rem', background:'#222a3d', color:'#c7c4d8', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>
              Skip
            </button>
            <button onClick={submitFeedback} disabled={rating === 0 || submitting}
              style={{ flex:2, padding:'0.875rem', background: rating > 0 ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', color: rating > 0 ? '#1d00a5' : '#c7c4d8', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.8rem', cursor: rating > 0 ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {submitting ? 'Submitting...' : '✓ Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ──
  return (
    <div style={{ height:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Top bar */}
      <nav style={{ height:60, background:'rgba(11,19,38,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(195,192,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', flexShrink:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
          <span style={{ fontSize:'1rem', fontWeight:900, letterSpacing:'-0.03em', color:'#f5e9ff' }}>AlumNEX • Google Meet</span>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#222a3d', padding:'0.25rem 0.65rem', borderRadius:999, border:'1px solid rgba(70,69,85,0.3)' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: isConnected ? '#4edea3' : '#ffb4ab', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color: isConnected ? '#4edea3' : '#ffb4ab' }}>
              {isConnected ? (peerPresent ? 'PEER CONNECTED' : 'WAITING FOR PEER') : 'CONNECTING...'}
            </span>
          </div>
          <span style={{ fontSize:'0.72rem', color:'#c7c4d8' }}>Room: <strong style={{ color:'#c3c0ff' }}>{roomId}</strong></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.72rem', color:'#c7c4d8' }}>You: <strong style={{ color:'#c3c0ff' }}>{myId}</strong></span>
          <button onClick={() => navigate('/dashboard')} style={{ padding:'0.4rem 1rem', background:'rgba(79,70,229,0.15)', color:'#c3c0ff', border:'1px solid rgba(195,192,255,0.2)', borderRadius:8, fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>Leave</button>
        </div>
      </nav>

      {/* Canvas */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Google Meet area */}
        <div style={{ flex:1, padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem', overflow:'hidden' }}>
          {meetLoading ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#131b2e', borderRadius:14, border:'1px solid rgba(70,69,85,0.2)' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>🔄</div>
                <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#c7c4d8' }}>Loading Google Meet...</div>
              </div>
            </div>
          ) : (
            <div style={{ flex:1, position:'relative', borderRadius:14, overflow:'hidden', background:'#131b2e', border:'1px solid rgba(70,69,85,0.2)' }}>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', textAlign:'center' }}>
                <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>{meetOpened ? '✅' : '📹'}</div>
                <h3 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1rem', color:'#c3c0ff' }}>
                  {meetOpened ? 'Meeting in Progress' : 'Join Google Meet'}
                </h3>
                <p style={{ fontSize:'0.9rem', color:'#c7c4d8', marginBottom:'1.5rem', maxWidth:500, lineHeight:1.6 }}>
                  {meetOpened
                    ? 'Your Google Meet is open in another tab. Use the chat panel here to communicate. Click "End Session" when done to provide feedback.'
                    : 'Click the button below to open Google Meet in a new tab. Both participants will join the same meeting room.'}
                </p>

                <div style={{ background:'#222a3d', borderRadius:12, padding:'1rem', marginBottom:'1.5rem', maxWidth:600, width:'100%' }}>
                  <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'0.5rem' }}>Meeting Link</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <input value={meetLink} readOnly style={{ flex:1, background:'#131b2e', border:'1px solid rgba(70,69,85,0.3)', borderRadius:8, padding:'0.6rem', color:'#dae2fd', fontSize:'0.8rem', fontFamily:'monospace' }} />
                    <button onClick={() => navigator.clipboard.writeText(meetLink)}
                      style={{ padding:'0.6rem 1rem', background:'rgba(195,192,255,0.15)', color:'#c3c0ff', border:'1px solid rgba(195,192,255,0.2)', borderRadius:8, fontWeight:700, fontSize:'0.75rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                      📋 Copy
                    </button>
                  </div>
                </div>

                <button onClick={openMeet}
                  style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'1rem 2rem', background: meetOpened ? 'rgba(78,222,163,0.15)' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: meetOpened ? '#4edea3' : '#1d00a5', border: meetOpened ? '1px solid rgba(78,222,163,0.3)' : 'none', borderRadius:12, fontWeight:700, fontSize:'0.9rem', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:20 }}>video_call</span>
                  {meetOpened ? 'Rejoin Google Meet' : 'Open Google Meet'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width:340, background:'#131b2e', borderLeft:'1px solid rgba(70,69,85,0.2)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ display:'flex', borderBottom:'1px solid rgba(70,69,85,0.2)', flexShrink:0 }}>
            {[['chat','chat_bubble','Chat'],['participants','group','People']].map(([tab,icon,label]) => (
              <button key={tab} onClick={() => setSidePanel(tab)} style={{ flex:1, padding:'0.75rem 0.5rem', background: sidePanel===tab ? '#222a3d' : 'transparent', color: sidePanel===tab ? '#c3c0ff' : '#c7c4d8', border:'none', borderBottom: sidePanel===tab ? '2px solid #4f46e5' : '2px solid transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', transition:'all 0.2s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:18 }}>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Chat panel */}
          {sidePanel === 'chat' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ flex:1, overflowY:'auto', padding:'0.875rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, color:'#c7c4d8', textAlign:'center', padding:'1.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:30, opacity:0.2, marginBottom:8 }}>chat_bubble</span>
                    <p style={{ fontSize:'0.75rem', opacity:0.45 }}>No messages yet</p>
                  </div>
                ) : chatMessages.map((m,i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.from===myId ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize:'0.6rem', color:'#c7c4d8', marginBottom:3 }}>{m.from} · {m.time}</div>
                    <div style={{ background: m.from===myId ? 'rgba(79,70,229,0.25)' : '#222a3d', border:`1px solid ${m.from===myId ? 'rgba(195,192,255,0.2)' : 'rgba(70,69,85,0.2)'}`, borderRadius:10, padding:'0.5rem 0.75rem', fontSize:'0.8rem', maxWidth:'85%', lineHeight:1.5 }}>{m.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding:'0.75rem', borderTop:'1px solid rgba(70,69,85,0.2)', flexShrink:0 }}>
                <div style={{ position:'relative' }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter') sendChat(); }}
                    placeholder="Send a message..."
                    style={{ width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.3)', borderRadius:9, padding:'0.6rem 2.2rem 0.6rem 0.8rem', color:'#dae2fd', fontSize:'0.76rem', outline:'none', boxSizing:'border-box' }} />
                  <button onClick={sendChat} style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer' }}>
                    <span className="material-symbols-outlined" style={{ color:'#c3c0ff', fontSize:15 }}>send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Participants panel */}
          {sidePanel === 'participants' && (
            <div style={{ flex:1, padding:'1rem', overflowY:'auto' }}>
              <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(199,196,216,0.4)', marginBottom:'1rem' }}>In this session</div>
              {[{name:myId,role:'You',color:'#c3c0ff',online:true},{name:peerName,role:'Peer',color:'#4edea3',online:peerPresent}].map((p,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'0.75rem', background:'#171f33', borderRadius:10, marginBottom:8, border:'1px solid rgba(70,69,85,0.15)', opacity: p.online ? 1 : 0.45 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${p.color}40,${p.color}20)`, border:`1px solid ${p.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, color:p.color, flexShrink:0 }}>{p.name[0]?.toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{p.name}</div>
                    <div style={{ fontSize:'0.65rem', color:'#c7c4d8' }}>{p.role}</div>
                  </div>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: p.online ? '#4edea3' : '#464555' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ height:72, background:'rgba(11,19,38,0.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div>
            <div style={{ fontSize:'0.52rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(199,196,216,0.45)', marginBottom:1 }}>Elapsed</div>
            <div style={{ fontSize:'1.1rem', fontFamily:'monospace', fontWeight:700, color:'#c3c0ff' }}>{fmt(elapsed)}</div>
          </div>
        </div>

        <button onClick={endSession} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 1.1rem', height:40, borderRadius:999, background:'#ffb4ab', color:'#690005', border:'none', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', boxShadow:'0 4px 14px rgba(255,107,107,0.22)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16 }}>call_end</span>End Session
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex' }}>
            {[myId[0]||'Y', peerName[0]||'?'].map((l,i) => (
              <div key={i} style={{ width:32, height:32, borderRadius:'50%', background: i===1&&peerPresent ? 'linear-gradient(135deg,#00a572,#4edea3)' : '#222a3d', border:'2px solid #0b1326', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:700, color:'#c3c0ff', marginLeft: i>0 ? -7 : 0, opacity: i===1&&!peerPresent ? 0.35 : 1 }}>{l.toUpperCase()}</div>
            ))}
          </div>
          <span style={{ fontSize:'0.7rem', color:'#c7c4d8' }}>{peerPresent ? '2 active' : 'Peer offline'}</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(78,222,163,0.4)} 50%{opacity:0.7;box-shadow:0 0 0 6px rgba(78,222,163,0)} }
      `}</style>
    </div>
  );
}
