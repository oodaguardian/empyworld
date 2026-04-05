'use client';
import dynamic from 'next/dynamic';
const MovieUpload = dynamic(() => import('../../../src/views/MovieUpload'), { ssr: false });
export default function Page() { return <MovieUpload />; }
