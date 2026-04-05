'use client';
import dynamic from 'next/dynamic';
const RacingGame = dynamic(() => import('../../../src/games/RacingGame'), { ssr: false });
export default function Page() { return <RacingGame />; }
