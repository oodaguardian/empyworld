'use client';
import dynamic from 'next/dynamic';
const LearningGames = dynamic(() => import('../../src/views/LearningGames'), { ssr: false });
export default function Page() { return <LearningGames />; }
