import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
const empxvcLogo = '/empxvc.png';
import { playStartupJingle } from '../services/sounds';

// Floating decorative particles
const PARTICLES = ['🌸', '💖', '✨', '🦋', '⭐', '💫', '🌺', '💕', '🎀', '🌟'];

function Star({ style }) {
  return <div className="star" style={style} />;
}

function FloatingParticle({ emoji, style }) {
  return (
    <motion.div
      className="absolute text-lg pointer-events-none select-none"
      style={style}
      animate={{
        y: [0, -25, 0],
        rotate: [0, 15, -15, 0],
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: style.duration,
        repeat: Infinity,
        delay: style.delay,
        ease: 'easeInOut',
      }}
    >
      {emoji}
    </motion.div>
  );
}

export default function SplashScreen() {
  const stars = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      key: i,
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        width: `${2 + Math.random() * 5}px`,
        height: `${2 + Math.random() * 5}px`,
        background: Math.random() > 0.5 ? '#FF76C2' : '#9B30FF',
      },
    })),
    []
  );

  const particles = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      key: i,
      emoji: PARTICLES[i % PARTICLES.length],
      style: {
        top: `${5 + Math.random() * 90}%`,
        left: `${5 + Math.random() * 90}%`,
        duration: 2.5 + Math.random() * 3,
        delay: Math.random() * 3,
        fontSize: `${1 + Math.random() * 1.2}rem`,
      },
    })),
    []
  );

  useEffect(() => {
    // Short delay so AudioContext can be created after first user interaction context
    const t = setTimeout(() => playStartupJingle(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative flex items-center justify-center w-full h-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #160020 0%, #2D0050 35%, #200040 60%, #0D1A6E 100%)' }}
    >
      {/* Background stars */}
      {stars.map((s) => (
        <Star key={s.key} style={s.style} />
      ))}

      {/* Floating emoji particles */}
      {particles.map((p) => (
        <FloatingParticle key={p.key} emoji={p.emoji} style={p.style} />
      ))}

      {/* Radial glow behind logo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(155,48,255,0.25) 0%, rgba(255,45,139,0.15) 40%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <motion.div
        className="flex flex-col items-center gap-4 relative z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12, duration: 0.8 }}
      >
        {/* Logo image - bouncing */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <img
            src={empxvcLogo}
            alt="Empy's World Logo"
            className="logo-shimmer"
            style={{ height: 'clamp(80px, 18vw, 160px)', width: 'auto', objectFit: 'contain' }}
          />
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            style={{ background: 'radial-gradient(circle, rgba(255,45,139,0.4) 0%, transparent 70%)' }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="glitter-text font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.3em] text-center"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          E M P Y &apos;s
        </motion.h1>

        <motion.h2
          className="glitter-text font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.4em] text-center"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          W O R L D
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="font-body text-sm sm:text-base md:text-lg mt-2 tracking-widest text-center"
          style={{ color: '#FF76C2' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ delay: 1.5, duration: 1.5 }}
        >
          🌸 Loading your magic world... 🌸
        </motion.p>

        {/* Loading bar */}
        <motion.div
          className="w-48 sm:w-64 h-3 rounded-full overflow-hidden mt-4"
          style={{ background: 'rgba(155,48,255,0.2)', border: '1px solid rgba(255,45,139,0.3)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #FF2D8B, #9B30FF, #3B82F6, #FF76C2)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s linear infinite',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3.5, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Sparkle dots */}
        <motion.div
          className="flex gap-2 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {['💖', '✨', '💜', '✨', '💙'].map((e, i) => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              style={{ fontSize: '1.1rem' }}
            >
              {e}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
