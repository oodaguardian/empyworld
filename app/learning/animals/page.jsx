'use client';
import dynamic from 'next/dynamic';
const AnimalsGame = dynamic(() => import('../../../src/games/AnimalsGame'), { ssr: false });
export default function Page() { return <AnimalsGame />; }
