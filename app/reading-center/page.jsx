'use client';
import dynamic from 'next/dynamic';
const ReadingCenter = dynamic(() => import('../../src/views/ReadingCenter'), { ssr: false });
export default function Page() { return <ReadingCenter />; }
