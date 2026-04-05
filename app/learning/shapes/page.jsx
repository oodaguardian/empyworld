'use client';
import dynamic from 'next/dynamic';
const ShapesGame = dynamic(() => import('../../../src/games/ShapesGame'), { ssr: false });
export default function Page() { return <ShapesGame />; }
