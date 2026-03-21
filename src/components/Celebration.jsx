import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playWin } from '../services/sounds';

const EMOJIS = ['🎉', '⭐', '🌟', '🎊', '✨', '💖', '🦄', '🌈', '🎀', '🏆', '💫', '🎶'];

function Particle({ emoji, delay }) {
  const x = Math.random() * 100;
  const size = 20 + Math.random() * 24;
  return (
    <motion.div
      initial={{ y: '110vh', x: `${x}vw`, opacity: 1, rotate: 0, scale: 0 }}
      animate={{
        y: '-10vh',
        rotate: 360 + Math.random() * 360,
        scale: [0, 1.2, 1],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 2 + Math.random(), delay, ease: 'easeOut' }}
      className="fixed pointer-events-none z-50"
      style={{ fontSize: size }}
    >
      {emoji}
    </motion.div>
  );
}

export default function Celebration({ show, onDone, message = 'Amazing! 🎉', stars = 3 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      playWin();
      const p = [];
      for (let i = 0; i < 30; i++) {
        p.push({
          id: i,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          delay: Math.random() * 0.5,
        });
      }
      setParticles(p);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {particles.map(p => (
            <Particle key={p.id} emoji={p.emoji} delay={p.delay} />
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onDone}
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-empy-pink/90 to-empy-blue/90 rounded-3xl p-8 mx-4 text-center shadow-2xl border-2 border-empy-yellow/50 max-w-sm"
            >
              <div className="text-5xl mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 400 }}
                    className="inline-block"
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
              <h2 className="glitter-text font-display text-2xl sm:text-3xl mb-3">{message}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDone}
                className="btn bg-empy-yellow text-black font-display text-lg px-8 border-none hover:bg-empy-yellow/80"
              >
                Continue ▶
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
