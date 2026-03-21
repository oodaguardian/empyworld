import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useTTS from '../hooks/useTTS';
import useScore from '../hooks/useScore';
import { playCorrect, playWrong, playClick } from '../services/sounds';

const COLORS = [
  { name: 'Red', hex: '#EF4444', emoji: '🔴' },
  { name: 'Blue', hex: '#3B82F6', emoji: '🔵' },
  { name: 'Yellow', hex: '#EAB308', emoji: '🟡' },
  { name: 'Green', hex: '#22C55E', emoji: '🟢' },
  { name: 'Orange', hex: '#F97316', emoji: '🟠' },
  { name: 'Purple', hex: '#A855F7', emoji: '🟣' },
  { name: 'Pink', hex: '#EC4899', emoji: '💖' },
  { name: 'White', hex: '#F8FAFC', emoji: '⚪' },
  { name: 'Black', hex: '#1E293B', emoji: '⚫' },
  { name: 'Brown', hex: '#92400E', emoji: '🟤' },
  { name: 'Gray', hex: '#6B7280', emoji: '🩶' },
  { name: 'Turquoise', hex: '#06B6D4', emoji: '💎' },
];

const MIXES = [
  { a: 'Red', b: 'Blue', result: 'Purple' },
  { a: 'Red', b: 'Yellow', result: 'Orange' },
  { a: 'Blue', b: 'Yellow', result: 'Green' },
  { a: 'Red', b: 'White', result: 'Pink' },
  { a: 'Black', b: 'White', result: 'Gray' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MODES = { LEARN: 'learn', QUIZ: 'quiz', MIX: 'mix' };

const SHAPES = ['●', '■', '▲', '★', '♥', '◆'];

export default function ColorsGame() {
  const [mode, setMode] = useState(MODES.LEARN);
  const [colorIdx, setColorIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [quizTarget, setQuizTarget] = useState(null);
  const [quizChoices, setQuizChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mixIdx, setMixIdx] = useState(0);
  const [mixRevealed, setMixRevealed] = useState(false);
  const { speak } = useTTS();
  const { recordScore } = useScore('colors');

  const color = COLORS[colorIdx];

  const speakColor = (c) => {
    speak(`${c.name}`, { rate: 0.7 });
  };

  // Quiz
  const startQuiz = () => {
    setMode(MODES.QUIZ);
    setScore(0);
    setRound(0);
    genQuiz(0);
  };

  const genQuiz = () => {
    const target = COLORS[Math.floor(Math.random() * COLORS.length)];
    const wrong = shuffle(COLORS.filter(c => c.name !== target.name)).slice(0, 3);
    const choices = shuffle([target, ...wrong]);
    setQuizTarget(target);
    setQuizChoices(choices);
    setSelected(null);
    setIsCorrect(null);
    setTimeout(() => speak(`Find ${target.name}`), 200);
  };

  const handleQuizAnswer = (c) => {
    if (isCorrect !== null) return;
    setSelected(c.name);
    if (c.name === quizTarget.name) {
      playCorrect();
      setIsCorrect(true);
      setScore(s => s + 1);
      setTimeout(() => {
        if (round >= 9) {
          recordScore(score + 1, score + 1 >= 8 ? 3 : score + 1 >= 5 ? 2 : 1);
          setShowCelebration(true);
        } else {
          setRound(r => r + 1);
          genQuiz();
        }
      }, 1000);
    } else {
      playWrong();
      setIsCorrect(false);
      setTimeout(() => { setIsCorrect(null); setSelected(null); }, 600);
    }
  };

  // Mix
  const mix = MIXES[mixIdx];
  const mixA = COLORS.find(c => c.name === mix.a);
  const mixB = COLORS.find(c => c.name === mix.b);
  const mixResult = COLORS.find(c => c.name === mix.result);

  return (
    <GameShell title="Colors!" icon="🎨" gameType="colors" backTo="/learning-games" instructions="Learn your colors!">
      <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
        <div className="flex gap-2">
          <button onClick={() => setMode(MODES.LEARN)}
            className={`btn btn-sm font-display ${mode === MODES.LEARN ? 'bg-empy-pink text-white border-empy-pink' : 'btn-ghost text-white/60'}`}>
            📖 Learn
          </button>
          <button onClick={startQuiz}
            className={`btn btn-sm font-display ${mode === MODES.QUIZ ? 'bg-empy-blue text-white border-empy-blue' : 'btn-ghost text-white/60'}`}>
            🧠 Quiz
          </button>
          <button onClick={() => { setMode(MODES.MIX); setMixIdx(0); setMixRevealed(false); }}
            className={`btn btn-sm font-display ${mode === MODES.MIX ? 'bg-empy-yellow text-black border-empy-yellow' : 'btn-ghost text-white/60'}`}>
            🧪 Mix
          </button>
        </div>

        {mode === MODES.LEARN && (
          <div className="flex flex-col items-center gap-4">
            <motion.div key={colorIdx} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-3xl border-4 border-white/30 shadow-2xl flex items-center justify-center text-7xl"
                style={{ backgroundColor: color.hex }}>
                {SHAPES[colorIdx % SHAPES.length]}
              </div>
            </motion.div>

            <motion.p key={`name-${colorIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-display text-white">{color.emoji} {color.name}</motion.p>

            <div className="flex items-center gap-4">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setColorIdx(i => Math.max(0, i - 1)); playClick(); }}
                disabled={colorIdx === 0} className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">◀</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => speakColor(color)}
                className="btn btn-lg bg-empy-yellow/30 border-empy-yellow/50 text-white font-display">🔊 Hear It</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setColorIdx(i => Math.min(COLORS.length - 1, i + 1)); playClick(); }}
                disabled={colorIdx === COLORS.length - 1} className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">▶</motion.button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {COLORS.map((c, i) => (
                <motion.button key={c.name} whileTap={{ scale: 0.9 }} onClick={() => { setColorIdx(i); playClick(); }}
                  className={`w-10 h-10 rounded-full border-3 transition-all ${i === colorIdx ? 'border-white scale-125 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>
        )}

        {mode === MODES.QUIZ && quizTarget && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-white/60 font-display text-sm">Round {round + 1}/10 · Score: {score}</p>
            <p className="text-xl font-display text-white">
              Tap the <span className="font-bold" style={{ color: quizTarget.hex }}>{quizTarget.name}</span> one!
            </p>
            <div className="grid grid-cols-2 gap-4">
              {quizChoices.map(c => (
                <motion.button key={c.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuizAnswer(c)}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 text-4xl flex items-center justify-center transition-all ${
                    selected === c.name
                      ? isCorrect === true ? 'border-green-400 ring-4 ring-green-400/50' : isCorrect === false ? 'border-red-400 ring-4 ring-red-400/50' : 'border-white'
                      : 'border-white/20 hover:border-white/50'
                  }`}
                  style={{ backgroundColor: c.hex }}>
                  {SHAPES[COLORS.indexOf(c) % SHAPES.length]}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {mode === MODES.MIX && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-lg font-display text-white">What happens when we mix...</p>
            <div className="flex items-center gap-4">
              <motion.div initial={{ x: -30 }} animate={{ x: 0 }} className="w-20 h-20 rounded-2xl border-2 border-white/30 flex items-center justify-center text-sm font-display text-white"
                style={{ backgroundColor: mixA.hex }}>{mixA.name}</motion.div>
              <span className="text-3xl text-empy-yellow font-display">+</span>
              <motion.div initial={{ x: 30 }} animate={{ x: 0 }} className="w-20 h-20 rounded-2xl border-2 border-white/30 flex items-center justify-center text-sm font-display text-white"
                style={{ backgroundColor: mixB.hex }}>{mixB.name}</motion.div>
              <span className="text-3xl text-white font-display">=</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: mixRevealed ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-20 h-20 rounded-2xl border-2 border-empy-yellow flex items-center justify-center text-sm font-display text-white"
                style={{ backgroundColor: mixResult.hex }}>
                {mixRevealed ? mixResult.name : '?'}
              </motion.div>
            </div>

            {!mixRevealed ? (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                setMixRevealed(true);
                playCorrect();
                speak(`${mixA.name} and ${mixB.name} make ${mixResult.name}`);
              }} className="btn btn-lg bg-empy-pink text-white border-empy-pink font-display">🧪 Mix them!</motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                setMixIdx(i => (i + 1) % MIXES.length);
                setMixRevealed(false);
                playClick();
              }} className="btn btn-lg bg-empy-blue text-white border-empy-blue font-display">Next mix ▶</motion.button>
            )}
          </div>
        )}
      </div>

      <Celebration
        show={showCelebration}
        onDone={() => { setShowCelebration(false); setMode(MODES.LEARN); }}
        message={`Colorful! ${score}/10! 🎨`}
        stars={score >= 8 ? 3 : score >= 5 ? 2 : 1}
      />
    </GameShell>
  );
}
