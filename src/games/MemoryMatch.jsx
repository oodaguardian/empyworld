import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useScore from '../hooks/useScore';
import useTTS from '../hooks/useTTS';
import { playFlip, playCorrect, playWrong } from '../services/sounds';

const CARD_SETS = {
  easy: ['🐱', '🐶', '🐻', '🦊'],
  medium: ['🐱', '🐶', '🐻', '🦊', '🐸', '🦋', '🐙', '🦄'],
  hard: ['🐱', '🐶', '🐻', '🦊', '🐸', '🦋', '🐙', '🦄', '🐯', '🐧', '🦁', '🐬'],
};

function shuffle(arr) {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export default function MemoryMatch() {
  const [difficulty, setDifficulty] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const { recordScore } = useScore('memory');
  const { speak } = useTTS();

  const startGame = useCallback((diff) => {
    const emojis = CARD_SETS[diff];
    const pairs = [...emojis, ...emojis];
    setCards(shuffle(pairs).map((emoji, i) => ({ id: i, emoji })));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLocked(false);
    setDifficulty(diff);
    setStartTime(Date.now());
    setShowCelebration(false);
    speak(`Let's go, Empy!`);
  }, []);

  const handleFlip = useCallback((id) => {
    if (locked || flipped.includes(id) || matched.has(id)) return;
    playFlip();
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      if (cards[a].emoji === cards[b].emoji) {
        playCorrect();
        const newMatched = new Set(matched);
        newMatched.add(a);
        newMatched.add(b);
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        if (newMatched.size === cards.length) {
          const time = Math.round((Date.now() - startTime) / 1000);
          const stars = moves + 1 <= cards.length / 2 + 2 ? 3 : moves + 1 <= cards.length ? 2 : 1;
          recordScore(1000 - (moves + 1) * 10 - time, stars);
          speak(`You did it, Empy!`);
          setTimeout(() => setShowCelebration(true), 400);
        }
      } else {
        playWrong();
        setTimeout(() => { setFlipped([]); setLocked(false); }, 800);
      }
    }
  }, [flipped, matched, cards, locked, startTime, moves, recordScore]);

  const cols = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 6 : 4;

  if (!difficulty) {
    return (
      <GameShell title="Memory Match" icon="🃏" gameType="memory" backTo="/games" instructions="Match the pairs!">
        <div className="h-full flex flex-col items-center justify-center gap-6 p-4">
          <h2 className="text-2xl font-display text-white">Pick Difficulty</h2>
          {[
            { d: 'easy', label: '😊 Easy', sub: '4 pairs', color: 'bg-green-500/30 border-green-400' },
            { d: 'medium', label: '🤔 Medium', sub: '8 pairs', color: 'bg-empy-yellow/30 border-empy-yellow' },
            { d: 'hard', label: '🔥 Hard', sub: '12 pairs', color: 'bg-red-500/30 border-red-400' },
          ].map(({ d, label, sub, color }) => (
            <motion.button key={d} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => startGame(d)}
              className={`btn btn-lg ${color} text-white font-display w-56 flex-col h-auto py-4`}>
              <span className="text-xl">{label}</span>
              <span className="text-xs opacity-70">{sub}</span>
            </motion.button>
          ))}
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Memory Match" icon="🃏" gameType="memory" backTo="/games" instructions={`Moves: ${moves}`}>
      <div className="h-full flex flex-col items-center p-2 sm:p-4 gap-2">
        <div className="flex items-center gap-4 text-white/60 text-sm font-display">
          <span>Moves: {moves}</span>
          <span>Pairs: {matched.size / 2} / {cards.length / 2}</span>
          <button onClick={() => setDifficulty(null)} className="btn btn-xs btn-ghost text-white/40">Change</button>
        </div>

        <div className={`grid gap-2 sm:gap-3 flex-1 w-full max-w-lg place-items-center`}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.id) || matched.has(card.id);
            const isMatched = matched.has(card.id);
            return (
              <motion.button
                key={card.id}
                whileHover={!isFlipped ? { scale: 1.05 } : {}}
                whileTap={!isFlipped ? { scale: 0.95 } : {}}
                onClick={() => handleFlip(card.id)}
                className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center text-3xl sm:text-4xl transition-all cursor-pointer ${
                  isMatched
                    ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-400/30'
                    : isFlipped
                    ? 'border-empy-yellow bg-empy-yellow/10'
                    : 'border-empy-pink/40 bg-gradient-to-br from-empy-pink/20 to-empy-blue/20 hover:border-empy-pink'
                }`}
              >
                <motion.span
                  initial={false}
                  animate={{ rotateY: isFlipped ? 0 : 180, opacity: isFlipped ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isFlipped ? card.emoji : ''}
                </motion.span>
                {!isFlipped && <span className="text-2xl sm:text-3xl text-empy-pink/40">?</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Celebration
        show={showCelebration}
        onDone={() => setDifficulty(null)}
        message={`Matched in ${moves} moves! 🃏`}
        stars={moves <= cards.length / 2 + 2 ? 3 : moves <= cards.length ? 2 : 1}
      />
    </GameShell>
  );
}
