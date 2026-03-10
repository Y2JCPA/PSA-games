'use client';

import { useState, useEffect } from 'react';
import { EventBus } from '@/game/EventBus';
import { BuildingDef, BuildingCategory } from '@/lib/types';
import { RIDES } from '@/game/data/rides';
import { SHOPS } from '@/game/data/shops';
import { QUESTS } from '@/game/data/quests';
import { DECORATIONS } from '@/game/data/decorations';
import { STAFF_DEFS } from '@/game/data/staff';

const CATEGORIES: { id: BuildingCategory | 'paths' | 'bulldoze' | 'staff'; label: string; emoji: string }[] = [
  { id: 'rides', label: 'Rides', emoji: '🎢' },
  { id: 'shops', label: 'Shops', emoji: '🏪' },
  { id: 'decor', label: 'Decor', emoji: '🌳' },
  { id: 'staff', label: 'Staff', emoji: '👷' },
  { id: 'paths', label: 'Paths', emoji: '🛤️' },
  { id: 'bulldoze', label: 'Remove', emoji: '🔨' },
];

const ITEMS_BY_CATEGORY: Record<string, BuildingDef[]> = {
  rides: RIDES,
  shops: SHOPS,
  decor: DECORATIONS,
};

const UNLOCK_REQUIREMENTS = new Map<string, string>();

for (const quest of QUESTS) {
  const requirement = (() => {
    switch (quest.type) {
      case 'build_rides':
        return `Build ${quest.target} rides`;
      case 'earn_gold':
        return `Earn ${quest.target.toLocaleString()} gold`;
      case 'guest_count':
        return `Reach ${quest.target} guests`;
      case 'build_shops':
        return `Build ${quest.target} shops`;
      case 'reach_rating':
        return `Reach ${quest.target}-star rating`;
    }
  })();

  for (const rewardId of [...(quest.rewardRideIds ?? []), ...(quest.rewardShopIds ?? [])]) {
    UNLOCK_REQUIREMENTS.set(rewardId, requirement);
  }
}

