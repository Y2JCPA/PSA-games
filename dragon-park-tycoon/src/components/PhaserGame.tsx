'use client';

import { useEffect, useRef } from 'react';
import { EventBus } from '@/game/EventBus';

interface PhaserGameProps {
  onSceneReady?: () => void;
  parkData?: string | null;
}

export default function PhaserGame({ onSceneReady, parkData }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    import('@/game/main').then(({ createGame }) => {
      if (gameRef.current) return;
      const game = createGame('game-container');
      gameRef.current = game;

      EventBus.once('scene-ready', () => {
        if (parkData && !loadedRef.current) {
          loadedRef.current = true;
          EventBus.emit('load-save', parkData);
        }
        onSceneReady?.();
      });
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id="game-container"
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
