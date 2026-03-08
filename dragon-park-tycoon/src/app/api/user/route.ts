import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const db = getDb();
  const trimmed = username.trim().slice(0, 20);

  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(trimmed) as { id: number; username: string } | undefined;
  if (!user) {
    const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(trimmed);
    user = { id: result.lastInsertRowid as number, username: trimmed };
  }

  // Check for existing save
  const save = db.prepare('SELECT * FROM saves WHERE user_id = ? ORDER BY saved_at DESC LIMIT 1').get(user.id) as { park_data: string } | undefined;

  return NextResponse.json({ user, hasSave: !!save, parkData: save?.park_data || null });
}

export async function GET() {
  const db = getDb();
  const users = db.prepare('SELECT id, username FROM users ORDER BY username').all();
  return NextResponse.json({ users });
}
