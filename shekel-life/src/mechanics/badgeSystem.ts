import { BadgeId, LevelState, Badge } from '../store/types';

interface BadgeCheck {
  id: BadgeId;
  check: (levelState: LevelState, badges: Badge[]) => boolean;
}

const badgeChecks: BadgeCheck[] = [
  {
    id: 'firstSave',
    check: (level) => level.totalSaved > 0,
  },
  {
    id: 'goalGetter',
    check: (level) => level.savingGoal?.completed === true,
  },
  {
    id: 'tzedakahStar',
    check: (level) => level.consecutiveMaaserPeriods >= 3,
  },
  {
    id: 'plannerPro',
    check: (level) => {
      // Awarded when completing a yom tov week without negative balance
      // This is checked externally when a yom tov week completes
      return false; // Triggered manually
    },
  },
  {
    id: 'noImpulse',
    check: (level) => level.impulseResistCount >= 3,
  },
  {
    id: 'investorBadge',
    check: () => false, // Triggered when Level 4 investing module is completed
  },
  {
    id: 'shekelLegend',
    check: () => false, // Triggered when all levels are completed
  },
];

/**
 * Check which new badges should be awarded based on current game state
 * Returns array of badge IDs that should be newly earned
 */
export const checkBadges = (levelState: LevelState, currentBadges: Badge[]): BadgeId[] => {
  const newBadges: BadgeId[] = [];

  for (const badgeCheck of badgeChecks) {
    const existingBadge = currentBadges.find((b) => b.id === badgeCheck.id);
    if (existingBadge && !existingBadge.earned && badgeCheck.check(levelState, currentBadges)) {
      newBadges.push(badgeCheck.id);
    }
  }

  return newBadges;
};

/**
 * Get badge display info
 */
export const getBadgeEmoji = (badgeId: BadgeId): string => {
  const emojiMap: Record<BadgeId, string> = {
    firstSave: '💰',
    goalGetter: '🎯',
    tzedakahStar: '🤝',
    plannerPro: '📅',
    noImpulse: '🚫',
    investorBadge: '📈',
    shekelLegend: '🏆',
  };
  return emojiMap[badgeId];
};
