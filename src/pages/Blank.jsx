import React from 'react';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';

export default function Blank() {
  return (
    <PageLayout title="Coming Soon" icon="✨">
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl sm:text-7xl md:text-8xl"
        >
          🚀
        </motion.div>
        <h2 className="glitter-text font-display text-xl sm:text-2xl md:text-3xl text-center">
          Something Amazing is Coming!
        </h2>
        <p className="text-white/60 font-body text-sm sm:text-base md:text-lg text-center max-w-md">
          This space is reserved for something super special. Stay tuned!
        </p>
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {['⭐', '🌟', '💫', '✨', '🌈'].map((emoji, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ delay: i * 0.15, duration: 1.5, repeat: Infinity }}
              className="text-2xl sm:text-3xl"
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </PageLayout>
  );
}
