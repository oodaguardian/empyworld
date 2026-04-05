import React from 'react';
import { useNavigate } from '../navigation';
import { motion } from 'framer-motion';
import { GAME_POKI_MAP } from '../constants/deeplinks';

export default function GameShell({ title, icon, gameType, backTo = '/', children, instructions }) {
  const navigate = useNavigate();
  const pokiLink = GAME_POKI_MAP[gameType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="w-full h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-empy-yellow/20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(backTo)}
          className="btn btn-circle btn-sm bg-empy-pink/20 border-empy-pink/40 text-white hover:bg-empy-pink/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </motion.button>

        <span className="text-xl">{icon}</span>
        <h1 className="glitter-text font-display text-base sm:text-lg flex-1 truncate">{title}</h1>

        {instructions && (
          <span className="text-xs sm:text-sm text-white/60 hidden sm:block">{instructions}</span>
        )}

        {pokiLink && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={pokiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xs sm:btn-sm bg-empy-yellow/20 border-empy-yellow/40 text-empy-yellow hover:bg-empy-yellow/40 gap-1"
          >
            🎮 <span className="hidden sm:inline">More Games</span>
          </motion.a>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="btn btn-circle btn-sm bg-empy-yellow/20 border-empy-yellow/40 text-white hover:bg-empy-yellow/40"
        >
          🏠
        </motion.button>
      </header>

      {/* Game area */}
      <main className="flex-1 min-h-0 overflow-auto">
        {children}
      </main>
    </motion.div>
  );
}
