import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useTTS from '../hooks/useTTS';
import useScore from '../hooks/useScore';
import { playCorrect, playWrong, playClick } from '../services/sounds';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const WORDS = {
  A: 'Apple 🍎', B: 'Bear 🐻', C: 'Cat 🐱', D: 'Dog 🐶', E: 'Elephant 🐘',
  F: 'Fish 🐟', G: 'Giraffe 🦒', H: 'Hat 🎩', I: 'Ice cream 🍦', J: 'Jellyfish 🪼',
  K: 'Kite 🪁', L: 'Lion 🦁', M: 'Moon 🌙', N: 'Nest 🪺', O: 'Octopus 🐙',
  P: 'Penguin 🐧', Q: 'Queen 👑', R: 'Rainbow 🌈', S: 'Star ⭐', T: 'Tiger 🐯',
  U: 'Umbrella ☂️', V: 'Violin 🎻', W: 'Whale 🐋', X: 'Xylophone 🎵', Y: 'Yarn 🧶',
  Z: 'Zebra 🦓',
};

const MODES = { LEARN: 'learn', QUIZ: 'quiz' };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ABCGame() {
  const [mode, setMode] = useState(MODES.LEARN);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizCorrect, setQuizCorrect] = useState(null);
  const [quizTarget, setQuizTarget] = useState('');
  const [score, setScore] = useState(0);
  const [quizRound, setQuizRound] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selected, setSelected] = useState(null);
  const { speak } = useTTS();
  const { recordScore } = useScore('abc');

  const letter = ALPHABET[currentIndex];

  const speakLetter = useCallback((l) => {
    const word = WORDS[l];
    speak(`${l} is for ${word.replace(/[^\w\s]/g, '').trim()}`);
  }, [speak]);

  const nextLetter = () => {
    playClick();
    if (currentIndex < 25) {
      setCurrentIndex(i => i + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevLetter = () => {
    playClick();
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const startQuiz = () => {
    setMode(MODES.QUIZ);
    setScore(0);
    setQuizRound(0);
    generateQuizQ(0);
  };

  const generateQuizQ = (round) => {
    const target = ALPHABET[Math.floor(Math.random() * 26)];
    const wrong = shuffle(ALPHABET.filter(l => l !== target)).slice(0, 3);
    setQuizTarget(target);
    setQuizAnswers(shuffle([target, ...wrong]));
    setQuizCorrect(null);
    setSelected(null);
    setTimeout(() => {
      speak(`Find the letter ${target}`);
    }, 300);
  };

  const handleQuizAnswer = (answer) => {
    if (quizCorrect !== null) return;
    setSelected(answer);
    if (answer === quizTarget) {
      playCorrect();
      setQuizCorrect(true);
      setScore(s => s + 1);
      setTimeout(() => {
        if (quizRound >= 9) {
          recordScore(score + 1, score + 1 >= 8 ? 3 : score + 1 >= 5 ? 2 : 1);
          setShowCelebration(true);
        } else {
          setQuizRound(r => r + 1);
          generateQuizQ(quizRound + 1);
        }
      }, 1000);
    } else {
      playWrong();
      setQuizCorrect(false);
      setTimeout(() => {
        setQuizCorrect(null);
        setSelected(null);
      }, 800);
    }
  };

  return (
    <GameShell title="ABC Learning" icon="🔤" gameType="abc" backTo="/learning-games" instructions="Learn your letters!">
      <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode(MODES.LEARN)}
            className={`btn btn-sm font-display ${mode === MODES.LEARN ? 'bg-empy-pink text-white border-empy-pink' : 'btn-ghost text-white/60'}`}
          >
            📖 Learn
          </button>
          <button
            onClick={startQuiz}
            className={`btn btn-sm font-display ${mode === MODES.QUIZ ? 'bg-empy-blue text-white border-empy-blue' : 'btn-ghost text-white/60'}`}
          >
            🧠 Quiz
          </button>
        </div>

        {mode === MODES.LEARN ? (
          <div className="flex flex-col items-center gap-4">
            {/* Big Letter Display */}
            <motion.div
              key={letter}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="relative"
            >
              <div className="text-[120px] sm:text-[160px] md:text-[200px] font-display leading-none text-center">
                <span className="glitter-text">{letter}</span>
                <span className="text-empy-pink/60 ml-2 sm:ml-4">{letter.toLowerCase()}</span>
              </div>
            </motion.div>

            {/* Word */}
            <motion.p
              key={`word-${letter}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-display text-white text-center"
            >
              {letter} is for {WORDS[letter]}
            </motion.p>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevLetter}
                disabled={currentIndex === 0}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30"
              >
                ◀
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => speakLetter(letter)}
                className="btn btn-lg btn-wide bg-empy-yellow/30 border-empy-yellow/50 text-white font-display gap-2"
              >
                🔊 Hear It
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextLetter}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl"
              >
                ▶
              </motion.button>
            </div>

            {/* Letter strip */}
            <div className="flex flex-wrap justify-center gap-1 max-w-md">
              {ALPHABET.map((l, i) => (
                <motion.button
                  key={l}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setCurrentIndex(i); playClick(); }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-display text-sm flex items-center justify-center transition-colors ${
                    i === currentIndex
                      ? 'bg-empy-pink text-white shadow-lg shadow-empy-pink/40'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {l}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          /* Quiz Mode */
          <div className="flex flex-col items-center gap-6">
            <div className="text-white/60 font-display text-sm">
              Round {quizRound + 1} / 10 &nbsp;·&nbsp; Score: {score}
            </div>

            <motion.p
              key={`q-${quizRound}-${quizTarget}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl font-display text-white text-center"
            >
              Tap the letter <span className="text-empy-yellow text-3xl">{quizTarget}</span>
            </motion.p>

            <div className="grid grid-cols-2 gap-4">
              {quizAnswers.map((a) => (
                <motion.button
                  key={a}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuizAnswer(a)}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl text-4xl sm:text-5xl font-display transition-all border-2 ${
                    selected === a
                      ? quizCorrect === true
                        ? 'bg-green-500/40 border-green-400 text-green-200'
                        : quizCorrect === false
                        ? 'bg-red-500/40 border-red-400 text-red-200 animate-pulse'
                        : 'bg-empy-pink/30 border-empy-pink/50 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  {a}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => speak(`Find the letter ${quizTarget}`)}
              className="btn btn-sm bg-empy-yellow/20 border-empy-yellow/40 text-empy-yellow"
            >
              🔊 Hear again
            </motion.button>
          </div>
        )}
      </div>

      <Celebration
        show={showCelebration}
        onDone={() => { setShowCelebration(false); setMode(MODES.LEARN); }}
        message={`Amazing! ${score}/10! 🔤`}
        stars={score >= 8 ? 3 : score >= 5 ? 2 : 1}
      />
    </GameShell>
  );
}
