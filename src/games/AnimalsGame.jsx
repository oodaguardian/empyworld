import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import Celebration from '../components/Celebration';
import useTTS from '../hooks/useTTS';
import useScore from '../hooks/useScore';
import { playCorrect, playWrong, playClick } from '../services/sounds';

const ANIMALS = [
  { name: 'Cat', emoji: '🐱', sound: 'Meow meow!', habitat: 'Farm', fact: 'Cats can sleep up to 16 hours a day!' },
  { name: 'Dog', emoji: '🐶', sound: 'Woof woof!', habitat: 'Farm', fact: 'Dogs can learn over 100 words!' },
  { name: 'Cow', emoji: '🐮', sound: 'Moo moo!', habitat: 'Farm', fact: 'Cows have best friends!' },
  { name: 'Pig', emoji: '🐷', sound: 'Oink oink!', habitat: 'Farm', fact: 'Pigs are very smart animals!' },
  { name: 'Horse', emoji: '🐴', sound: 'Neigh neigh!', habitat: 'Farm', fact: 'Horses can sleep standing up!' },
  { name: 'Chicken', emoji: '🐔', sound: 'Cluck cluck!', habitat: 'Farm', fact: 'Chickens can remember over 100 faces!' },
  { name: 'Duck', emoji: '🦆', sound: 'Quack quack!', habitat: 'Farm', fact: "A duck's quack doesn't echo!" },
  { name: 'Lion', emoji: '🦁', sound: 'Roar!', habitat: 'Jungle', fact: 'Lions are called the King of the Jungle!' },
  { name: 'Elephant', emoji: '🐘', sound: 'Trumpet!', habitat: 'Jungle', fact: 'Elephants are the biggest land animals!' },
  { name: 'Monkey', emoji: '🐵', sound: 'Ooh ooh ah ah!', habitat: 'Jungle', fact: 'Monkeys love to eat bananas!' },
  { name: 'Tiger', emoji: '🐯', sound: 'Grrr!', habitat: 'Jungle', fact: 'Every tiger has unique stripes!' },
  { name: 'Giraffe', emoji: '🦒', sound: 'Hum hum!', habitat: 'Jungle', fact: 'Giraffes are the tallest animals!' },
  { name: 'Zebra', emoji: '🦓', sound: 'Bray!', habitat: 'Jungle', fact: 'No two zebras have the same stripes!' },
  { name: 'Snake', emoji: '🐍', sound: 'Hiss hiss!', habitat: 'Jungle', fact: 'Snakes smell with their tongue!' },
  { name: 'Fish', emoji: '🐟', sound: 'Blub blub!', habitat: 'Ocean', fact: 'Some fish can fly out of water!' },
  { name: 'Dolphin', emoji: '🐬', sound: 'Click click!', habitat: 'Ocean', fact: 'Dolphins sleep with one eye open!' },
  { name: 'Whale', emoji: '🐋', sound: 'Whooo!', habitat: 'Ocean', fact: 'Blue whales are the biggest animals ever!' },
  { name: 'Octopus', emoji: '🐙', sound: 'Squish!', habitat: 'Ocean', fact: 'Octopuses have 3 hearts!' },
  { name: 'Eagle', emoji: '🦅', sound: 'Screech!', habitat: 'Sky', fact: 'Eagles can see 8 times better than humans!' },
  { name: 'Parrot', emoji: '🦜', sound: 'Polly wants a cracker!', habitat: 'Sky', fact: 'Parrots can learn to talk!' },
  { name: 'Owl', emoji: '🦉', sound: 'Hoo hoo!', habitat: 'Sky', fact: 'Owls can turn their heads almost all the way around!' },
  { name: 'Butterfly', emoji: '🦋', sound: 'Flutter flutter!', habitat: 'Sky', fact: 'Butterflies taste with their feet!' },
  { name: 'Penguin', emoji: '🐧', sound: 'Honk!', habitat: 'Ocean', fact: 'Penguins cannot fly but they are great swimmers!' },
  { name: 'Bear', emoji: '🐻', sound: 'Growl!', habitat: 'Jungle', fact: 'Bears love honey!' },
];

