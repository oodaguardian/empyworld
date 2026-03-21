import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function Star({ style }) {
  return <div className="star" style={style} />;
}

export default function SplashScreen() {
  const stars = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      key: i,
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        width: `${2 + Math.random() * 4}px`,
        height: `${2 + Math.random() * 4}px`,
      },
    })),
    []
  );

  return (
    <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-empy-black via-empy-blue-dark to-empy-black overflow-hidden">
      {/* Background stars */}
      {stars.map((s) => (
        <Star key={s.key} style={s.style} />
      ))}

      {/* Bouncing Logo */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 12,
          duration: 0.8,
        }}
      >
        {/* Bouncing TV icon */}
        <motion.div
          animate={{ y: [0, -30, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
          }}
          className="text-7xl sm:text-8xl md:text-9xl"
        >
          📺
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
          className="text-empy-yellow font-body text-sm sm:text-base md:text-lg mt-2 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1] }}
          transition={{ delay: 1.5, duration: 1.5 }}
        >
          ✨ Loading your adventure... ✨
        </motion.p>

        {/* Loading bar */}
        <motion.div
          className="w-48 sm:w-64 h-2 rounded-full bg-empy-black border border-empy-yellow/30 mt-4 overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #FF69B4, #FFD700, #4A90D9)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3.5, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
