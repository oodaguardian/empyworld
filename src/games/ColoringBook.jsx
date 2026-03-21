import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import { playColorFill } from '../services/sounds';

const PALETTE = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7',
  '#EC4899', '#06B6D4', '#92400E', '#F8FAFC', '#1E293B', '#6B7280',
];

// SVG coloring scenes with named regions
const SCENES = [
  {
    name: 'Cat',
    emoji: '🐱',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'body', d: 'M60 120 Q60 70 100 60 Q140 70 140 120 Q140 170 100 175 Q60 170 60 120Z', default: '#D4D4D8' },
      { id: 'head', d: 'M70 80 Q70 40 100 35 Q130 40 130 80 Q130 100 100 105 Q70 100 70 80Z', default: '#D4D4D8' },
      { id: 'earL', d: 'M70 60 L60 30 L85 50Z', default: '#A1A1AA' },
      { id: 'earR', d: 'M130 60 L140 30 L115 50Z', default: '#A1A1AA' },
      { id: 'nose', d: 'M95 75 L100 80 L105 75Z', default: '#FDA4AF' },
      { id: 'tail', d: 'M135 140 Q170 120 165 90 Q163 80 155 85 Q160 100 135 130', default: '#D4D4D8' },
      { id: 'ground', d: 'M20 170 Q100 160 180 170 L180 200 L20 200Z', default: '#86EFAC' },
    ],
  },
  {
    name: 'Dog',
    emoji: '🐶',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'body', d: 'M55 115 Q55 80 100 70 Q145 80 145 115 Q145 165 100 170 Q55 165 55 115Z', default: '#D4D4D8' },
      { id: 'head', d: 'M65 80 Q65 45 100 35 Q135 45 135 80 Q135 105 100 108 Q65 105 65 80Z', default: '#D4D4D8' },
      { id: 'earL', d: 'M65 55 Q45 50 40 75 Q42 90 55 80Z', default: '#A1A1AA' },
      { id: 'earR', d: 'M135 55 Q155 50 160 75 Q158 90 145 80Z', default: '#A1A1AA' },
      { id: 'nose', d: 'M93 72 Q100 82 107 72 Q100 68 93 72Z', default: '#1E293B' },
      { id: 'tongue', d: 'M95 85 Q100 100 105 85Z', default: '#FDA4AF' },
      { id: 'tail', d: 'M140 120 Q165 100 170 80 Q173 73 168 78 Q163 90 140 115', default: '#D4D4D8' },
      { id: 'ground', d: 'M10 170 Q100 155 190 170 L190 200 L10 200Z', default: '#86EFAC' },
    ],
  },
  {
    name: 'Butterfly',
    emoji: '🦋',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'wingTL', d: 'M100 90 Q60 30 30 60 Q20 85 60 100Z', default: '#C4B5FD' },
      { id: 'wingTR', d: 'M100 90 Q140 30 170 60 Q180 85 140 100Z', default: '#C4B5FD' },
      { id: 'wingBL', d: 'M100 110 Q60 105 40 140 Q35 160 80 140Z', default: '#FCA5A5' },
      { id: 'wingBR', d: 'M100 110 Q140 105 160 140 Q165 160 120 140Z', default: '#FCA5A5' },
      { id: 'body', d: 'M96 70 Q100 65 104 70 L104 150 Q100 155 96 150Z', default: '#52525B' },
      { id: 'spotL', d: 'M60 75 A12 12 0 1 1 60 76Z', default: '#FDE68A' },
      { id: 'spotR', d: 'M140 75 A12 12 0 1 1 140 76Z', default: '#FDE68A' },
    ],
  },
  {
    name: 'Flower',
    emoji: '🌸',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'petalT', d: 'M100 50 Q80 70 85 95 Q100 85 115 95 Q120 70 100 50Z', default: '#FCA5A5' },
      { id: 'petalR', d: 'M130 100 Q120 80 100 90 Q110 100 100 115 Q120 120 130 100Z', default: '#FCA5A5' },
      { id: 'petalB', d: 'M100 140 Q120 120 115 100 Q100 110 85 100 Q80 120 100 140Z', default: '#FCA5A5' },
      { id: 'petalL', d: 'M70 100 Q80 80 100 90 Q90 100 100 115 Q80 120 70 100Z', default: '#FCA5A5' },
      { id: 'center', d: 'M100 95 A10 10 0 1 1 100 96Z', default: '#FDE68A' },
      { id: 'stem', d: 'M97 130 L97 185 L103 185 L103 130Z', default: '#4ADE80' },
      { id: 'leafL', d: 'M97 155 Q70 145 65 160 Q75 165 97 158Z', default: '#4ADE80' },
      { id: 'leafR', d: 'M103 160 Q130 150 135 165 Q125 168 103 163Z', default: '#4ADE80' },
    ],
  },
  {
    name: 'House',
    emoji: '🏠',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'wall', d: 'M40 95 L40 180 L160 180 L160 95Z', default: '#D4D4D8' },
      { id: 'roof', d: 'M30 100 L100 35 L170 100Z', default: '#EF4444' },
      { id: 'door', d: 'M85 130 L85 180 L115 180 L115 130 Q100 120 85 130Z', default: '#92400E' },
      { id: 'windowL', d: 'M50 110 L50 135 L75 135 L75 110Z', default: '#93C5FD' },
      { id: 'windowR', d: 'M125 110 L125 135 L150 135 L150 110Z', default: '#93C5FD' },
      { id: 'chimney', d: 'M135 35 L135 65 L150 65 L150 50Z', default: '#78716C' },
      { id: 'sky', d: 'M0 0 L200 0 L200 200 L0 200Z', default: '#BFDBFE' },
      { id: 'grass', d: 'M0 175 L200 175 L200 200 L0 200Z', default: '#86EFAC' },
    ],
  },
  {
    name: 'Fish',
    emoji: '🐟',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'water', d: 'M0 0 L200 0 L200 200 L0 200Z', default: '#BFDBFE' },
      { id: 'body', d: 'M60 100 Q60 65 100 55 Q140 65 150 100 Q140 135 100 145 Q60 135 60 100Z', default: '#D4D4D8' },
      { id: 'tail', d: 'M55 100 Q30 75 25 60 Q28 85 30 100 Q28 115 25 140 Q30 125 55 100Z', default: '#FCA5A5' },
      { id: 'fin', d: 'M100 60 Q115 40 120 55 Q110 60 100 60Z', default: '#FDE68A' },
      { id: 'eye', d: 'M125 90 A8 8 0 1 1 125 91Z', default: '#F8FAFC' },
      { id: 'bubble1', d: 'M155 80 A5 5 0 1 1 155 81Z', default: '#E0F2FE' },
      { id: 'bubble2', d: 'M165 65 A4 4 0 1 1 165 66Z', default: '#E0F2FE' },
      { id: 'seaweed', d: 'M160 200 Q155 170 165 150 Q170 130 160 110', default: '#4ADE80' },
    ],
  },
  {
    name: 'Star',
    emoji: '⭐',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'sky', d: 'M0 0 L200 0 L200 200 L0 200Z', default: '#1E293B' },
      { id: 'star', d: 'M100 20 L115 70 L170 70 L125 100 L140 155 L100 125 L60 155 L75 100 L30 70 L85 70Z', default: '#FDE68A' },
      { id: 'moon', d: 'M155 30 A20 20 0 1 0 165 60 A15 15 0 1 1 155 30Z', default: '#D4D4D8' },
      { id: 'hill', d: 'M0 160 Q50 130 100 145 Q150 160 200 140 L200 200 L0 200Z', default: '#166534' },
    ],
  },
  {
    name: 'Rainbow',
    emoji: '🌈',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'sky', d: 'M0 0 L200 0 L200 200 L0 200Z', default: '#BFDBFE' },
      { id: 'red', d: 'M20 140 Q20 50 100 40 Q180 50 180 140 L165 140 Q165 60 100 55 Q35 60 35 140Z', default: '#D4D4D8' },
      { id: 'orange', d: 'M35 140 Q35 65 100 55 Q165 65 165 140 L150 140 Q150 75 100 68 Q50 75 50 140Z', default: '#D4D4D8' },
      { id: 'yellow', d: 'M50 140 Q50 80 100 68 Q150 80 150 140 L135 140 Q135 90 100 80 Q65 90 65 140Z', default: '#D4D4D8' },
      { id: 'green', d: 'M65 140 Q65 92 100 80 Q135 92 135 140 L120 140 Q120 102 100 92 Q80 102 80 140Z', default: '#D4D4D8' },
      { id: 'blue', d: 'M80 140 Q80 105 100 92 Q120 105 120 140Z', default: '#D4D4D8' },
      { id: 'ground', d: 'M0 140 L200 140 L200 200 L0 200Z', default: '#86EFAC' },
      { id: 'sun', d: 'M160 35 A15 15 0 1 1 160 36Z', default: '#FDE68A' },
    ],
  },
  {
    name: 'Car',
    emoji: '🚗',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'road', d: 'M0 130 L200 130 L200 200 L0 200Z', default: '#52525B' },
      { id: 'body', d: 'M30 130 L30 100 L60 100 L80 75 L140 75 L160 100 L170 100 L170 130Z', default: '#D4D4D8' },
      { id: 'windshield', d: 'M85 100 L95 80 L135 80 L145 100Z', default: '#93C5FD' },
      { id: 'windowBack', d: 'M65 100 L75 80 L90 80 L80 100Z', default: '#93C5FD' },
      { id: 'wheelL', d: 'M55 130 A15 15 0 1 1 55 131Z', default: '#1E293B' },
      { id: 'wheelR', d: 'M145 130 A15 15 0 1 1 145 131Z', default: '#1E293B' },
      { id: 'sky', d: 'M0 0 L200 0 L200 130 L0 130Z', default: '#BFDBFE' },
      { id: 'sun', d: 'M170 25 A12 12 0 1 1 170 26Z', default: '#FDE68A' },
    ],
  },
  {
    name: 'Heart',
    emoji: '💕',
    viewBox: '0 0 200 200',
    regions: [
      { id: 'bg', d: 'M0 0 L200 0 L200 200 L0 200Z', default: '#FFF1F2' },
      { id: 'heart', d: 'M100 170 C65 140 15 110 15 65 C15 35 35 20 60 20 C75 20 90 30 100 45 C110 30 125 20 140 20 C165 20 185 35 185 65 C185 110 135 140 100 170Z', default: '#D4D4D8' },
      { id: 'sparkle1', d: 'M40 50 L45 40 L50 50 L45 55Z', default: '#FDE68A' },
      { id: 'sparkle2', d: 'M155 45 L160 35 L165 45 L160 50Z', default: '#FDE68A' },
      { id: 'sparkle3', d: 'M95 80 L100 70 L105 80 L100 85Z', default: '#FDE68A' },
    ],
  },
];

