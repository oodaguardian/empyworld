'use client';
import dynamic from 'next/dynamic';
const BookReader = dynamic(() => import('../../../src/games/BookReader'), { ssr: false });
export default function Page() { return <BookReader />; }
