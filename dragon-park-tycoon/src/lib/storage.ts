// Client-side storage for Dragon Park Tycoon
// Uses localStorage so it works on Vercel (no server DB needed)

const USERS_KEY = 'dpt_users';
const SAVE_PREFIX = 'dpt_save_';
const LEADERBOARD_KEY = 'dpt_leaderboard';

export interface DPTUser {
  id: string;
  username: string;
}

export interface DPTSave {
  userId: string;
  parkName: string;
  parkData: string;
  savedAt: string;
}

export interface DPTLeaderboardEntry {
  userId: string;
  username: string;
  parkName: string;
  rating: number;
  gold: number;
  updatedAt: string;
}

function getUsers(): DPTUser[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users: DPTUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loginOrCreate(username: string): { user: DPTUser; hasSave: boolean; parkData: string | null } {
  const trimmed = username.trim().slice(0, 20);
  const users = getUsers();
  let user = users.find(u => u.username.toLowerCase() === trimmed.toLowerCase());
  
  if (!user) {
    user = { id: `user_${Date.now()}`, username: trimmed };
    users.push(user);
    saveUsers(users);
  }

  const save = localStorage.getItem(SAVE_PREFIX + user.id);
  let parkData: string | null = null;
  if (save) {
    const parsed: DPTSave = JSON.parse(save);
    parkData = parsed.parkData;
  }

  return { user, hasSave: !!save, parkData };
}

export function getAllUsers(): DPTUser[] {
  return getUsers();
}

export function savePark(userId: string, parkData: string, parkName: string, rating: number, gold: number) {
  const save: DPTSave = {
    userId,
    parkName,
    parkData,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVE_PREFIX + userId, JSON.stringify(save));

  // Update leaderboard
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  const lb = getLeaderboard();
  const idx = lb.findIndex(e => e.userId === userId);
  const entry: DPTLeaderboardEntry = {
    userId,
    username: user.username,
    parkName,
    rating,
    gold,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    lb[idx] = entry;
  } else {
    lb.push(entry);
  }
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(lb));
}

export function loadPark(userId: string): DPTSave | null {
  const raw = localStorage.getItem(SAVE_PREFIX + userId);
  return raw ? JSON.parse(raw) : null;
}

export function getLeaderboard(): DPTLeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  const lb: DPTLeaderboardEntry[] = raw ? JSON.parse(raw) : [];
  return lb.sort((a, b) => b.rating - a.rating);
}
