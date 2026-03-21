import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import Dashboard from './components/Dashboard';
import LearningGames from './pages/LearningGames';
import Games from './pages/Games';
import Movies from './pages/Movies';
import MovieUpload from './pages/MovieUpload';
import MessagesToDad from './pages/MessagesToDad';
import ReadingCenter from './pages/ReadingCenter';
import Music from './pages/Music';
import Blank from './pages/Blank';
import Settings from './pages/Settings';

// Learning games
import ABCGame from './games/ABCGame';
import NumberGame from './games/NumberGame';
import ColorsGame from './games/ColorsGame';
import ShapesGame from './games/ShapesGame';
import AnimalsGame from './games/AnimalsGame';

// Fun games
import MemoryMatch from './games/MemoryMatch';
import BubblePop from './games/BubblePop';
import ColoringBook from './games/ColoringBook';
import RacingGame from './games/RacingGame';
import DressUp from './games/DressUp';
import PuzzleGame from './games/PuzzleGame';

// Reading
import BookReader from './games/BookReader';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // mvx.empy.my always shows the upload portal
  useEffect(() => {
    if (window.location.hostname === 'mvx.empy.my' && location.pathname === '/') {
      navigate('/movies/upload', { replace: true });
    }
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/learning-games" element={<LearningGames />} />
        <Route path="/games" element={<Games />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/upload" element={<MovieUpload />} />
        <Route path="/messages-to-dad" element={<MessagesToDad />} />
        <Route path="/reading-center" element={<ReadingCenter />} />
        <Route path="/music" element={<Music />} />
        <Route path="/blank" element={<Blank />} />
        <Route path="/settings" element={<Settings />} />

        {/* Learning games */}
        <Route path="/learning/abc" element={<ABCGame />} />
        <Route path="/learning/numbers" element={<NumberGame />} />
        <Route path="/learning/colors" element={<ColorsGame />} />
        <Route path="/learning/shapes" element={<ShapesGame />} />
        <Route path="/learning/animals" element={<AnimalsGame />} />
        <Route path="/learning/puzzle" element={<PuzzleGame />} />

        {/* Fun games */}
        <Route path="/games/coloring" element={<ColoringBook />} />
        <Route path="/games/memory" element={<MemoryMatch />} />
        <Route path="/games/bubble-pop" element={<BubblePop />} />
        <Route path="/games/racing" element={<RacingGame />} />
        <Route path="/games/dress-up" element={<DressUp />} />
        <Route path="/games/puzzle" element={<PuzzleGame />} />

        {/* Reading */}
        <Route path="/reading/books" element={<BookReader />} />
      </Routes>
    </AnimatePresence>
  );
}
