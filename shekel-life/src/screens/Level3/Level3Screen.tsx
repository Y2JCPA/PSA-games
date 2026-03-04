import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store';
import { BudgetDashboard } from '../../components/BudgetDashboard';
import { ConsequenceModal } from '../../components/ConsequenceModal';
import { MaaserModal } from '../../components/MaaserModal';
import { LevelNavBar } from '../../components/LevelNavBar';
import { colors, fonts, spacing, borderRadius } from '../../theme';

type Level3View =
  | 'intro'
  | 'characterSelect'
  | 'howItWorks'
  | 'jobSelect'
  | 'goalSelect'
  | 'workCalendar'
  | 'budgetAllocate'
  | 'monthlyEvents'
  | 'monthSummary'
  | 'gameWin'
  | 'gameOver';

type JobId = 'babysitting' | 'tutoring' | 'delivery';

interface JobDef {
  id: JobId;
  payPerSession: number;
  maxSessionsPerWeek: number;
  emoji: string;
}

interface SavingsGoalOption {
  id: string;
  nameKey: string;
  target: number;
}

interface MonthlyBudget {
  phone: number;
  transport: number;
  food: number;
  savings: number;
  maaser: number;
  fun: number;
}

interface MonthEvent {
  id: 'phoneCracked' | 'barMitzvah' | 'yomTovWeek' | 'bonusShift' | 'mallSale' | 'bonusPayment';
  type: 'cost' | 'bonus' | 'choice' | 'info';
  amount: number;
  descriptionKey: string;
  consequenceKey?: string;
}

const TOTAL_MONTHS = 4;
const WEEKS_PER_MONTH = 4;
const WORK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

const JOBS: Record<JobId, JobDef> = {
  babysitting: { id: 'babysitting', payPerSession: 40, maxSessionsPerWeek: 3, emoji: '🍼' },
  tutoring: { id: 'tutoring', payPerSession: 50, maxSessionsPerWeek: 2, emoji: '📖' },
  delivery: { id: 'delivery', payPerSession: 30, maxSessionsPerWeek: 4, emoji: '🛵' },
};

const GOALS: SavingsGoalOption[] = [
  { id: 'newPhone', nameKey: 'level3SavingsGoals.newPhone', target: 800 },
  { id: 'trip', nameKey: 'level3SavingsGoals.trip', target: 500 },
  { id: 'bike', nameKey: 'level3SavingsGoals.bike', target: 650 },
];

const defaultWorkPlan = () => Array.from({ length: WEEKS_PER_MONTH }, () => Array(5).fill(false));

interface Level3Props {
  onHome: () => void;
  onRestart: () => void;
}

