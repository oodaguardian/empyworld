import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';
import useTTS from '../hooks/useTTS';
import { playClick } from '../services/sounds';

// Character base + clothing items with layered SVG
const CHARACTERS = [
  { name: 'Girl', emoji: '👧', skinColor: '#FDBCB4' },
  { name: 'Boy', emoji: '👦', skinColor: '#FDBCB4' },
];

const CATEGORIES = {
  hair: {
    label: '💇 Hair',
    items: [
      { name: 'Long Pink', svg: (c) => <path d="M30 25 Q50 5 70 25 Q75 15 80 30 L80 55 Q75 50 70 50 L30 50 Q25 50 20 55 L20 30 Q25 15 30 25Z" fill="#EC4899" />, id: 'long-pink' },
      { name: 'Long Brown', svg: (c) => <path d="M30 25 Q50 5 70 25 Q75 15 80 30 L80 55 Q75 50 70 50 L30 50 Q25 50 20 55 L20 30 Q25 15 30 25Z" fill="#92400E" />, id: 'long-brown' },
      { name: 'Short Blue', svg: (c) => <path d="M30 25 Q50 10 70 25 Q73 20 75 30 L75 40 Q70 42 65 40 L35 40 Q30 42 25 40 L25 30 Q27 20 30 25Z" fill="#3B82F6" />, id: 'short-blue' },
      { name: 'Curly Purple', svg: (c) => <><circle cx="25" cy="32" r="8" fill="#A855F7"/><circle cx="35" cy="22" r="8" fill="#A855F7"/><circle cx="50" cy="18" r="9" fill="#A855F7"/><circle cx="65" cy="22" r="8" fill="#A855F7"/><circle cx="75" cy="32" r="8" fill="#A855F7"/></>, id: 'curly-purple' },
      { name: 'Ponytails', svg: (c) => <><path d="M30 25 Q50 10 70 25 L70 38 L30 38Z" fill="#EAB308"/><ellipse cx="22" cy="50" rx="6" ry="14" fill="#EAB308"/><ellipse cx="78" cy="50" rx="6" ry="14" fill="#EAB308"/></>, id: 'ponytails' },
      { name: 'Bald', svg: () => null, id: 'none' },
    ],
  },
  tops: {
    label: '👕 Tops',
    items: [
      { name: 'Pink Dress', svg: () => <path d="M30 60 L70 60 L75 95 Q50 100 25 95Z" fill="#EC4899" />, id: 'pink-dress' },
      { name: 'Blue Shirt', svg: () => <><rect x="30" y="60" width="40" height="30" rx="3" fill="#3B82F6"/><rect x="20" y="60" width="15" height="20" rx="3" fill="#3B82F6"/><rect x="65" y="60" width="15" height="20" rx="3" fill="#3B82F6"/></>, id: 'blue-shirt' },
      { name: 'Yellow Top', svg: () => <path d="M30 60 L70 60 L72 85 L28 85Z" fill="#EAB308" />, id: 'yellow-top' },
      { name: 'Rainbow Dress', svg: () => <><path d="M30 60 L70 60 L75 95 Q50 100 25 95Z" fill="#A855F7"/><rect x="30" y="68" width="40" height="5" fill="#EF4444" opacity="0.5"/><rect x="30" y="75" width="40" height="5" fill="#EAB308" opacity="0.5"/><rect x="30" y="82" width="40" height="5" fill="#22C55E" opacity="0.5"/></>, id: 'rainbow' },
      { name: 'Green Hoodie', svg: () => <><rect x="28" y="58" width="44" height="32" rx="5" fill="#22C55E"/><rect x="20" y="60" width="14" height="18" rx="3" fill="#22C55E"/><rect x="66" y="60" width="14" height="18" rx="3" fill="#22C55E"/><circle cx="42" cy="68" r="2" fill="#166534"/><circle cx="58" cy="68" r="2" fill="#166534"/></>, id: 'green-hoodie' },
    ],
  },
  bottoms: {
    label: '👖 Bottoms',
    items: [
      { name: 'Pink Skirt', svg: () => <path d="M32 88 L68 88 L75 115 L25 115Z" fill="#FCA5A5" />, id: 'pink-skirt' },
      { name: 'Blue Jeans', svg: () => <><rect x="32" y="88" width="16" height="30" rx="3" fill="#1D4ED8"/><rect x="52" y="88" width="16" height="30" rx="3" fill="#1D4ED8"/></>, id: 'blue-jeans' },
      { name: 'Purple Shorts', svg: () => <><rect x="32" y="88" width="16" height="18" rx="3" fill="#7C3AED"/><rect x="52" y="88" width="16" height="18" rx="3" fill="#7C3AED"/></>, id: 'purple-shorts' },
      { name: 'Yellow Skirt', svg: () => <path d="M32 88 L68 88 L72 112 L28 112Z" fill="#FDE68A" />, id: 'yellow-skirt' },
    ],
  },
  shoes: {
    label: '👟 Shoes',
    items: [
      { name: 'Pink Shoes', svg: () => <><ellipse cx="40" cy="122" rx="10" ry="5" fill="#EC4899"/><ellipse cx="60" cy="122" rx="10" ry="5" fill="#EC4899"/></>, id: 'pink-shoes' },
      { name: 'Blue Boots', svg: () => <><rect x="32" y="116" width="12" height="10" rx="3" fill="#1D4ED8"/><rect x="56" y="116" width="12" height="10" rx="3" fill="#1D4ED8"/></>, id: 'blue-boots' },
      { name: 'Yellow Sneakers', svg: () => <><ellipse cx="40" cy="122" rx="12" ry="5" fill="#EAB308"/><ellipse cx="60" cy="122" rx="12" ry="5" fill="#EAB308"/></>, id: 'yellow-sneakers' },
      { name: 'Red Heels', svg: () => <><path d="M30 120 L48 120 L48 125 L28 125Z" fill="#EF4444"/><path d="M52 120 L70 120 L72 125 L52 125Z" fill="#EF4444"/></>, id: 'red-heels' },
    ],
  },
  accessories: {
    label: '🎀 Extras',
    items: [
      { name: 'Crown', svg: () => <path d="M35 20 L40 10 L45 18 L50 8 L55 18 L60 10 L65 20Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1" />, id: 'crown' },
      { name: 'Bow', svg: () => <><ellipse cx="42" cy="25" rx="8" ry="5" fill="#EC4899"/><ellipse cx="58" cy="25" rx="8" ry="5" fill="#EC4899"/><circle cx="50" cy="25" r="3" fill="#BE185D"/></>, id: 'bow' },
      { name: 'Sunglasses', svg: () => <><rect x="33" y="42" width="12" height="8" rx="4" fill="#1E293B" opacity="0.8"/><rect x="55" y="42" width="12" height="8" rx="4" fill="#1E293B" opacity="0.8"/><line x1="45" y1="46" x2="55" y2="46" stroke="#1E293B" strokeWidth="1.5"/></>, id: 'glasses' },
      { name: 'Necklace', svg: () => <><path d="M38 58 Q50 65 62 58" fill="none" stroke="#EAB308" strokeWidth="1.5"/><circle cx="50" cy="64" r="3" fill="#EF4444"/></>, id: 'necklace' },
      { name: 'Wings', svg: () => <><path d="M25 70 Q10 50 15 35 Q20 45 28 60Z" fill="#C4B5FD" opacity="0.6"/><path d="M75 70 Q90 50 85 35 Q80 45 72 60Z" fill="#C4B5FD" opacity="0.6"/></>, id: 'wings' },
      { name: 'None', svg: () => null, id: 'none' },
    ],
  },
};

