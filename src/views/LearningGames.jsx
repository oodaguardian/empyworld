import React from 'react';
import { useNavigate } from '../navigation';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { playClick } from '../services/sounds';

const LEARNING_ITEMS = [
  { id: 'abc', title: 'ABCs', icon: '🔤', desc: 'Learn your letters!', path: '/learning/abc', color: 'from-pink-400 to-rose-500' },
  { id: 'numbers', title: '123s', icon: '🔢', desc: 'Count with fun!', path: '/learning/numbers', color: 'from-blue-400 to-cyan-500' },
  { id: 'colors', title: 'Colors', icon: '🌈', desc: 'Explore colors!', path: '/learning/colors', color: 'from-yellow-400 to-orange-500' },
  { id: 'shapes', title: 'Shapes', icon: '🔷', desc: 'Find the shapes!', path: '/learning/shapes', color: 'from-purple-400 to-indigo-500' },
  { id: 'animals', title: 'Animals', icon: '🦁', desc: 'Animal sounds!', path: '/learning/animals', color: 'from-green-400 to-emerald-500' },
  { id: 'puzzles', title: 'Puzzles', icon: '🧩', desc: 'Solve puzzles!', path: '/learning/puzzle', color: 'from-fuchsia-400 to-pink-500' },
];

export default function LearningGames() {
  const navigate = useNavigate();

  return (
    <PageLayout title="Learning Games" icon="🎓">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 h-full auto-rows-fr">
        {LEARNING_ITEMS.map((item, i) => (
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
    </PageLayout>
  );
}
