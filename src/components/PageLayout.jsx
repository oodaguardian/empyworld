import React from 'react';
import { useNavigate } from '../navigation';
import { motion } from 'framer-motion';
const empxvcLogo = '/empxvc.png';

export default function PageLayout({ title, icon, children, bgGradient }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={`w-full h-full flex flex-col overflow-hidden ${bgGradient || ''}`}
    >
      {/* Header bar */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3"
        style={{ borderBottom: '1px solid rgba(255,45,139,0.25)', background: 'rgba(45,0,80,0.4)', backdropFilter: 'blur(10px)' }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="btn btn-circle btn-sm sm:btn-md border text-white flex-shrink-0"
          style={{ background: 'rgba(255,45,139,0.2)', borderColor: 'rgba(255,45,139,0.5)' }}
          aria-label="Go back home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </motion.button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl sm:text-2xl md:text-3xl">{icon}</span>
          <h1 className="glitter-text font-display text-base sm:text-lg md:text-xl lg:text-2xl truncate">
            {title}
          </h1>
        </div>

        {/* Logo in center-right area */}
        <motion.img
          src={empxvcLogo}
          alt="Empy's World"
          className="logo-shimmer flex-shrink-0"
          style={{ height: 'clamp(22px, 4vw, 36px)', width: 'auto', objectFit: 'contain' }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="btn btn-circle btn-sm sm:btn-md border text-white flex-shrink-0"
          style={{ background: 'rgba(155,48,255,0.2)', borderColor: 'rgba(155,48,255,0.5)' }}
          aria-label="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </motion.button>
      </header>

      {/* Page content */}
      <main className="flex-1 min-h-0 overflow-auto p-3 sm:p-4 md:p-6">
        {children}
      </main>
    </motion.div>
  );
}
