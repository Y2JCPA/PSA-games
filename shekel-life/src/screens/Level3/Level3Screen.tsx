import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store';
import { MaaserModal } from '../../components/MaaserModal';
import { LevelNavBar } from '../../components/LevelNavBar';
import { colors, fonts, spacing, borderRadius } from '../../theme';

// ─── Types ───────────────────────────────────────────────────
type JobId = 'babysitting' | 'tutoring' | 'delivery';
type Level3View =
  | 'intro' | 'characterSelect' | 'howItWorks' | 'jobSelect'
  | 'savingsGoal' | 'shiftOffers' | 'monthEvents' | 'phoneBill'
  | 'monthSummary' | 'gameWin' | 'gameOver';

interface Job {
  id: JobId;
  basePayPerShift: number;
  emoji: string;
}

interface ShiftOffer {
  id: string;
  descKey: string;
  pay: number;
  energyCost: number;
  socialCost: number;    // positive = social sacrifice
  socialGain: number;    // some shifts are social (tutoring friend)
  conflictKey?: string;  // what you miss if you take it
}

interface MonthEvent {
  id: string;
  textKey: string;
  emoji: string;
  choices: EventChoice[];
}

interface EventChoice {
  labelKey: string;
  cost: number;           // negative = you receive money
  socialEffect: number;
  energyEffect: number;
  debtIfCantAfford?: boolean;
  isInstallment?: { monthly: number; total: number; months: number };
  lendingRisk?: boolean;  // 70% payback
}

interface SavingsGoalOption {
  id: string; nameKey: string; amount: number; emoji: string;
}

// ─── Constants ───────────────────────────────────────────────
const JOBS: Job[] = [
  { id: 'babysitting', basePayPerShift: 68, emoji: '🍼' },
  { id: 'tutoring', basePayPerShift: 83, emoji: '📖' },
  { id: 'delivery', basePayPerShift: 53, emoji: '🛵' },
];

const SAVINGS_GOALS: SavingsGoalOption[] = [
  { id: 'newPhone', nameKey: 'newPhone', amount: 600, emoji: '📱' },
  { id: 'trip', nameKey: 'trip', amount: 400, emoji: '✈️' },
  { id: 'laptop', nameKey: 'laptop', amount: 938, emoji: '💻' },
  { id: 'bike', nameKey: 'bike', amount: 500, emoji: '🚲' },
];

const PHONE_BILL = 34;
const TOTAL_MONTHS = 6;
const INTEREST_RATE = 0.02;       // 2% monthly on savings
const DEBT_INTEREST = 0.10;       // 10% on parent loans
const INFLATION_MONTH = 3;        // Prices go up in month 3
const INFLATION_RATE = 0.15;      // 15%
const EMERGENCY_FUND_THRESHOLD = 200;

// ─── Shift Generation ────────────────────────────────────────
function generateShiftOffers(month: number, job: Job, hasPhone: boolean, inflated: boolean): ShiftOffer[] {
  const payMult = inflated ? 1.0 : 1.0; // income doesn't rise with inflation
  const isYomTov = month === 2 || month === 5;

  const allShifts: ShiftOffer[] = [
    { id: 'evening_sit', descKey: 'eveningSit', pay: job.basePayPerShift, energyCost: 15, socialCost: 10, socialGain: 0, conflictKey: 'missBowling' },
    { id: 'weekend_gig', descKey: 'weekendGig', pay: job.basePayPerShift + 15, energyCost: 20, socialCost: 15, socialGain: 0, conflictKey: 'missFriends' },
    { id: 'double_shift', descKey: 'doubleShift', pay: job.basePayPerShift * 2, energyCost: 35, socialCost: 5, socialGain: 0 },
    { id: 'friend_tutor', descKey: 'friendTutor', pay: job.basePayPerShift - 10, energyCost: 10, socialCost: 0, socialGain: 12 },
    { id: 'rush_delivery', descKey: 'rushDelivery', pay: job.basePayPerShift + 20, energyCost: 25, socialCost: 0, socialGain: 0 },
    { id: 'easy_gig', descKey: 'easyGig', pay: Math.round(job.basePayPerShift * 0.7), energyCost: 5, socialCost: 0, socialGain: 0 },
    { id: 'group_job', descKey: 'groupJob', pay: job.basePayPerShift, energyCost: 12, socialCost: 0, socialGain: 15 },
    { id: 'late_night', descKey: 'lateNight', pay: job.basePayPerShift + 25, energyCost: 30, socialCost: 20, socialGain: 0, conflictKey: 'missSleep' },
  ];

  if (!hasPhone) {
    // Can't get called for some shifts
    const available = allShifts.filter(s => ['easy_gig', 'friend_tutor', 'group_job'].includes(s.id));
    return available.slice(0, 2);
  }

  const shuffled = allShifts.sort(() => Math.random() - 0.5);
  const count = isYomTov ? 2 : 4; // Fewer shifts on yom tov months
  return shuffled.slice(0, count);
}