const HABITATS = ['Farm', 'Jungle', 'Ocean', 'Sky'];
const HABITAT_EMOJIS = { Farm: '🏡', Jungle: '🌴', Ocean: '🌊', Sky: '☁️' };

function shuffle(arr) {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const MODES = { LEARN: 'learn', QUIZ: 'quiz', SORT: 'sort' };

export default function AnimalsGame() {
  const [mode, setMode] = useState(MODES.LEARN);
  const [animalIdx, setAnimalIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [quizTarget, setQuizTarget] = useState(null);
  const [quizChoices, setQuizChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  // Sort mode
  const [sortAnimal, setSortAnimal] = useState(null);
  const [sortScore, setSortScore] = useState(0);
  const [sortRound, setSortRound] = useState(0);
  const { speak } = useTTS();
  const { recordScore } = useScore('animals');

  const animal = ANIMALS[animalIdx];

  const speakAnimal = (a) => {
    speak(`${a.name}. ${a.sound}`, { rate: 0.7 });
  };

  // Quiz - "Which one says MOO?"
  const startQuiz = () => { setMode(MODES.QUIZ); setScore(0); setRound(0); genQuiz(); };

  const genQuiz = () => {
    const target = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const wrong = shuffle(ANIMALS.filter(a => a.name !== target.name)).slice(0, 3);
    setQuizTarget(target);
    setQuizChoices(shuffle([target, ...wrong]));
    setSelected(null); setIsCorrect(null);
    setTimeout(() => speak(`Which one says ${target.sound}?`), 200);
  };

  const handleQuizAnswer = (a) => {
    if (isCorrect !== null) return;
    setSelected(a.name);
    if (a.name === quizTarget.name) {
      playCorrect(); setIsCorrect(true); setScore(s => s + 1);
      setTimeout(() => {
        if (round >= 7) { recordScore(score + 1, score + 1 >= 6 ? 3 : score + 1 >= 4 ? 2 : 1); setShowCelebration(true); }
        else { setRound(r => r + 1); genQuiz(); }
      }, 1000);
    } else {
      playWrong(); setIsCorrect(false);
      setTimeout(() => { setIsCorrect(null); setSelected(null); }, 600);
    }
  };

  // Sort mode
  const startSort = () => { setMode(MODES.SORT); setSortScore(0); setSortRound(0); genSortAnimal(); };

  const genSortAnimal = () => {
    const a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    setSortAnimal(a); setSelected(null); setIsCorrect(null);
    setTimeout(() => speak(`Where does the ${a.name} live?`), 200);
  };

  const handleSort = (habitat) => {
    if (isCorrect !== null || !sortAnimal) return;
    setSelected(habitat);
    if (habitat === sortAnimal.habitat) {
      playCorrect(); setIsCorrect(true); setSortScore(s => s + 1);
      setTimeout(() => {
        if (sortRound >= 7) { recordScore(sortScore + 1, sortScore + 1 >= 6 ? 3 : 2); setShowCelebration(true); }
        else { setSortRound(r => r + 1); genSortAnimal(); }
      }, 1000);
    } else {
      playWrong(); setIsCorrect(false);
      setTimeout(() => { setIsCorrect(null); setSelected(null); }, 600);
    }
  };

  return (
    <GameShell title="Animals!" icon="🐘" gameType="animals" backTo="/learning-games" instructions="Learn about animals!">
      <div className="h-full flex flex-col items-center justify-center p-4 gap-4 overflow-auto">
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setMode(MODES.LEARN)} className={`btn btn-sm font-display ${mode === MODES.LEARN ? 'bg-empy-pink text-white border-empy-pink' : 'btn-ghost text-white/60'}`}>📖 Learn</button>
          <button onClick={startQuiz} className={`btn btn-sm font-display ${mode === MODES.QUIZ ? 'bg-empy-blue text-white border-empy-blue' : 'btn-ghost text-white/60'}`}>🧠 Quiz</button>
          <button onClick={startSort} className={`btn btn-sm font-display ${mode === MODES.SORT ? 'bg-empy-yellow text-black border-empy-yellow' : 'btn-ghost text-white/60'}`}>🏡 Sort</button>
        </div>

        {mode === MODES.LEARN && (
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <motion.div key={animalIdx} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
              <div className="text-[100px] sm:text-[130px] leading-none">{animal.emoji}</div>
            </motion.div>
            <h2 className="text-3xl font-display text-white">{animal.name}</h2>
            <p className="text-lg text-empy-yellow font-display">"{animal.sound}"</p>
            <p className="text-sm text-white/70 max-w-xs text-center">{animal.fact}</p>
            <p className="text-xs text-white/50">Habitat: {HABITAT_EMOJIS[animal.habitat]} {animal.habitat}</p>

            <div className="flex items-center gap-4">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setAnimalIdx(i => Math.max(0, i - 1)); playClick(); }} disabled={animalIdx === 0}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">◀</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => speakAnimal(animal)}
                className="btn btn-lg bg-empy-yellow/30 border-empy-yellow/50 text-white font-display">🔊 Hear It</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setAnimalIdx(i => Math.min(ANIMALS.length - 1, i + 1)); playClick(); }} disabled={animalIdx === ANIMALS.length - 1}
                className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">▶</motion.button>
            </div>

            <div className="flex flex-wrap justify-center gap-1 max-w-md">
              {ANIMALS.map((a, i) => (
                <motion.button key={a.name} whileTap={{ scale: 0.8 }} onClick={() => { setAnimalIdx(i); playClick(); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${i === animalIdx ? 'bg-empy-pink/40 border-2 border-empy-pink scale-110' : 'bg-white/5 border border-white/10'}`}>
                  {a.emoji}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {mode === MODES.QUIZ && quizTarget && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-white/60 font-display text-sm">Round {round + 1}/8 · Score: {score}</p>
            <p className="text-xl font-display text-white">Which one says <span className="text-empy-yellow">"{quizTarget.sound}"</span>?</p>
            <div className="grid grid-cols-2 gap-4">
              {quizChoices.map(a => (
                <motion.button key={a.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleQuizAnswer(a)}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                    selected === a.name
                      ? isCorrect === true ? 'border-green-400 bg-green-500/20' : isCorrect === false ? 'border-red-400 bg-red-500/20' : ''
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}>
                  <span className="text-4xl">{a.emoji}</span>
                  <span className="text-xs text-white/70 font-display">{a.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {mode === MODES.SORT && sortAnimal && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-white/60 font-display text-sm">Round {sortRound + 1}/8 · Score: {sortScore}</p>
            <motion.div key={sortRound} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-7xl">{sortAnimal.emoji}</motion.div>
            <p className="text-xl font-display text-white">Where does the <span className="text-empy-yellow">{sortAnimal.name}</span> live?</p>
            <div className="grid grid-cols-2 gap-3">
              {HABITATS.map(h => (
                <motion.button key={h} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSort(h)}
                  className={`px-6 py-4 rounded-2xl border-2 flex flex-col items-center gap-1 font-display transition-all ${
                    selected === h
                      ? isCorrect === true ? 'border-green-400 bg-green-500/20' : isCorrect === false ? 'border-red-400 bg-red-500/20' : ''
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}>
                  <span className="text-3xl">{HABITAT_EMOJIS[h]}</span>
                  <span className="text-sm text-white">{h}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Celebration
        show={showCelebration}
        onDone={() => { setShowCelebration(false); setMode(MODES.LEARN); }}
        message={mode === MODES.SORT ? `Sorted! ${sortScore}/8! 🏡` : `Great! ${score}/8! 🐘`}
        stars={((mode === MODES.SORT ? sortScore : score) >= 6) ? 3 : ((mode === MODES.SORT ? sortScore : score) >= 4) ? 2 : 1}
      />
    </GameShell>
  );
}
