import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useTTS from '../hooks/useTTS';
import useScore from '../hooks/useScore';
import { playCorrect, playWrong, playClick } from '../services/sounds';

const SHAPES = [
  { name: 'Circle', emoji: '⭕', svg: (s) => <circle cx="50" cy="50" r="45" fill={s} /> },
  { name: 'Square', emoji: '🟧', svg: (s) => <rect x="5" y="5" width="90" height="90" fill={s} /> },
  { name: 'Triangle', emoji: '🔺', svg: (s) => <polygon points="50,5 95,95 5,95" fill={s} /> },
  { name: 'Rectangle', emoji: '📦', svg: (s) => <rect x="5" y="20" width="90" height="60" fill={s} /> },
  { name: 'Star', emoji: '⭐', svg: (s) => <polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" fill={s} /> },
  { name: 'Heart', emoji: '❤️', svg: (s) => <path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C40 5 48 12 50 18 C52 12 60 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill={s} /> },
  { name: 'Diamond', emoji: '💎', svg: (s) => <polygon points="50,5 95,50 50,95 5,50" fill={s} /> },
  { name: 'Oval', emoji: '🥚', svg: (s) => <ellipse cx="50" cy="50" rx="45" ry="30" fill={s} /> },
];

const COLORS_HEX = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#EC4899', '#F97316', '#06B6D4'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MODES = { LEARN: 'learn', QUIZ: 'quiz', BUILD: 'build' };

// Simple "build a house" activity
const HOUSE_PARTS = [
  { shape: 'Square', label: 'Wall', color: '#EF4444', x: 30, y: 45, w: 40, h: 40 },
  { shape: 'Triangle', label: 'Roof', color: '#3B82F6', x: 30, y: 15, w: 40, h: 30 },
  { shape: 'Rectangle', label: 'Door', color: '#92400E', x: 43, y: 60, w: 14, h: 25 },
  { shape: 'Circle', label: 'Window', color: '#EAB308', x: 55, y: 55, w: 10, h: 10 },
];

export default function ShapesGame() {
  const [mode, setMode] = useState(MODES.LEARN);
  const [shapeIdx, setShapeIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [quizTarget, setQuizTarget] = useState(null);
  const [quizChoices, setQuizChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [builtParts, setBuiltParts] = useState([]);
  const { speak } = useTTS();
  const { recordScore } = useScore('shapes');

  const shape = SHAPES[shapeIdx];
  const colorHex = COLORS_HEX[shapeIdx % COLORS_HEX.length];

  const speakShape = (s) => speak(`${s.name}`, { rate: 0.7 });

  const startQuiz = () => {
    setMode(MODES.QUIZ); setScore(0); setRound(0); genQuiz();
  };

  const genQuiz = () => {
    const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const wrong = shuffle(SHAPES.filter(s => s.name !== target.name)).slice(0, 3);
    setQuizTarget(target);
    setQuizChoices(shuffle([target, ...wrong]));
    setSelected(null); setIsCorrect(null);
    setTimeout(() => speak(`Find the ${target.name}`), 200);
  };

  const handleAnswer = (s) => {
    if (isCorrect !== null) return;
    setSelected(s.name);
    if (s.name === quizTarget.name) {
      playCorrect(); setIsCorrect(true); setScore(sc => sc + 1);
      setTimeout(() => {
        if (round >= 7) {
          recordScore(score + 1, score + 1 >= 6 ? 3 : score + 1 >= 4 ? 2 : 1);
          setShowCelebration(true);
        } else { setRound(r => r + 1); genQuiz(); }
      }, 1000);
    } else {
      playWrong(); setIsCorrect(false);
      setTimeout(() => { setIsCorrect(null); setSelected(null); }, 600);
    }
  };

  const addHousePart = () => {
    if (builtParts.length < HOUSE_PARTS.length) {
      playCorrect();
      setBuiltParts(p => [...p, HOUSE_PARTS[p.length]]);
      const part = HOUSE_PARTS[builtParts.length];
      speak(`Add the ${part.shape} for the ${part.label}`);
      if (builtParts.length + 1 === HOUSE_PARTS.length) {
        setTimeout(() => setShowCelebration(true), 800);
      }
    }
  };

  return (
    <GameShell title="Shapes!" icon="🔷" gameType="shapes" backTo="/learning-games" instructions="Learn your shapes!">
      <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
        <div className="flex gap-2">
          <button onClick={() => setMode(MODES.LEARN)} className={`btn btn-sm font-display ${mode === MODES.LEARN ? 'bg-empy-pink text-white border-empy-pink' : 'btn-ghost text-white/60'}`}>📖 Learn</button>
          <button onClick={startQuiz} className={`btn btn-sm font-display ${mode === MODES.QUIZ ? 'bg-empy-blue text-white border-empy-blue' : 'btn-ghost text-white/60'}`}>🧠 Quiz</button>
          <button onClick={() => { setMode(MODES.BUILD); setBuiltParts([]); }} className={`btn btn-sm font-display ${mode === MODES.BUILD ? 'bg-empy-yellow text-black border-empy-yellow' : 'btn-ghost text-white/60'}`}>🏠 Build</button>
        </div>

        {mode === MODES.LEARN && (
          <div className="flex flex-col items-center gap-4">
            <motion.div key={shapeIdx} initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
              <svg viewBox="0 0 100 100" className="w-40 h-40 sm:w-52 sm:h-52 drop-shadow-2xl">
                {shape.svg(colorHex)}
              </svg>
            </motion.div>
            <motion.p key={`n-${shapeIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display text-white">{shape.emoji} {shape.name}</motion.p>

            <div className="flex items-center gap-4">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShapeIdx(i => Math.max(0, i - 1)); playClick(); }} disabled={shapeIdx === 0}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">◀</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => speakShape(shape)}
                className="btn btn-lg bg-empy-yellow/30 border-empy-yellow/50 text-white font-display">🔊 Hear It</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShapeIdx(i => Math.min(SHAPES.length - 1, i + 1)); playClick(); }} disabled={shapeIdx === SHAPES.length - 1}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">▶</motion.button>
            </div>

            <div className="flex gap-2 flex-wrap justify-center">
              {SHAPES.map((s, i) => (
                <motion.button key={s.name} whileTap={{ scale: 0.9 }} onClick={() => { setShapeIdx(i); playClick(); }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${i === shapeIdx ? 'border-empy-yellow bg-empy-yellow/20' : 'border-white/20 bg-white/5'}`}>
                  <svg viewBox="0 0 100 100" className="w-8 h-8">{s.svg(i === shapeIdx ? COLORS_HEX[i % COLORS_HEX.length] : '#9CA3AF')}</svg>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {mode === MODES.QUIZ && quizTarget && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-white/60 font-display text-sm">Round {round + 1}/8 · Score: {score}</p>
            <p className="text-xl font-display text-white">Find the <span className="text-empy-yellow">{quizTarget.name}</span>!</p>
            <div className="grid grid-cols-2 gap-4">
              {quizChoices.map((s, i) => (
                <motion.button key={s.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(s)}
                  className={`w-28 h-28 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    selected === s.name
                      ? isCorrect === true ? 'border-green-400 bg-green-500/20' : isCorrect === false ? 'border-red-400 bg-red-500/20' : ''
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}>
                  <svg viewBox="0 0 100 100" className="w-16 h-16">{s.svg(COLORS_HEX[i])}</svg>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {mode === MODES.BUILD && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-display text-white">Build a house with shapes!</p>
            <div className="relative w-60 h-60 bg-white/5 rounded-2xl border-2 border-white/20 overflow-hidden">
              {/* Sky */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-400/30 to-green-400/20" />
              {/* Built parts */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                {builtParts.map((p, i) => {
                  if (p.shape === 'Square') return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.color} stroke="white" strokeWidth="1" />;
                  if (p.shape === 'Triangle') return <polygon key={i} points={`${p.x + p.w / 2},${p.y} ${p.x + p.w},${p.y + p.h} ${p.x},${p.y + p.h}`} fill={p.color} stroke="white" strokeWidth="1" />;
                  if (p.shape === 'Rectangle') return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.color} stroke="white" strokeWidth="1" />;
                  if (p.shape === 'Circle') return <circle key={i} cx={p.x} cy={p.y} r={p.w / 2} fill={p.color} stroke="white" strokeWidth="1" />;
                  return null;
                })}
              </svg>
            </div>

            {builtParts.length < HOUSE_PARTS.length ? (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addHousePart}
                className="btn btn-lg bg-empy-pink text-white border-empy-pink font-display">
                Add {HOUSE_PARTS[builtParts.length].shape} ({HOUSE_PARTS[builtParts.length].label}) {builtParts.length + 1}/{HOUSE_PARTS.length}
              </motion.button>
            ) : (
              <p className="text-xl font-display text-empy-yellow">🎉 House complete!</p>
            )}
          </div>
        )}
      </div>

      <Celebration
        show={showCelebration}
        onDone={() => { setShowCelebration(false); setMode(MODES.LEARN); setBuiltParts([]); }}
        message={mode === MODES.BUILD ? 'Great Building! 🏠' : `Super! ${score}/8! 🔷`}
        stars={mode === MODES.BUILD ? 3 : score >= 6 ? 3 : score >= 4 ? 2 : 1}
      />
    </GameShell>
  );
}
