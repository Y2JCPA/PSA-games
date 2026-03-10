'use client';

import { useState, useEffect } from 'react';
import { EventBus } from '@/game/EventBus';
import { QuestDef, QuestProgress } from '@/lib/types';
import { RIDES } from '@/game/data/rides';
import { SHOPS } from '@/game/data/shops';

interface QuestState {
  quest: QuestDef | null;
  progress: QuestProgress | null;
  allCompleted: boolean;
}

const BUILDING_NAME_MAP = new Map(
  [...RIDES, ...SHOPS].map(def => [def.id, def.name]),
);

export default function QuestPanel() {
  const [questState, setQuestState] = useState<QuestState>({
    quest: null,
    progress: null,
    allCompleted: false,
  });
  const [collapsed, setCollapsed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [unlockedName, setUnlockedName] = useState('');

  useEffect(() => {
    const onQuestUpdate = (data: QuestState & { unlockedRideIds: string[]; unlockedShopIds: string[] }) => {
      setQuestState({
        quest: data.quest,
        progress: data.progress,
        allCompleted: data.allCompleted,
      });
    };

    const onQuestCompleted = (quest: QuestDef) => {
      const unlockedNames = [
        ...(quest.rewardRideIds ?? []),
        ...(quest.rewardShopIds ?? []),
      ].map(id => BUILDING_NAME_MAP.get(id) ?? id);
      const name = unlockedNames.join(', ');
      setUnlockedName(name);
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
    };

    EventBus.on('quest-update', onQuestUpdate);
    EventBus.on('quest-completed', onQuestCompleted);

    return () => {
      EventBus.off('quest-update', onQuestUpdate);
      EventBus.off('quest-completed', onQuestCompleted);
    };
  }, []);

  const { quest, progress, allCompleted } = questState;

  if (!quest && !allCompleted) return null;

  const progressRatio = quest && progress
    ? Math.min(1, progress.current / quest.target)
    : 0;

  return (
    <>
      {/* Celebration overlay */}
      {celebrating && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="animate-bounce text-center">
              <div className="text-6xl mb-2">🎉🎊🎉</div>
              <div className="text-3xl text-dragon-gold font-bold bg-dragon-dark/80 rounded-xl px-6 py-3 border-2 border-dragon-gold">
              🔓 {unlockedName}
              </div>
            </div>
          </div>
        )}

      {/* Quest panel */}
      <div
        className="fixed z-20 left-1/2 -translate-x-1/2"
        style={{ top: '48px' }}
      >
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="bg-dragon-dark/90 border-2 border-dragon-gold rounded-full px-4 py-1 text-lg"
          >
            📜
          </button>
        ) : (
          <div className="bg-dragon-dark/95 border-2 border-dragon-gold rounded-xl px-4 py-2 min-w-48 max-w-72">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm text-dragon-gold font-bold">📜</span>
              <button
                onClick={() => setCollapsed(true)}
                className="text-gray-400 hover:text-white text-xs px-1"
              >
                ▲
              </button>
            </div>

            {allCompleted ? (
              <div className="text-center text-dragon-gold text-lg py-1">
                🏆 ⭐ 🎉
              </div>
            ) : quest && progress ? (
              <>
                {/* Quest icons */}
                <div className="flex items-center justify-center gap-2 text-xl mb-1">
                  <span>{quest.iconLeft}</span>
                  <span className="text-gray-400">→</span>
                  <span>{quest.iconRight}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressRatio * 100}%`,
                      background: progressRatio >= 1
                        ? 'linear-gradient(90deg, #ffd700, #ff8800)'
                        : 'linear-gradient(90deg, #4488ff, #44ccff)',
                    }}
                  />
                </div>

                {/* Progress numbers */}
                <div className="text-center text-xs text-gray-300 mt-1">
                  {progress.current} / {quest.target}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
