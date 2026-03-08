'use client';

import { useState, useEffect } from 'react';
import { EventBus } from '@/game/EventBus';
import { BuildingDef, BuildingCategory } from '@/lib/types';
import { RIDES } from '@/game/data/rides';
import { SHOPS } from '@/game/data/shops';
import { DECORATIONS } from '@/game/data/decorations';

const CATEGORIES: { id: BuildingCategory | 'paths' | 'bulldoze'; label: string; emoji: string }[] = [
  { id: 'rides', label: 'Rides', emoji: '🎢' },
  { id: 'shops', label: 'Shops', emoji: '🏪' },
  { id: 'decor', label: 'Decor', emoji: '🌳' },
  { id: 'paths', label: 'Paths', emoji: '🛤️' },
  { id: 'bulldoze', label: 'Remove', emoji: '🔨' },
];

const ITEMS_BY_CATEGORY: Record<string, BuildingDef[]> = {
  rides: RIDES,
  shops: SHOPS,
  decor: DECORATIONS,
};

export default function BuildMenu() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BuildingDef | null>(null);
  const [rideCamData, setRideCamData] = useState<{id: string; def: BuildingDef; gridX: number; gridY: number} | null>(null);

  useEffect(() => {
    const onBuildingSelected = (data: {id: string; def: BuildingDef; gridX: number; gridY: number}) => {
      if (data.def.category === 'rides') {
        setRideCamData(data);
      }
    };

    const onRideCamExit = () => {
      setRideCamData(null);
    };

    EventBus.on('building-selected', onBuildingSelected);
    EventBus.on('exit-ride-cam', onRideCamExit);

    return () => {
      EventBus.off('building-selected', onBuildingSelected);
      EventBus.off('exit-ride-cam', onRideCamExit);
    };
  }, []);

  const handleCategoryClick = (catId: string) => {
    if (catId === activeCategory) {
      // Close menu
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
    setSelectedItem(item);
    EventBus.emit('set-build-mode', item);
  };

  const handleWatchRide = () => {
    if (rideCamData) {
      EventBus.emit('watch-ride', rideCamData);
      setRideCamData(null);
    }
  };

  const items = activeCategory ? ITEMS_BY_CATEGORY[activeCategory] : null;

  return (
    <>
      {/* Ride info popup */}
      {rideCamData && (
        <div className="fixed left-1/2 -translate-x-1/2 z-30 bg-dragon-dark/95 border-2 border-dragon-gold rounded-xl p-4 min-w-64 text-center" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
          <div className="text-2xl mb-1">{rideCamData.def.emoji}</div>
          <div className="text-dragon-gold font-[family-name:var(--font-family-fantasy)] text-lg">{rideCamData.def.name}</div>
          <div className="text-gray-300 text-sm mb-3">{rideCamData.def.description}</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleWatchRide}
              className="bg-dragon-orange px-4 py-2 rounded-lg text-white font-bold text-lg hover:bg-orange-500 transition-colors"
            >
              🎬 Watch Ride!
            </button>
            <button
              onClick={() => setRideCamData(null)}
              className="bg-dragon-purple px-4 py-2 rounded-lg text-white hover:bg-purple-600 transition-colors"
            >
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
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg min-w-20 transition-all ${
                    selectedItem?.id === item.id
                      ? 'bg-dragon-gold/30 border-2 border-dragon-gold scale-105'
                      : 'bg-dragon-purple/40 border border-transparent hover:bg-dragon-purple/60'
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs text-white font-bold mt-1 whitespace-nowrap">{item.name}</span>
                  <span className="text-xs text-dragon-gold">💰{item.cost}</span>
                  {item.income > 0 && (
                    <span className="text-xs text-green-400">+{item.income}g</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom toolbar — uses safe area inset to clear mobile browser chrome */}
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
