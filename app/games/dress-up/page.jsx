'use client';
import dynamic from 'next/dynamic';
const DressUp = dynamic(() => import('../../../src/games/DressUp'), { ssr: false });
export default function Page() { return <DressUp />; }