export default function DressUp() {
  const [charIdx, setCharIdx] = useState(0);
  const [category, setCategory] = useState('hair');
  const [equipped, setEquipped] = useState({
    hair: 'long-pink', tops: 'pink-dress', bottoms: 'pink-skirt', shoes: 'pink-shoes', accessories: 'bow',
  });

  const char = CHARACTERS[charIdx];
  const { speak } = useTTS();

  const equip = (cat, itemId) => {
    playClick();
    setEquipped(prev => ({ ...prev, [cat]: itemId }));
  };

  const randomize = () => {
    playClick();
    const newEquip = {};
    Object.entries(CATEGORIES).forEach(([cat, { items }]) => {
      newEquip[cat] = items[Math.floor(Math.random() * items.length)].id;
    });
    setEquipped(newEquip);
    speak(`Looking good, Empy!`);
  };

  const getEquippedSvg = (cat) => {
    const item = CATEGORIES[cat].items.find(i => i.id === equipped[cat]);
    if (!item || !item.svg) return null;
    return item.svg(char);
  };

  return (
    <GameShell title="Dress Up!" icon="👗" gameType="dressup" backTo="/games" instructions="Create your look!">
      <div className="h-full flex flex-col sm:flex-row p-2 sm:p-4 gap-2 sm:gap-4">
        {/* Character display */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="relative bg-gradient-to-b from-pink-200/20 to-purple-200/20 rounded-3xl p-4 border-2 border-white/10">
            <svg viewBox="0 0 100 135" className="w-48 h-64 sm:w-56 sm:h-72">
              {/* Background sparkles */}
              <circle cx="15" cy="15" r="2" fill="#FDE68A" opacity="0.5"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
              <circle cx="85" cy="20" r="1.5" fill="#FDE68A" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/></circle>
              <circle cx="10" cy="90" r="1.5" fill="#C4B5FD" opacity="0.5"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite"/></circle>

              {/* Wings (behind body) */}
              {equipped.accessories === 'wings' && getEquippedSvg('accessories')}

              {/* Body (skin) */}
              <ellipse cx="50" cy="45" rx="18" ry="20" fill={char.skinColor} /> {/* Head */}
              <rect x="40" y="55" width="20" height="10" fill={char.skinColor} rx="3" /> {/* Neck */}
              <rect x="30" y="60" width="40" height="30" fill={char.skinColor} rx="5" /> {/* Torso */}
              <rect x="34" y="90" width="14" height="30" fill={char.skinColor} rx="3" /> {/* Leg L */}
              <rect x="52" y="90" width="14" height="30" fill={char.skinColor} rx="3" /> {/* Leg R */}

              {/* Eyes */}
              <circle cx="42" cy="43" r="3" fill="white" />
              <circle cx="58" cy="43" r="3" fill="white" />
              <circle cx="42" cy="43" r="1.5" fill="#1E293B" />
              <circle cx="58" cy="43" r="1.5" fill="#1E293B" />

              {/* Mouth */}
              <path d="M44 52 Q50 56 56 52" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" />

              {/* Clothing layers */}
              {getEquippedSvg('tops')}
              {getEquippedSvg('bottoms')}
              {getEquippedSvg('shoes')}
              {getEquippedSvg('hair')}
              {equipped.accessories !== 'wings' && getEquippedSvg('accessories')}
            </svg>
          </div>

          {/* Character toggle + randomize */}
          <div className="flex gap-2">
            {CHARACTERS.map((c, i) => (
              <button key={c.name} onClick={() => { setCharIdx(i); playClick(); }}
                className={`btn btn-sm font-display ${i === charIdx ? 'bg-empy-pink text-white border-empy-pink' : 'btn-ghost text-white/60'}`}>
                {c.emoji} {c.name}
              </button>
            ))}
            <button onClick={randomize} className="btn btn-sm bg-empy-yellow/20 border-empy-yellow/40 text-empy-yellow font-display">🎲 Random</button>
          </div>
        </div>

        {/* Item picker */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-shrink-0">
            {Object.entries(CATEGORIES).map(([cat, { label }]) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 btn btn-xs font-display ${cat === category ? 'bg-empy-blue text-white border-empy-blue' : 'btn-ghost text-white/60'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORIES[category].items.map(item => (
                <motion.button key={item.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => equip(category, item.id)}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 p-2 transition-all ${
                    equipped[category] === item.id
                      ? 'border-empy-yellow bg-empy-yellow/20 shadow-lg shadow-empy-yellow/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}>
                  <svg viewBox="0 0 100 135" className="w-12 h-16">
                    {item.svg(char)}
                  </svg>
                  <span className="text-[10px] text-white/70 font-display truncate w-full text-center">{item.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
