import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useScore from '../hooks/useScore';
import useTTS from '../hooks/useTTS';
import { playCorrect, playClick } from '../services/sounds';

// Bright, simple emoji images for puzzles
const PUZZLES = [
  { name: 'Cat', emoji: '🐱', bg: '#FFF1F2' },
  { name: 'Dog', emoji: '🐶', bg: '#FEF3C7' },
  { name: 'Unicorn', emoji: '🦄', bg: '#F3E8FF' },
  { name: 'Star', emoji: '⭐', bg: '#FFFBEB' },
  { name: 'Rainbow', emoji: '🌈', bg: '#ECFDF5' },
  { name: 'Flower', emoji: '🌸', bg: '#FDF2F8' },
  { name: 'Butterfly', emoji: '🦋', bg: '#EFF6FF' },
  { name: 'Fish', emoji: '🐠', bg: '#F0FDFA' },
  { name: 'Heart', emoji: '💖', bg: '#FFF1F2' },
  { name: 'Sun', emoji: '☀️', bg: '#FFFBEB' },
];

function shuffle(arr) {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function generatePieces(size) {
  const pieces = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      pieces.push({ id: row * size + col, row, col, placed: false });
    }
  }
  return pieces;
}

export default function PuzzleGame() {
  const [difficulty, setDifficulty] = useState(null); // 2, 3, 4
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [pieces, setPieces] = useState([]);
  const [shuffledPieces, setShuffledPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const { recordScore } = useScore('puzzle');
  const { speak } = useTTS();

  const puzzle = PUZZLES[puzzleIdx];

  const startPuzzle = useCallback((size) => {
    setDifficulty(size);
    setMoves(0);
    setShowCelebration(false);
    setSelectedPiece(null);
    const p = generatePieces(size);
    setPieces(p);
    setShuffledPieces(shuffle([...p]));
    setBoard(Array(size * size).fill(null));
    speak(`Let's go, Empy!`);
  }, []);

  const handlePieceTap = (piece) => {
    if (piece.placed) return;
    playClick();
    setSelectedPiece(piece);
  };

  const handleSlotTap = (slotIdx) => {
    if (!selectedPiece || board[slotIdx] !== null) return;
    
    // Check if piece goes to correct slot
    const correctSlot = selectedPiece.row * difficulty + selectedPiece.col;
    if (slotIdx === correctSlot) {
      playCorrect();
      setMoves(m => m + 1);
      
      const newBoard = [...board];
      newBoard[slotIdx] = selectedPiece;
      setBoard(newBoard);
      
      setShuffledPieces(prev => prev.map(p => p.id === selectedPiece.id ? { ...p, placed: true } : p));
      setSelectedPiece(null);

      // Check completion
      if (newBoard.every(s => s !== null)) {
        recordScore(1000 - moves * 10, moves <= difficulty * difficulty ? 3 : 2);
        speak(`Yay, Empy!`);
        setTimeout(() => setShowCelebration(true), 400);
      }
    } else {
      // Wrong slot - piece snaps back
      setSelectedPiece(null);
      setMoves(m => m + 1);
    }
  };

  if (!difficulty) {
    return (
      <GameShell title="Puzzle!" icon="🧩" gameType="puzzle" backTo="/games" instructions="Solve the puzzle!">
        <div className="h-full flex flex-col items-center justify-center gap-6 p-4">
          <h2 className="text-2xl font-display text-white">Pick a Puzzle!</h2>
          
          {/* Puzzle selection */}
          <div className="flex gap-2 flex-wrap justify-center max-w-sm">
            {PUZZLES.map((p, i) => (
              <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => { setPuzzleIdx(i); }}
                className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center border-2 transition-all ${
                  i === puzzleIdx ? 'border-empy-yellow bg-empy-yellow/20' : 'border-white/20 bg-white/5'
                }`}>
                {p.emoji}
              </motion.button>
            ))}
          </div>

          <h3 className="text-lg font-display text-white/70">Difficulty</h3>
          <div className="flex gap-3">
            {[
              { s: 2, label: '😊 Easy', sub: '2×2', color: 'bg-green-500/30 border-green-400' },
              { s: 3, label: '🤔 Medium', sub: '3×3', color: 'bg-empy-yellow/30 border-empy-yellow' },
              { s: 4, label: '🔥 Hard', sub: '4×4', color: 'bg-red-500/30 border-red-400' },
            ].map(({ s, label, sub, color }) => (
              <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => startPuzzle(s)}
                className={`btn btn-md ${color} text-white font-display flex-col h-auto py-3`}>
                <span>{label}</span><span className="text-xs opacity-70">{sub}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </GameShell>
    );
  }

  const pieceSize = Math.min(280 / difficulty, 90);

  return (
    <GameShell title="Puzzle!" icon="🧩" gameType="puzzle" backTo="/games" instructions={`Moves: ${moves}`}>
      <div className="h-full flex flex-col items-center p-3 gap-3 overflow-auto">
        <div className="flex items-center gap-4 text-white/60 text-sm font-display">
          <span>Moves: {moves}</span>
          <span>{puzzle.emoji} {puzzle.name}</span>
          <button onClick={() => setDifficulty(null)} className="btn btn-xs btn-ghost text-white/40">Change</button>
        </div>

        {/* Puzzle board (target) */}
        <div className="rounded-2xl p-2 border-2 border-empy-yellow/30" style={{ backgroundColor: puzzle.bg + '33' }}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${difficulty}, ${pieceSize}px)` }}>
            {board.map((slot, i) => {
              const row = Math.floor(i / difficulty);
              const col = i % difficulty;
              return (
                <motion.div
                  key={i}
                  whileHover={slot === null ? { scale: 1.05 } : {}}
                  onClick={() => handleSlotTap(i)}
                  className={`flex items-center justify-center border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    slot !== null ? 'border-green-400/50' : 'border-dashed border-white/30 hover:border-empy-pink/50'
                  }`}
                  style={{ width: pieceSize, height: pieceSize, backgroundColor: slot ? puzzle.bg : 'rgba(255,255,255,0.05)' }}
                >
                  {slot !== null ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ fontSize: pieceSize * 0.6 }}>
                      {puzzle.emoji}
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs font-display">{row + 1},{col + 1}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Shuffled pieces tray */}
        <div className="flex-shrink-0">
          <p className="text-xs text-white/40 font-display text-center mb-1">Tap a piece, then tap where it goes</p>
          <div className="flex gap-2 flex-wrap justify-center max-w-sm">
            {shuffledPieces.filter(p => !p.placed).map(piece => (
              <motion.button
                key={piece.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePieceTap(piece)}
                className={`rounded-lg flex items-center justify-center border-2 transition-all ${
                  selectedPiece?.id === piece.id
                    ? 'border-empy-yellow bg-empy-yellow/30 shadow-lg shadow-empy-yellow/30 scale-110'
                    : 'border-white/30 bg-white/10 hover:bg-white/20'
                }`}
                style={{ width: pieceSize * 0.8, height: pieceSize * 0.8, backgroundColor: selectedPiece?.id === piece.id ? undefined : puzzle.bg }}
              >
                <div style={{ fontSize: pieceSize * 0.45 }}>{puzzle.emoji}</div>
                <span className="absolute bottom-0 text-[8px] text-black/40 font-display">{piece.row + 1},{piece.col + 1}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <Celebration
        show={showCelebration}
        onDone={() => setDifficulty(null)}
        message={`Puzzle Complete! 🧩`}
        stars={moves <= difficulty * difficulty ? 3 : moves <= difficulty * difficulty * 2 ? 2 : 1}
      />
    </GameShell>
  );
}
