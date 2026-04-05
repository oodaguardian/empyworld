'use client';
import dynamic from 'next/dynamic';
const MemoryMatch = dynamic(() => import('../../../src/games/MemoryMatch'), { ssr: false });
export default function Page() { return <MemoryMatch />; }
