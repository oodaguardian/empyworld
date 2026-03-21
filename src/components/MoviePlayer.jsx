import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmbedUrl } from '../services/bunny';
import logo from '../emplogo.png';

export default function MoviePlayer({ movie, onClose }) {
  if (!movie) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="movie-player"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: '#0a0614' }}
      >
        {/* ── Pink/Blue top accent bar ─────────────────────────── */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#4A90D9] via-[#9B5DE5] to-[#FF69B4]" />

        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0d0b2a 0%, #1a0d2e 100%)', borderBottom: '1px solid rgba(74,144,217,0.25)' }}
        >
          {/* Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full blur-md opacity-60"
                style={{ background: 'linear-gradient(135deg, #4A90D9, #FF69B4)' }} />
              <img
                src={logo}
                alt="Empy TV"
                className="relative h-9 w-9 rounded-full object-cover border-2"
                style={{ borderColor: '#FF69B4' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-display tracking-widest uppercase"
                style={{ color: '#4A90D9' }}>
                Empy TV Movies
              </p>
              <h2 className="text-white font-display text-sm sm:text-lg leading-tight truncate max-w-[60vw]">
                {movie.title}
              </h2>
            </div>
          </div>

          {/* Close */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-white text-lg font-bold transition-all"
            style={{
              background: 'rgba(255,105,180,0.15)',
              border: '1px solid rgba(255,105,180,0.4)',
            }}
          >
            ✕
          </motion.button>
        </div>

        {/* ── Player area ──────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          {/* Corner accent lines */}
          <div className="absolute top-0 left-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to right, #4A90D9, transparent)' }} />
          <div className="absolute top-0 right-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to left, #FF69B4, transparent)' }} />
          <div className="absolute bottom-0 left-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to right, #4A90D9, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-40 h-0.5 z-10"
            style={{ background: 'linear-gradient(to left, #FF69B4, transparent)' }} />

          <iframe
            src={getEmbedUrl(movie.bunnyId)}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            title={movie.title}
          />
        </div>

        {/* ── Pink/Blue bottom accent bar ─────────────────────── */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#FF69B4] via-[#9B5DE5] to-[#4A90D9]" />
      </motion.div>
    </AnimatePresence>
  );
}
