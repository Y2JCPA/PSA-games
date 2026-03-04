import { LevelState, LevelId } from '../store/types';
import { isYomTovWeek } from './shabbatCalendar';

export interface Consequence {
  id: string;
  messageKey: string;
  severity: 'mild' | 'moderate' | 'severe';
  balanceImpact?: number; // additional cost penalty
}

/**
 * Check for consequences based on the current game state
 * Returns an array of consequences that should trigger
 */
export const checkConsequences = (level: LevelState): Consequence[] => {
  const consequences: Consequence[] = [];

  // Check if player is broke during a special event week
  if (level.balance <= 0 && isYomTovWeek(level.currentWeek)) {
    consequences.push({
      id: 'yomTovBroke',
      messageKey: 'reducedIncome',
      severity: 'moderate',
    });
  }

  return consequences;
};

/**
 * Level 1 specific consequences
 */
export const checkLevel1Consequences = (
  level: LevelState,
  justBoughtImmediate: boolean,
  savingGoalExists: boolean,
): Consequence[] => {
  const consequences: Consequence[] = [];

  // If they spent all money on immediate items and have a saving goal
  if (level.balance <= 0 && savingGoalExists && !level.savingGoal?.completed) {
    consequences.push({
      id: 'cantSaveForGoal',
      messageKey: 'toyOutOfStock',
      severity: 'moderate',
    });
  }

  // Shabbat and forgot to buy
  if (level.currentDay === 7 && level.inventory.length === 0) {
    consequences.push({
      id: 'noShabbatSnacks',
      messageKey: 'noSnacks',
      severity: 'mild',
    });
  }

  return consequences;
};

/**
 * Level 2 specific consequences
 */
export const checkLevel2Consequences = (level: LevelState): Consequence[] => {
  const consequences: Consequence[] = [];

  if (level.balance < 0) {
    consequences.push({
      id: 'cantAffordSupplies',
      messageKey: 'cantAffordSupplies',
      severity: 'moderate',
    });
  }

  return consequences;
};

/**
 * Level 3 specific consequences
 */
export const checkLevel3Consequences = (level: LevelState): Consequence[] => {
  const consequences: Consequence[] = [];

  if (isYomTovWeek(level.currentWeek) && level.balance < 50) {
    consequences.push({
      id: 'yomTovUnprepared',
      messageKey: 'reducedIncome',
      severity: 'severe',
    });
  }

  return consequences;
};

/**
 * Get a random event for the current week (used in Levels 2-4)
 */
export interface RandomEvent {
  id: string;
  descriptionKey: string;
  cost: number;
  isRequired: boolean;
}

const level2Events: RandomEvent[] = [
  { id: 'tiyul', descriptionKey: 'tiyulMissed', cost: 30, isRequired: true },
  { id: 'birthday', descriptionKey: 'giftCantBuy', cost: 25, isRequired: false },
  { id: 'purim', descriptionKey: 'giftCantBuy', cost: 40, isRequired: false },
];

export const getRandomEvent = (levelId: LevelId, weekNumber: number): RandomEvent | null => {
  // Trigger events on specific weeks for predictability in early levels
  if (levelId === 2) {
    if (weekNumber === 4) return level2Events[0];
    if (weekNumber === 8) return level2Events[1];
    if (weekNumber === 12) return level2Events[2];
  }
  return null;
};
