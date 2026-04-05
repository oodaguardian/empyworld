'use client';
import dynamic from 'next/dynamic';
const Blank = dynamic(() => import('../../src/views/Blank'), { ssr: false });
export default function Page() { return <Blank />; }
