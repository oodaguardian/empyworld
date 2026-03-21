import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { playClick } from '../services/sounds';

const BOOKS = [
  { id: 'reader', title: 'Story Time', icon: '📖', desc: 'Read-along stories!', path: '/reading/books', color: 'from-amber-400 to-orange-500' },
  { id: 'peter', title: 'Peter Rabbit', icon: '🐰', desc: 'A classic tale!', path: '/reading/books', color: 'from-green-400 to-emerald-500' },
  { id: 'tortoise', title: 'Tortoise & Hare', icon: '🐢', desc: 'Slow and steady!', path: '/reading/books', color: 'from-yellow-400 to-lime-500' },
  { id: 'goldilocks', title: 'Goldilocks', icon: '🐻', desc: 'Just right!', path: '/reading/books', color: 'from-pink-400 to-rose-500' },
  { id: 'pigs', title: 'Three Little Pigs', icon: '🐷', desc: 'Huff and puff!', path: '/reading/books', color: 'from-red-400 to-pink-500' },
  { id: 'duckling', title: 'Ugly Duckling', icon: '🦆', desc: 'A beautiful swan!', path: '/reading/books', color: 'from-blue-400 to-cyan-500' },
];

export default function ReadingCenter() {
  const navigate = useNavigate();

  return (
    <PageLayout title="Reading Center" icon="📚">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 h-full auto-rows-fr">
        {BOOKS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
