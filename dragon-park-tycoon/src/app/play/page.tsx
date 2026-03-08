'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), { ssr: false });
const HUD = dynamic(() => import('@/components/HUD'), { ssr: false });
const BuildMenu = dynamic(() => import('@/components/BuildMenu'), { ssr: false });
const QuestPanel = dynamic(() => import('@/components/QuestPanel'), { ssr: false });

export default function PlayPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [parkData, setParkData] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem('userId');
    const name = sessionStorage.getItem('username');
    const data = sessionStorage.getItem('parkData');

    if (!id || !name) {
      router.push('/');
      return;
    }

    setUserId(id);
    setUsername(name);
    setParkData(data);
    setReady(true);
  }, [router]);

  if (!ready || userId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dragon-dark">
        <div className="text-dragon-gold text-2xl font-[family-name:var(--font-family-fantasy)] animate-pulse">
          🐉 Loading your park...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-dragon-dark">
      {/* Phaser game canvas */}
      <div className="absolute inset-0" style={{ top: '44px', bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
        <PhaserGame parkData={parkData} />
      </div>

      {/* HUD overlay */}
      <HUD userId={userId} username={username} />

      {/* Quest panel */}
      <QuestPanel />

      {/* Build menu */}
      <BuildMenu />
    </div>
  );
}
