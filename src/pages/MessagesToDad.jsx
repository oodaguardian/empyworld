import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import PageLayout from '../components/PageLayout';
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
} from '../services/supabase';

// ─────────────────────────── Constants ───────────────────────────────────────
const EMPY = { id: 'empy', name: 'Empy 🌸' };
const DADDY = { id: 'daddy', name: 'Daddy 👨' };
const ZEGO_APP_ID = parseInt(import.meta.env.VITE_ZEGO_APP_ID) || 0;
const ZEGO_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET || '0ba973aa2322bc1af61354aff598c4cd';
const ROOM_ID = 'empy-daddy-room';

// ─────────────────────────── Helpers ─────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────── Sub-components ──────────────────────────────────

function CallRingingOverlay({ type, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(22,0,32,0.96)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-8xl"
      >
        {type === 'video' ? '📹' : '📞'}
      </motion.div>
      <p className="glitter-text font-display text-3xl">Calling Daddy…</p>
      <p className="text-white/60 font-body">Waiting for him to pick up 💕</p>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onCancel}
        className="btn btn-circle btn-lg"
        style={{ background: '#FF2D8B', border: 'none', fontSize: '2rem' }}
        aria-label="Cancel call"
      >
        📵
      </motion.button>
    </motion.div>
  );
}

