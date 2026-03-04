import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store';
import { BudgetDashboard } from '../../components/BudgetDashboard';
import { ConsequenceModal } from '../../components/ConsequenceModal';
import { MaaserModal } from '../../components/MaaserModal';
import { colors, fonts, spacing, borderRadius } from '../../theme';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Level2View =
  | 'intro'
  | 'characterSelect'
  | 'howItWorks'
  | 'budgetAllocate'
  | 'weeklyEvents'
  | 'weekSummary'
  | 'gameWin'
  | 'gameOver';

interface BudgetAllocation {
  needs: number;
  wants: number;
  savings: number;
  maaser: number;
}

interface WeekEvent {
  id: string;
  type: 'cost' | 'bonus';
  amount: number;
  emoji: string;
  descriptionKey: string;
  consequenceKey?: string;
}

interface EventResult {
  event: WeekEvent;
  paid: boolean;
}

// ─── Game Data ──────────────────────────────────────────────────────────────────

const TOTAL_WEEKS = 8;
const WEEKLY_INCOME = 50;
const MIN_NEEDS = 10;
const MAASER_AMOUNT = 5; // 10% of 50

// Predefined events per week (1-indexed, weeks 1..8)
const WEEK_EVENTS: WeekEvent[][] = [
  // Week 1 — easy warm-up
  [
    {
      id: 'supplies',
      type: 'cost',
      amount: 15,
      emoji: '📝',
      descriptionKey: 'level2Events.supplies',
      consequenceKey: 'suppliesMissed',
    },
  ],
  // Week 2 — bonus!
  [
    {
      id: 'chanukahGelt',
      type: 'bonus',
      amount: 30,
      emoji: '🕎',
      descriptionKey: 'level2Events.chanukahGelt',
    },
  ],
  // Week 3 — moderate
  [
    {
      id: 'birthday',
      type: 'cost',
      amount: 25,
      emoji: '🎁',
      descriptionKey: 'level2Events.birthday',
      consequenceKey: 'giftCantBuy',
    },
  ],
  // Week 4 — planning challenge
  [
    {
      id: 'tiyul',
      type: 'cost',
      amount: 30,
      emoji: '🎒',
      descriptionKey: 'level2Events.tiyul',
      consequenceKey: 'tiyulMissed',
    },
  ],
  // Week 5 — unexpected expense
  [
    {
      id: 'lostBroke',
      type: 'cost',
      amount: 15,
      emoji: '😬',
      descriptionKey: 'level2Events.lostBroke',
    },
  ],
  // Week 6 — big cost!
  [
    {
      id: 'purim',
      type: 'cost',
      amount: 50,
      emoji: '🎭',
      descriptionKey: 'level2Events.purim',
      consequenceKey: 'purimMissed',
    },
  ],
  // Week 7 — social
  [
    {
      id: 'friendMovie',
      type: 'cost',
      amount: 20,
      emoji: '🎬',
      descriptionKey: 'level2Events.friendMovie',
      consequenceKey: 'movieMissed',
    },
  ],
  // Week 8 — easy finish
  [
    {
      id: 'bookFair',
      type: 'cost',
      amount: 12,
      emoji: '📚',
      descriptionKey: 'level2Events.bookFair',
      consequenceKey: 'bookMissed',
    },
  ],
];

// ─── Main Component ─────────────────────────────────────────────────────────────

