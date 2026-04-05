'use client';
import dynamic from 'next/dynamic';
const ABCGame = dynamic(() => import('../../../src/games/ABCGame'), { ssr: false });
export default function Page() { return <ABCGame />; }
