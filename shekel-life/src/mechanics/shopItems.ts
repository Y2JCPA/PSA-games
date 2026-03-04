import { ShopItem } from '../store/types';

/**
 * Level 1 makolet items — mix of immediate (candy/snacks) and lasting (toys)
 * Prices in shekalim, realistic for Israeli makolet
 */
export const level1Items: ShopItem[] = [
  // Immediate items (consumed, gone fast)
  { id: 'candy1', nameKey: 'candy', price: 3, category: 'candy', isImmediate: true, emoji: '🍬' },
  { id: 'chocolate1', nameKey: 'chocolate', price: 5, category: 'candy', isImmediate: true, emoji: '🍫' },
  { id: 'chips1', nameKey: 'chips', price: 6, category: 'snack', isImmediate: true, emoji: '🥔' },
  { id: 'icecream1', nameKey: 'iceCream', price: 8, category: 'snack', isImmediate: true, emoji: '🍦' },
  { id: 'juice1', nameKey: 'juice', price: 4, category: 'snack', isImmediate: true, emoji: '🧃' },
  { id: 'cookie1', nameKey: 'cookie', price: 7, category: 'snack', isImmediate: true, emoji: '🍪' },

  // Fruit (immediate but healthier)
  { id: 'apple1', nameKey: 'apple', price: 2, category: 'fruit', isImmediate: true, emoji: '🍎' },
  { id: 'banana1', nameKey: 'banana', price: 2, category: 'fruit', isImmediate: true, emoji: '🍌' },

  // Lasting items (toys — require saving up)
  { id: 'stickers1', nameKey: 'stickers', price: 10, category: 'craft', isImmediate: false, emoji: '⭐' },
  { id: 'ball1', nameKey: 'ball', price: 15, category: 'toy', isImmediate: false, emoji: '🏀' },
  { id: 'crayons1', nameKey: 'crayons', price: 20, category: 'craft', isImmediate: false, emoji: '🖍️' },
  { id: 'book1', nameKey: 'book', price: 25, category: 'book', isImmediate: false, emoji: '📖' },
  { id: 'puzzle1', nameKey: 'puzzle', price: 35, category: 'game', isImmediate: false, emoji: '🧩' },
  { id: 'toy1', nameKey: 'toy', price: 40, category: 'toy', isImmediate: false, emoji: '🚗' },
  { id: 'doll1', nameKey: 'doll', price: 45, category: 'toy', isImmediate: false, emoji: '🧸' },
  { id: 'lego1', nameKey: 'lego', price: 60, category: 'toy', isImmediate: false, emoji: '🧱' },
  { id: 'boardgame1', nameKey: 'boardGame', price: 50, category: 'game', isImmediate: false, emoji: '🎲' },
  { id: 'stuffed1', nameKey: 'stuffedAnimal', price: 55, category: 'toy', isImmediate: false, emoji: '🐻' },
];

/**
 * Get items available for immediate purchase (snacks & candy)
 */
export const getImmediateItems = (): ShopItem[] =>
  level1Items.filter((item) => item.isImmediate);

/**
 * Get items that require saving (toys & lasting items)
 */
export const getGoalItems = (): ShopItem[] =>
  level1Items.filter((item) => !item.isImmediate);

/**
 * Get item by ID
 */
export const getItemById = (id: string): ShopItem | undefined =>
  level1Items.find((item) => item.id === id);
