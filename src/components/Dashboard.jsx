import React, { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import VideoCenter from './VideoCenter';
import useGesture from '../hooks/useGesture';

const CARDS = [
  { id: 'learning-games', label: 'Learning Games', icon: '🎓', path: '/learning-games', color: 'from-pink-500 to-purple-600' },
  { id: 'games', label: 'Games', icon: '🎮', path: '/games', color: 'from-green-400 to-cyan-500' },
  { id: 'movies', label: 'Movies', icon: '🎬', path: '/movies', color: 'from-red-500 to-orange-500' },
  { id: 'messages', label: 'Messages to Dad', icon: '💌', path: '/messages-to-dad', color: 'from-yellow-400 to-amber-500' },
  { id: 'reading', label: 'Reading Center', icon: '📚', path: '/reading-center', color: 'from-blue-400 to-indigo-500' },
  { id: 'music', label: 'Music', icon: '🎵', path: '/music', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'blank', label: 'Settings', icon: '⚙️', path: '/settings', color: 'from-gray-500 to-slate-600' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 15 } },
};

function NavCard({ card, onNavigate }) {
  const ref = useRef(null);

  const handleAction = useCallback(() => {
    onNavigate(card.path);
  }, [card.path, onNavigate]);

  useGesture(ref, {
    onTap: handleAction,
    onLongPress: handleAction,
  });

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAction}
      className="empy-card p-2 sm:p-3 w-full h-full select-none"
      role="button"
      tabIndex={0}
      aria-label={card.label}
      onKeyDown={(e) => e.key === 'Enter' && handleAction()}
    >
      <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl bg-gradient-to-br ${card.color} rounded-xl w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center shadow-lg`}>
        {card.icon}
      </div>
      <span className="text-white font-body font-bold text-[10px] sm:text-xs md:text-sm lg:text-base text-center leading-tight mt-1">
        {card.label}
      </span>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (path) => navigate(path),
    [navigate]
  );

  /* Layout: 
     MOBILE (portrait)  -> Header, 2x2 top cards, carousel, 2x2 bottom cards + 1 bottom row
     TABLET/DESKTOP     -> Header row, then grid: left col (cards), center (carousel), right col (cards)
     TV / wide          -> same but larger
  */

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col overflow-hidden"
    >
      {/* ===== HEADER ===== */}
      <header className="flex-shrink-0 flex items-center justify-center py-1.5 sm:py-2 md:py-3 px-2">
        <h1 className="glitter-text font-display text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl tracking-[0.25em] sm:tracking-[0.3em] text-center whitespace-nowrap">
          E M P Y &apos;s &nbsp; W O R L D
        </h1>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      {/* Mobile / Small Screens: Vertical flow */}
      <div className="flex-1 min-h-0 md:hidden flex flex-col gap-1 px-2 pb-1">
        {/* Top row of cards: 4 cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-shrink-0 grid grid-cols-4 gap-1.5"
          style={{ height: '14%' }}
        >
          {CARDS.slice(0, 4).map((card) => (
            <NavCard key={card.id} card={card} onNavigate={handleNavigate} />
          ))}
        </motion.div>

        {/* Video Center - center */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-purple-500/20" style={{ background: 'rgba(13,10,30,0.6)' }}>
          <VideoCenter />
        </div>

        {/* Bottom row of cards: 3 cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-shrink-0 grid grid-cols-3 gap-1.5"
          style={{ height: '14%' }}
        >
          {CARDS.slice(4).map((card) => (
            <NavCard key={card.id} card={card} onNavigate={handleNavigate} />
          ))}
        </motion.div>
      </div>

      {/* Tablet / Desktop / TV: 3-column grid */}
      <div className="flex-1 min-h-0 hidden md:grid grid-cols-[1fr_2.5fr_1fr] gap-3 px-3 lg:px-6 pb-3">
        {/* Left column: cards stacked */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2 lg:gap-3"
        >
          {CARDS.slice(0, 3).map((card) => (
            <NavCard key={card.id} card={card} onNavigate={handleNavigate} />
          ))}
        </motion.div>

        {/* Center: Video Center */}
        <div className="min-h-0 rounded-2xl overflow-hidden border border-purple-500/20" style={{ background: 'rgba(13,10,30,0.6)' }}>
          <VideoCenter />
        </div>

        {/* Right column: remaining cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2 lg:gap-3"
        >
          {CARDS.slice(3).map((card) => (
            <NavCard key={card.id} card={card} onNavigate={handleNavigate} />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
