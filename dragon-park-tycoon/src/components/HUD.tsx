'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventBus } from '@/game/EventBus';

interface GameState {
  gold: number;
  rating: number;
  guestCount: number;
  gameSpeed: number;
  paused: boolean;
}

interface HUDProps {
  userId: string;
  username: string;
}

export default function HUD({ userId, username }: HUDProps) {
  const [state, setState] = useState<GameState>({
    gold: 2000,
    rating: 0,
    guestCount: 0,
    gameSpeed: 1,
    paused: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onStateUpdate = (newState: GameState) => setState(newState);
    const onMessage = (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), 2000);
    };
    const onSaveReady = async (data: string) => {
      try {
        const { savePark } = await import('@/lib/storage');
        savePark(userId, data, `${username}'s Dragon Park`, state.rating, state.gold);
        setMessage('Game saved!');
        setTimeout(() => setMessage(null), 2000);
      } catch {
        setMessage('Save failed!');
        setTimeout(() => setMessage(null), 2000);
      }
      setSaving(false);
    };

    EventBus.on('state-update', onStateUpdate);
    EventBus.on('show-message', onMessage);
    EventBus.on('save-data-ready', onSaveReady);

    // Auto-save every 60 seconds
    const autoSaveInterval = setInterval(() => {
      EventBus.emit('save-game');
    }, 60000);

    return () => {
      EventBus.off('state-update', onStateUpdate);
      EventBus.off('show-message', onMessage);
      EventBus.off('save-data-ready', onSaveReady);
      clearInterval(autoSaveInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, username]);

  const handleSave = useCallback(() => {
    setSaving(true);
    EventBus.emit('save-game');
  }, []);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push('⭐');
      else if (i === full && half) stars.push('🌟');
      else stars.push('☆');
    }
    return stars.join('');
  };

  return (
    <>
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-dragon-dark/90 border-b-2 border-dragon-gold px-2 py-1">
        <div className="flex items-center justify-between flex-wrap gap-1 max-w-full">
          {/* Gold */}
          <div className="flex items-center gap-1 bg-dragon-purple/50 rounded-lg px-3 py-1">
            <span className="text-xl">💰</span>
            <span className="text-dragon-gold font-bold text-lg font-[family-name:var(--font-family-fantasy)]">
              {state.gold.toLocaleString()}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 bg-dragon-purple/50 rounded-lg px-3 py-1">
            <span className="text-sm tracking-wider">{renderStars(state.rating)}</span>
            <span className="text-dragon-gold text-sm font-bold">{state.rating.toFixed(1)}</span>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-1 bg-dragon-purple/50 rounded-lg px-3 py-1">
            <span className="text-xl">👥</span>
            <span className="text-white font-bold">{state.guestCount}</span>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => EventBus.emit('toggle-pause')}
              className={`px-2 py-1 rounded text-lg ${state.paused ? 'bg-red-600' : 'bg-dragon-purple/50'}`}
            >
              {state.paused ? '▶️' : '⏸️'}
            </button>
            {[1, 2, 3].map(speed => (
              <button
                key={speed}
                onClick={() => EventBus.emit('set-speed', speed)}
                className={`px-2 py-1 rounded text-sm font-bold ${
                  state.gameSpeed === speed && !state.paused
                    ? 'bg-dragon-gold text-dragon-dark'
                    : 'bg-dragon-purple/50 text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Save & Settings */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-dragon-green px-3 py-1 rounded text-sm font-bold hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              {saving ? '...' : '💾 Save'}
            </button>
            <a href="/leaderboard" className="bg-dragon-purple px-3 py-1 rounded text-sm font-bold hover:bg-purple-600 transition-colors">
              🏆
            </a>
            <a href="/" className="bg-dragon-orange/80 px-2 py-1 rounded text-sm hover:bg-orange-500 transition-colors">
              🚪
            </a>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-dragon-purple border-2 border-dragon-gold rounded-xl px-6 py-3 font-[family-name:var(--font-family-fantasy)] text-dragon-gold text-lg animate-bounce">
          {message}
        </div>
      )}
    </>
  );
}
