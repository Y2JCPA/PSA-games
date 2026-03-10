export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface SaveData {
  id: number;
  user_id: number;
  park_name: string;
  park_data: string;
  saved_at: string;
}

export interface LeaderboardEntry {
  id: number;
  user_id: number;
  username: string;
  park_name: string;
  rating: number;
  gold: number;
  updated_at: string;
}

export type BuildingCategory = 'rides' | 'shops' | 'decor' | 'paths';

export interface BuildingDef {
  id: string;
  name: string;
  category: BuildingCategory;
  cost: number;
  income: number;
  width: number;
  height: number;
  emoji: string;
  description: string;
  color: number;
}

export interface PlacedBuilding {
  id: string;
  defId: string;
  gridX: number;
  gridY: number;
  placed_at: number;
}

export interface ParkState {
  buildings: PlacedBuilding[];
  gold: number;
  rating: number;
  guestCount: number;
  totalEarned: number;
  totalSpent: number;
  tickCount: number;
}

export interface GuestState {
  id: string;
  x: number;
  y: number;
  happiness: number;
  gold: number;
  state: 'entering' | 'walking' | 'queuing' | 'riding' | 'shopping' | 'leaving';
  target: string | null;
}

// --- Quest System ---

export interface QuestDef {
  id: string;
  type: 'build_rides' | 'earn_gold' | 'guest_count' | 'build_shops' | 'reach_rating';
  target: number;
  rewardRideIds?: string[];
  rewardShopIds?: string[];
  iconLeft: string;
  iconRight: string;
}

export interface QuestProgress {
  questId: string;
  current: number;
  completed: boolean;
}

// --- Staff System ---

export type StaffType = 'janitor' | 'mechanic' | 'entertainer';

export interface StaffDef {
  id: StaffType;
  name: string;
  emoji: string;
  cost: number;
  color: number;
}

export interface PlacedStaff {
  id: string;
  type: StaffType;
  gridX: number;
  gridY: number;
}

// --- Ride Upgrades & Breakdowns ---

export interface RideUpgradeState {
  buildingId: string;
  level: number;
}

export interface RideBreakdownState {
  buildingId: string;
  broken: boolean;
  repairTimer: number;
}
