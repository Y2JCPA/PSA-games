/**
 * Chore system for Level 1 — kids earn shekalim by doing household chores.
 * Each chore has a payout, emoji, time cost (how many chores per day), and category.
 * Kids can do up to 3 chores per day (maxChoresPerDay).
 */

export interface Chore {
  id: string;
  nameKey: string;
  emoji: string;
  payout: number;
  category: 'easy' | 'medium' | 'hard';
}

export const MAX_CHORES_PER_DAY = 3;

export const chores: Chore[] = [
  // Easy (₪1)
  { id: 'read_book',    nameKey: 'readBook',    emoji: '📖', payout: 1, category: 'easy' },
  { id: 'make_bed',     nameKey: 'makeBed',     emoji: '🛏️', payout: 1, category: 'easy' },
  { id: 'tidy_toys',    nameKey: 'tidyToys',    emoji: '🧸', payout: 1, category: 'easy' },

  // Medium (₪2-3)
  { id: 'set_table',    nameKey: 'setTable',    emoji: '🍽️', payout: 2, category: 'medium' },
  { id: 'fold_laundry', nameKey: 'foldLaundry', emoji: '👕', payout: 2, category: 'medium' },
  { id: 'take_trash',   nameKey: 'takeTrash',   emoji: '🗑️', payout: 3, category: 'medium' },
  { id: 'help_cook',    nameKey: 'helpCook',    emoji: '🥘', payout: 3, category: 'medium' },

  // Hard (₪4)
  { id: 'sweep_floor',  nameKey: 'sweepFloor',  emoji: '🧹', payout: 4, category: 'hard' },
  { id: 'wash_floor',   nameKey: 'washFloor',   emoji: '🪣', payout: 4, category: 'hard' },
  { id: 'wash_dishes',  nameKey: 'washDishes',  emoji: '🫧', payout: 4, category: 'hard' },
];

/**
 * Get a random selection of available chores for the day (5 out of 10).
 * This keeps it fresh — not every chore is available every day.
 */
export const getDailyChores = (seed?: number): Chore[] => {
  const shuffled = [...chores].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
};

/**
 * Get chore by ID
 */
export const getChoreById = (id: string): Chore | undefined =>
  chores.find((c) => c.id === id);
