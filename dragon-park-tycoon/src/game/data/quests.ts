import { QuestDef } from '@/lib/types';

// Starter rides (always available): dragon_flight, sea_serpent_splash, unicorn_trail, basilisk_bumper
// Unlockable rides: griffin_carousel, phoenix_drop, wyvern_whirlwind, pegasus_swing

export const QUESTS: QuestDef[] = [
  {
    id: 'quest_build_3_rides',
    type: 'build_rides',
    target: 3,
    rewardRideId: 'griffin_carousel',
    iconLeft: '🎢×3',
    iconRight: '🔓🦅',
  },
  {
    id: 'quest_earn_5000',
    type: 'earn_gold',
    target: 5000,
    rewardRideId: 'phoenix_drop',
    iconLeft: '💰5K',
    iconRight: '🔓🔥',
  },
  {
    id: 'quest_10_guests',
    type: 'guest_count',
    target: 10,
    rewardRideId: 'wyvern_whirlwind',
    iconLeft: '👥10',
    iconRight: '🔓🌪️',
  },
  {
    id: 'quest_build_2_shops',
    type: 'build_shops',
    target: 2,
    rewardShopId: 'enchanted_ice_cream',
    iconLeft: '🏪×2',
    iconRight: '🔓🍦',
  },
  {
    id: 'quest_3_star',
    type: 'reach_rating',
    target: 3,
    rewardRideId: 'pegasus_swing',
    iconLeft: '⭐⭐⭐',
    iconRight: '🔓🪽',
  },
];

// Rides that are available from the start (not locked behind quests)
export const STARTER_RIDE_IDS = ['dragon_flight', 'sea_serpent_splash', 'unicorn_trail', 'basilisk_bumper'];

// Shops available from the start
export const STARTER_SHOP_IDS = ['potion_stand', 'dragon_egg_bakery', 'magic_wand_shop'];
