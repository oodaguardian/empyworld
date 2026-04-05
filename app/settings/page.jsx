'use client';
import dynamic from 'next/dynamic';
const Settings = dynamic(() => import('../../src/views/Settings'), { ssr: false });
export default function Page() { return <Settings />; }
