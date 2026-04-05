'use client';
import dynamic from 'next/dynamic';
const BubblePop = dynamic(() => import('../../../src/games/BubblePop'), { ssr: false });
export default function Page() { return <BubblePop />; }
