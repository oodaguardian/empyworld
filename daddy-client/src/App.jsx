import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import {
  supabaseReady,
  sendTextMessage,
  sendVoiceMessage,
  subscribeToMessages,
  initiateCall,
  updateCallStatus,
  subscribeToIncomingCalls,
  watchCallStatus,
  registerPushSubscription,
  sendPushNotification,
} from './supabase.js';

// ─────────────── Constants ───────────────────────────────────────────────────
const DADDY = { id: 'daddy', name: 'Daddy 👨' };
const EMPY  = { id: 'empy',  name: 'Empy 🌸' };
const ZEGO_APP_ID = parseInt(import.meta.env.VITE_ZEGO_APP_ID) || 0;
const ZEGO_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET || '0ba973aa2322bc1af61354aff598c4cd';
const ROOM_ID = 'empy-daddy-room';

// ─────────────── Helpers ─────────────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─────────────── Sub-components ──────────────────────────────────────────────

function IncomingCallOverlay({ call, onAccept, onDecline }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(22,0,32,0.97)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
      exit={{ opacity: 0 }}
    >
      {/* Pulsing rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: '#FF2D8B', width: 160 + i * 60, height: 160 + i * 60, opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      <motion.div className="text-[6rem]" animate={{ rotate: [0, 20, -20, 0], y: [0, -10, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}>
        {call.type === 'video' ? '📹' : '📞'}
      </motion.div>

      <div className="text-center z-10">
        <p className="text-[#FF76C2] font-display text-2xl mb-1">Empy is calling! 🌸</p>
        <p className="text-white/60 font-sans text-base">{call.type === 'video' ? '📹 Video Call' : '📞 Audio Call'}</p>
      </div>

      <div className="flex gap-10 z-10">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onDecline}
          className="btn btn-circle btn-lg text-3xl"
          style={{ background: '#EF4444', border: 'none' }}>
          📵
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onAccept}
          className="btn btn-circle btn-lg text-3xl"
          style={{ background: '#22C55E', border: 'none' }}>
          {call.type === 'video' ? '📹' : '📞'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function RingingOverlay({ type, onCancel }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(22,0,32,0.97)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="text-[6rem]"
        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>
        {type === 'video' ? '📹' : '📞'}
      </motion.div>
      <p className="text-[#FF76C2] font-display text-2xl">Calling Empy… 🌸</p>
      <p className="text-white/60 font-sans text-sm">Waiting for her to answer 💕</p>
      <motion.button whileTap={{ scale: 0.9 }} onClick={onCancel}
        className="btn btn-circle btn-lg text-3xl"
        style={{ background: '#EF4444', border: 'none' }}>
        📵
      </motion.button>
    </motion.div>
  );
}

function ZegoCallOverlay({ callType, onEnd }) {
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !ZEGO_APP_ID) return;
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      ZEGO_APP_ID, ZEGO_SECRET, ROOM_ID, DADDY.id, DADDY.name
    );
    zpRef.current = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current.joinRoom({
      container: containerRef.current,
      scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
      turnOnCameraWhenJoining: callType === 'video',
      turnOnMicrophoneWhenJoining: true,
      showPreJoinView: false,
      onLeaveRoom: onEnd,
    });
    return () => {
      try { zpRef.current?.destroy?.(); } catch (_) {}
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50" style={{ background: '#000' }}>
      <div ref={containerRef} className="w-full h-full" />
      <motion.button whileTap={{ scale: 0.9 }} onClick={onEnd}
        className="absolute top-4 right-4 btn btn-circle btn-sm z-10"
        style={{ background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff' }}>
        ✕
      </motion.button>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isDaddy = msg.sender_id === DADDY.id;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex ${isDaddy ? 'justify-end' : 'justify-start'} mb-2`}
    >
      {!isDaddy && <span className="text-xl mr-2 self-end mb-1">🌸</span>}
      <div
        className="max-w-[75%] rounded-2xl px-4 py-2 shadow-lg"
        style={{
          background: isDaddy
            ? 'linear-gradient(135deg, #3B82F6, #9B30FF)'
            : 'linear-gradient(135deg, #FF2D8B, #9B30FF)',
        }}
      >
        {msg.type === 'text' && (
          <p className="text-white font-sans text-sm sm:text-base leading-snug">{msg.content}</p>
        )}
        {msg.type === 'voice' && (
          <div className="flex items-center gap-2">
            <span>🎤</span>
            <audio controls src={msg.audio_url} className="h-8" style={{ maxWidth: '190px' }} />
          </div>
        )}
        <p className="text-white/40 font-sans text-xs mt-1 text-right">
          {isDaddy ? 'You' : 'Empy'} · {formatTime(msg.created_at)}
        </p>
      </div>
      {isDaddy && <span className="text-xl ml-2 self-end mb-1">👨</span>}
    </motion.div>
  );
}

// ─────────────── Main App ────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [callPhase, setCallPhase] = useState('idle');
  const [callType, setCallType] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // ── Setup ──────────────────────────────────────────────────────────────────
  useEffect(() => subscribeToMessages(setMessages), []);

  useEffect(() => subscribeToIncomingCalls(EMPY.id, (call) => {
    if (call && callPhase === 'idle') {
      setIncomingCall(call);
      // Ring-ring sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const ring = (freq, start) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          g.gain.setValueAtTime(0.3, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          o.connect(g); g.connect(ctx.destination);
          o.start(start); o.stop(start + 0.4);
        };
        [880, 1100, 880, 1100].forEach((f, i) => ring(f, ctx.currentTime + i * 0.5));
      } catch (_) {}
    } else if (!call) setIncomingCall(null);
  }), [callPhase]);

  // Register Web Push so Empy can notify us
  useEffect(() => { registerPushSubscription(DADDY.id).catch(() => {}); }, []);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // SW messages (accept/decline from notification)
  useEffect(() => {
    const handler = (e) => {
      const { type } = e.detail || {};
      if (type === 'ACCEPT_CALL') handleAcceptIncoming();
      if (type === 'DECLINE_CALL') handleDeclineIncoming();
    };
    window.addEventListener('sw-message', handler);
    return () => window.removeEventListener('sw-message', handler);
  }, [incomingCall]); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Calling ────────────────────────────────────────────────────────────────
  const handleStartCall = useCallback(async (type) => {
    if (!ZEGO_APP_ID) { alert('ZegoCloud App ID not set in .env'); return; }
    setCallType(type);
    setCallPhase('ringing');
    try {
      const id = await initiateCall(DADDY.id, DADDY.name, type);
      setCurrentCallId(id);
      await sendPushNotification(
        EMPY.id,
        type === 'video' ? '📹 Daddy is video calling!' : '📞 Daddy is calling!',
        'Tap to answer',
        { type: 'call', callType: type, callId: id }
      );
      const timeout = setTimeout(() => {
        updateCallStatus(id, 'missed');
        setCallPhase('idle'); setCurrentCallId(null);
      }, 30000);
      return () => clearTimeout(timeout);
    } catch (_) {
      setCallPhase('active');
    }
  }, []);

  // Watch ringing call for Empy's response
  useEffect(() => {
    if (callPhase !== 'ringing' || !currentCallId) return;
    return watchCallStatus(currentCallId, (status) => {
      if (status === 'accepted') setCallPhase('active');
      else if (['declined', 'cancelled', 'ended'].includes(status)) {
        setCallPhase('idle'); setCurrentCallId(null);
      }
    });
  }, [callPhase, currentCallId]);

  const handleCancelCall = useCallback(async () => {
    if (currentCallId) await updateCallStatus(currentCallId, 'cancelled');
    setCallPhase('idle'); setCurrentCallId(null);
  }, [currentCallId]);

  const handleAcceptIncoming = useCallback(async () => {
    if (incomingCall?.callId) await updateCallStatus(incomingCall.callId, 'accepted');
    setCallType(incomingCall?.type || 'video');
    setCurrentCallId(incomingCall?.callId || null);
    setIncomingCall(null);
    setCallPhase('active');
  }, [incomingCall]);
  const handleInstallApp = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDeclineIncoming = useCallback(async () => {
    if (incomingCall?.callId) await updateCallStatus(incomingCall.callId, 'declined');
    setIncomingCall(null);
  }, [incomingCall]);

  const handleCallEnd = useCallback(async () => {
    if (currentCallId) await updateCallStatus(currentCallId, 'ended');
    setCallPhase('idle'); setCurrentCallId(null); setCallType(null);
  }, [currentCallId]);

  // ── Messaging ──────────────────────────────────────────────────────────────
  const handleSendText = useCallback(async () => {
    if (!input.trim()) return;
    const text = input.trim(); setInput('');
    try {
      await sendTextMessage(DADDY.id, DADDY.name, text);
      await sendPushNotification(EMPY.id, '👨 Message from Daddy', text, { type: 'message' });
    } catch {
      setMessages((prev) => [...prev, {
        id: String(Date.now()), sender_id: DADDY.id, sender_name: DADDY.name,
        type: 'text', content: text, created_at: new Date().toISOString(),
      }]);
    }
  }, [input]);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          await sendVoiceMessage(DADDY.id, DADDY.name, blob);
          await sendPushNotification(EMPY.id, '🎤 Voice message from Daddy', 'Tap to listen', { type: 'message' });
        } catch { alert('Voice message requires Supabase Storage. Create the voice-messages bucket in the Supabase dashboard.'); }
      };
      recorder.start(); mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch { alert('Microphone access denied.'); }
  }, []);

  const handleStopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', position: 'relative' }}>

      {/* Header */}
      <header style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(45,0,80,0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,45,139,0.25)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="font-display" style={{ fontSize: '1.3rem', background: 'linear-gradient(90deg, #FF2D8B, #FF76C2, #9B30FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            💌 Daddy Portal
          </span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Nunito, sans-serif' }}>
            Messages &amp; Calls from Empy 🌸
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
            onClick={() => handleStartCall('video')}
            disabled={callPhase !== 'idle'}
            style={{ background: 'linear-gradient(135deg, #9B30FF, #3B82F6)', border: 'none', color: '#fff', borderRadius: '12px', padding: '8px 14px', fontFamily: 'Fredoka One, cursive', fontSize: '0.85rem', cursor: 'pointer', opacity: callPhase !== 'idle' ? 0.5 : 1 }}>
            📹 Call
          </motion.button>
          <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
            onClick={() => handleStartCall('audio')}
            disabled={callPhase !== 'idle'}
            style={{ background: 'linear-gradient(135deg, #FF2D8B, #9B30FF)', border: 'none', color: '#fff', borderRadius: '12px', padding: '8px 14px', fontFamily: 'Fredoka One, cursive', fontSize: '0.85rem', cursor: 'pointer', opacity: callPhase !== 'idle' ? 0.5 : 1 }}>
            📞 Call
          </motion.button>
        </div>
      </header>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'linear-gradient(90deg, #FF2D8B, #9B30FF)', color: '#fff', fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem' }}>
            <span>📲 Install Daddy Portal for quick access &amp; notifications!</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleInstallApp} style={{ background: '#fff', color: '#9B30FF', border: 'none', borderRadius: '8px', padding: '4px 12px', fontFamily: 'Fredoka One, cursive', cursor: 'pointer' }}>Install</button>
              <button onClick={() => setShowInstallBanner(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px', scrollbarWidth: 'none' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', opacity: 0.6 }}>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: '4rem' }}>💌</motion.div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem' }}>Empy's messages will appear here!</p>
          </div>
        )}
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        padding: '10px 12px',
        background: 'rgba(45,0,80,0.6)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,45,139,0.25)',
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onPointerDown={handleStartRecording}
          onPointerUp={handleStopRecording}
          onPointerLeave={handleStopRecording}
          style={{
            flexShrink: 0, width: '42px', height: '42px', borderRadius: '50%', border: 'none',
            background: isRecording ? '#FF2D8B' : 'rgba(155,48,255,0.4)', color: '#fff',
            fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Hold to record"
        >
          {isRecording
            ? <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>🔴</motion.span>
            : '🎤'}
        </motion.button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          placeholder="Reply to Empy… 💕"
          maxLength={300}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '20px',
            background: 'rgba(45,0,80,0.7)', border: '1px solid rgba(255,45,139,0.4)',
            color: '#fff', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none',
          }}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSendText}
          disabled={!input.trim()}
          style={{
            flexShrink: 0, padding: '10px 16px', borderRadius: '20px', border: 'none',
            background: input.trim() ? 'linear-gradient(135deg, #3B82F6, #9B30FF)' : 'rgba(155,48,255,0.3)',
            color: '#fff', fontFamily: 'Fredoka One, cursive', fontSize: '1rem', cursor: 'pointer',
          }}
        >
          Send 💙
        </motion.button>
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {incomingCall && callPhase === 'idle' && (
          <IncomingCallOverlay key="incoming" call={incomingCall}
            onAccept={handleAcceptIncoming} onDecline={handleDeclineIncoming} />
        )}
        {callPhase === 'ringing' && (
          <RingingOverlay key="ringing" type={callType} onCancel={handleCancelCall} />
        )}
        {callPhase === 'active' && (
          <ZegoCallOverlay key="active" callType={callType} onEnd={handleCallEnd} />
        )}
      </AnimatePresence>
    </div>
  );
}