export const Level3Screen: React.FC<Level3Props> = ({ onHome, onRestart }) => {
  const { t } = useTranslation();
  const {
    levels,
    setGender,
    startLevel,
    toggleMaaser,
    addIncome,
    spend,
    addMaaser,
    addToSavingGoal,
    setSavingGoal,
    incrementImpulseResist,
    advanceWeek,
    completeLevel,
    earnBadge,
  } = useGameStore();
  const level = levels[3];

  const [view, setView] = useState<Level3View>(level.status === 'in_progress' ? 'workCalendar' : 'intro');
  const [selectedJob, setSelectedJob] = useState<JobId | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalOption | null>(null);
  const [showMaaserPrompt, setShowMaaserPrompt] = useState(false);
  const [workPlan, setWorkPlan] = useState<boolean[][]>(defaultWorkPlan());
  const [monthIncome, setMonthIncome] = useState(0);
  const [budget, setBudget] = useState<MonthlyBudget>({
    phone: 50,
    transport: 40,
    food: 50,
    savings: 40,
    maaser: 0,
    fun: 20,
  });
  const [events, setEvents] = useState<MonthEvent[]>([]);
  const [eventIndex, setEventIndex] = useState(0);
  const [consequenceKey, setConsequenceKey] = useState<string | null>(null);
  const [monthEarned, setMonthEarned] = useState(0);
  const [monthSpent, setMonthSpent] = useState(0);
  const [monthSaved, setMonthSaved] = useState(0);

  const currentMonth = level.currentWeek;
  const currentEvent = events[eventIndex];

  const job = selectedJob ? JOBS[selectedJob] : null;
  const yomTovWeekIndex = currentMonth === 3 ? 1 : -1; // week #2 in month 3 has no work

  const weekSessions = useMemo(
    () => workPlan.map((week) => week.filter(Boolean).length),
    [workPlan]
  );

  const calculatedIncome = useMemo(() => {
    if (!job) return 0;
    return weekSessions.reduce((sum, sessions) => sum + sessions * job.payPerSession, 0);
  }, [job, weekSessions]);

  const allocated = budget.phone + budget.transport + budget.food + budget.savings + budget.maaser + budget.fun;
  const unallocated = monthIncome - allocated;

  const updateBudget = (key: keyof MonthlyBudget, delta: number) => {
    setBudget((prev) => {
      const next = prev[key] + delta;
      if (key === 'phone') return prev; // fixed
      if (next < 0) return prev;
      const nextTotal = allocated + delta;
      if (monthIncome > 0 && nextTotal > monthIncome) return prev;
      return { ...prev, [key]: next };
    });
  };

  const toggleWorkDay = (weekIdx: number, dayIdx: number) => {
    if (!job) return;
    if (weekIdx === yomTovWeekIndex) return;

    const maxPerWeek = job.maxSessionsPerWeek;
    const selectedInWeek = workPlan[weekIdx].filter(Boolean).length;
    const currentlySelected = workPlan[weekIdx][dayIdx];

    if (!currentlySelected && selectedInWeek >= maxPerWeek) return;

    setWorkPlan((prev) => {
      const next = prev.map((w) => [...w]);
      next[weekIdx][dayIdx] = !next[weekIdx][dayIdx];
      return next;
    });
  };

  const buildMonthEvents = (month: number): MonthEvent[] => {
    if (month === 1) {
      return [{ id: 'barMitzvah', type: 'cost', amount: 80, descriptionKey: 'level3Events.barMitzvah', consequenceKey: 'barMitzvahCantAfford' }];
    }
    if (month === 2) {
      return [{ id: 'phoneCracked', type: 'choice', amount: 200, descriptionKey: 'level3Events.phoneCracked', consequenceKey: 'phoneCantAfford' }];
    }
    if (month === 3) {
      return [
        { id: 'yomTovWeek', type: 'info', amount: 0, descriptionKey: 'level3Events.yomTovWeek' },
        { id: 'bonusShift', type: 'choice', amount: job ? job.payPerSession : 40, descriptionKey: 'level3Events.bonusShift' },
      ];
    }
    return [
      { id: 'mallSale', type: 'choice', amount: 120, descriptionKey: 'level3Events.mallSale' },
      { id: 'bonusPayment', type: 'bonus', amount: 40, descriptionKey: 'level3Events.bonusPayment' },
    ];
  };

  const startMonthBudget = () => {
    const income = calculatedIncome;
    setMonthIncome(income);
    const maaserDefault = level.maaserEnabled ? Math.round(income * 0.1) : 0;
    const afterFixed = Math.max(0, income - 50 - maaserDefault);

    setBudget({
      phone: 50,
      transport: Math.min(40, afterFixed),
      food: Math.min(50, Math.max(0, afterFixed - 40)),
      savings: Math.min(40, Math.max(0, afterFixed - 90)),
      maaser: maaserDefault,
      fun: Math.max(0, Math.min(30, afterFixed - 130)),
    });
    setView('budgetAllocate');
  };

  const confirmMonthlyBudget = () => {
    if (monthIncome < 50) return;
    if (allocated > monthIncome) return;

    addIncome(3, monthIncome);
    let spent = 0;
    let saved = 0;

    if (budget.phone > 0 && spend(3, budget.phone)) spent += budget.phone;
    if (budget.transport > 0 && spend(3, budget.transport)) spent += budget.transport;
    if (budget.food > 0 && spend(3, budget.food)) spent += budget.food;
    if (budget.fun > 0 && spend(3, budget.fun)) spent += budget.fun;

    if (budget.savings > 0) {
      addToSavingGoal(3, budget.savings);
      saved += budget.savings;
    }

    if (level.maaserEnabled && budget.maaser > 0) {
      addMaaser(3, budget.maaser);
      spent += budget.maaser;
    }

    setMonthEarned(monthIncome);
    setMonthSpent(spent);
    setMonthSaved(saved);

    setEvents(buildMonthEvents(currentMonth));
    setEventIndex(0);
    setView('monthlyEvents');
  };

  const nextEvent = () => {
    if (eventIndex + 1 >= events.length) {
      setView('monthSummary');
      return;
    }
    setEventIndex((i) => i + 1);
  };

  const finishMonth = () => {
    const latest = levels[3];

    if (latest.balance < 0) {
      setConsequenceKey('overspentMonth');
      setView('gameOver');
      return;
    }

    if (currentMonth >= TOTAL_MONTHS) {
      const goalCompleted = !!latest.savingGoal?.completed;
      if (goalCompleted && latest.balance >= 0) {
        completeLevel(3);
        earnBadge('goalGetter');
        if (latest.impulseResistCount >= 3) earnBadge('noImpulse');
        setView('gameWin');
      } else {
        setConsequenceKey('noSavingsGoal');
        setView('gameOver');
      }
      return;
    }

    advanceWeek(3);
    setWorkPlan(defaultWorkPlan());
    setMonthIncome(0);
    setEvents([]);
    setEventIndex(0);
    setView('workCalendar');
  };

  const resetLevel = () => {
    startLevel(3, 0);
    setSelectedJob(null);
    setSelectedGoal(null);
    setWorkPlan(defaultWorkPlan());
    setMonthIncome(0);
    setEvents([]);
    setEventIndex(0);
    setConsequenceKey(null);
    setView('characterSelect');
  };

  // ─── Screens ────────────────────────────────────────────────────────────────

  if (view === 'intro') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emoji}>💼</Text>
        <Text style={styles.title}>{t('levels.level3.title')}</Text>
        <Text style={styles.subtitle}>{t('levels.level3.subtitle')}</Text>
        <Text style={styles.description}>{t('levels.level3.intro')}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setView('characterSelect')}>
          <Text style={styles.primaryText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'characterSelect') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emoji}>💼</Text>
        <Text style={styles.title}>{t('levels.level3.title')}</Text>
        <Text style={styles.chooseLabel}>{t('common.chooseCharacter')}</Text>
        <View style={styles.characters}>
          <TouchableOpacity style={[styles.charCard, level.gender === 'boy' && styles.selected]} onPress={() => setGender(3, 'boy')}>
            <Text style={styles.avatar}>👦</Text>
            <Text style={styles.charName}>{t('levels.level3.boyName')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.charCard, level.gender === 'girl' && styles.selected]} onPress={() => setGender(3, 'girl')}>
            <Text style={styles.avatar}>👧</Text>
            <Text style={styles.charName}>{t('levels.level3.girlName')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, !level.gender && styles.disabled]}
          onPress={() => {
            if (!level.gender) return;
            startLevel(3, 0);
            setView('howItWorks');
          }}
          disabled={!level.gender}
        >
          <Text style={styles.primaryText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'howItWorks') {
    const charName = level.gender === 'girl' ? t('levels.level3.girlName') : t('levels.level3.boyName');
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level3HowItWorks.title')}</Text>
          <Text style={styles.description}>{t('level3HowItWorks.greeting', { name: charName })}</Text>
          {[
            ['💼', 'level3HowItWorks.step1title', 'level3HowItWorks.step1text'],
            ['📅', 'level3HowItWorks.step2title', 'level3HowItWorks.step2text'],
            ['📊', 'level3HowItWorks.step3title', 'level3HowItWorks.step3text'],
            ['🏆', 'level3HowItWorks.step4title', 'level3HowItWorks.step4text'],
          ].map(([emoji, titleKey, textKey], idx) => (
            <View key={idx} style={styles.stepCard}>
              <Text style={styles.stepEmoji}>{emoji}</Text>
              <Text style={styles.stepTitle}>{t(titleKey)}</Text>
              <Text style={styles.stepText}>{t(textKey)}</Text>
            </View>
          ))}
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>{t('level3HowItWorks.tip')}</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setView('jobSelect')}>
            <Text style={styles.primaryText}>{t('level3HowItWorks.letsGo')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'jobSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level3Jobs.title')}</Text>
          <Text style={styles.subtitle}>{t('level3Jobs.subtitle')}</Text>
          {(Object.values(JOBS)).map((j) => (
            <TouchableOpacity
              key={j.id}
              style={[styles.jobCard, selectedJob === j.id && styles.selected]}
              onPress={() => setSelectedJob(j.id)}
            >
              <Text style={styles.jobEmoji}>{j.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{t(`level3Jobs.${j.id}`)}</Text>
                <Text style={styles.jobMeta}>{t(`level3Jobs.${j.id}Pay`)}</Text>
                <Text style={styles.jobMeta}>{t(`level3Jobs.${j.id}Avail`)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.primaryButton, !selectedJob && styles.disabled]}
            onPress={() => setView('goalSelect')}
            disabled={!selectedJob}
          >
            <Text style={styles.primaryText}>{t('common.next')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'goalSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level3SavingsGoals.title')}</Text>
          <Text style={styles.subtitle}>{t('level3SavingsGoals.subtitle')}</Text>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.goalCard, selectedGoal?.id === g.id && styles.selected]}
              onPress={() => setSelectedGoal(g)}
            >
              <Text style={styles.goalName}>{t(g.nameKey)}</Text>
              <Text style={styles.goalAmount}>₪{g.target}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.primaryButton, !selectedGoal && styles.disabled]}
            onPress={() => {
              if (!selectedGoal) return;
              setSavingGoal(3, {
                itemId: selectedGoal.id,
                targetAmount: selectedGoal.target,
                currentAmount: 0,
                completed: false,
              });
              setShowMaaserPrompt(true);
              setView('workCalendar');
            }}
            disabled={!selectedGoal}
          >
            <Text style={styles.primaryText}>{t('level3SavingsGoals.selectGoal')}</Text>
          </TouchableOpacity>

          <MaaserModal
            visible={showMaaserPrompt}
            onAccept={() => {
              toggleMaaser(3, true);
              setShowMaaserPrompt(false);
            }}
            onDecline={() => setShowMaaserPrompt(false)}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'workCalendar' && job) {
    return (
      <SafeAreaView style={styles.container}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.weekBadge}>{t('level3Ui.monthOf', { month: currentMonth, total: TOTAL_MONTHS })}</Text>
          <Text style={styles.title}>{t('level3WorkCalendar.title')}</Text>
          <Text style={styles.subtitle}>{t('level3WorkCalendar.subtitle')}</Text>

          <View style={styles.jobPill}>
            <Text style={styles.jobPillText}>{job.emoji} {t(`level3Jobs.${job.id}`)} — ₪{job.payPerSession}</Text>
          </View>

          {workPlan.map((week, weekIdx) => {
            const isYomTovWeek = weekIdx === yomTovWeekIndex;
            return (
              <View key={weekIdx} style={styles.weekCard}>
                <Text style={styles.weekTitle}>{t('level3Ui.weekOf', { week: weekIdx + 1 })}</Text>
                {isYomTovWeek && <Text style={styles.yomTovNote}>{t('level3Events.yomTovWeek')}</Text>}
                <View style={styles.daysRow}>
                  {WORK_DAYS.map((dayKey, dayIdx) => {
                    const selected = week[dayIdx];
                    return (
                      <TouchableOpacity
                        key={`${weekIdx}-${dayKey}`}
                        style={[
                          styles.dayChip,
                          selected && styles.dayChipSelected,
                          isYomTovWeek && styles.dayChipDisabled,
                        ]}
                        onPress={() => toggleWorkDay(weekIdx, dayIdx)}
                        disabled={isYomTovWeek}
                      >
                        <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{t(`level3WorkCalendar.${dayKey}`)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.weekSessionsText}>
                  {t('level3WorkCalendar.sessionsThisWeek', { count: weekSessions[weekIdx] })}
                </Text>
              </View>
            );
          })}

          <View style={styles.incomeCard}>
            <Text style={styles.incomeTitle}>{t('level3WorkCalendar.estimatedEarnings', { amount: calculatedIncome })}</Text>
            <Text style={styles.incomeSub}>{t('level3WorkCalendar.maxSessions', { max: job.maxSessionsPerWeek })}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, calculatedIncome < 50 && styles.disabled]}
            onPress={startMonthBudget}
            disabled={calculatedIncome < 50}
          >
            <Text style={styles.primaryText}>{t('level3WorkCalendar.confirmSchedule')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'budgetAllocate') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.weekBadge}>{t('level3Ui.monthOf', { month: currentMonth, total: TOTAL_MONTHS })}</Text>
          <Text style={styles.title}>{t('level3BudgetUi.title')}</Text>
          <Text style={styles.subtitle}>{t('level3BudgetUi.subtitle', { month: currentMonth, total: TOTAL_MONTHS, income: monthIncome })}</Text>

          <BudgetDashboard
            income={monthIncome}
            categories={[
              { label: t('level3BudgetUi.phoneBill'), amount: budget.phone, color: colors.primary },
              { label: t('level3BudgetUi.transport'), amount: budget.transport, color: colors.warning },
              { label: t('level3BudgetUi.food'), amount: budget.food, color: '#F8C471' },
              { label: t('level3BudgetUi.savings'), amount: budget.savings, color: colors.success },
              ...(level.maaserEnabled ? [{ label: t('level3BudgetUi.maaser'), amount: budget.maaser, color: colors.maaser }] : []),
              { label: t('level3BudgetUi.fun'), amount: budget.fun, color: '#BB8FCE' },
            ]}
            balance={unallocated}
            period="month"
          />

          {([
            ['transport', 'level3BudgetUi.transport'],
            ['food', 'level3BudgetUi.food'],
            ['savings', 'level3BudgetUi.savings'],
            ...(level.maaserEnabled ? [['maaser', 'level3BudgetUi.maaser']] : []),
            ['fun', 'level3BudgetUi.fun'],
          ] as Array<[keyof MonthlyBudget, string]>).map(([key, labelKey]) => (
            <View key={key} style={styles.allocRow}>
              <Text style={styles.allocLabel}>{t(labelKey)}</Text>
              <View style={styles.allocActions}>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => updateBudget(key, -10)}><Text style={styles.adjustText}>−10</Text></TouchableOpacity>
                <Text style={styles.allocValue}>₪{budget[key]}</Text>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => updateBudget(key, 10)}><Text style={styles.adjustText}>+10</Text></TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={[styles.unallocatedCard, unallocated < 0 && styles.unallocatedBad]}>
            <Text style={styles.unallocatedText}>{t('level3BudgetUi.unallocated')}:</Text>
            <Text style={styles.unallocatedAmount}>₪{unallocated}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (allocated > monthIncome || monthIncome < 50) && styles.disabled]}
            onPress={confirmMonthlyBudget}
            disabled={allocated > monthIncome || monthIncome < 50}
          >
            <Text style={styles.primaryText}>{t('level3BudgetUi.confirmBudget')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'monthlyEvents' && currentEvent) {
    const canAfford = levels[3].balance >= currentEvent.amount;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level3Events.title')}</Text>
          <View style={styles.eventCard}>
            <Text style={styles.eventText}>{t(currentEvent.descriptionKey, { amount: currentEvent.amount })}</Text>

            {currentEvent.id === 'phoneCracked' && (
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={[styles.primaryButton, !canAfford && styles.disabled]}
                  disabled={!canAfford}
                  onPress={() => {
                    const ok = spend(3, 200);
                    if (!ok) setConsequenceKey('phoneCantAfford');
                    setMonthSpent((s) => s + (ok ? 200 : 0));
                    nextEvent();
                  }}
                >
                  <Text style={styles.primaryText}>{t('level3Ui.payRepair')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setConsequenceKey('phoneCantAfford');
                    nextEvent();
                  }}
                >
                  <Text style={styles.secondaryText}>{t('level3Ui.skipRepair')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentEvent.id === 'barMitzvah' && (
              <TouchableOpacity
                style={[styles.primaryButton, !canAfford && styles.disabled]}
                disabled={!canAfford}
                onPress={() => {
                  const ok = spend(3, currentEvent.amount);
                  if (!ok) setConsequenceKey('barMitzvahCantAfford');
                  setMonthSpent((s) => s + (ok ? currentEvent.amount : 0));
                  nextEvent();
                }}
              >
                <Text style={styles.primaryText}>{t('level2Ui.payEvent', { amount: currentEvent.amount })}</Text>
              </TouchableOpacity>
            )}

            {currentEvent.id === 'yomTovWeek' && (
              <TouchableOpacity style={styles.primaryButton} onPress={nextEvent}>
                <Text style={styles.primaryText}>{t('common.next')}</Text>
              </TouchableOpacity>
            )}

            {currentEvent.id === 'bonusShift' && (
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    addIncome(3, currentEvent.amount);
                    setMonthEarned((e) => e + currentEvent.amount);
                    nextEvent();
                  }}
                >
                  <Text style={styles.primaryText}>{t('level3Ui.takeBonus', { amount: currentEvent.amount })}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={nextEvent}>
                  <Text style={styles.secondaryText}>{t('level3Ui.skipBonus')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentEvent.id === 'mallSale' && (
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={[styles.primaryButton, !canAfford && styles.disabled]}
                  disabled={!canAfford}
                  onPress={() => {
                    const ok = spend(3, currentEvent.amount);
                    if (ok) setMonthSpent((s) => s + currentEvent.amount);
                    nextEvent();
                  }}
                >
                  <Text style={styles.primaryText}>{t('level3Ui.buySale', { amount: currentEvent.amount })}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    incrementImpulseResist(3);
                    nextEvent();
                  }}
                >
                  <Text style={styles.secondaryText}>{t('level3Ui.resistSale')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentEvent.id === 'bonusPayment' && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  addIncome(3, currentEvent.amount);
                  setMonthEarned((e) => e + currentEvent.amount);
                  nextEvent();
                }}
              >
                <Text style={styles.primaryText}>{t('level2Events.bonusReceived', { amount: currentEvent.amount })}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {consequenceKey && (
          <ConsequenceModal
            visible={true}
            consequenceKey={consequenceKey}
            onDismiss={() => setConsequenceKey(null)}
          />
        )}
      </SafeAreaView>
    );
  }

  if (view === 'monthSummary') {
    return (
      <SafeAreaView style={styles.container}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level3Ui.monthSummaryTitle', { month: currentMonth })}</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{t('level3Ui.monthlyEarned', { amount: monthEarned })}</Text>
            <Text style={styles.summaryText}>{t('level3Ui.monthlySpent', { amount: monthSpent })}</Text>
            <Text style={styles.summaryText}>{t('level3Ui.monthlySaved', { amount: monthSaved })}</Text>
            <Text style={[styles.summaryText, styles.balanceText]}>{t('level3Ui.balanceNow', { amount: levels[3].balance })}</Text>
          </View>

          {levels[3].savingGoal && (
            <View style={styles.goalProgressCard}>
              <Text style={styles.goalProgressTitle}>
                {t('level3BudgetUi.savingsGoal', {
                  name: t(`level3SavingsGoals.${levels[3].savingGoal?.itemId}`),
                  target: levels[3].savingGoal?.targetAmount,
                })}
              </Text>
              <Text style={styles.goalProgressText}>
                {t('level3BudgetUi.savingsProgress', {
                  current: levels[3].savingGoal.currentAmount,
                  target: levels[3].savingGoal.targetAmount,
                })}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={finishMonth}>
            <Text style={styles.primaryText}>
              {currentMonth >= TOTAL_MONTHS
                ? t('common.done')
                : t('level3Ui.nextMonth', { next: currentMonth + 1 })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'gameWin') {
    const charName = level.gender === 'girl' ? t('levels.level3.girlName') : t('levels.level3.boyName');
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>{t('level3Ui.wonTitle')}</Text>
        <Text style={styles.description}>{t('level3Ui.wonMessage', { name: charName, balance: levels[3].balance })}</Text>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryText}>{t('level3Ui.continue')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'gameOver') {
    const charName = level.gender === 'girl' ? t('levels.level3.girlName') : t('levels.level3.boyName');
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emoji}>😟</Text>
        <Text style={[styles.title, { color: colors.danger }]}>{t('level3Ui.lostTitle')}</Text>
        <Text style={styles.description}>
          {consequenceKey === 'noSavingsGoal'
            ? t('consequences.noSavingsGoal')
            : t('level3Ui.lostMessage', { name: charName })}
        </Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.warning }]} onPress={resetLevel}>
          <Text style={styles.primaryText}>{t('level3Ui.playAgain')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 72, marginBottom: spacing.md },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  chooseLabel: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  characters: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  charCard: {
    width: 130,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.primary, backgroundColor: '#e8f4fd' },
  avatar: { fontSize: 56, marginBottom: spacing.xs },
  charName: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.white, fontSize: fonts.sizes.lg, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  secondaryText: { color: colors.darkGray, fontSize: fonts.sizes.md, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stepEmoji: { fontSize: 32, marginBottom: spacing.xs, textAlign: 'center' },
  stepTitle: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  stepText: { fontSize: fonts.sizes.sm, color: colors.darkGray, textAlign: 'center', lineHeight: 20 },
  tipBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tipText: { fontSize: fonts.sizes.sm, color: colors.darkGray, textAlign: 'center' },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  jobEmoji: { fontSize: 38, marginRight: spacing.sm },
  jobTitle: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray },
  jobMeta: { fontSize: fonts.sizes.sm, color: colors.gray },
  goalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalName: { fontSize: fonts.sizes.md, color: colors.darkGray, fontWeight: '700' },
  goalAmount: { fontSize: fonts.sizes.md, color: colors.success, fontWeight: '800' },
  weekBadge: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
  },
  jobPill: {
    backgroundColor: '#EBF5FB',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  jobPillText: { color: colors.primary, fontSize: fonts.sizes.sm, fontWeight: '700' },
  weekCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  weekTitle: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray, marginBottom: spacing.xs },
  yomTovNote: { fontSize: fonts.sizes.sm, color: colors.warning, marginBottom: spacing.sm },
  daysRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: colors.lightGray,
  },
  dayChipSelected: { backgroundColor: colors.primary },
  dayChipDisabled: { opacity: 0.5 },
  dayText: { fontSize: fonts.sizes.xs, color: colors.darkGray, fontWeight: '600' },
  dayTextSelected: { color: colors.white },
  weekSessionsText: { marginTop: spacing.xs, fontSize: fonts.sizes.sm, color: colors.gray },
  incomeCard: {
    backgroundColor: '#d5f5e3',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  incomeTitle: { fontSize: fonts.sizes.md, color: colors.success, fontWeight: '700', textAlign: 'center' },
  incomeSub: { fontSize: fonts.sizes.sm, color: colors.darkGray, textAlign: 'center', marginTop: spacing.xs },
  allocRow: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocLabel: { fontSize: fonts.sizes.md, color: colors.darkGray, fontWeight: '600' },
  allocActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  adjustBtn: {
    width: 44,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.darkGray },
  allocValue: { width: 58, textAlign: 'center', fontSize: fonts.sizes.md, fontWeight: '800', color: colors.primary },
  unallocatedCard: {
    marginTop: spacing.md,
    backgroundColor: '#EBF5FB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unallocatedBad: { backgroundColor: colors.dangerLight },
  unallocatedText: { fontSize: fonts.sizes.md, color: colors.darkGray, fontWeight: '700' },
  unallocatedAmount: { fontSize: fonts.sizes.md, color: colors.primary, fontWeight: '800' },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  eventText: { fontSize: fonts.sizes.lg, color: colors.darkGray, textAlign: 'center', lineHeight: 26, marginBottom: spacing.md },
  eventActions: { gap: spacing.sm },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  summaryText: { fontSize: fonts.sizes.md, color: colors.darkGray, marginBottom: spacing.xs },
  balanceText: { fontWeight: '800', color: colors.primary },
  goalProgressCard: {
    backgroundColor: '#d5f5e3',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  goalProgressTitle: { fontSize: fonts.sizes.sm, color: colors.darkGray, fontWeight: '700', marginBottom: spacing.xs },
  goalProgressText: { fontSize: fonts.sizes.sm, color: colors.success, fontWeight: '700' },
});
