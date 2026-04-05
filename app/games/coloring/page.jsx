'use client';
import dynamic from 'next/dynamic';
const ColoringBook = dynamic(() => import('../../../src/games/ColoringBook'), { ssr: false });
export default function Page() { return <ColoringBook />; }