// ─── Event Generation ────────────────────────────────────────
function generateMonthEvents(month: number, inflated: boolean, hasMaaser: boolean, consecutiveMaaser: number): MonthEvent[] {
  const priceAdj = inflated ? 1.15 : 1.0;
  const events: MonthEvent[] = [];

  const allEvents: MonthEvent[] = [
    {
      id: 'phone_cracked', textKey: 'phoneCracked', emoji: '📱💥',
      choices: [
        { labelKey: 'fixPhone', cost: Math.round(134 * priceAdj), socialEffect: 0, energyEffect: 0 },
        { labelKey: 'liveCracked', cost: 0, socialEffect: -5, energyEffect: -5 },
      ],
    },
    {
      id: 'jordans', textKey: 'jordans', emoji: '👟',
      choices: [
        { labelKey: 'buyJordans', cost: Math.round(268 * priceAdj), socialEffect: 15, energyEffect: 0 },
        { labelKey: 'buyJordansInstall', cost: 0, socialEffect: 15, energyEffect: 0, isInstallment: { monthly: 34, total: Math.round(335 * priceAdj), months: 10 } },
        { labelKey: 'skipJordans', cost: 0, socialEffect: -8, energyEffect: 0 },
      ],
    },
    {
      id: 'friend_loan', textKey: 'friendLoan', emoji: '🤝',
      choices: [
        { labelKey: 'lendFriend', cost: 67, socialEffect: 15, energyEffect: 0, lendingRisk: true },
        { labelKey: 'declineLend', cost: 0, socialEffect: -10, energyEffect: 0 },
      ],
    },
    {
      id: 'bar_mitzvah', textKey: 'barMitzvah', emoji: '🎉',
      choices: [
        { labelKey: 'niceGift', cost: Math.round(54 * priceAdj), socialEffect: 18, energyEffect: 0 },
        { labelKey: 'cheapGift', cost: Math.round(20 * priceAdj), socialEffect: 5, energyEffect: 0 },
        { labelKey: 'skipEvent', cost: 0, socialEffect: -15, energyEffect: 5 },
      ],
    },
    {
      id: 'concert', textKey: 'concert', emoji: '🎵',
      choices: [
        { labelKey: 'buyConcert', cost: Math.round(100 * priceAdj), socialEffect: 20, energyEffect: -10 },
        { labelKey: 'skipConcert', cost: 0, socialEffect: -5, energyEffect: 5 },
      ],
    },
    {
      id: 'school_trip', textKey: 'schoolTrip', emoji: '🏕️',
      choices: [
        { labelKey: 'payTrip', cost: Math.round(80 * priceAdj), socialEffect: 18, energyEffect: -5 },
        { labelKey: 'skipTrip', cost: 0, socialEffect: -20, energyEffect: 5 },
      ],
    },
    {
      id: 'falafel_inflation', textKey: 'falafelInflation', emoji: '🧆',
      choices: [
        { labelKey: 'buyFalafel', cost: Math.round(17 * priceAdj), socialEffect: 5, energyEffect: 5 },
        { labelKey: 'bringLunch', cost: 0, socialEffect: -3, energyEffect: 0 },
      ],
    },
    {
      id: 'emergency_dentist', textKey: 'emergencyDentist', emoji: '🦷',
      choices: [
        { labelKey: 'payDentist', cost: Math.round(120 * priceAdj), socialEffect: 0, energyEffect: 5, debtIfCantAfford: true },
      ],
    },
    {
      id: 'broken_bike', textKey: 'brokenBike', emoji: '🚲💥',
      choices: [
        { labelKey: 'fixBike', cost: Math.round(60 * priceAdj), socialEffect: 0, energyEffect: 10 },
        { labelKey: 'walkEverywhere', cost: 0, socialEffect: 0, energyEffect: -15 },
      ],
    },
    {
      id: 'sale_temptation', textKey: 'saleTemptation', emoji: '🛍️',
      choices: [
        { labelKey: 'buySale', cost: Math.round(80 * priceAdj), socialEffect: 5, energyEffect: 0 },
        { labelKey: 'resistSale', cost: 0, socialEffect: 0, energyEffect: 0 },
      ],
    },
  ];

  // Pick 2-3 events per month
  const shuffled = allEvents.sort(() => Math.random() - 0.5);
  const count = month >= 4 ? 3 : 2; // Later months are harder
  events.push(...shuffled.slice(0, count));

  // Inflation announcement in month 3
  if (month === INFLATION_MONTH) {
    events.unshift({
      id: 'inflation_notice', textKey: 'inflationNotice', emoji: '📈',
      choices: [{ labelKey: 'understood', cost: 0, socialEffect: 0, energyEffect: -5 }],
    });
  }

  // Maaser reward in month 3 if consistent
  if (month === 3 && hasMaaser && consecutiveMaaser >= 2) {
    events.push({
      id: 'maaser_reward', textKey: 'maaserReward', emoji: '✨',
      choices: [{ labelKey: 'acceptReward', cost: -120, socialEffect: 10, energyEffect: 5 }],
    });
  }

  // Yom tov events
  if (month === 2 || month === 5) {
    events.unshift({
      id: 'yom_tov', textKey: 'yomTov', emoji: '🕍',
      choices: [{ labelKey: 'enjoyHoliday', cost: 0, socialEffect: 10, energyEffect: 10 }],
    });
  }

  return events;
}

function getMoodFace(v: number): string {
  if (v >= 80) return '😄'; if (v >= 60) return '🙂'; if (v >= 40) return '😐'; if (v >= 20) return '😟'; return '😢';
}
function getEnergyFace(v: number): string {
  if (v >= 80) return '⚡'; if (v >= 60) return '🔋'; if (v >= 40) return '🪫'; if (v >= 20) return '😴'; return '💀';
}
function getSocialFace(v: number): string {
  if (v >= 80) return '👫'; if (v >= 60) return '🤝'; if (v >= 40) return '👋'; if (v >= 20) return '😶'; return '😔';
}
function getStarRating(v: number): string {
  if (v >= 80) return '⭐⭐⭐'; if (v >= 50) return '⭐⭐'; if (v >= 20) return '⭐'; return '—';
}

// ─── Component ───────────────────────────────────────────────
interface Level3Props { onHome: () => void; onRestart: () => void; }

