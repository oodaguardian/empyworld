import React from 'react';
import { useNavigate } from '../navigation';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { playClick } from '../services/sounds';
import { DEEPLINKS } from '../constants/deeplinks';

const GAME_ITEMS = [
  { id: 'coloring', title: 'Coloring Book', icon: '🎨', desc: 'Color fun pictures!', path: '/games/coloring', color: 'from-pink-400 to-rose-500' },
  { id: 'memory', title: 'Memory Match', icon: '🃏', desc: 'Find the pairs!', path: '/games/memory', color: 'from-purple-400 to-indigo-500' },
  { id: 'bubble', title: 'Bubble Pop', icon: '🫧', desc: 'Pop all bubbles!', path: '/games/bubble-pop', color: 'from-cyan-400 to-blue-500' },
  { id: 'racing', title: 'Racing', icon: '🏎️', desc: 'Zoom zoom!', path: '/games/racing', color: 'from-red-400 to-orange-500' },
  { id: 'dressup', title: 'Dress Up', icon: '👗', desc: 'Fashion time!', path: '/games/dress-up', color: 'from-fuchsia-400 to-pink-500' },
  { id: 'puzzle', title: 'Puzzle', icon: '🧩', desc: 'Solve puzzles!', path: '/games/puzzle', color: 'from-green-400 to-emerald-500' },
];

export default function Games() {
  const navigate = useNavigate();

  return (
    <PageLayout title="Games" icon="🎮">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 h-full auto-rows-fr">
        {GAME_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClick(); navigate(item.path); }}
            className="empy-card p-3 sm:p-4 cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20`} />
            <span className="text-3xl sm:text-4xl md:text-5xl relative z-10">{item.icon}</span>
            <h3 className="text-white font-display text-sm sm:text-base md:text-lg relative z-10">{item.title}</h3>
            <p className="text-white/60 font-body text-xs sm:text-sm relative z-10">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Poki link */}
      <div className="mt-4 text-center">
        <a href={DEEPLINKS.poki_kids} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 font-display text-sm hover:bg-white/20 transition-colors">
          🎮 More Games on Poki →
        </a>
      </div>
    </PageLayout>
  );
}
