import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';

export async function POST(req: NextRequest) {
  const { userId, parkData, parkName, rating, gold } = await req.json();
  if (!userId || !parkData) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const db = getDb();
  const name = parkName || 'My Dragon Park';

  // Upsert save (keep only latest)
  const existing = db.prepare('SELECT id FROM saves WHERE user_id = ?').get(userId) as { id: number } | undefined;
  if (existing) {
    db.prepare('UPDATE saves SET park_data = ?, park_name = ?, saved_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(parkData, name, existing.id);
  } else {
    db.prepare('INSERT INTO saves (user_id, park_data, park_name) VALUES (?, ?, ?)')
      .run(userId, parkData, name);
  }

  // Update leaderboard
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string };
  const existingLb = db.prepare('SELECT id FROM leaderboard WHERE user_id = ?').get(userId) as { id: number } | undefined;
  if (existingLb) {
    db.prepare('UPDATE leaderboard SET park_name = ?, rating = ?, gold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, rating || 0, gold || 0, existingLb.id);
  } else {
    db.prepare('INSERT INTO leaderboard (user_id, username, park_name, rating, gold) VALUES (?, ?, ?, ?, ?)')
      .run(userId, user.username, name, rating || 0, gold || 0);
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const db = getDb();
  const save = db.prepare('SELECT * FROM saves WHERE user_id = ? ORDER BY saved_at DESC LIMIT 1').get(userId);
  return NextResponse.json({ save: save || null });
}
