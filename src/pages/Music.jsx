import React from 'react';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';

const PLAYLISTS = [
  { id: 1, title: 'Lullabies', icon: '🌙', desc: 'Sweet dreams' },
  { id: 2, title: 'Dance Party', icon: '💃', desc: 'Move & groove!' },
  { id: 3, title: 'Sing Along', icon: '🎤', desc: 'Karaoke time!' },
  { id: 4, title: 'Nursery Rhymes', icon: '🎶', desc: 'Classic songs' },
  { id: 5, title: 'Disney Hits', icon: '🏰', desc: 'Magical tunes' },
  { id: 6, title: 'Relaxing', icon: '🧘', desc: 'Calm & peace' },
];

export default function Music() {
  return (
    <PageLayout title="Music" icon="🎵">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 h-full auto-rows-fr">
        {PLAYLISTS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="empy-card p-3 sm:p-4 cursor-pointer"
          >
            <span className="text-3xl sm:text-4xl md:text-5xl">{item.icon}</span>
            <h3 className="text-white font-display text-sm sm:text-base md:text-lg">{item.title}</h3>
            <p className="text-white/60 font-body text-xs sm:text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
}
