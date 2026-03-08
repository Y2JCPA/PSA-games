'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard, type DPTLeaderboardEntry } from '@/lib/storage';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<DPTLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEntries(getLeaderboard());
    setLoading(false);
  }, []);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push('⭐');
      else stars.push('☆');
    }
    return stars.join('');
  };

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dragon-dark via-dragon-purple to-dragon-dark p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-family-fantasy)] text-dragon-gold mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-dragon-light/60 font-[family-name:var(--font-family-fantasy)]">
            The greatest Dragon Parks in the realm!
          </p>
        </div>

        {/* Back link */}
        <div className="mb-6 text-center">
          <a
            href="/"
            className="text-dragon-gold hover:text-yellow-300 font-[family-name:var(--font-family-fantasy)] text-lg"
          >
            ⬅️ Back to Home
          </a>
        </div>

        {loading ? (
          <div className="text-center text-dragon-gold text-xl animate-pulse font-[family-name:var(--font-family-fantasy)]">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center bg-dragon-dark/80 border-2 border-dragon-gold/30 rounded-xl p-8">
            <div className="text-4xl mb-4">🐉</div>
            <p className="text-dragon-light/60 text-lg font-[family-name:var(--font-family-fantasy)]">
              No parks yet! Be the first to build one!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.userId}
                className={`bg-dragon-dark/80 border-2 rounded-xl p-4 flex items-center gap-4 ${
                  index < 3 ? 'border-dragon-gold' : 'border-dragon-gold/30'
                }`}
              >
                <div className="text-2xl w-10 text-center font-bold">
                  {getMedal(index)}
                </div>
                <div className="flex-1">
                  <div className="font-[family-name:var(--font-family-fantasy)] text-lg text-white">
                    {entry.username}
                  </div>
                  <div className="text-sm text-dragon-light/60">
                    {entry.parkName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{renderStars(entry.rating)}</div>
                  <div className="text-dragon-gold font-bold">💰 {entry.gold.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
