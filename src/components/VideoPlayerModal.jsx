import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoPlayerModal({ videoId, title, onClose }) {
  if (!videoId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-[820px] rounded-2xl overflow-hidden border-2 border-purple-500/60"
          style={{
            background: '#1A1535',
            boxShadow: '0 0 60px rgba(155,93,229,0.4)',
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: '#231D45' }}>
            <h3 className="font-display text-white text-sm sm:text-base md:text-lg flex-1 pr-3 truncate">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-empy-pink border border-empy-pink/50 bg-empy-pink/10 hover:bg-empy-pink/30 transition-colors text-sm sm:text-base flex-shrink-0"
              aria-label="Close player"
            >
              ✕
            </button>
          </div>

          {/* Player */}
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={title}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
