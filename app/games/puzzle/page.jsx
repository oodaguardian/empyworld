'use client';
import dynamic from 'next/dynamic';
const PuzzleGame = dynamic(() => import('../../../src/games/PuzzleGame'), { ssr: false });
export default function Page() { return <PuzzleGame />; }