export const Level3Screen: React.FC<Level3Props> = ({ onHome, onRestart }) => {
  const { t } = useTranslation();
  const {
    levels, setGender, startLevel, addIncome, spend,
    toggleMaaser, addMaaser, setSavingGoal, addToSavingGoal,
    incrementImpulseResist, advanceWeek, completeLevel,
  } = useGameStore();
  const level = levels[3];

  const [view, setView] = useState<Level3View>('intro');
  const [showMaaser, setShowMaaser] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalOption | null>(null);
  const [currentMonth, setCurrentMonth] = useState(1);

  // Meters
  const [energy, setEnergy] = useState(70);
  const [social, setSocial] = useState(60);

  // Financial state
  const [savingsAccount, setSavingsAccount] = useState(0);
  const [debt, setDebt] = useState(0);
  const [installmentDebt, setInstallmentDebt] = useState(0);
  const [installmentMonthly, setInstallmentMonthly] = useState(0);
  const [installmentRemaining, setInstallmentRemaining] = useState(0);
  const [hasPhone, setHasPhone] = useState(true);
  const [inflated, setInflated] = useState(false);
  const [pendingLoan, setPendingLoan] = useState(0);
  const [consecutiveMaaser, setConsecutiveMaaser] = useState(0);

  // Month state
  const [monthShifts, setMonthShifts] = useState<ShiftOffer[]>([]);
  const [shiftDecisions, setShiftDecisions] = useState<Record<string, boolean>>({});
  const [monthEvents, setMonthEvents] = useState<MonthEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [monthEarned, setMonthEarned] = useState(0);
  const [monthSpent, setMonthSpent] = useState(0);

  const job = selectedJob || JOBS[0];
  const charName = level.gender === 'girl' ? t('levels.level3.girlName') : t('levels.level3.boyName');

  // ─── Handlers ──────────────────────────────────────────────
  const startNewMonth = (month: number) => {
    const inf = month >= INFLATION_MONTH;
    setInflated(inf);
    const shifts = generateShiftOffers(month, job, hasPhone, inf);
    setMonthShifts(shifts);
    setShiftDecisions({});
    setMonthEarned(0);
    setMonthSpent(0);
    setCurrentEventIndex(0);
    setView('shiftOffers');
  };

  const handleShiftDecision = (shiftId: string, accept: boolean) => {
    setShiftDecisions(prev => ({ ...prev, [shiftId]: accept }));
  };

  const handleConfirmShifts = () => {
    let earned = 0;
    let eDelta = 5; // Base monthly energy recovery
    let sDelta = -3; // Base social drift

    monthShifts.forEach(shift => {
      if (shiftDecisions[shift.id]) {
        earned += shift.pay;
        eDelta -= shift.energyCost;
        sDelta -= shift.socialCost;
        sDelta += shift.socialGain;
      }
    });

    addIncome(3, earned);
    setMonthEarned(earned);
    setEnergy(prev => Math.max(0, Math.min(100, prev + eDelta)));
    setSocial(prev => Math.max(0, Math.min(100, prev + sDelta)));

    // Apply savings interest
    if (savingsAccount > 0) {
      const interest = Math.round(savingsAccount * INTEREST_RATE);
      setSavingsAccount(prev => prev + interest);
    }

    // Apply debt interest
    if (debt > 0) {
      setDebt(prev => Math.round(prev * (1 + DEBT_INTEREST)));
    }

    // Resolve pending loan (70% payback)
    if (pendingLoan > 0) {
      if (Math.random() < 0.7) {
        addIncome(3, pendingLoan);
        setPendingLoan(0);
      } else {
        // They didn't pay back
        setSocial(prev => Math.max(0, prev - 5));
        setPendingLoan(0);
      }
    }

    // Pay installments
    if (installmentRemaining > 0) {
      const payment = installmentMonthly;
      spend(3, payment);
      setMonthSpent(prev => prev + payment);
      setInstallmentRemaining(prev => prev - 1);
      if (installmentRemaining <= 1) {
        setInstallmentMonthly(0);
        setInstallmentDebt(0);
      }
    }

    // Generate events
    const events = generateMonthEvents(currentMonth, inflated, level.maaserEnabled, consecutiveMaaser);
    setMonthEvents(events);
    setCurrentEventIndex(0);
    setView(events.length > 0 ? 'monthEvents' : 'phoneBill');
  };

  const handleEventChoice = (choice: EventChoice) => {
    if (choice.isInstallment) {
      setInstallmentMonthly(choice.isInstallment.monthly);
      setInstallmentDebt(choice.isInstallment.total);
      setInstallmentRemaining(choice.isInstallment.months);
      setSocial(prev => Math.max(0, Math.min(100, prev + choice.socialEffect)));
    } else if (choice.lendingRisk) {
      if (level.balance >= choice.cost) {
        spend(3, choice.cost);
        setMonthSpent(prev => prev + choice.cost);
        setPendingLoan(choice.cost);
        setSocial(prev => Math.max(0, Math.min(100, prev + choice.socialEffect)));
      }
    } else if (choice.cost > 0) {
      if (level.balance >= choice.cost) {
        spend(3, choice.cost);
        setMonthSpent(prev => prev + choice.cost);
      } else if (choice.debtIfCantAfford) {
        // Forced to borrow from parents
        const shortfall = choice.cost - level.balance;
        if (level.balance > 0) spend(3, level.balance);
        setDebt(prev => prev + shortfall);
        setMonthSpent(prev => prev + choice.cost);
      } else {
        // Can't afford, skip
        return;
      }
      setSocial(prev => Math.max(0, Math.min(100, prev + choice.socialEffect)));
      setEnergy(prev => Math.max(0, Math.min(100, prev + choice.energyEffect)));
    } else if (choice.cost < 0) {
      addIncome(3, Math.abs(choice.cost));
      setSocial(prev => Math.max(0, Math.min(100, prev + choice.socialEffect)));
      setEnergy(prev => Math.max(0, Math.min(100, prev + choice.energyEffect)));
    } else {
      setSocial(prev => Math.max(0, Math.min(100, prev + choice.socialEffect)));
      setEnergy(prev => Math.max(0, Math.min(100, prev + choice.energyEffect)));
    }

    if (choice.cost === 0 && !choice.isInstallment && !choice.lendingRisk && monthEvents[currentEventIndex]?.id === 'sale_temptation') {
      incrementImpulseResist(3);
    }

    // Next event or phone bill
    if (currentEventIndex < monthEvents.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    } else {
      setView('phoneBill');
    }
  };

  const handlePayPhoneBill = (pay: boolean) => {
    if (pay && level.balance >= PHONE_BILL) {
      spend(3, PHONE_BILL);
      setMonthSpent(prev => prev + PHONE_BILL);
      setHasPhone(true);
    } else if (pay && level.balance < PHONE_BILL) {
      // Borrow to pay
      const shortfall = PHONE_BILL - level.balance;
      if (level.balance > 0) spend(3, level.balance);
      setDebt(prev => prev + shortfall);
      setMonthSpent(prev => prev + PHONE_BILL);
      setHasPhone(true);
    } else {
      setHasPhone(false);
      setSocial(prev => Math.max(0, prev - 15));
    }
    setView('monthSummary');
  };

  const handleSaveToAccount = (amount: number) => {
    if (level.balance >= amount) {
      spend(3, amount);
      setSavingsAccount(prev => prev + amount);
      addToSavingGoal(3, amount);
    }
  };

  const handlePayDebt = (amount: number) => {
    const payAmount = Math.min(amount, debt, level.balance);
    if (payAmount > 0) {
      spend(3, payAmount);
      setDebt(prev => prev - payAmount);
    }
  };

  const handleNextMonth = () => {
    if (energy <= 0 || social <= 0 || (level.balance < 0 && debt > 200)) {
      setView('gameOver');
      return;
    }
    if (currentMonth >= TOTAL_MONTHS) {
      completeLevel(3);
      setView('gameWin');
      return;
    }

    // Maaser tracking
    if (level.maaserEnabled) {
      const maaserAmt = Math.round(monthEarned * 0.1);
      if (level.balance >= maaserAmt) {
        addMaaser(3, maaserAmt);
        setConsecutiveMaaser(prev => prev + 1);
      }
    }

    // Energy partial recovery each month
    setEnergy(prev => Math.min(100, prev + 10));

    const nextMonth = currentMonth + 1;
    setCurrentMonth(nextMonth);
    advanceWeek(3);
    startNewMonth(nextMonth);
  };

  const handlePlayAgain = () => {
    startLevel(3, 150);
    setCurrentMonth(1);
    setEnergy(70);
    setSocial(60);
    setSavingsAccount(0);
    setDebt(0);
    setInstallmentDebt(0);
    setInstallmentMonthly(0);
    setInstallmentRemaining(0);
    setHasPhone(true);
    setInflated(false);
    setPendingLoan(0);
    setConsecutiveMaaser(0);
    setView('howItWorks');
  };

  // ─── METERS BAR ────────────────────────────────────────────
  const MetersBar = () => (
    <View style={styles.metersBar}>
      <View style={styles.meterItem}>
        <Text style={styles.meterFace}>{getEnergyFace(energy)}</Text>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${energy}%`, backgroundColor: energy > 50 ? '#FF9800' : energy > 25 ? '#F44336' : '#B71C1C' }]} />
        </View>
        <Text style={styles.meterValue}>{energy}%</Text>
      </View>
      <View style={styles.meterItem}>
        <Text style={styles.meterFace}>{getSocialFace(social)}</Text>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${social}%`, backgroundColor: social > 50 ? '#2196F3' : social > 25 ? '#FF9800' : '#E91E63' }]} />
        </View>
        <Text style={styles.meterValue}>{social}%</Text>
      </View>
      <View style={styles.meterItem}>
        <Text style={styles.meterFace}>💰</Text>
        <Text style={[styles.balanceText, level.balance < 0 && { color: colors.danger }]}>₪{level.balance}</Text>
      </View>
      {debt > 0 && (
        <View style={styles.debtBadge}>
          <Text style={styles.debtText}>🔴 Debt: ₪{debt}</Text>
        </View>
      )}
      {!hasPhone && (
        <View style={styles.phoneCutBadge}>
          <Text style={styles.phoneCutText}>📵 Phone Cut Off!</Text>
        </View>
      )}
      {savingsAccount > 0 && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>🏦 Savings: ₪{savingsAccount}</Text>
        </View>
      )}
    </View>
  );

  // ─── INTRO ────────────────────────────────────────────────
  if (view === 'intro') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.bigEmoji}>📱</Text>
        <Text style={styles.title}>{t('levels.level3.title')}</Text>
        <Text style={styles.subtitle}>{t('levels.level3.subtitle')}</Text>
        <Text style={styles.description}>{t('levels.level3.intro')}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('characterSelect')}>
          <Text style={styles.primaryBtnText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── CHARACTER SELECT ──────────────────────────────────────
  if (view === 'characterSelect') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <Text style={styles.bigEmoji}>📱</Text>
        <Text style={styles.title}>{t('common.chooseCharacter')}</Text>
        <View style={styles.charRow}>
          <TouchableOpacity style={[styles.charCard, level.gender === 'boy' && styles.charSelected]} onPress={() => setGender(3, 'boy')}>
            <Text style={styles.charEmoji}>👦</Text>
            <Text style={styles.charName}>{t('levels.level3.boyName')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.charCard, level.gender === 'girl' && styles.charSelected]} onPress={() => setGender(3, 'girl')}>
            <Text style={styles.charEmoji}>👧</Text>
            <Text style={styles.charName}>{t('levels.level3.girlName')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.primaryBtn, !level.gender && styles.disabledBtn]} onPress={() => { if (level.gender) { startLevel(3, 150); setShowMaaser(true); } }} disabled={!level.gender}>
          <Text style={styles.primaryBtnText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
        <MaaserModal visible={showMaaser} onAccept={() => { toggleMaaser(3, true); setShowMaaser(false); setView('howItWorks'); }} onDecline={() => { setShowMaaser(false); setView('howItWorks'); }} />
      </SafeAreaView>
    );
  }

  // ─── HOW IT WORKS ──────────────────────────────────────────
  if (view === 'howItWorks') {
    const steps = [
      { emoji: '📱', title: 'Your Phone is Your Lifeline', text: 'Pay ₪34/month or it gets cut off. No phone = fewer shifts, missed social events, everything gets harder.' },
      { emoji: '💼', title: 'Take Shift Offers', text: 'Each month, shift offers come in. More work = more money, but watch your energy! Burn out and your parents limit your hours.' },
      { emoji: '🏦', title: 'Save & Earn Interest', text: 'Money in savings earns 2% monthly. But if you need cash and borrow from parents — 10% interest on debt!' },
      { emoji: '📈', title: 'Prices Go Up (Inflation)', text: 'Halfway through, everything gets 15% more expensive. Your pay stays the same. Plan ahead!' },
      { emoji: '🎯', title: 'Win Condition', text: 'Survive 6 months: positive balance, savings goal reached, no debt, and all meters above 50%.' },
    ];
    return (
      <SafeAreaView style={styles.scrollContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>How It Works</Text>
          <Text style={styles.howGreeting}>This is real life, {charName}. Here's what you're dealing with:</Text>
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepCard}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
              {i < steps.length - 1 && <Text style={styles.arrow}>⬇️</Text>}
            </React.Fragment>
          ))}
          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>The buy-now-pay-later trap is real. ₪34/month sounds cheap until you realize you're paying ₪335 for something worth ₪268!</Text>
          </View>
          <TouchableOpacity style={styles.greenBtn} onPress={() => setView('jobSelect')}>
            <Text style={styles.greenBtnText}>Let's Go! 🎉</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── JOB SELECT ────────────────────────────────────────────
  if (view === 'jobSelect') {
    return (
      <SafeAreaView style={styles.scrollContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Choose Your Job</Text>
          {JOBS.map(j => (
            <TouchableOpacity key={j.id} style={[styles.jobCard, selectedJob?.id === j.id && styles.jobSelected]} onPress={() => setSelectedJob(j)}>
              <Text style={styles.jobEmoji}>{j.emoji}</Text>
              <View style={styles.jobInfo}>
                <Text style={styles.jobName}>{t(`level3Jobs.${j.id}`)}</Text>
                <Text style={styles.jobPay}>₪{j.basePayPerShift}/shift</Text>
                <Text style={styles.jobDesc}>{t(`level3Jobs.${j.id}Desc`)}</Text>
              </View>
              {selectedJob?.id === j.id && <Text style={styles.jobCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.primaryBtn, !selectedJob && styles.disabledBtn]} onPress={() => { if (selectedJob) setView('savingsGoal'); }} disabled={!selectedJob}>
            <Text style={styles.primaryBtnText}>Choose This Job</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SAVINGS GOAL ──────────────────────────────────────────
  if (view === 'savingsGoal') {
    return (
      <SafeAreaView style={styles.scrollContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>🎯 Set Your Savings Goal</Text>
          <Text style={styles.subtitle}>What are you working towards?</Text>
          {SAVINGS_GOALS.map(goal => (
            <TouchableOpacity key={goal.id} style={styles.goalCard} onPress={() => {
              setSelectedGoal(goal);
              setSavingGoal(3, { itemId: goal.id, targetAmount: goal.amount, currentAmount: 0, completed: false });
              startNewMonth(1);
            }}>
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <View style={styles.goalInfo}>
                <Text style={styles.goalName}>{t(`level3SavingsGoals.${goal.nameKey}`)}</Text>
                <Text style={styles.goalAmount}>₪{goal.amount}</Text>
              </View>
              <Text style={styles.goalArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SHIFT OFFERS ──────────────────────────────────────────
  if (view === 'shiftOffers') {
    const allDecided = monthShifts.every(s => shiftDecisions[s.id] !== undefined);
    const isYomTov = currentMonth === 2 || currentMonth === 5;

    return (
      <SafeAreaView style={styles.scrollContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.weekHeader}>Month {currentMonth} of {TOTAL_MONTHS}</Text>
          {isYomTov && <View style={styles.yomTovBanner}><Text style={styles.yomTovText}>🕍 Yom Tov month — fewer shifts available</Text></View>}
          {!hasPhone && <View style={styles.phoneCutBanner}><Text style={styles.phoneCutBannerText}>📵 Phone is off! Only walk-in shifts available.</Text></View>}
          {inflated && currentMonth === INFLATION_MONTH && <View style={styles.inflationBanner}><Text style={styles.inflationBannerText}>📈 Prices just went up 15%! Your pay didn't.</Text></View>}

          <MetersBar />

          <Text style={styles.sectionTitle}>📲 Shift Offers This Month</Text>

          {monthShifts.map(shift => {
            const decided = shiftDecisions[shift.id];
            const accepted = decided === true;
            const declined = decided === false;
            return (
              <View key={shift.id} style={[styles.shiftCard, accepted && styles.shiftAccepted, declined && styles.shiftDeclined]}>
                <Text style={styles.shiftDesc}>{t(`level3Shifts.${shift.descKey}`)}</Text>
                <View style={styles.shiftMeta}>
                  <Text style={styles.shiftPay}>💰 ₪{shift.pay}</Text>
                  <Text style={styles.shiftEnergy}>⚡ -{shift.energyCost}%</Text>
                  {shift.socialCost > 0 && <Text style={styles.shiftSocial}>👫 -{shift.socialCost}%</Text>}
                  {shift.socialGain > 0 && <Text style={styles.shiftSocialGain}>👫 +{shift.socialGain}%</Text>}
                </View>
                {shift.conflictKey && <Text style={styles.shiftConflict}>⚠️ {t(`level3Shifts.${shift.conflictKey}`)}</Text>}
                <View style={styles.shiftButtons}>
                  <TouchableOpacity style={[styles.yesBtn, accepted && styles.yesBtnActive]} onPress={() => handleShiftDecision(shift.id, true)}>
                    <Text style={[styles.yesBtnText, accepted && styles.btnTextActive]}>✓ Take it</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.noBtn, declined && styles.noBtnActive]} onPress={() => handleShiftDecision(shift.id, false)}>
                    <Text style={[styles.noBtnText, declined && styles.btnTextActive]}>✗ Pass</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={[styles.primaryBtn, !allDecided && styles.disabledBtn]} onPress={handleConfirmShifts} disabled={!allDecided}>
            <Text style={styles.primaryBtnText}>{allDecided ? 'Lock In Shifts →' : 'Decide on all shifts first!'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MONTH EVENTS ─────────────────────────────────────────
  if (view === 'monthEvents' && monthEvents[currentEventIndex]) {
    const evt = monthEvents[currentEventIndex];
    return (
      <SafeAreaView style={styles.scrollContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]}>
          <Text style={styles.weekHeader}>Month {currentMonth} — Event {currentEventIndex + 1}/{monthEvents.length}</Text>
          <MetersBar />
          <View style={styles.eventCard}>
            <Text style={styles.eventEmoji}>{evt.emoji}</Text>
            <Text style={styles.eventText}>{t(`level3Events2.${evt.textKey}`)}</Text>
            <Text style={styles.eventBalance}>Balance: ₪{level.balance}</Text>
            {evt.choices.map((choice, i) => {
              const canAfford = choice.cost <= 0 || level.balance >= choice.cost || choice.debtIfCantAfford || choice.isInstallment || choice.lendingRisk;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    choice.cost > 100 ? styles.dangerBtn :
                    choice.cost <= 0 ? styles.greenBtn :
                    styles.primaryBtn,
                    !canAfford && styles.disabledBtn,
                  ]}
                  onPress={() => handleEventChoice(choice)}
                  disabled={!canAfford}
                >
                  <Text style={styles.primaryBtnText}>
                    {t(`level3Events2.${choice.labelKey}`)}
                    {choice.cost > 0 ? ` (₪${choice.cost})` : choice.cost < 0 ? ` (+₪${Math.abs(choice.cost)})` : ''}
                    {choice.isInstallment ? ` — or ₪${choice.isInstallment.monthly}/mo ×${choice.isInstallment.months}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── PHONE BILL ────────────────────────────────────────────
  if (view === 'phoneBill') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <Text style={styles.bigEmoji}>📱</Text>
        <Text style={styles.title}>Phone Bill Due!</Text>
        <Text style={styles.description}>Your monthly phone bill is ₪{PHONE_BILL}. Pay it to keep your phone active.</Text>
        <Text style={styles.eventBalance}>Balance: ₪{level.balance}</Text>
        {level.balance < PHONE_BILL && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ You don't have enough! You can borrow from your parents (adds to your debt at 10% interest), or skip and lose your phone.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => handlePayPhoneBill(true)}>
          <Text style={styles.primaryBtnText}>
            {level.balance >= PHONE_BILL ? `Pay ₪${PHONE_BILL}` : `Borrow & Pay ₪${PHONE_BILL}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => handlePayPhoneBill(false)}>
          <Text style={styles.secondaryBtnText}>📵 Skip — lose phone for next month</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── MONTH SUMMARY ─────────────────────────────────────────
  if (view === 'monthSummary') {
    const goalProgress = level.savingGoal ? Math.round((savingsAccount / level.savingGoal.targetAmount) * 100) : 0;
    return (
      <SafeAreaView style={styles.scrollContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>📊 Month {currentMonth} Summary</Text>
          <MetersBar />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Earned from shifts</Text><Text style={[styles.summaryAmount, { color: colors.success }]}>+₪{monthEarned}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Spent</Text><Text style={[styles.summaryAmount, { color: colors.danger }]}>-₪{monthSpent}</Text></View>
            {savingsAccount > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Savings (2% interest)</Text><Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>₪{savingsAccount}</Text></View>}
            {debt > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Debt (10% interest)</Text><Text style={[styles.summaryAmount, { color: colors.danger }]}>-₪{debt}</Text></View>}
            {installmentRemaining > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Installments left</Text><Text style={styles.summaryAmount}>₪{installmentMonthly}/mo × {installmentRemaining}</Text></View>}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}><Text style={styles.summaryLabelBold}>Cash Balance</Text><Text style={[styles.summaryAmountBold, level.balance < 0 && { color: colors.danger }]}>₪{level.balance}</Text></View>
          </View>

          {/* Savings goal progress */}
          {selectedGoal && (
            <View style={styles.goalProgressCard}>
              <Text style={styles.goalProgressTitle}>🎯 {selectedGoal.emoji} {t(`level3SavingsGoals.${selectedGoal.nameKey}`)}</Text>
              <View style={styles.goalBar}><View style={[styles.goalBarFill, { width: `${Math.min(goalProgress, 100)}%` }]} /></View>
              <Text style={styles.goalProgressText}>₪{savingsAccount} / ₪{selectedGoal.amount} ({goalProgress}%)</Text>
            </View>
          )}

          {/* Save to account option */}
          {level.balance > 0 && (
            <View style={styles.saveSection}>
              <Text style={styles.saveSectionTitle}>🏦 Save to your account?</Text>
              <View style={styles.saveButtons}>
                {[25, 50, 100].filter(a => a <= level.balance).map(amount => (
                  <TouchableOpacity key={amount} style={styles.saveBtn} onPress={() => handleSaveToAccount(amount)}>
                    <Text style={styles.saveBtnText}>Save ₪{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Pay debt option */}
          {debt > 0 && level.balance > 0 && (
            <View style={styles.debtSection}>
              <Text style={styles.debtSectionTitle}>🔴 Pay down debt? (₪{debt} at 10% interest)</Text>
              <TouchableOpacity style={styles.debtPayBtn} onPress={() => handlePayDebt(Math.min(debt, level.balance))}>
                <Text style={styles.debtPayBtnText}>Pay ₪{Math.min(debt, level.balance)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Warnings */}
          {energy < 30 && <View style={styles.warningBox}><Text style={styles.warningText}>😴 You're burning out! Work fewer shifts next month or your parents will step in.</Text></View>}
          {social < 30 && <View style={styles.warningBox}><Text style={styles.warningText}>😶 Your friends barely see you anymore. Make time for people!</Text></View>}
          {debt > 100 && <View style={styles.warningBox}><Text style={styles.warningText}>🔴 Your debt is growing with 10% interest! Pay it down before it spirals.</Text></View>}
          {!hasPhone && <View style={styles.warningBox}><Text style={styles.warningText}>📵 No phone next month = fewer shifts and missed social events.</Text></View>}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleNextMonth}>
            <Text style={styles.primaryBtnText}>{currentMonth < TOTAL_MONTHS ? `Start Month ${currentMonth + 1} →` : '🏆 See Results!'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── GAME WIN ──────────────────────────────────────────────
  if (view === 'gameWin') {
    const goalReached = savingsAccount >= (selectedGoal?.amount || 0);
    const noDebt = debt === 0 && installmentRemaining === 0;
    const metersGood = energy >= 50 && social >= 50;
    const perfectWin = goalReached && noDebt && metersGood && level.balance > 0;

    return (
      <SafeAreaView style={styles.scrollContainer}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]}>
          <Text style={styles.bigEmoji}>{perfectWin ? '🏆' : '🎉'}</Text>
          <Text style={styles.title}>{perfectWin ? '6 Months — Perfect Score!' : '6 Months Complete!'}</Text>

          <View style={styles.starReport}>
            <Text style={styles.starReportTitle}>Report Card</Text>
            <View style={styles.starRow}><Text style={styles.starLabel}>💰 Money</Text><Text style={styles.starValue}>{getStarRating(Math.min(100, level.balance))}</Text></View>
            <View style={styles.starRow}><Text style={styles.starLabel}>⚡ Energy</Text><Text style={styles.starValue}>{getStarRating(energy)}</Text></View>
            <View style={styles.starRow}><Text style={styles.starLabel}>👫 Social</Text><Text style={styles.starValue}>{getStarRating(social)}</Text></View>
            <View style={styles.starRow}><Text style={styles.starLabel}>🏦 Savings Goal</Text><Text style={styles.starValue}>{goalReached ? '⭐⭐⭐' : '—'}</Text></View>
            <View style={styles.starRow}><Text style={styles.starLabel}>🔴 Debt Free</Text><Text style={styles.starValue}>{noDebt ? '⭐⭐⭐' : '—'}</Text></View>
          </View>

          <Text style={styles.finalBalance}>Cash: ₪{level.balance} | Savings: ₪{savingsAccount}{debt > 0 ? ` | Debt: ₪${debt}` : ''}</Text>

          {!perfectWin && <Text style={styles.description}>
            {!goalReached ? `You needed ₪${selectedGoal?.amount} in savings but only had ₪${savingsAccount}. Save more each month!` :
             debt > 0 ? 'You still have debt! Avoid buy-now-pay-later and pay down debt faster.' :
             !metersGood ? 'Your energy or social life suffered. Balance work with rest and friends!' :
             'Close! Keep trying for the perfect score.'}
          </Text>}

          <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
            <Text style={styles.primaryBtnText}>Play Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── GAME OVER ─────────────────────────────────────────────
  if (view === 'gameOver') {
    const reason = energy <= 0 ? `You burned out in month ${currentMonth}. Your parents pulled you from your job. Work-life balance matters!`
      : social <= 0 ? `You lost all your friends by month ${currentMonth}. Money isn't everything — people matter!`
      : `Your debt spiraled out of control by month ${currentMonth}. Avoid borrowing and the buy-now-pay-later trap!`;
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.bigEmoji}>😢</Text>
        <Text style={styles.title}>Game Over</Text>
        <Text style={styles.description}>{reason}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
};

// ─── STYLES ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  centerContainer: { flex: 1, backgroundColor: colors.offWhite, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  scrollContainer: { flex: 1, backgroundColor: colors.offWhite },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  bigEmoji: { fontSize: 72, marginBottom: spacing.md },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: fonts.sizes.md, color: colors.gray, textAlign: 'center', marginBottom: spacing.lg },
  description: { fontSize: fonts.sizes.lg, color: colors.darkGray, textAlign: 'center', lineHeight: 28, marginBottom: spacing.xl },
  sectionTitle: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.darkGray, marginBottom: spacing.md },
  weekHeader: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: spacing.sm },
  howGreeting: { fontSize: fonts.sizes.lg, color: colors.darkGray, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 26 },

  // Buttons
  primaryBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.md, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontSize: fonts.sizes.md, fontWeight: '700', textAlign: 'center' },
  greenBtn: { backgroundColor: '#4CAF50', borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.md, width: '100%', alignItems: 'center' },
  greenBtnText: { color: colors.white, fontSize: fonts.sizes.lg, fontWeight: '700' },
  dangerBtn: { backgroundColor: colors.danger, borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.md, width: '100%', alignItems: 'center' },
  secondaryBtn: { borderRadius: borderRadius.md, paddingVertical: spacing.md, marginTop: spacing.sm, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: colors.gray, fontSize: fonts.sizes.md, fontWeight: '600' },
  disabledBtn: { backgroundColor: colors.gray, opacity: 0.5 },

  // Characters
  charRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  charCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', width: 120, borderWidth: 3, borderColor: 'transparent' },
  charSelected: { borderColor: colors.primary, backgroundColor: '#e8f4fd' },
  charEmoji: { fontSize: 48, marginBottom: spacing.xs },
  charName: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray },

  // How it works
  stepCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, width: '100%', alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  stepEmoji: { fontSize: 40, marginBottom: spacing.xs },
  stepTitle: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs, textAlign: 'center' },
  stepText: { fontSize: fonts.sizes.md, color: colors.darkGray, textAlign: 'center', lineHeight: 22 },
  arrow: { fontSize: 24, paddingVertical: spacing.xs, textAlign: 'center' },
  tipBox: { backgroundColor: '#FFF8E1', borderRadius: 16, padding: spacing.lg, width: '100%', alignItems: 'center', marginTop: spacing.lg, borderWidth: 2, borderColor: '#FFD54F' },
  tipEmoji: { fontSize: 32, marginBottom: spacing.xs },
  tipText: { fontSize: fonts.sizes.md, color: colors.darkGray, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },

  // Jobs
  jobCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, borderWidth: 3, borderColor: 'transparent', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  jobSelected: { borderColor: colors.primary, backgroundColor: '#e8f4fd' },
  jobEmoji: { fontSize: 36, marginRight: spacing.md },
  jobInfo: { flex: 1 },
  jobName: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.darkGray },
  jobPay: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.success },
  jobDesc: { fontSize: fonts.sizes.sm, color: colors.gray, marginTop: spacing.xs },
  jobCheck: { fontSize: 24, color: colors.primary, fontWeight: '800' },

  // Goals
  goalCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  goalEmoji: { fontSize: 36, marginRight: spacing.md },
  goalInfo: { flex: 1 },
  goalName: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.darkGray },
  goalAmount: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.success },
  goalArrow: { fontSize: 24, color: colors.gray },

  // Meters
  metersBar: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  meterItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  meterFace: { fontSize: 24, marginRight: spacing.sm, width: 30 },
  meterTrack: { flex: 1, height: 12, backgroundColor: colors.lightGray, borderRadius: 6, overflow: 'hidden', marginRight: spacing.sm },
  meterFill: { height: '100%', borderRadius: 6 },
  meterValue: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.darkGray, width: 36, textAlign: 'right' },
  balanceText: { fontSize: fonts.sizes.lg, fontWeight: '800', color: colors.primary },
  debtBadge: { backgroundColor: '#FFEBEE', borderRadius: 8, padding: spacing.xs, marginTop: spacing.xs },
  debtText: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.danger, textAlign: 'center' },
  phoneCutBadge: { backgroundColor: '#FFF3E0', borderRadius: 8, padding: spacing.xs, marginTop: spacing.xs },
  phoneCutText: { fontSize: fonts.sizes.sm, fontWeight: '700', color: '#E65100', textAlign: 'center' },
  savingsBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: spacing.xs, marginTop: spacing.xs },
  savingsText: { fontSize: fonts.sizes.sm, fontWeight: '700', color: '#2E7D32', textAlign: 'center' },

  // Shifts
  shiftCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 3, borderColor: 'transparent', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  shiftAccepted: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  shiftDeclined: { borderColor: '#9E9E9E', backgroundColor: '#FAFAFA', opacity: 0.7 },
  shiftDesc: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.darkGray, lineHeight: 22, marginBottom: spacing.sm },
  shiftMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  shiftPay: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.success },
  shiftEnergy: { fontSize: fonts.sizes.sm, fontWeight: '600', color: '#FF9800' },
  shiftSocial: { fontSize: fonts.sizes.sm, fontWeight: '600', color: '#E91E63' },
  shiftSocialGain: { fontSize: fonts.sizes.sm, fontWeight: '600', color: '#2196F3' },
  shiftConflict: { fontSize: fonts.sizes.sm, color: '#E65100', marginBottom: spacing.sm, fontStyle: 'italic' },
  shiftButtons: { flexDirection: 'row', gap: spacing.sm },
  yesBtn: { flex: 1, backgroundColor: '#E8F5E9', borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 2, borderColor: '#C8E6C9' },
  yesBtnActive: { backgroundColor: '#4CAF50', borderColor: '#388E3C' },
  yesBtnText: { fontSize: fonts.sizes.md, fontWeight: '700', color: '#388E3C' },
  noBtn: { flex: 1, backgroundColor: '#FAFAFA', borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0' },
  noBtnActive: { backgroundColor: '#9E9E9E', borderColor: '#757575' },
  noBtnText: { fontSize: fonts.sizes.md, fontWeight: '700', color: '#757575' },
  btnTextActive: { color: colors.white },

  // Banners
  yomTovBanner: { backgroundColor: '#F3E5F5', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 2, borderColor: '#CE93D8' },
  yomTovText: { fontSize: fonts.sizes.md, fontWeight: '600', color: '#7B1FA2', textAlign: 'center' },
  phoneCutBanner: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 2, borderColor: '#FFB74D' },
  phoneCutBannerText: { fontSize: fonts.sizes.md, fontWeight: '600', color: '#E65100', textAlign: 'center' },
  inflationBanner: { backgroundColor: '#FFEBEE', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 2, borderColor: '#EF9A9A' },
  inflationBannerText: { fontSize: fonts.sizes.md, fontWeight: '600', color: '#C62828', textAlign: 'center' },

  // Events
  eventCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, width: '100%', alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  eventEmoji: { fontSize: 56, marginBottom: spacing.md },
  eventText: { fontSize: fonts.sizes.lg, color: colors.darkGray, textAlign: 'center', lineHeight: 26, marginBottom: spacing.md },
  eventBalance: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.gray, marginBottom: spacing.lg },

  // Summary
  summaryCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, marginTop: spacing.md, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { fontSize: fonts.sizes.md, color: colors.darkGray },
  summaryAmount: { fontSize: fonts.sizes.md, fontWeight: '700' },
  summaryDivider: { height: 2, backgroundColor: colors.lightGray, marginVertical: spacing.sm },
  summaryLabelBold: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.darkGray },
  summaryAmountBold: { fontSize: fonts.sizes.lg, fontWeight: '800', color: colors.primary },

  // Goal progress
  goalProgressCard: { backgroundColor: '#FFF8E1', borderRadius: 16, padding: spacing.lg, width: '100%', marginTop: spacing.md, borderWidth: 2, borderColor: '#FFD54F' },
  goalProgressTitle: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray, marginBottom: spacing.sm },
  goalBar: { height: 16, backgroundColor: colors.lightGray, borderRadius: 8, overflow: 'hidden', marginBottom: spacing.xs },
  goalBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 8 },
  goalProgressText: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.darkGray, textAlign: 'center' },

  // Save/Debt sections
  saveSection: { backgroundColor: '#E8F5E9', borderRadius: 16, padding: spacing.lg, width: '100%', marginTop: spacing.md, borderWidth: 2, borderColor: '#C8E6C9' },
  saveSectionTitle: { fontSize: fonts.sizes.md, fontWeight: '700', color: '#2E7D32', marginBottom: spacing.sm },
  saveButtons: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: { flex: 1, backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: spacing.sm, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: fonts.sizes.sm },
  debtSection: { backgroundColor: '#FFEBEE', borderRadius: 16, padding: spacing.lg, width: '100%', marginTop: spacing.md, borderWidth: 2, borderColor: '#EF9A9A' },
  debtSectionTitle: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.danger, marginBottom: spacing.sm },
  debtPayBtn: { backgroundColor: colors.danger, borderRadius: 8, paddingVertical: spacing.sm, alignItems: 'center' },
  debtPayBtnText: { color: colors.white, fontWeight: '700', fontSize: fonts.sizes.md },

  // Warnings
  warningBox: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: spacing.md, marginTop: spacing.md, borderWidth: 2, borderColor: '#FFE0B2', width: '100%' },
  warningText: { fontSize: fonts.sizes.md, color: '#E65100', lineHeight: 22 },

  // Stars
  starReport: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, width: '100%', marginBottom: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  starReportTitle: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: spacing.lg },
  starRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  starLabel: { fontSize: fonts.sizes.lg, color: colors.darkGray },
  starValue: { fontSize: fonts.sizes.lg },
  finalBalance: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.gray, marginBottom: spacing.lg, textAlign: 'center' },
});
