export type Gender = 'boy' | 'girl';
export type Language = 'en' | 'he';
export type LevelId = 1 | 2 | 3 | 4;
export type LevelStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';
export type DayType = 'regular' | 'shabbat' | 'yom_tov';

export type BadgeId =
  | 'firstSave'
  | 'goalGetter'
  | 'tzedakahStar'
  | 'plannerPro'
  | 'noImpulse'
  | 'investorBadge'
  | 'shekelLegend';

export interface ShopItem {
  id: string;
  nameKey: string;
  price: number;
  category: 'candy' | 'snack' | 'fruit' | 'toy' | 'game' | 'craft' | 'book';
  isImmediate: boolean; // true = consumed immediately (candy), false = lasting item
  emoji: string;
}

export interface BasketItem {
  item: ShopItem;
  quantity: number;
}

export interface SavingGoal {
  itemId: string;
  targetAmount: number;
  currentAmount: number;
  completed: boolean;
}

export interface Badge {
  id: BadgeId;
  earned: boolean;
  earnedAt?: number;
  emoji: string;
}

export interface LevelState {
  id: LevelId;
  status: LevelStatus;
  gender?: Gender;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalSaved: number;
  maaserEnabled: boolean;
  maaserTotal: number;
  savingGoal?: SavingGoal;
  currentWeek: number;
  currentDay: number;
  impulseResistCount: number;
  consecutiveMaaserPeriods: number;
  inventory: string[]; // item IDs of owned lasting items
}

export interface GameState {
  language: Language;
  levels: Record<LevelId, LevelState>;
  badges: Badge[];
  currentLevel?: LevelId;
  hasSeenIntro: boolean;
}
