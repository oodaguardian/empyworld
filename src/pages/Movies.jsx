import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import MoviePlayer from '../components/MoviePlayer';
import { fetchMovies, isBunnyConfigured } from '../services/bunny';
import { useNavigate } from 'react-router-dom';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const loadMovies = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const list = await fetchMovies();
      setMovies(list);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();

    const interval = setInterval(() => {
      loadMovies({ silent: true });
    }, 15000);

    const onVisible = () => {
      if (!document.hidden) {
        loadMovies({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadMovies]);

  return (
    <>
      <PageLayout title="Movies" icon="🎬">
        {/* Upload shortcut */}
        <div className="flex justify-end mb-3 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => loadMovies()}
            className="btn btn-sm font-display gap-1 mr-2"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
            }}
          >
            ⟳ Refresh
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/movies/upload')}
            className="btn btn-sm font-display gap-1"
            style={{
              background: 'linear-gradient(135deg, #4A90D9, #FF69B4)',
              border: 'none',
              color: 'white',
            }}
          >
            ➕ Upload Movie
          </motion.button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-empy-pink border-t-transparent animate-spin" />
              <p className="text-white/60 font-display">Loading movies…</p>
            </div>
          </div>
        )}

        {!loading && movies.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-white font-display text-xl mb-1">No movies yet!</p>
              <p className="text-white/50 font-body text-sm mb-4">Upload movies from the portal to watch here.</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/movies/upload')}
                className="btn font-display"
                style={{ background: 'linear-gradient(135deg, #4A90D9, #FF69B4)', border: 'none', color: 'white' }}
              >
                Go to Upload Portal
              </motion.button>
            </div>
          </div>
        )}

        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-auto pb-2">
            {movies.map((movie, i) => (
              <motion.button
                key={movie.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 220 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(movie)}
                className="relative rounded-2xl overflow-hidden border-2 border-white/10 hover:border-empy-pink/60 transition-all text-left group"
                style={{ aspectRatio: '16/10', background: '#1a1040' }}
              >
                {/* Movie icon placeholder */}
                <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
                  🎬
                </div>

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(10,6,20,0.55)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg, #4A90D9, #FF69B4)' }}>
                    ▶
                  </div>
                </div>

                {/* Title bar */}
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                  style={{ background: 'linear-gradient(to top, rgba(10,6,20,0.95), transparent)' }}>
                  <p className="text-white font-display text-xs sm:text-sm truncate">{movie.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </PageLayout>

      {/* Full-screen player */}
      <AnimatePresence>
        {selected && (
          <MoviePlayer movie={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
