'use client';
import dynamic from 'next/dynamic';
const Games = dynamic(() => import('../../src/views/Games'), { ssr: false });
export default function Page() { return <Games />; }
