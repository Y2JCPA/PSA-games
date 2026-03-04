import { create } from 'zustand';
import { GameState, Gender, LevelId, LevelState, Badge, BadgeId, SavingGoal, Language } from './types';
import i18n from '../i18n';

const createInitialLevelState = (id: LevelId, status: 'unlocked' | 'locked'): LevelState => ({
  id,
  status,
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  totalSaved: 0,
  maaserEnabled: false,
  maaserTotal: 0,
  currentWeek: 1,
  currentDay: 1,
  impulseResistCount: 0,
  consecutiveMaaserPeriods: 0,
  inventory: [],
});

const initialBadges: Badge[] = [
  { id: 'firstSave', earned: false, emoji: '💰' },
  { id: 'goalGetter', earned: false, emoji: '🎯' },
  { id: 'tzedakahStar', earned: false, emoji: '🤝' },
  { id: 'plannerPro', earned: false, emoji: '📅' },
  { id: 'noImpulse', earned: false, emoji: '🚫' },
  { id: 'investorBadge', earned: false, emoji: '📈' },
  { id: 'shekelLegend', earned: false, emoji: '🏆' },
];

interface GameActions {
  setLanguage: (lang: Language) => void;
  setCurrentLevel: (level: LevelId) => void;
  setGender: (level: LevelId, gender: Gender) => void;
  startLevel: (level: LevelId, startingBalance: number) => void;
  addIncome: (level: LevelId, amount: number) => void;
  spend: (level: LevelId, amount: number, itemId?: string) => boolean;
  saveMoney: (level: LevelId, amount: number) => void;
  setSavingGoal: (level: LevelId, goal: SavingGoal) => void;
  addToSavingGoal: (level: LevelId, amount: number) => void;
  toggleMaaser: (level: LevelId, enabled: boolean) => void;
  addMaaser: (level: LevelId, amount: number) => void;
  incrementImpulseResist: (level: LevelId) => void;
  advanceDay: (level: LevelId) => void;
  advanceWeek: (level: LevelId) => void;
  earnBadge: (badgeId: BadgeId) => void;
  completeLevel: (level: LevelId) => void;
  addToInventory: (level: LevelId, itemId: string) => void;
  setHasSeenIntro: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  language: 'en',
  levels: {
    1: createInitialLevelState(1, 'unlocked'),
    2: createInitialLevelState(2, 'locked'),
    3: createInitialLevelState(3, 'locked'),
    4: createInitialLevelState(4, 'locked'),
  },
  badges: initialBadges,
  hasSeenIntro: false,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },

  setCurrentLevel: (level) => set({ currentLevel: level }),

  setGender: (level, gender) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: { ...state.levels[level], gender },
      },
    })),

  startLevel: (level, startingBalance) =>
    set((state) => ({
      currentLevel: level,
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          status: 'in_progress',
          balance: startingBalance,
          totalEarned: startingBalance,
        },
      },
    })),

  addIncome: (level, amount) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          balance: state.levels[level].balance + amount,
          totalEarned: state.levels[level].totalEarned + amount,
        },
      },
    })),

  spend: (level, amount, itemId) => {
    const state = get();
    if (state.levels[level].balance < amount) return false;
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          balance: state.levels[level].balance - amount,
          totalSpent: state.levels[level].totalSpent + amount,
          inventory: itemId
            ? [...state.levels[level].inventory, itemId]
            : state.levels[level].inventory,
        },
      },
    }));
    return true;
  },

  saveMoney: (level, amount) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          balance: state.levels[level].balance - amount,
          totalSaved: state.levels[level].totalSaved + amount,
        },
      },
    })),

  setSavingGoal: (level, goal) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: { ...state.levels[level], savingGoal: goal },
      },
    })),

  addToSavingGoal: (level, amount) =>
    set((state) => {
      const currentGoal = state.levels[level].savingGoal;
      if (!currentGoal) return state;
      const newAmount = Math.min(currentGoal.currentAmount + amount, currentGoal.targetAmount);
      return {
        levels: {
          ...state.levels,
          [level]: {
            ...state.levels[level],
            balance: state.levels[level].balance - amount,
            totalSaved: state.levels[level].totalSaved + amount,
            savingGoal: {
              ...currentGoal,
              currentAmount: newAmount,
              completed: newAmount >= currentGoal.targetAmount,
            },
          },
        },
      };
    }),

  toggleMaaser: (level, enabled) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: { ...state.levels[level], maaserEnabled: enabled },
      },
    })),

  addMaaser: (level, amount) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          balance: state.levels[level].balance - amount,
          maaserTotal: state.levels[level].maaserTotal + amount,
          consecutiveMaaserPeriods: state.levels[level].consecutiveMaaserPeriods + 1,
        },
      },
    })),

  incrementImpulseResist: (level) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          impulseResistCount: state.levels[level].impulseResistCount + 1,
        },
      },
    })),

  advanceDay: (level) =>
    set((state) => {
      const currentDay = state.levels[level].currentDay;
      const newDay = currentDay >= 7 ? 1 : currentDay + 1;
      const newWeek = currentDay >= 7 ? state.levels[level].currentWeek + 1 : state.levels[level].currentWeek;
      return {
        levels: {
          ...state.levels,
          [level]: {
            ...state.levels[level],
            currentDay: newDay,
            currentWeek: newWeek,
          },
        },
      };
    }),

  advanceWeek: (level) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          currentWeek: state.levels[level].currentWeek + 1,
          currentDay: 1,
        },
      },
    })),

  earnBadge: (badgeId) =>
    set((state) => ({
      badges: state.badges.map((b) =>
        b.id === badgeId ? { ...b, earned: true, earnedAt: Date.now() } : b
      ),
    })),

  completeLevel: (level) =>
    set((state) => {
      const nextLevel = (level + 1) as LevelId;
      const updatedLevels = {
        ...state.levels,
        [level]: { ...state.levels[level], status: 'completed' as const },
      };
      if (nextLevel <= 4 && state.levels[nextLevel]) {
        updatedLevels[nextLevel] = { ...state.levels[nextLevel], status: 'unlocked' as const };
      }
      return { levels: updatedLevels };
    }),

  addToInventory: (level, itemId) =>
    set((state) => ({
      levels: {
        ...state.levels,
        [level]: {
          ...state.levels[level],
          inventory: [...state.levels[level].inventory, itemId],
        },
      },
    })),

  setHasSeenIntro: () => set({ hasSeenIntro: true }),

  resetGame: () => set(initialState),
}));
