import { QuestDef } from '@/lib/types';

export const QUESTS: QuestDef[] = [
  {
    id: 'quest_build_3_rides',
    type: 'build_rides',
    target: 3,
    rewardRideIds: ['griffin_carousel'],
    iconLeft: '🎢×3',
    iconRight: '🔓🦅',
  },
  {
    id: 'quest_earn_3000',
    type: 'earn_gold',
    target: 3000,
    rewardShopIds: ['enchanted_ice_cream'],
    iconLeft: '💰3K',
    iconRight: '🔓🍦',
  },
  {
    id: 'quest_8_guests',
    type: 'guest_count',
    target: 8,
    rewardRideIds: ['chimera_chase'],
    iconLeft: '👥8',
    iconRight: '🔓🦁',
  },
  {
    id: 'quest_build_2_shops',
    type: 'build_shops',
    target: 2,
    rewardShopIds: ['firebreather_bbq'],
    iconLeft: '🏪×2',
    iconRight: '🔓🍖',
  },
  {
    id: 'quest_earn_8000',
    type: 'earn_gold',
    target: 8000,
    rewardRideIds: ['phoenix_drop'],
    iconLeft: '💰8K',
    iconRight: '🔓🔥',
  },
  {
    id: 'quest_build_5_rides',
    type: 'build_rides',
    target: 5,
    rewardRideIds: ['wyvern_whirlwind'],
    iconLeft: '🎢×5',
    iconRight: '🔓🌪️',
  },
  {
    id: 'quest_15_guests',
    type: 'guest_count',
    target: 15,
    rewardRideIds: ['ice_golem_coaster'],
    iconLeft: '👥15',
    iconRight: '🔓🧊',
  },
  {
    id: 'quest_build_4_shops',
    type: 'build_shops',
    target: 4,
    rewardShopIds: ['crystal_candy', 'goblin_juice'],
    iconLeft: '🏪×4',
    iconRight: '🔓🍬🧃',
  },
  {
    id: 'quest_3_star',
    type: 'reach_rating',
    target: 3,
    rewardRideIds: ['pegasus_swing'],
    iconLeft: '⭐⭐⭐',
    iconRight: '🔓🪽',
  },
  {
    id: 'quest_earn_20000',
    type: 'earn_gold',
    target: 20000,
    rewardRideIds: ['shadow_steed'],
    rewardShopIds: ['wizard_coffee', 'dragon_souvenirs'],
    iconLeft: '💰20K',
    iconRight: '🔓🌙☕🎁',
  },
  {
    id: 'quest_25_guests',
    type: 'guest_count',
    target: 25,
    rewardRideIds: ['thunderbird_launch', 'volcano_wyrm'],
    iconLeft: '👥25',
    iconRight: '🔓⚡🌋',
  },
  {
    id: 'quest_5_star',
    type: 'reach_rating',
    target: 5,
    rewardRideIds: ['elder_dragon'],
    iconLeft: '⭐⭐⭐⭐⭐',
    iconRight: '🔓👑',
  },
];

// Rides that are available from the start (not locked behind quests)
export const STARTER_RIDE_IDS = ['dragon_flight', 'sea_serpent_splash', 'unicorn_trail', 'basilisk_bumper'];

// Shops available from the start
export const STARTER_SHOP_IDS = ['potion_stand', 'dragon_egg_bakery', 'magic_wand_shop'];
