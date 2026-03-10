import { QuestDef, QuestProgress } from '@/lib/types';
import { QUESTS, STARTER_RIDE_IDS, STARTER_SHOP_IDS } from '../data/quests';
import { EventBus } from '../EventBus';

export class QuestSystem {
  private quests: QuestDef[] = QUESTS;
  private progress: QuestProgress[] = [];
  private unlockedRideIds: Set<string> = new Set(STARTER_RIDE_IDS);
  private unlockedShopIds: Set<string> = new Set(STARTER_SHOP_IDS);
  private activeQuestIndex = 0;
  private peakGuestCount = 0;

  constructor() {
    this.progress = this.quests.map(q => ({
      questId: q.id,
      current: 0,
      completed: false,
    }));
  }

  getActiveQuest(): QuestDef | null {
    if (this.activeQuestIndex >= this.quests.length) return null;
    return this.quests[this.activeQuestIndex];
  }

  getActiveProgress(): QuestProgress | null {
    if (this.activeQuestIndex >= this.progress.length) return null;
    return this.progress[this.activeQuestIndex];
  }

  isRideUnlocked(rideId: string): boolean {
    return this.unlockedRideIds.has(rideId);
  }

  isShopUnlocked(shopId: string): boolean {
    return this.unlockedShopIds.has(shopId);
  }

  getUnlockedRideIds(): string[] {
    return Array.from(this.unlockedRideIds);
  }

  getUnlockedShopIds(): string[] {
    return Array.from(this.unlockedShopIds);
  }

  // Call this from ParkScene whenever state changes
  evaluate(stats: {
    rideCount: number;
    shopCount: number;
    totalEarned: number;
    guestCount: number;
    rating: number;
  }) {
    if (stats.guestCount > this.peakGuestCount) {
      this.peakGuestCount = stats.guestCount;
    }

    const quest = this.getActiveQuest();
    const prog = this.getActiveProgress();
    if (!quest || !prog || prog.completed) return;

    let current = 0;
    switch (quest.type) {
      case 'build_rides':
        current = stats.rideCount;
        break;
      case 'earn_gold':
        current = stats.totalEarned;
        break;
      case 'guest_count':
        current = this.peakGuestCount;
        break;
      case 'build_shops':
        current = stats.shopCount;
        break;
      case 'reach_rating':
        current = stats.rating;
        break;
    }

    prog.current = Math.min(current, quest.target);

    if (prog.current >= quest.target && !prog.completed) {
      prog.completed = true;
      for (const rideId of quest.rewardRideIds ?? []) {
        this.unlockedRideIds.add(rideId);
      }
      for (const shopId of quest.rewardShopIds ?? []) {
        this.unlockedShopIds.add(shopId);
      }

      EventBus.emit('quest-completed', quest);

      this.activeQuestIndex++;

      this.emitState();
    } else {
      this.emitState();
    }
  }

  emitState() {
    const quest = this.getActiveQuest();
    const prog = this.getActiveProgress();
    EventBus.emit('quest-update', {
      quest,
      progress: prog,
      unlockedRideIds: Array.from(this.unlockedRideIds),
      unlockedShopIds: Array.from(this.unlockedShopIds),
      allCompleted: this.activeQuestIndex >= this.quests.length,
    });
  }

  // Save/load support
  serialize(): {
    activeQuestIndex: number;
    progress: QuestProgress[];
    unlockedRideIds: string[];
    unlockedShopIds: string[];
    peakGuestCount: number;
  } {
    return {
      activeQuestIndex: this.activeQuestIndex,
      progress: this.progress,
      unlockedRideIds: Array.from(this.unlockedRideIds),
      unlockedShopIds: Array.from(this.unlockedShopIds),
      peakGuestCount: this.peakGuestCount,
    };
  }

  loadFromSave(data: {
    activeQuestIndex?: number;
    progress?: QuestProgress[];
    unlockedRideIds?: string[];
    unlockedShopIds?: string[];
    peakGuestCount?: number;
  }) {
    if (data.activeQuestIndex !== undefined) this.activeQuestIndex = data.activeQuestIndex;
    if (data.progress) {
      // Merge saved progress with current quest definitions
      for (let i = 0; i < this.progress.length && i < data.progress.length; i++) {
        this.progress[i].current = data.progress[i].current;
        this.progress[i].completed = data.progress[i].completed;
      }
    }
    if (data.unlockedRideIds) {
      this.unlockedRideIds = new Set([...STARTER_RIDE_IDS, ...data.unlockedRideIds]);
    }
    if (data.unlockedShopIds) {
      this.unlockedShopIds = new Set([...STARTER_SHOP_IDS, ...data.unlockedShopIds]);
    }
    if (data.peakGuestCount !== undefined) this.peakGuestCount = data.peakGuestCount;
  }
}
