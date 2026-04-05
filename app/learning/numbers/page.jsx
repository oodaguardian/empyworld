'use client';
import dynamic from 'next/dynamic';
const NumberGame = dynamic(() => import('../../../src/games/NumberGame'), { ssr: false });
export default function Page() { return <NumberGame />; }
