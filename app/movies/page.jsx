'use client';
import dynamic from 'next/dynamic';
const Movies = dynamic(() => import('../../src/views/Movies'), { ssr: false });
export default function Page() { return <Movies />; }
