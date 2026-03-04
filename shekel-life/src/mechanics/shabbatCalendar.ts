import { DayType } from '../store/types';

// Day names for display (Sunday=1 through Saturday=7, Israeli week)
const dayNames = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbat'],
  he: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
};

// Major Yamim Tovim that affect spending/income (simplified for game)
// Weeks in the game year that have yom tov
const yomTovWeeks: Record<number, string> = {
  3: 'Rosh Hashana',
  4: 'Yom Kippur',
  5: 'Sukkot',
  6: 'Simchat Torah',
  15: 'Chanukah',
  24: 'Purim',
  27: 'Pesach',
  28: 'Pesach (Chol HaMoed)',
  34: 'Yom HaAtzmaut',
  38: 'Shavuot',
};

/**
 * Get the day type for a given day number (1-7)
 * Day 7 (Saturday/Shabbat) is always a no-spend day
 */
export const getDayType = (dayNumber: number, weekNumber: number): DayType => {
  if (dayNumber === 7) return 'shabbat';
  if (yomTovWeeks[weekNumber] && (dayNumber === 1 || dayNumber === 2)) return 'yom_tov';
  return 'regular';
};

/**
 * Check if the current day is a no-spend day
 */
export const isNoSpendDay = (dayNumber: number, weekNumber: number): boolean => {
  const dayType = getDayType(dayNumber, weekNumber);
  return dayType === 'shabbat' || dayType === 'yom_tov';
};

/**
 * Check if the current week is a yom tov week (reduced income)
 */
export const isYomTovWeek = (weekNumber: number): boolean => {
  return weekNumber in yomTovWeeks;
};

/**
 * Get yom tov name for a given week
 */
export const getYomTovName = (weekNumber: number): string | undefined => {
  return yomTovWeeks[weekNumber];
};

/**
 * Get day name for display
 */
export const getDayName = (dayNumber: number, language: 'en' | 'he'): string => {
  return dayNames[language][dayNumber - 1] || '';
};

/**
 * Calculate reduced income factor for yom tov weeks
 * During yom tov weeks, income is reduced (can't work as much)
 */
export const getIncomeMultiplier = (weekNumber: number): number => {
  if (!isYomTovWeek(weekNumber)) return 1.0;
  // Longer holidays = more income reduction
  const holiday = yomTovWeeks[weekNumber];
  if (holiday?.includes('Pesach') || holiday?.includes('Sukkot')) return 0.4;
  if (holiday?.includes('Rosh Hashana') || holiday?.includes('Shavuot')) return 0.6;
  return 0.8;
};
