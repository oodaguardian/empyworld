'use client';
import dynamic from 'next/dynamic';
const ColorsGame = dynamic(() => import('../../../src/games/ColorsGame'), { ssr: false });
export default function Page() { return <ColorsGame />; }