export const Level2Screen: React.FC = () => {
  const { t } = useTranslation();
  const { levels, setGender, startLevel, addIncome, spend, saveMoney, addMaaser, toggleMaaser, advanceWeek, completeLevel, earnBadge } = useGameStore();
  const level = levels[2];

  const [view, setView] = useState<Level2View>(
    level.status === 'in_progress' ? 'budgetAllocate' : 'intro'
  );
  const [showMaaser, setShowMaaser] = useState(false);
  const [allocation, setAllocation] = useState<BudgetAllocation>({
    needs: 20,
    wants: 15,
    savings: 15,
    maaser: 0,
  });
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eventResults, setEventResults] = useState<EventResult[]>([]);
  const [activeConsequenceKey, setActiveConsequenceKey] = useState<string | null>(null);

  const currentWeek = level.currentWeek;
  const weekEvents = WEEK_EVENTS[Math.min(currentWeek - 1, WEEK_EVENTS.length - 1)] || [];

  // ─── Budget allocation helpers ──────────────────────────────────────────────

  const totalAllocated = allocation.needs + allocation.wants + allocation.savings + allocation.maaser;
  const allocationRemaining = WEEKLY_INCOME - totalAllocated;

  const adjustAllocation = useCallback((
    key: keyof BudgetAllocation,
    delta: number,
  ) => {
    setAllocation((prev) => {
      const newVal = prev[key] + delta;
      if (newVal < 0) return prev;
      if (key === 'needs' && newVal < MIN_NEEDS) return prev;
      const newTotal = totalAllocated + delta;
      if (newTotal > WEEKLY_INCOME) return prev;
      return { ...prev, [key]: newVal };
    });
  }, [totalAllocated]);

  // ─── Game flow callbacks ────────────────────────────────────────────────────

  const handleStartLevel = useCallback((gender: 'boy' | 'girl') => {
    setGender(2, gender);
  }, [setGender]);

  const handleConfirmStart = useCallback(() => {
    if (!level.gender) return;
    startLevel(2, 0);
    setShowMaaser(true);
    setView('howItWorks');
  }, [level.gender, startLevel]);

  const handleMaaserAccept = useCallback(() => {
    toggleMaaser(2, true);
    setAllocation((prev) => ({ ...prev, maaser: MAASER_AMOUNT, wants: Math.max(0, prev.wants - MAASER_AMOUNT) }));
    setShowMaaser(false);
  }, [toggleMaaser]);

  const handleMaaserDecline = useCallback(() => {
    setShowMaaser(false);
  }, []);

  const handleConfirmBudget = useCallback(() => {
    if (allocationRemaining !== 0) return;
    if (allocation.needs < MIN_NEEDS) return;

    // Give income for the week
    addIncome(2, WEEKLY_INCOME);

    // Apply maaser if enabled
    if (level.maaserEnabled && allocation.maaser > 0) {
      addMaaser(2, allocation.maaser);
    }

    // Apply savings
    if (allocation.savings > 0) {
      saveMoney(2, allocation.savings);
      earnBadge('firstSave');
    }

    // Reset event tracking for this week
    setCurrentEventIndex(0);
    setEventResults([]);
    setView('weeklyEvents');
  }, [allocationRemaining, allocation, level.maaserEnabled, addIncome, addMaaser, saveMoney, earnBadge]);

  const handlePayEvent = useCallback((event: WeekEvent) => {
    const success = spend(2, event.amount);
    const result: EventResult = { event, paid: success };
    setEventResults((prev) => [...prev, result]);

    if (!success && event.consequenceKey) {
      setActiveConsequenceKey(event.consequenceKey);
      return; // will advance after modal dismissed
    }

    advanceToNextEvent(event);
  }, [spend]);

  const handleBonusEvent = useCallback((event: WeekEvent) => {
    addIncome(2, event.amount);
    setEventResults((prev) => [...prev, { event, paid: true }]);
    advanceToNextEvent(event);
  }, [addIncome]);

  const advanceToNextEvent = useCallback((event: WeekEvent) => {
    const nextIndex = currentEventIndex + 1;
    if (nextIndex >= weekEvents.length) {
      setView('weekSummary');
    } else {
      setCurrentEventIndex(nextIndex);
    }
  }, [currentEventIndex, weekEvents.length]);

  const handleConsequenceDismiss = useCallback(() => {
    setActiveConsequenceKey(null);
    const currentEvent = weekEvents[currentEventIndex];
    advanceToNextEvent(currentEvent);
  }, [currentEventIndex, weekEvents, advanceToNextEvent]);

  const handleNextWeek = useCallback(() => {
    const lvl = levels[2];
    if (lvl.balance < 0) {
      setView('gameOver');
      return;
    }

    advanceWeek(2);
    const nextWeek = lvl.currentWeek + 1;

    if (nextWeek > TOTAL_WEEKS) {
      // Check win condition
      completeLevel(2);
      earnBadge('plannerPro');
      setView('gameWin');
      return;
    }

    // Reset for next week
    setAllocation({
      needs: level.maaserEnabled ? 20 : 20,
      wants: level.maaserEnabled ? 15 : 15,
      savings: 15,
      maaser: level.maaserEnabled ? MAASER_AMOUNT : 0,
    });
    setCurrentEventIndex(0);
    setEventResults([]);
    setView('budgetAllocate');
  }, [levels, advanceWeek, completeLevel, earnBadge, level.maaserEnabled]);

  const handleReset = useCallback(() => {
    startLevel(2, 0);
    setAllocation({ needs: 20, wants: 15, savings: 15, maaser: 0 });
    setCurrentEventIndex(0);
    setEventResults([]);
    setView('characterSelect');
  }, [startLevel]);

  // ─── Views ──────────────────────────────────────────────────────────────────

  if (view === 'intro') {
    return (
      <SafeAreaView style={styles.introContainer}>
        <Text style={styles.levelEmoji}>📚</Text>
        <Text style={styles.introTitle}>{t('levels.level2.title')}</Text>
        <Text style={styles.introSubtitle}>{t('levels.level2.subtitle')}</Text>
        <Text style={styles.introText}>{t('levels.level2.intro')}</Text>
        <TouchableOpacity style={styles.startButton} onPress={() => setView('characterSelect')}>
          <Text style={styles.startText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'characterSelect') {
    const charName = level.gender === 'girl'
      ? t('levels.level2.girlName')
      : level.gender === 'boy' ? t('levels.level2.boyName') : '';

    return (
      <SafeAreaView style={styles.introContainer}>
        <Text style={styles.levelEmoji}>📚</Text>
        <Text style={styles.introTitle}>{t('levels.level2.title')}</Text>
        <Text style={styles.chooseLabel}>{t('common.chooseCharacter')}</Text>

        <View style={styles.characters}>
          <TouchableOpacity
            style={[styles.charCard, level.gender === 'boy' && styles.charSelected]}
            onPress={() => handleStartLevel('boy')}
          >
            <Text style={styles.avatar}>👦</Text>
            <Text style={styles.charName}>{t('levels.level2.boyName')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.charCard, level.gender === 'girl' && styles.charSelected]}
            onPress={() => handleStartLevel('girl')}
          >
            <Text style={styles.avatar}>👧</Text>
            <Text style={styles.charName}>{t('levels.level2.girlName')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.startButton, !level.gender && styles.disabledButton]}
          onPress={handleConfirmStart}
          disabled={!level.gender}
        >
          <Text style={styles.startText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>

        <MaaserModal
          visible={showMaaser}
          onAccept={handleMaaserAccept}
          onDecline={handleMaaserDecline}
        />
      </SafeAreaView>
    );
  }

  if (view === 'howItWorks') {
    const charName = level.gender === 'girl'
      ? t('levels.level2.girlName')
      : t('levels.level2.boyName');
    return (
      <SafeAreaView style={styles.howContainer}>
        <ScrollView contentContainerStyle={styles.howScroll}>
          <Text style={styles.howTitle}>{t('level2HowItWorks.title')}</Text>
          <Text style={styles.howGreeting}>
            {t('level2HowItWorks.greeting', { name: charName })}
          </Text>

          {[
            { emoji: '💰', title: t('level2HowItWorks.step1title'), text: t('level2HowItWorks.step1text') },
            { emoji: '📊', title: t('level2HowItWorks.step2title'), text: t('level2HowItWorks.step2text') },
            { emoji: '⚡', title: t('level2HowItWorks.step3title'), text: t('level2HowItWorks.step3text') },
            { emoji: '🏆', title: t('level2HowItWorks.step4title'), text: t('level2HowItWorks.step4text') },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepCard}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <Text style={styles.stepNumber}>{step.title}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
              {i < 3 && <View style={styles.stepArrow}><Text style={styles.arrowText}>⬇️</Text></View>}
            </React.Fragment>
          ))}

          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>{t('level2HowItWorks.tip')}</Text>
          </View>

          <TouchableOpacity
            style={styles.letsGoButton}
            onPress={() => setView('budgetAllocate')}
          >
            <Text style={styles.letsGoText}>{t('level2HowItWorks.letsGo')} 🎉</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'budgetAllocate') {
    const weekNum = currentWeek;
    const isValid = allocationRemaining === 0 && allocation.needs >= MIN_NEEDS;

    const categories: Array<{ key: keyof BudgetAllocation; label: string; desc: string; color: string; min: number }> = [
      { key: 'needs', label: t('level2Ui.needs'), desc: t('level2Ui.needsDesc'), color: colors.primary, min: MIN_NEEDS },
      { key: 'wants', label: t('level2Ui.wants'), desc: t('level2Ui.wantsDesc'), color: colors.warning, min: 0 },
      { key: 'savings', label: t('level2Ui.savings'), desc: t('level2Ui.savingsDesc'), color: colors.success, min: 0 },
      ...(level.maaserEnabled
        ? [{ key: 'maaser' as keyof BudgetAllocation, label: t('level2Ui.maaser'), desc: t('level2Ui.maaserDesc'), color: colors.maaser, min: 0 }]
        : []),
    ];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.weekBadge}>
            {t('level2Ui.weekOf', { week: weekNum, total: TOTAL_WEEKS })}
          </Text>
          <Text style={styles.sectionTitle}>{t('level2Ui.allocateTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('level2Ui.allocateSubtitle')}</Text>

          <View style={styles.incomeCard}>
            <Text style={styles.incomeEmoji}>💰</Text>
            <Text style={styles.incomeLabel}>{t('level2Events.weeklyIncomeArrived')}</Text>
            <Text style={styles.incomeAmount}>₪{WEEKLY_INCOME}</Text>
          </View>

          {categories.map((cat) => (
            <View key={cat.key} style={styles.allocationCard}>
              <View style={styles.allocHeader}>
                <View style={[styles.colorBubble, { backgroundColor: cat.color }]} />
                <View style={styles.allocLabels}>
                  <Text style={styles.allocLabel}>{cat.label}</Text>
                  <Text style={styles.allocDesc}>{cat.desc}</Text>
                </View>
                <Text style={styles.allocAmount}>₪{allocation[cat.key]}</Text>
              </View>
              <View style={styles.allocButtons}>
                <TouchableOpacity
                  style={[styles.adjButton, styles.adjMinus]}
                  onPress={() => adjustAllocation(cat.key, -5)}
                >
                  <Text style={styles.adjText}>−5</Text>
                </TouchableOpacity>
                <View style={styles.allocBar}>
                  <View
                    style={[
                      styles.allocFill,
                      { width: `${(allocation[cat.key] / WEEKLY_INCOME) * 100}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.adjButton, styles.adjPlus]}
                  onPress={() => adjustAllocation(cat.key, 5)}
                >
                  <Text style={styles.adjText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={[styles.remainingCard, allocationRemaining === 0 ? styles.remainingOk : styles.remainingPending]}>
            <Text style={styles.remainingLabel}>{t('level2Ui.remaining')}</Text>
            <Text style={[styles.remainingAmount, allocationRemaining === 0 ? styles.remainingOkText : styles.remainingPendingText]}>
              ₪{allocationRemaining}
            </Text>
          </View>

          {!isValid && allocationRemaining !== 0 && (
            <Text style={styles.validationHint}>
              {t('level2Ui.mustAllocateAll')}
            </Text>
          )}
          {!isValid && allocation.needs < MIN_NEEDS && (
            <Text style={styles.validationHint}>
              {t('level2Ui.minNeeds', { min: MIN_NEEDS })}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.confirmButton, !isValid && styles.disabledButton]}
            onPress={handleConfirmBudget}
            disabled={!isValid}
          >
            <Text style={styles.confirmButtonText}>{t('level2Ui.confirmBudget')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'weeklyEvents') {
    const currentEvent = weekEvents[currentEventIndex];
    if (!currentEvent) {
      // No events this week, go to summary
      return null;
    }

    const lvl = levels[2];
    const canAfford = lvl.balance >= currentEvent.amount;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.weekBadge}>
            {t('level2Ui.weekOf', { week: currentWeek, total: TOTAL_WEEKS })}
          </Text>
          <Text style={styles.sectionTitle}>{t('level2Events.eventTitle')}</Text>

          <View style={styles.balancePill}>
            <Text style={styles.balancePillLabel}>{t('common.balance')}</Text>
            <Text style={[styles.balancePillAmount, lvl.balance < 0 ? styles.dangerText : styles.successText]}>
              ₪{lvl.balance}
            </Text>
          </View>

          <View style={styles.eventCard}>
            <Text style={styles.eventEmoji}>{currentEvent.emoji}</Text>
            <Text style={styles.eventDescription}>
              {t(currentEvent.descriptionKey, { amount: currentEvent.amount })}
            </Text>

            {currentEvent.type === 'bonus' ? (
              <TouchableOpacity
                style={styles.bonusButton}
                onPress={() => handleBonusEvent(currentEvent)}
              >
                <Text style={styles.bonusButtonText}>
                  {t('level2Events.bonusReceived', { amount: currentEvent.amount })}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={[styles.payButton, !canAfford && styles.disabledButton]}
                  onPress={() => handlePayEvent(currentEvent)}
                  disabled={!canAfford}
                >
                  <Text style={styles.payButtonText}>
                    {t('level2Ui.payEvent', { amount: currentEvent.amount })}
                  </Text>
                </TouchableOpacity>

                {!canAfford && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => {
                      setEventResults((prev) => [...prev, { event: currentEvent, paid: false }]);
                      if (currentEvent.consequenceKey) {
                        setActiveConsequenceKey(currentEvent.consequenceKey);
                      } else {
                        advanceToNextEvent(currentEvent);
                      }
                    }}
                  >
                    <Text style={styles.skipButtonText}>{t('level2Ui.skipEvent')}</Text>
                  </TouchableOpacity>
                )}

                {canAfford && (
                  <TouchableOpacity
                    style={styles.skipButtonSecondary}
                    onPress={() => {
                      setEventResults((prev) => [...prev, { event: currentEvent, paid: false }]);
                      advanceToNextEvent(currentEvent);
                    }}
                  >
                    <Text style={styles.skipSecondaryText}>{t('level2Ui.skipEvent')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.eventProgress}>
            {weekEvents.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === currentEventIndex ? styles.progressDotActive : i < currentEventIndex ? styles.progressDotDone : null,
                ]}
              />
            ))}
          </View>
        </ScrollView>

        {activeConsequenceKey && (
          <ConsequenceModal
            visible={true}
            consequenceKey={activeConsequenceKey}
            onDismiss={handleConsequenceDismiss}
          />
        )}
      </SafeAreaView>
    );
  }

  if (view === 'weekSummary') {
    const lvl = levels[2];
    const isLastWeek = currentWeek >= TOTAL_WEEKS;
    const weekSaved = allocation.savings;
    const weekSpent = eventResults.filter((r) => r.event.type === 'cost' && r.paid).reduce((s, r) => s + r.event.amount, 0);
    const weekEarned = WEEKLY_INCOME + eventResults.filter((r) => r.event.type === 'bonus').reduce((s, r) => s + r.event.amount, 0);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>
            {t('level2Ui.summaryTitle', { week: currentWeek })}
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryEmoji}>💰</Text>
              <Text style={styles.summaryLabel}>{t('level2Ui.weekSummaryEarned', { amount: weekEarned })}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryEmoji}>💸</Text>
              <Text style={styles.summaryLabel}>{t('level2Ui.weekSummarySpent', { amount: weekSpent })}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryEmoji}>🏦</Text>
              <Text style={styles.summaryLabel}>{t('level2Ui.weekSummarySaved', { amount: weekSaved })}</Text>
            </View>
          </View>

          {eventResults.map((result, i) => (
            <View key={i} style={[styles.resultRow, result.paid ? styles.resultPaid : styles.resultMissed]}>
              <Text style={styles.resultEmoji}>{result.paid ? '✅' : '❌'}</Text>
              <Text style={styles.resultText}>
                {result.event.type === 'bonus'
                  ? t('level2Events.bonusReceived', { amount: result.event.amount })
                  : result.paid
                  ? t('level2Events.canAfford', { amount: result.event.amount })
                  : `${result.event.emoji} ₪${result.event.amount}`}
              </Text>
            </View>
          ))}

          <View style={[styles.balanceSummary, lvl.balance < 0 ? styles.balanceDanger : styles.balanceGood]}>
            <Text style={styles.balanceSummaryLabel}>{t('level2Ui.summaryBalance', { balance: lvl.balance })}</Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleNextWeek}>
            <Text style={styles.confirmButtonText}>
              {isLastWeek ? t('level2Ui.finishGame') : t('level2Ui.nextWeek')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'gameWin') {
    const lvl = levels[2];
    const charName = lvl.gender === 'girl' ? t('levels.level2.girlName') : t('levels.level2.boyName');

    return (
      <SafeAreaView style={styles.outcomeContainer}>
        <ScrollView contentContainerStyle={styles.outcomeContent}>
          <Text style={styles.outcomeEmoji}>🎉</Text>
          <Text style={styles.outcomeTitle}>{t('level2Ui.wonTitle')}</Text>
          <Text style={styles.outcomeMessage}>
            {t('level2Ui.wonMessage', { name: charName, balance: lvl.balance })}
          </Text>

          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statValue}>{TOTAL_WEEKS}</Text>
              <Text style={styles.statLabel}>Weeks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₪{lvl.totalEarned}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏦</Text>
              <Text style={styles.statValue}>₪{lvl.totalSaved}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.success }]}>
            <Text style={styles.confirmButtonText}>{t('level2Ui.continue')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'gameOver') {
    const lvl = levels[2];
    const charName = lvl.gender === 'girl' ? t('levels.level2.girlName') : t('levels.level2.boyName');

    return (
      <SafeAreaView style={styles.outcomeContainer}>
        <ScrollView contentContainerStyle={styles.outcomeContent}>
          <Text style={styles.outcomeEmoji}>😟</Text>
          <Text style={[styles.outcomeTitle, { color: colors.danger }]}>{t('level2Ui.lostTitle')}</Text>
          <Text style={styles.outcomeMessage}>
            {t('level2Ui.lostMessage', { name: charName })}
          </Text>
          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.warning }]} onPress={handleReset}>
            <Text style={styles.confirmButtonText}>{t('level2Ui.playAgain')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
};

// ─── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  levelEmoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  introSubtitle: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    marginBottom: spacing.lg,
  },
  introText: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  chooseLabel: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  characters: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  charCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: 130,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  charSelected: {
    borderColor: colors.primary,
    backgroundColor: '#e8f4fd',
  },
  avatar: {
    fontSize: 56,
    marginBottom: spacing.xs,
  },
  charName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.darkGray,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  disabledButton: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  startText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  // How It Works
  howContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  howScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  howTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  howGreeting: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 26,
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepEmoji: { fontSize: 40, marginBottom: spacing.xs },
  stepNumber: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  stepText: { fontSize: fonts.sizes.md, color: colors.darkGray, textAlign: 'center', lineHeight: 22 },
  stepArrow: { paddingVertical: spacing.xs },
  arrowText: { fontSize: 24 },
  tipBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 2,
    borderColor: '#FFD54F',
  },
  tipEmoji: { fontSize: 32, marginBottom: spacing.xs },
  tipText: { fontSize: fonts.sizes.md, color: colors.darkGray, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  letsGoButton: {
    backgroundColor: '#4CAF50',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  letsGoText: { color: colors.white, fontSize: fonts.sizes.xl, fontWeight: '800' },
  // Budget Allocate
  weekBadge: {
    backgroundColor: colors.primary,
    color: colors.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    textAlign: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  incomeCard: {
    backgroundColor: '#e8f8f0',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.success,
  },
  incomeEmoji: { fontSize: 28, marginRight: spacing.sm },
  incomeLabel: { flex: 1, fontSize: fonts.sizes.md, color: colors.darkGray, fontWeight: '600' },
  incomeAmount: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.success },
  allocationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  allocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  colorBubble: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  allocLabels: { flex: 1 },
  allocLabel: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray },
  allocDesc: { fontSize: fonts.sizes.xs, color: colors.gray },
  allocAmount: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.darkGray },
  allocButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adjButton: {
    width: 44,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjMinus: { backgroundColor: colors.dangerLight },
  adjPlus: { backgroundColor: '#d5f5e3' },
  adjText: { fontSize: fonts.sizes.sm, fontWeight: '800', color: colors.darkGray },
  allocBar: {
    flex: 1,
    height: 10,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  allocFill: { height: '100%', borderRadius: borderRadius.round },
  remainingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
  },
  remainingOk: { backgroundColor: '#d5f5e3', borderWidth: 2, borderColor: colors.success },
  remainingPending: { backgroundColor: '#fdebd0', borderWidth: 2, borderColor: colors.warning },
  remainingLabel: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray },
  remainingAmount: { fontSize: fonts.sizes.md, fontWeight: '800' },
  remainingOkText: { color: colors.success },
  remainingPendingText: { color: colors.warning },
  validationHint: {
    fontSize: fonts.sizes.sm,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmButtonText: { color: colors.white, fontSize: fonts.sizes.lg, fontWeight: '700' },
  // Events
  balancePill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'stretch',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  balancePillLabel: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.darkGray },
  balancePillAmount: { fontSize: fonts.sizes.md, fontWeight: '800' },
  dangerText: { color: colors.danger },
  successText: { color: colors.success },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  eventEmoji: { fontSize: 64, marginBottom: spacing.md },
  eventDescription: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  eventActions: { width: '100%', gap: spacing.sm },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  payButtonText: { color: colors.white, fontSize: fonts.sizes.lg, fontWeight: '700' },
  skipButton: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: { color: colors.danger, fontSize: fonts.sizes.md, fontWeight: '600' },
  skipButtonSecondary: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipSecondaryText: { color: colors.gray, fontSize: fonts.sizes.sm },
  bonusButton: {
    backgroundColor: '#d5f5e3',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  bonusButtonText: { color: colors.success, fontSize: fonts.sizes.lg, fontWeight: '700' },
  eventProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.lightGray,
  },
  progressDotActive: { backgroundColor: colors.primary },
  progressDotDone: { backgroundColor: colors.success },
  // Week Summary
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryEmoji: { fontSize: 24, marginRight: spacing.sm },
  summaryLabel: { fontSize: fonts.sizes.md, color: colors.darkGray, fontWeight: '600' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  resultPaid: { backgroundColor: '#d5f5e3' },
  resultMissed: { backgroundColor: colors.dangerLight },
  resultEmoji: { fontSize: 20, marginRight: spacing.sm },
  resultText: { fontSize: fonts.sizes.sm, color: colors.darkGray, flex: 1 },
  balanceSummary: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  balanceGood: { backgroundColor: '#d5f5e3', borderWidth: 2, borderColor: colors.success },
  balanceDanger: { backgroundColor: colors.dangerLight, borderWidth: 2, borderColor: colors.danger },
  balanceSummaryLabel: { fontSize: fonts.sizes.lg, fontWeight: '800', color: colors.darkGray },
  // Win / Game Over
  outcomeContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  outcomeContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  outcomeEmoji: { fontSize: 80, marginBottom: spacing.md },
  outcomeTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  outcomeMessage: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statEmoji: { fontSize: 28, marginBottom: spacing.xs },
  statValue: { fontSize: fonts.sizes.lg, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: fonts.sizes.xs, color: colors.gray, marginTop: 2 },
});
