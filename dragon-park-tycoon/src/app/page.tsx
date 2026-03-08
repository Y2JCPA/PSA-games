'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: number;
  username: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
      .catch(() => {});
  }, []);

  const handleLogin = async (username: string) => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (data.user) {
        // Store user info in sessionStorage
        sessionStorage.setItem('userId', String(data.user.id));
        sessionStorage.setItem('username', data.user.username);
        if (data.parkData) {
          sessionStorage.setItem('parkData', data.parkData);
        } else {
          sessionStorage.removeItem('parkData');
        }
        router.push('/play');
      }
    } catch {
      alert('Something went wrong!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-dragon-dark via-dragon-purple to-dragon-dark">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-[family-name:var(--font-family-fantasy)] text-dragon-gold drop-shadow-lg mb-2">
          🐉 Dragon Park Tycoon
        </h1>
        <p className="text-xl text-dragon-light/80 font-[family-name:var(--font-family-fantasy)]">
          Build your own fantasy creature theme park!
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-dragon-dark/80 border-2 border-dragon-gold rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-[family-name:var(--font-family-fantasy)] text-dragon-gold text-center mb-6">
          Enter Your Name
        </h2>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin(name)}
            placeholder="Your adventurer name..."
            maxLength={20}
            className="flex-1 bg-dragon-purple/30 border-2 border-dragon-gold/50 rounded-xl px-4 py-3 text-xl text-white placeholder-gray-400 focus:border-dragon-gold focus:outline-none font-[family-name:var(--font-family-fantasy)]"
            autoFocus
          />
          <button
            onClick={() => handleLogin(name)}
            disabled={loading || !name.trim()}
            className="bg-dragon-gold text-dragon-dark px-6 py-3 rounded-xl text-xl font-bold font-[family-name:var(--font-family-fantasy)] hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Play!'}
          </button>
        </div>

        {/* Existing users */}
        {users.length > 0 && (
          <div>
            <h3 className="text-lg font-[family-name:var(--font-family-fantasy)] text-dragon-light/60 mb-3 text-center">
              — or pick your name —
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user.username)}
                  className="bg-dragon-purple hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-lg font-[family-name:var(--font-family-fantasy)] transition-colors border border-dragon-gold/30"
                >
                  {user.username}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="mt-6 flex gap-4">
        <a
          href="/leaderboard"
          className="text-dragon-gold hover:text-yellow-300 font-[family-name:var(--font-family-fantasy)] text-lg"
        >
          🏆 Leaderboard
        </a>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-5xl opacity-30 animate-pulse">🐉</div>
      <div className="absolute top-20 right-10 text-4xl opacity-20 animate-bounce">🔥</div>
      <div className="absolute bottom-20 left-20 text-4xl opacity-20 animate-pulse">🏰</div>
      <div className="absolute bottom-10 right-20 text-5xl opacity-30 animate-bounce">⚔️</div>
    </div>
  );
}
