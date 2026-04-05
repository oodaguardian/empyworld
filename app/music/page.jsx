'use client';
import dynamic from 'next/dynamic';
const Music = dynamic(() => import('../../src/views/Music'), { ssr: false });
export default function Page() { return <Music />; }