export default function ColoringBook() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState({});

  const scene = SCENES[sceneIdx];
  const sceneKey = scene.name;

  const handleRegionClick = (regionId) => {
    playColorFill();
    setFills(prev => ({
      ...prev,
      [sceneKey]: { ...(prev[sceneKey] || {}), [regionId]: selectedColor },
    }));
  };

  const resetScene = () => {
    setFills(prev => ({ ...prev, [sceneKey]: {} }));
  };

  const getFill = (region) => {
    return fills[sceneKey]?.[region.id] || region.default;
  };

  return (
    <GameShell title="Coloring Book" icon="🖍️" gameType="coloring" backTo="/games" instructions="Tap a color, then tap a shape!">
      <div className="h-full flex flex-col p-2 sm:p-4 gap-2">
        {/* Scene picker */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 flex-shrink-0">
          {SCENES.map((s, i) => (
            <motion.button key={s.name} whileTap={{ scale: 0.9 }}
              onClick={() => { setSceneIdx(i); }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-display transition-all ${
                i === sceneIdx ? 'bg-empy-pink text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}>
              {s.emoji} {s.name}
            </motion.button>
          ))}
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <svg viewBox={scene.viewBox} className="w-full h-full max-w-md max-h-[60vh] drop-shadow-xl"
            style={{ background: '#F8FAFC', borderRadius: 16 }}>
            {scene.regions.map(region => (
              <motion.path
                key={region.id}
                d={region.d}
                fill={getFill(region)}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                whileHover={{ opacity: 0.85 }}
                onClick={() => handleRegionClick(region.id)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </svg>
        </div>

        {/* Color palette */}
        <div className="flex-shrink-0 flex flex-col gap-2 items-center">
          <div className="flex gap-2 flex-wrap justify-center">
            {PALETTE.map(color => (
              <motion.button key={color} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(color)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-3 transition-all ${
                  selectedColor === color ? 'border-white scale-110 shadow-lg ring-2 ring-white/50' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }} />
            ))}
          </div>
          <button onClick={resetScene} className="btn btn-xs btn-ghost text-white/50 font-display">🗑️ Clear</button>
        </div>
      </div>
    </GameShell>
  );
}