export default function BuildMenu() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BuildingDef | null>(null);
  const [rideCamData, setRideCamData] = useState<{
    id: string; def: BuildingDef; gridX: number; gridY: number;
    level?: number; broken?: boolean;
  } | null>(null);
  const [unlockedRideIds, setUnlockedRideIds] = useState<string[]>([]);
  const [unlockedShopIds, setUnlockedShopIds] = useState<string[]>([]);

  useEffect(() => {
    const onBuildingSelected = (data: {
      id: string; def: BuildingDef; gridX: number; gridY: number;
      level?: number; broken?: boolean;
    }) => {
      setRideCamData(data);
    };

    const onRideCamExit = () => {
      setRideCamData(null);
    };

    const onQuestUpdate = (data: { unlockedRideIds: string[]; unlockedShopIds: string[] }) => {
      setUnlockedRideIds(data.unlockedRideIds);
      setUnlockedShopIds(data.unlockedShopIds);
    };

    EventBus.on('building-selected', onBuildingSelected);
    EventBus.on('exit-ride-cam', onRideCamExit);
    EventBus.on('quest-update', onQuestUpdate);

    return () => {
      EventBus.off('building-selected', onBuildingSelected);
      EventBus.off('exit-ride-cam', onRideCamExit);
      EventBus.off('quest-update', onQuestUpdate);
    };
  }, []);

  const handleCategoryClick = (catId: string) => {
    if (catId === activeCategory) {
      setActiveCategory(null);
      setSelectedItem(null);
      EventBus.emit('cancel-mode');
      return;
    }

    setActiveCategory(catId);
    setSelectedItem(null);

    if (catId === 'paths') {
      EventBus.emit('set-path-mode');
    } else if (catId === 'bulldoze') {
      EventBus.emit('set-bulldoze-mode');
    } else {
      EventBus.emit('cancel-mode');
    }
  };

  const handleItemClick = (item: BuildingDef) => {
    if (item.category === 'rides' && !unlockedRideIds.includes(item.id)) return;
    if (item.category === 'shops' && !unlockedShopIds.includes(item.id)) return;
    setSelectedItem(item);
    EventBus.emit('set-build-mode', item);
  };

  const handleStaffClick = (staffId: string) => {
    EventBus.emit('set-staff-mode', staffId);
  };

  const handleWatchRide = () => {
    if (rideCamData) {
      EventBus.emit('watch-ride', rideCamData);
      setRideCamData(null);
    }
  };

  const handleUpgradeRide = () => {
    if (rideCamData) {
      EventBus.emit('upgrade-ride', rideCamData.id);
      setRideCamData(null);
    }
  };

  const handleRepairRide = () => {
    if (rideCamData) {
      EventBus.emit('repair-ride', rideCamData.id);
      setRideCamData(null);
    }
  };

  const isItemLocked = (item: BuildingDef): boolean => {
    if (item.category === 'rides') return !unlockedRideIds.includes(item.id);
    if (item.category === 'shops') return !unlockedShopIds.includes(item.id);
    return false;
  };

  const getUnlockRequirement = (item: BuildingDef): string | null => {
    return UNLOCK_REQUIREMENTS.get(item.id) ?? null;
  };

  const items = activeCategory ? ITEMS_BY_CATEGORY[activeCategory] : null;

  return (
    <>
      {/* Ride info popup with upgrade/repair */}
      {rideCamData && (
        <div className="fixed left-1/2 -translate-x-1/2 z-30 bg-dragon-dark/95 border-2 border-dragon-gold rounded-xl p-4 min-w-64 text-center" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
          <div className="text-2xl mb-1">{rideCamData.def.emoji}</div>
          <div className="text-dragon-gold font-[family-name:var(--font-family-fantasy)] text-lg">{rideCamData.def.name}</div>

          {rideCamData.level !== undefined && rideCamData.level > 0 && (
            <div className="text-sm text-yellow-300 mb-1">
              {'★'.repeat(rideCamData.level)}{'☆'.repeat(3 - rideCamData.level)}
            </div>
          )}

          {rideCamData.broken && (
            <div className="text-red-400 text-sm mb-2 animate-pulse">⚠️ BROKEN</div>
          )}

          <div className="flex gap-2 justify-center flex-wrap mt-2">
            {rideCamData.def.category === 'rides' && (
              <button onClick={handleWatchRide} className="bg-dragon-orange px-3 py-2 rounded-lg text-white font-bold hover:bg-orange-500 transition-colors">
                🎬
              </button>
            )}

            {rideCamData.def.category === 'rides' && rideCamData.level !== undefined && rideCamData.level < 3 && !rideCamData.broken && (
              <button onClick={handleUpgradeRide} className="bg-blue-600 px-3 py-2 rounded-lg text-white font-bold hover:bg-blue-500 transition-colors">
                ⬆️ 💰{rideCamData.def.cost * (rideCamData.level || 1)}
              </button>
            )}

            {rideCamData.broken && (
              <button onClick={handleRepairRide} className="bg-green-600 px-3 py-2 rounded-lg text-white font-bold hover:bg-green-500 transition-colors">
                🔧 💰{Math.floor(rideCamData.def.cost * 0.3)}
              </button>
            )}

            <button onClick={() => setRideCamData(null)} className="bg-dragon-purple px-3 py-2 rounded-lg text-white hover:bg-purple-600 transition-colors">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Items panel */}
      {items && items.length > 0 && (
        <div className="fixed left-0 right-0 z-20 px-2" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
          <div className="bg-dragon-dark/95 border-2 border-dragon-gold rounded-xl p-2 max-w-2xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {items.map(item => {
                const locked = isItemLocked(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg min-w-20 transition-all ${
                      locked
                        ? 'bg-gray-700/70 border border-gray-500 opacity-80 grayscale cursor-not-allowed'
                        : selectedItem?.id === item.id
                          ? 'bg-dragon-gold/30 border-2 border-dragon-gold scale-105'
                          : 'bg-dragon-purple/40 border border-transparent hover:bg-dragon-purple/60'
                    }`}
                    disabled={locked}
                  >
                    <span className="text-2xl">{locked ? `🔒 ${item.emoji}` : item.emoji}</span>
                    <span className={`text-xs font-bold mt-1 whitespace-nowrap ${locked ? 'text-gray-200' : 'text-white'}`}>{item.name}</span>
                    <span className={`text-xs ${locked ? 'text-gray-300' : 'text-dragon-gold'}`}>💰{item.cost}</span>
                    {item.income > 0 && (
                      <span className={`text-xs ${locked ? 'text-gray-400' : 'text-green-400'}`}>+{item.income}g</span>
                    )}
                    {locked && getUnlockRequirement(item) && (
                      <span className="text-[10px] text-center text-gray-300 mt-1 leading-tight max-w-24">
                        {getUnlockRequirement(item)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Staff panel */}
      {activeCategory === 'staff' && (
        <div className="fixed left-0 right-0 z-20 px-2" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
          <div className="bg-dragon-dark/95 border-2 border-dragon-gold rounded-xl p-2 max-w-2xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STAFF_DEFS.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffClick(staff.id)}
                  className="flex-shrink-0 flex flex-col items-center p-2 rounded-lg min-w-20 transition-all bg-dragon-purple/40 border border-transparent hover:bg-dragon-purple/60"
                >
                  <span className="text-2xl">{staff.emoji}</span>
                  <span className="text-xs text-white font-bold mt-1 whitespace-nowrap">{staff.name}</span>
                  <span className="text-xs text-dragon-gold">💰{staff.cost}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-dragon-dark/95 border-t-2 border-dragon-gold px-2 pt-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-center gap-3 max-w-lg mx-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex flex-col items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-dragon-gold text-dragon-dark scale-110 shadow-lg'
                  : 'bg-dragon-purple text-white hover:bg-purple-600 active:bg-purple-700'
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs mt-0.5">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
