import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useTTS from '../hooks/useTTS';
import useScore from '../hooks/useScore';
import { playCorrect, playWrong, playClick } from '../services/sounds';

const MAX_LEARN_NUMBER = 100;
const NUMBERS = Array.from({ length: MAX_LEARN_NUMBER }, (_, i) => i + 1);
const EMOJIS = ['🐱', '🐶', '🍎', '🌟', '🦋', '🐠', '🌺', '🎈', '🐻', '💖'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MODES = { LEARN: 'learn', COUNT: 'count', ADD: 'add' };

export default function NumberGame() {
  const [mode, setMode] = useState(MODES.LEARN);
  const [currentNum, setCurrentNum] = useState(1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [addProblem, setAddProblem] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [countTarget, setCountTarget] = useState(null);
  const [counted, setCounted] = useState(0);
  const { speak } = useTTS();
  const { recordScore } = useScore('numbers');

  const emoji = EMOJIS[currentNum % EMOJIS.length];

  const speakNumber = (n) => {
    speak(`${n}. ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}`, { rate: 0.65 });
  };

  const nextNum = () => { playClick(); setCurrentNum(n => Math.min(n + 1, MAX_LEARN_NUMBER)); };
  const prevNum = () => { playClick(); setCurrentNum(n => Math.max(n - 1, 1)); };

  // --- Count mode ---
  const startCount = () => {
    setMode(MODES.COUNT);
    setScore(0);
    setRound(0);
    genCountProblem();
  };

  const genCountProblem = () => {
    const target = 10 + Math.floor(Math.random() * 91);
    setCountTarget(target);
    setCounted(0);
    setIsCorrect(null);
    setTimeout(() => speak(`Count to ${target}`), 200);
  };

  const handleCountTap = () => {
    if (!countTarget) return;
    playClick();
    const next = counted + 1;
    setCounted(next);
    speak(`${next}`, { rate: 0.9 });
    if (next === countTarget) {
      playCorrect();
      setIsCorrect(true);
      setScore(s => s + 1);
      setTimeout(() => {
        if (round >= 7) {
          recordScore(score + 1, score + 1 >= 6 ? 3 : score + 1 >= 4 ? 2 : 1);
          setShowCelebration(true);
        } else {
          setRound(r => r + 1);
          genCountProblem();
        }
      }, 1200);
    }
  };

  // --- Addition mode ---
  const startAdd = () => {
    setMode(MODES.ADD);
    setScore(0);
    setRound(0);
    genAddProblem();
  };

  const genAddProblem = () => {
    const a = 1 + Math.floor(Math.random() * 5);
    const b = 1 + Math.floor(Math.random() * 5);
    const answer = a + b;
    const choices = shuffle([answer, answer + 1 > 10 ? answer - 2 : answer + 1, Math.max(1, answer - 1)]);
    setAddProblem({ a, b, answer, choices: [...new Set(choices)].length >= 3 ? [...new Set(choices)] : shuffle([answer, answer + 2, Math.max(1, answer - 2)]) });
    setSelected(null);
    setIsCorrect(null);
    const eA = EMOJIS[a % EMOJIS.length];
    setTimeout(() => speak(`${a} plus ${b}?`), 200);
  };

  const handleAddAnswer = (ans) => {
    if (isCorrect !== null) return;
    setSelected(ans);
    if (ans === addProblem.answer) {
      playCorrect();
      setIsCorrect(true);
      setScore(s => s + 1);
      setTimeout(() => {
        if (round >= 7) {
          recordScore(score + 1, score + 1 >= 6 ? 3 : score + 1 >= 4 ? 2 : 1);
          setShowCelebration(true);
        } else {
          setRound(r => r + 1);
          genAddProblem();
        }
      }, 1000);
    } else {
      playWrong();
      setIsCorrect(false);
      setTimeout(() => { setIsCorrect(null); setSelected(null); }, 600);
    }
  };

  return (
    <GameShell title="Number Fun" icon="🔢" gameType="numbers" backTo="/learning-games" instructions="Learn numbers 1-100!">
      <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
        {/* Mode tabs */}
        <div className="flex gap-2">
          {[
            { m: MODES.LEARN, icon: '📖', label: 'Learn', fn: () => setMode(MODES.LEARN) },
            { m: MODES.COUNT, icon: '👆', label: 'Count', fn: startCount },
            { m: MODES.ADD, icon: '➕', label: 'Add', fn: startAdd },
          ].map(({ m, icon: ic, label, fn }) => (
            <button key={m} onClick={fn}
              className={`btn btn-sm font-display ${mode === m ? 'bg-empy-pink text-white border-empy-pink' : 'btn-ghost text-white/60'}`}>
              {ic} {label}
            </button>
          ))}
        </div>

        {mode === MODES.LEARN && (
          <div className="flex flex-col items-center gap-4">
            <motion.div key={currentNum} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <div className="text-[100px] sm:text-[140px] font-display leading-none glitter-text text-center">
                {currentNum}
              </div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {Array.from({ length: currentNum }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring' }}
                  className="text-3xl"
                >
                  {emoji}
                </motion.span>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={prevNum} disabled={currentNum === 1}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">◀</motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => speakNumber(currentNum)}
                className="btn btn-lg bg-empy-yellow/30 border-empy-yellow/50 text-white font-display gap-2">🔊 Count</motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={nextNum} disabled={currentNum === MAX_LEARN_NUMBER}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">▶</motion.button>
            </div>

            <div className="flex flex-wrap justify-center gap-1 max-h-40 overflow-y-auto pr-1">
              {NUMBERS.map(n => (
                <motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => { setCurrentNum(n); playClick(); }}
                  className={`w-9 h-9 rounded-lg font-display text-sm flex items-center justify-center ${n === currentNum ? 'bg-empy-pink text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {mode === MODES.COUNT && countTarget && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-white/60 font-display text-sm">Round {round + 1}/8 · Score: {score}</p>
            <p className="text-xl font-display text-white text-center">Tap to count all the way to <span className="text-empy-yellow text-3xl">{countTarget}</span>!</p>
            <div className="w-full max-w-sm px-2">
              <div className="h-4 rounded-full bg-white/10 overflow-hidden border border-white/20">
                <div
                  className="h-full bg-empy-pink transition-all duration-200"
                  style={{ width: `${Math.min(100, (counted / countTarget) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-3xl font-display text-empy-yellow">{counted} / {countTarget}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCountTap}
              disabled={counted >= countTarget}
              className="btn btn-lg font-display text-white border-none disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #FF2D8B, #9B30FF)' }}
            >
              {counted + 1 <= countTarget ? `Count ${counted + 1}` : 'Great Job!'}
            </motion.button>
          </div>
        )}

        {mode === MODES.ADD && addProblem && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-white/60 font-display text-sm">Round {round + 1}/8 · Score: {score}</p>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {Array.from({ length: addProblem.a }).map((_, i) => <span key={`a${i}`} className="text-3xl">{EMOJIS[addProblem.a % EMOJIS.length]}</span>)}
                <span className="text-3xl text-empy-yellow font-display mx-2">+</span>
                {Array.from({ length: addProblem.b }).map((_, i) => <span key={`b${i}`} className="text-3xl">{EMOJIS[addProblem.a % EMOJIS.length]}</span>)}
              </div>
              <p className="text-2xl font-display text-white">{addProblem.a} + {addProblem.b} = ?</p>
            </div>
            <div className="flex gap-4">
              {addProblem.choices.map(c => (
                <motion.button key={c} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddAnswer(c)}
                  className={`w-20 h-20 rounded-2xl text-3xl font-display border-2 transition-all ${
                    selected === c
                      ? isCorrect === true ? 'bg-green-500/40 border-green-400 text-green-200'
                      : isCorrect === false ? 'bg-red-500/40 border-red-400 text-red-200' : ''
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}>
                  {c}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Celebration
        show={showCelebration}
        onDone={() => { setShowCelebration(false); setMode(MODES.LEARN); }}
        message={`Super! ${score}/8! 🔢`}
        stars={score >= 6 ? 3 : score >= 4 ? 2 : 1}
      />
    </GameShell>
  );
}
