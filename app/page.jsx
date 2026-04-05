'use client';

import dynamic from 'next/dynamic';
import ClientShell from './ClientShell';

const Dashboard = dynamic(() => import('../src/components/Dashboard'), { ssr: false });

export default function HomePage() {
  return (
    <ClientShell>
      <Dashboard />
    </ClientShell>
  );
}
