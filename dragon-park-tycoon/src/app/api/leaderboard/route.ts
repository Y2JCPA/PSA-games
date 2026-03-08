import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';

export async function GET() {
  const db = getDb();
  const entries = db.prepare(
    'SELECT * FROM leaderboard ORDER BY rating DESC, gold DESC LIMIT 50'
  ).all();
  return NextResponse.json({ entries });
}