function IncomingCallOverlay({ call, onAccept, onDecline }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(22,0,32,0.96)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0], y: [0, -10, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="text-8xl"
      >
        {call.type === 'video' ? '📹' : '📞'}
      </motion.div>
      <p className="glitter-text font-display text-3xl">Daddy is calling!</p>
      <p className="text-white/60 font-body">{call.type === 'video' ? 'Video Call' : 'Audio Call'}</p>
      <div className="flex gap-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDecline}
          className="btn btn-circle btn-lg"
          style={{ background: '#FF2D8B', border: 'none', fontSize: '2rem' }}
          aria-label="Decline"
        >
          📵
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAccept}
          className="btn btn-circle btn-lg"
          style={{ background: '#22C55E', border: 'none', fontSize: '2rem' }}
          aria-label="Accept"
        >
          {call.type === 'video' ? '📹' : '📞'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function ZegoCallOverlay({ callType, onEnd }) {
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !ZEGO_APP_ID) return;
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      ZEGO_APP_ID, ZEGO_SECRET, ROOM_ID, EMPY.id, EMPY.name
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
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onEnd}
        className="absolute top-4 right-4 btn btn-circle btn-sm z-10"
        style={{ background: 'rgba(255,45,139,0.8)', border: 'none', color: '#fff' }}
        aria-label="End call"
      >
        ✕
      </motion.button>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isEmpy = msg.sender_id === EMPY.id;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isEmpy ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div
        className="max-w-[75%] rounded-2xl px-4 py-2 shadow-lg"
        style={{
          background: isEmpy
            ? 'linear-gradient(135deg, #FF2D8B, #9B30FF)'
            : 'rgba(45,0,80,0.85)',
          border: isEmpy ? 'none' : '1px solid rgba(255,45,139,0.3)',
        }}
      >
        {msg.type === 'text' && (
          <p className="text-white font-body text-sm sm:text-base">{msg.content}</p>
        )}
        {msg.type === 'voice' && (
          <div className="flex items-center gap-2">
            <span>🎤</span>
            <audio controls src={msg.audio_url} className="h-8" style={{ maxWidth: '180px' }} />
          </div>
        )}
        <p className="text-white/40 font-body text-xs mt-1 text-right">
          {isEmpy ? 'Empy' : 'Daddy'} · {formatTime(msg.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────── Main Component ──────────────────────────────────
export default function MessagesToDad() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [callPhase, setCallPhase] = useState('idle'); // idle | ringing | active
  const [callType, setCallType] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const missTimeoutRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to messages via Supabase
  useEffect(() => {
    const unsub = subscribeToMessages(setMessages);
    return unsub;
  }, []);

  // Listen for incoming calls FROM Daddy
  useEffect(() => subscribeToIncomingCalls(DADDY.id, (call) => {
    if (call && callPhase === 'idle') setIncomingCall(call);
    else if (!call) setIncomingCall(null);
  }), [callPhase]);

  // Register Web Push subscription so Daddy can notify us
  useEffect(() => { registerPushSubscription(EMPY.id).catch(() => {}); }, []);

  // Handle accept/decline triggered by SW notification tap
  useEffect(() => {
    const handler = (e) => {
      const { type } = e.detail || {};
      if (type === 'ACCEPT_CALL') handleAcceptIncoming();
      if (type === 'DECLINE_CALL') handleDeclineIncoming();
    };
    window.addEventListener('sw-message', handler);
    return () => window.removeEventListener('sw-message', handler);
  }, [incomingCall]); // eslint-disable-line

  // ── Calling ────────────────────────────────────────────────────────────────

  const handleStartCall = useCallback(async (type) => {
    if (!ZEGO_APP_ID) {
      alert('ZegoCloud App ID not set. Add VITE_ZEGO_APP_ID to .env.local');
      return;
    }
    setCallType(type);
    setCallPhase('ringing');
    try {
      const callId = await initiateCall(EMPY.id, EMPY.name, type);
      setCurrentCallId(callId);
      // Notify Daddy
      await sendPushNotification(
        DADDY.id,
        type === 'video' ? '📹 Empy is video calling!' : '📞 Empy is calling!',
        'Tap to answer',
        { type: 'call', callType: type, callId }
      );
      // After 30s with no answer, mark missed
      clearTimeout(missTimeoutRef.current);
      missTimeoutRef.current = setTimeout(() => {
        updateCallStatus(callId, 'missed');
        setCallPhase('idle');
        setCurrentCallId(null);
      }, 30000);
    } catch (_) {
      // Supabase not configured — still allow local ZegoCloud call for testing
      setCallPhase('active');
    }
  }, []);

  const handleCancelCall = useCallback(async () => {
    clearTimeout(missTimeoutRef.current);
    if (currentCallId) await updateCallStatus(currentCallId, 'cancelled');
    setCallPhase('idle');
    setCurrentCallId(null);
  }, [currentCallId]);

  const handleAcceptIncoming = useCallback(async () => {
    if (incomingCall?.callId) await updateCallStatus(incomingCall.callId, 'accepted');
    setCallType(incomingCall?.type || 'video');
    setCurrentCallId(incomingCall?.callId || null);
    setIncomingCall(null);
    setCallPhase('active');
  }, [incomingCall]);

  const handleDeclineIncoming = useCallback(async () => {
    if (incomingCall?.callId) await updateCallStatus(incomingCall.callId, 'declined');
    setIncomingCall(null);
  }, [incomingCall]);

  const handleCallEnd = useCallback(async () => {
    clearTimeout(missTimeoutRef.current);
    if (currentCallId) await updateCallStatus(currentCallId, 'ended');
    setCallPhase('idle');
    setCurrentCallId(null);
    setCallType(null);
  }, [currentCallId]);

  // When ringing, watch Supabase call record for Daddy's response
  useEffect(() => {
    if (callPhase !== 'ringing' || !currentCallId) return;
    return watchCallStatus(currentCallId, (status) => {
      clearTimeout(missTimeoutRef.current);
      if (status === 'accepted') {
        setCallPhase('active');
      } else if (status === 'declined' || status === 'cancelled' || status === 'ended') {
        setCallPhase('idle');
        setCurrentCallId(null);
      }
    });
  }, [callPhase, currentCallId]);

  // ── Messaging ──────────────────────────────────────────────────────────────

  const handleSendText = useCallback(async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    try {
      await sendTextMessage(EMPY.id, EMPY.name, text);
      await sendPushNotification(DADDY.id, '💌 Message from Empy', text, { type: 'message' });
    } catch {
      // Optimistic local fallback
      setMessages((prev) => [...prev, {
        id: String(Date.now()), sender_id: EMPY.id, sender_name: EMPY.name,
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
          await sendVoiceMessage(EMPY.id, EMPY.name, blob);
          await sendPushNotification(DADDY.id, '🎤 Voice message from Empy', 'Tap to listen', { type: 'message' });
        } catch (_) {
          alert('Voice message requires Supabase Storage. Create the voice-messages bucket in the Supabase dashboard.');
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert('Microphone access denied.');
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  return (
    <PageLayout title="Letters to Dad" icon="💌">
      <div className="flex flex-col h-full gap-2">

        {/* ── Call buttons ─────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex gap-2 justify-center pb-1">
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleStartCall('video')}
            disabled={callPhase !== 'idle'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-display text-white text-sm sm:text-base font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, #9B30FF, #3B82F6)', border: '1px solid rgba(155,48,255,0.5)' }}
          >
            📹 Video Call
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleStartCall('audio')}
            disabled={callPhase !== 'idle'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-display text-white text-sm sm:text-base font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FF2D8B, #9B30FF)', border: '1px solid rgba(255,45,139,0.5)' }}
          >
            📞 Audio Call
          </motion.button>
        </div>

        {!supabaseReady && (
          <div className="flex-shrink-0 text-center text-xs font-body rounded-lg px-3 py-2"
            style={{ background: 'rgba(155,48,255,0.2)', color: '#FF76C2', border: '1px solid rgba(155,48,255,0.3)' }}>
            ⚠️ Supabase not configured — add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env.local
          </div>
        )}

        {/* ── Message list ──────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl">
                💌
              </motion.div>
              <p className="text-white/50 font-body text-sm">Send Daddy a message or give him a call!</p>
            </div>
          )}
          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Composer ──────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex gap-2 items-center">
          {/* Voice record button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onPointerDown={handleStartRecording}
            onPointerUp={handleStopRecording}
            onPointerLeave={handleStopRecording}
            className="btn btn-circle btn-sm sm:btn-md flex-shrink-0"
            style={{
              background: isRecording ? '#FF2D8B' : 'rgba(155,48,255,0.3)',
              border: '1px solid rgba(155,48,255,0.5)',
              color: '#fff',
            }}
            aria-label={isRecording ? 'Recording… release to send' : 'Hold to record voice message'}
          >
            {isRecording ? (
              <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>🔴</motion.span>
            ) : '🎤'}
          </motion.button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Type a message to Dad… 💕"
            className="input flex-1 font-body text-sm sm:text-base text-white"
            style={{
              background: 'rgba(45,0,80,0.7)',
              border: '1px solid rgba(255,45,139,0.4)',
              color: '#fff',
            }}
            maxLength={300}
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleSendText}
            disabled={!input.trim()}
            className="btn btn-sm sm:btn-md font-display text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF2D8B, #9B30FF)', border: 'none' }}
          >
            💌
          </motion.button>
        </div>
      </div>

      {/* ── Overlays ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {incomingCall && callPhase === 'idle' && (
          <IncomingCallOverlay
            key="incoming"
            call={incomingCall}
            onAccept={handleAcceptIncoming}
            onDecline={handleDeclineIncoming}
          />
        )}
        {callPhase === 'ringing' && (
          <CallRingingOverlay key="ringing" type={callType} onCancel={handleCancelCall} />
        )}
        {callPhase === 'active' && (
          <ZegoCallOverlay key="active" callType={callType} onEnd={handleCallEnd} />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

