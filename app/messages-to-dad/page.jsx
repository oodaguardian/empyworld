'use client';
import dynamic from 'next/dynamic';

const MessagesToDad = dynamic(() => import('../../src/views/MessagesToDad'), { ssr: false });
export default function Page() { return <MessagesToDad />; }
