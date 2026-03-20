import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LevelNavBar } from '../../components/LevelNavBar';
import { MaaserModal } from '../../components/MaaserModal';
import { useGameStore } from '../../store';
import { borderRadius, colors, fonts, spacing } from '../../theme';

type JobId = 'grocery' | 'barista' | 'pizza';
type GoalId = 'drivingLessons' | 'gapYearTrip' | 'armyLaptop';
type FundType = 'safe' | 'balanced' | 'aggressive';

type Level4View =
  | 'intro'
  | 'characterSelect'
  | 'howItWorks'
  | 'jobSelect'
  | 'savingsGoal'
  | 'payslip'
  | 'monthDecisions'
  | 'investmentChoice'
  | 'monthEvents'
  | 'phoneBill'
  | 'creditCardStatement'
  | 'monthSummary'
  | 'gameWin'
  | 'gameOver';

interface JobOption {
  id: JobId;
  emoji: string;
  monthlyGross: number;
  descKey: string;
}

interface SavingsGoalOption {
  id: GoalId;
  emoji: string;
  amount: number;
  nameKey: string;
}

interface Payslip {
  gross: number;
  tips: number;
  transport: number;
  taxable: number;
  bituachLeumi: number;
  masHachnasa: number;
  net: number;
}

interface EventChoice {
  labelKey: string;
  cashCost?: number;
  cardCost?: number;
  cashGain?: number;
  social: number;
  energy: number;
  startGym?: boolean;
  startInstallment?: { monthly: number; months: number };
  refundNextMonth?: number;
  startCourseBoost?: number;
}

interface MonthEvent {
  id: string;
  emoji: string;
  textKey: string;
  choices: EventChoice[];
}

interface CardLine {
  id: string;
  labelKey: string;
  amount: number;
}

interface InvestmentSnapshot {
  month: number;
  principal: number;
  value: number;
  rate: number;
}

const TOTAL_MONTHS = 6;
const BANK_SAVINGS_INTEREST = 0.015;
const BANK_DEBT_INTEREST = 0.02;
const CREDIT_CARD_INTEREST = 0.02;
const PHONE_BILL = 50;
const FOOD_BASELINE = 400;
const BUS_PASS = 200;
const PARENTS_CONTRIBUTION = 300;
const TOTAL_MANDATORY_MONTHLY = PARENTS_CONTRIBUTION + BUS_PASS + FOOD_BASELINE + PHONE_BILL;
const GYM_MONTHLY = 150;

const JOBS: JobOption[] = [
  { id: 'grocery', emoji: '🛒', monthlyGross: 3800, descKey: 'jobs.groceryDesc' },
  { id: 'barista', emoji: '☕', monthlyGross: 3200, descKey: 'jobs.baristaDesc' },
  { id: 'pizza', emoji: '🍕', monthlyGross: 4200, descKey: 'jobs.pizzaDesc' },
];

const GOALS: SavingsGoalOption[] = [
  { id: 'drivingLessons', emoji: '🚗', amount: 3500, nameKey: 'goals.drivingLessons' },
  { id: 'gapYearTrip', emoji: '✈️', amount: 5000, nameKey: 'goals.gapYearTrip' },
  { id: 'armyLaptop', emoji: '💻', amount: 4000, nameKey: 'goals.armyLaptop' },
];

interface Level4Props {
  onHome: () => void;
  onRestart: () => void;
}

const clampMeter = (v: number) => Math.max(0, Math.min(100, v));

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getFundRate = (fund: FundType) => {
  if (fund === 'safe') return randomInt(1, 3) / 100;
  if (fund === 'balanced') return randomInt(0, 6) / 100;
  return randomInt(-5, 10) / 100;
};

export const Level4Screen: React.FC<Level4Props> = ({ onHome, onRestart }) => {
  const { t } = useTranslation();
  const {
    levels,
    setGender,
    startLevel,
    addIncome,
    spend,
    toggleMaaser,
    addMaaser,
    setSavingGoal,
    advanceWeek,
    completeLevel,
    earnBadge,
  } = useGameStore();
  const level = levels[4];

  const [view, setView] = useState<Level4View>('intro');
  const [showMaaser, setShowMaaser] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(1);

  const [selectedJob, setSelectedJob] = useState<JobOption | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalOption | null>(null);

  const [energy, setEnergy] = useState(75);
  const [social, setSocial] = useState(70);

  const [savingsBalance, setSavingsBalance] = useState(0);
  const [bankDebt, setBankDebt] = useState(0);
  const [creditCardBalance, setCreditCardBalance] = useState(0);
  const [cardLines, setCardLines] = useState<CardLine[]>([]);

  const [gymActive, setGymActive] = useState(false);
  const [phoneInstallmentMonths, setPhoneInstallmentMonths] = useState(0);
  const [pendingFraudRefund, setPendingFraudRefund] = useState(0);
  const [creditCardUnlocked, setCreditCardUnlocked] = useState(false);

  const [selectedFund, setSelectedFund] = useState<FundType>('balanced');
  const [investedPrincipal, setInvestedPrincipal] = useState(0);
  const [investmentValue, setInvestmentValue] = useState(0);
  const [lastFundRate, setLastFundRate] = useState(0);
  const [investmentHistory, setInvestmentHistory] = useState<InvestmentSnapshot[]>([]);

  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [monthEvents, setMonthEvents] = useState<MonthEvent[]>([]);
  const [eventIndex, setEventIndex] = useState(0);
  const [monthInvestAmount, setMonthInvestAmount] = useState(0);

  const [monthGross, setMonthGross] = useState(0);
  const [monthTax, setMonthTax] = useState(0);
  const [monthNet, setMonthNet] = useState(0);
  const [monthCashSpent, setMonthCashSpent] = useState(0);
  const [monthCardSpent, setMonthCardSpent] = useState(0);
  const [monthCardPayment, setMonthCardPayment] = useState(0);

  const [goalSaved, setGoalSaved] = useState(0);
  const [consecutiveMaaserMonths, setConsecutiveMaaserMonths] = useState(0);
  const [courseIncomeBoost, setCourseIncomeBoost] = useState(0);
  const [failReason, setFailReason] = useState('');

  const getLiveBalance = () => useGameStore.getState().levels[4].balance;

  const effectiveBalance = useMemo(
    () => level.balance - bankDebt - creditCardBalance,
    [level.balance, bankDebt, creditCardBalance]
  );

  const charName =
    level.gender === 'girl' ? t('levels.level4.girlName') : t('levels.level4.boyName');

  const addCardLine = (labelKey: string, amount: number) => {
    setCardLines(prev => [
      ...prev,
      {
        id: `${labelKey}-${Date.now()}-${Math.random()}`,
        labelKey,
        amount,
      },
    ]);
    setCreditCardBalance(prev => Math.max(0, prev + amount));
    if (amount > 0) setMonthCardSpent(prev => prev + amount);
  };

  const spendWithOverdraft = (amount: number) => {
    if (amount <= 0) return;
    const balance = getLiveBalance();
    if (balance >= amount) {
      spend(4, amount);
    } else {
      if (balance > 0) {
        spend(4, balance);
      }
      setBankDebt(prev => prev + (amount - balance));
    }
    setMonthCashSpent(prev => prev + amount);
  };

  const applyFailureCheck = (reasonFallback?: string) => {
    const currentBalance = useGameStore.getState().levels[4].balance;
    const eff = currentBalance - bankDebt - creditCardBalance;
    if (energy <= 0) {
      setFailReason(t('level4.gameOver.energy'));
      setView('gameOver');
      return true;
    }
    if (social <= 0) {
      setFailReason(t('level4.gameOver.social'));
      setView('gameOver');
      return true;
    }
    if (eff < -2000) {
      setFailReason(reasonFallback || t('level4.gameOver.debtTrap'));
      setView('gameOver');
      return true;
    }
    return false;
  };

  const buildPayslipForMonth = (job: JobOption) => {
    const tips = job.id === 'barista' ? randomInt(200, 800) : 0;
    const transport = job.id === 'pizza' ? 400 : 0;
    const gross = job.monthlyGross + tips + courseIncomeBoost;
    const taxable = Math.max(0, gross - transport);
    const bituachLeumi = Math.round(taxable * 0.05);
    const masHachnasa = Math.round(taxable * 0.1);
    const net = taxable - bituachLeumi - masHachnasa;

    return {
      gross,
      tips,
      transport,
      taxable,
      bituachLeumi,
      masHachnasa,
      net,
    };
  };

  const generateMonthEvents = (month: number, goal: SavingsGoalOption | null): MonthEvent[] => {
    const possible: MonthEvent[] = [
      {
        id: 'phone_upgrade',
        emoji: '📱',
        textKey: 'events.phoneUpgrade',
        choices: [
          { labelKey: 'events.buyNow', cardCost: 1500, social: 10, energy: 0 },
          {
            labelKey: 'events.installmentDeal',
            social: 6,
            energy: 0,
            startInstallment: { monthly: 100, months: 15 },
          },
          { labelKey: 'events.skipTemptation', social: -4, energy: 3 },
        ],
      },
      {
        id: 'friend_wedding',
        emoji: '🎁',
        textKey: 'events.friendWeddingGift',
        choices: [
          { labelKey: 'events.giveGift', cardCost: 150, social: 12, energy: 0 },
          { labelKey: 'events.apologizeGift', social: -8, energy: 0 },
        ],
      },
      {
        id: 'concert',
        emoji: '🎵',
        textKey: 'events.concertTickets',
        choices: [
          { labelKey: 'events.goConcert', cardCost: 180, social: 15, energy: -3 },
          { labelKey: 'events.skipConcert', social: -5, energy: 2 },
        ],
      },
      {
        id: 'clothes',
        emoji: '🛍️',
        textKey: 'events.clothesShopping',
        choices: [
          { labelKey: 'events.buyClothes', cardCost: 300, social: 7, energy: 0 },
          { labelKey: 'events.skipClothes', social: -3, energy: 1 },
        ],
      },
      {
        id: 'side_hustle',
        emoji: '🚴',
        textKey: 'events.sideHustle',
        choices: [
          { labelKey: 'events.takeHustle', cashGain: 500, social: -6, energy: -18 },
          { labelKey: 'events.passHustle', social: 0, energy: 4 },
        ],
      },
      {
        id: 'fraud',
        emoji: '🛡️',
        textKey: 'events.creditCardFraud',
        choices: [
          {
            labelKey: 'events.reportFraud',
            cardCost: 300,
            social: 0,
            energy: -5,
            refundNextMonth: 300,
          },
        ],
      },
      {
        id: 'job_bonus',
        emoji: '⭐',
        textKey: 'events.jobBonus',
        choices: [{ labelKey: 'events.collectBonus', cashGain: 400, social: 4, energy: 2 }],
      },
      {
        id: 'gym_pressure',
        emoji: '🏋️',
        textKey: 'events.gymPressure',
        choices: [
          { labelKey: 'events.joinGym', social: 8, energy: 6, startGym: true },
          { labelKey: 'events.skipGym', social: -4, energy: 0 },
        ],
      },
      {
        id: 'speeding_ticket',
        emoji: '🚔',
        textKey: 'events.speedingTicket',
        choices: [{ labelKey: 'events.payFine', cashCost: 250, social: -2, energy: -1 }],
      },
      {
        id: 'lost_wallet',
        emoji: '😱',
        textKey: 'events.lostWallet',
        choices: [{ labelKey: 'events.acceptLoss', cashCost: 150, social: -5, energy: -2 }],
      },
      {
        id: 'birthday_dinner',
        emoji: '🎂',
        textKey: 'events.birthdayDinner',
        choices: [
          { labelKey: 'events.goToDinner', cardCost: 120, social: 10, energy: -2 },
          { labelKey: 'events.skipBirthdayDinner', social: -7, energy: 1 },
        ],
      },
      {
        id: 'broken_laptop',
        emoji: '💻',
        textKey: 'events.brokenLaptop',
        choices: [
          { labelKey: 'events.repairLaptop', cardCost: 400, social: 0, energy: 2 },
          { labelKey: 'events.skipRepairLaptop', social: -3, energy: -8 },
        ],
      },
      {
        id: 'family_simcha',
        emoji: '💒',
        textKey: 'events.familySimcha',
        choices: [
          { labelKey: 'events.buyOutfit', cardCost: 350, social: 10, energy: 0 },
          { labelKey: 'events.borrowOutfit', social: 2, energy: 0 },
        ],
      },
      {
        id: 'tax_refund',
        emoji: '💰',
        textKey: 'events.taxRefund',
        choices: [{ labelKey: 'events.collectRefund', cashGain: 300, social: 4, energy: 2 }],
      },
      {
        id: 'course_opportunity',
        emoji: '📚',
        textKey: 'events.courseOpportunity',
        choices: [
          {
            labelKey: 'events.takeCourse',
            cashCost: 600,
            social: -2,
            energy: -5,
            startCourseBoost: 250,
          },
          { labelKey: 'events.skipCourse', social: 0, energy: 2 },
        ],
      },
      {
        id: 'roommate_move',
        emoji: '🏠',
        textKey: 'events.roommateMove',
        choices: [
          { labelKey: 'events.considerMoving', cashCost: 250, social: 5, energy: -2 },
          { labelKey: 'events.stayHome', social: 1, energy: 1 },
        ],
      },
      {
        id: 'holiday_gifts',
        emoji: '🎁',
        textKey: 'events.holidayGifts',
        choices: [
          { labelKey: 'events.buyGiftsSmall', cardCost: 200, social: 6, energy: -1 },
          { labelKey: 'events.buyGiftsBig', cardCost: 400, social: 10, energy: -2 },
          { labelKey: 'events.skipHolidayGifts', social: -8, energy: 0 },
        ],
      },
    ];

    if (goal?.id === 'drivingLessons') {
      possible.push({
        id: 'car_insurance',
        emoji: '🚗',
        textKey: 'events.carInsuranceQuote',
        choices: [
          { labelKey: 'events.payInsurance', cardCost: 200, social: 2, energy: 0 },
          { labelKey: 'events.skipInsurance', social: -5, energy: 0 },
        ],
      });
      possible.push({
        id: 'car_repair',
        emoji: '🔧',
        textKey: 'events.carRepair',
        choices: [
          { labelKey: 'events.payRepair', cardCost: 800, social: 0, energy: 0 },
          { labelKey: 'events.delayRepair', social: -4, energy: -6 },
        ],
      });
      possible.push({
        id: 'tyre_puncture',
        emoji: '🛞',
        textKey: 'events.tyrePuncture',
        choices: [
          { labelKey: 'events.fixTyre', cashCost: 180, social: 0, energy: -1 },
          { labelKey: 'events.skipTyre', social: -3, energy: -3 },
        ],
      });
    }

    if (consecutiveMaaserMonths >= 2 && month >= 3) {
      possible.push({
        id: 'maaser_reward',
        emoji: '✨',
        textKey: 'events.maaserReward',
        choices: [{ labelKey: 'events.acceptReward', cashGain: 300, social: 10, energy: 5 }],
      });
    }

    const shuffled = [...possible].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, month >= 3 ? 3 : 2);
  };

  const startMonth = (month: number, job: JobOption) => {
    setCurrentMonth(month);
    setCardLines([]);
    setEventIndex(0);
    setMonthEvents([]);
    setMonthCashSpent(0);
    setMonthCardSpent(0);
    setMonthCardPayment(0);
    setMonthInvestAmount(0);

    if (month >= 2 && !creditCardUnlocked) {
      setCreditCardUnlocked(true);
    }

    if (savingsBalance > 0) {
      const growth = Math.round(savingsBalance * BANK_SAVINGS_INTEREST);
      setSavingsBalance(prev => prev + growth);
    }

    if (bankDebt > 0) {
      setBankDebt(prev => Math.round(prev * (1 + BANK_DEBT_INTEREST)));
    }

    if (investmentValue > 0) {
      const fundRate = getFundRate(selectedFund);
      const nextValue = Math.max(0, Math.round(investmentValue * (1 + fundRate)));
      setLastFundRate(fundRate);
      setInvestmentValue(nextValue);
      setInvestmentHistory(prev => [
        ...prev,
        { month, principal: investedPrincipal, value: nextValue, rate: fundRate },
      ]);
    } else {
      setLastFundRate(0);
    }

    if (pendingFraudRefund > 0) {
      addCardLine('statement.fraudRefund', -pendingFraudRefund);
      setPendingFraudRefund(0);
    }

    if (gymActive && month >= 2) {
      addCardLine('statement.gymMembership', GYM_MONTHLY);
    }

    if (phoneInstallmentMonths > 0 && month >= 2) {
      addCardLine('statement.phoneInstallment', 100);
      setPhoneInstallmentMonths(prev => prev - 1);
    }

    const nextPayslip = buildPayslipForMonth(job);
    setPayslip(nextPayslip);
    setMonthGross(nextPayslip.gross);
    setMonthTax(nextPayslip.bituachLeumi + nextPayslip.masHachnasa);
    setMonthNet(nextPayslip.net);
    setView('payslip');
  };

  const handlePayslipContinue = () => {
    if (!payslip) return;

    addIncome(4, payslip.net);

    if (level.maaserEnabled) {
      const maaserAmount = Math.round(payslip.net * 0.1);
      const balance = useGameStore.getState().levels[4].balance;
      if (balance >= maaserAmount) {
        addMaaser(4, maaserAmount);
        setConsecutiveMaaserMonths(prev => prev + 1);
        setMonthCashSpent(prev => prev + maaserAmount);
      } else {
        setConsecutiveMaaserMonths(0);
      }
    }

    setView('monthDecisions');
  };

  const handleMonthDecisionsContinue = () => {
    spendWithOverdraft(PARENTS_CONTRIBUTION);

    if (creditCardUnlocked) {
      addCardLine('statement.busPass', BUS_PASS);
      addCardLine('statement.foodGoingOut', FOOD_BASELINE);
    } else {
      spendWithOverdraft(BUS_PASS);
      spendWithOverdraft(FOOD_BASELINE);
    }

    setView('investmentChoice');
  };

  const handleInvest = (amount: number) => {
    if (amount > 0) {
      const balance = getLiveBalance();
      const actual = Math.min(amount, balance);
      if (actual > 0) {
        const nextPrincipal = investedPrincipal + actual;
        const nextValue = investmentValue + actual;
        spend(4, actual);
        setMonthInvestAmount(actual);
        setInvestedPrincipal(nextPrincipal);
        setInvestmentValue(nextValue);
        setInvestmentHistory(prev => [
          ...prev,
          { month: currentMonth, principal: nextPrincipal, value: nextValue, rate: 0 },
        ]);
      }
    }

    const events = generateMonthEvents(currentMonth, selectedGoal);
    setMonthEvents(events);
    setEventIndex(0);
    setView(events.length > 0 ? 'monthEvents' : 'phoneBill');
  };

  const handleEventChoice = (choice: EventChoice) => {
    if (choice.cashCost) {
      spendWithOverdraft(choice.cashCost);
    }

    if (choice.cardCost) {
      if (creditCardUnlocked) {
        addCardLine(`events.${monthEvents[eventIndex].id}`, choice.cardCost);
      } else {
        spendWithOverdraft(choice.cardCost);
      }
    }

    if (choice.cashGain) {
      addIncome(4, choice.cashGain);
    }

    if (choice.startGym) {
      setGymActive(true);
    }

    if (choice.startInstallment) {
      setPhoneInstallmentMonths(choice.startInstallment.months);
    }

    if (choice.refundNextMonth) {
      setPendingFraudRefund(prev => prev + (choice.refundNextMonth ?? 0));
    }

    if (choice.startCourseBoost) {
      setCourseIncomeBoost(prev => Math.max(prev, choice.startCourseBoost || 0));
    }

    setEnergy(prev => clampMeter(prev + choice.energy));
    setSocial(prev => clampMeter(prev + choice.social));

    if (eventIndex < monthEvents.length - 1) {
      setEventIndex(prev => prev + 1);
    } else {
      setView('phoneBill');
    }
  };

  const handlePhoneBill = () => {
    if (creditCardUnlocked) {
      addCardLine('statement.phoneBill', PHONE_BILL);
    } else {
      spendWithOverdraft(PHONE_BILL);
    }
    setView('creditCardStatement');
  };

  const payCardAmount = (amount: number) => {
    const due = Math.min(amount, creditCardBalance);
    if (due <= 0) {
      setView('monthSummary');
      return;
    }

    const balance = getLiveBalance();
    if (balance >= due) {
      spend(4, due);
    } else {
      if (balance > 0) {
        spend(4, balance);
      }
      setBankDebt(prev => prev + (due - balance));
    }
    setMonthCardPayment(due);

    const remaining = Math.max(0, creditCardBalance - due);
    if (remaining > 0) {
      setCreditCardBalance(Math.round(remaining * (1 + CREDIT_CARD_INTEREST)));
    } else {
      setCreditCardBalance(0);
    }
    setView('monthSummary');
  };

  const handleSaveToBank = (amount: number) => {
    const balance = getLiveBalance();
    const actual = Math.min(amount, balance);
    if (actual <= 0) return;
    spend(4, actual);
    setSavingsBalance(prev => prev + actual);
    setGoalSaved(prev => prev + actual);
  };

  const handleDebtPayment = (amount: number) => {
    const balance = getLiveBalance();
    const actual = Math.min(amount, bankDebt, balance);
    if (actual <= 0) return;
    spend(4, actual);
    setBankDebt(prev => prev - actual);
  };

  const handleNextMonth = () => {
    if (applyFailureCheck()) return;

    if (currentMonth >= TOTAL_MONTHS) {
      const goalReached = goalSaved >= (selectedGoal?.amount || 0);
      const cleanDebt = bankDebt <= 0 && creditCardBalance <= 0;
      const won = goalReached && cleanDebt && level.balance > 0;

      if (investedPrincipal > 0) {
        earnBadge('investorBadge');
      }

      if (won) {
        completeLevel(4);
        setView('gameWin');
      } else {
        setFailReason(t('level4.gameOver.noIndependence'));
        setView('gameOver');
      }
      return;
    }

    setEnergy(prev => clampMeter(prev + 12));
    setSocial(prev => clampMeter(prev + 8));

    const nextMonth = currentMonth + 1;
    setCurrentMonth(nextMonth);
    advanceWeek(4);
    startMonth(nextMonth, selectedJob || JOBS[0]);
  };

  const handlePlayAgain = () => {
    startLevel(4, 800);
    setView('howItWorks');
    setCurrentMonth(1);
    setEnergy(75);
    setSocial(70);
    setSavingsBalance(0);
    setBankDebt(0);
    setCreditCardBalance(0);
    setCardLines([]);
    setGymActive(false);
    setPhoneInstallmentMonths(0);
    setPendingFraudRefund(0);
    setCreditCardUnlocked(false);
    setSelectedFund('balanced');
    setInvestedPrincipal(0);
    setInvestmentValue(0);
    setLastFundRate(0);
    setInvestmentHistory([]);
    setPayslip(null);
    setMonthEvents([]);
    setEventIndex(0);
    setMonthInvestAmount(0);
    setMonthGross(0);
    setMonthTax(0);
    setMonthNet(0);
    setMonthCashSpent(0);
    setMonthCardSpent(0);
    setMonthCardPayment(0);
    setGoalSaved(0);
    setConsecutiveMaaserMonths(0);
    setCourseIncomeBoost(0);
    setFailReason('');
  };

  const MetersBar = () => (
    <View style={styles.metersCard}>
      <View style={styles.meterRow}>
        <Text style={styles.meterLabel}>{t('level4.moneyMeter')}</Text>
        <Text style={[styles.meterValue, effectiveBalance < -500 && styles.dangerText]}>
          ₪{effectiveBalance}
        </Text>
      </View>
      <View style={styles.meterRow}>
        <Text style={styles.meterLabel}>{t('level4.energyMeter')}</Text>
        <Text style={[styles.meterValue, energy <= 20 && styles.dangerText]}>{energy}%</Text>
      </View>
      <View style={styles.meterRow}>
        <Text style={styles.meterLabel}>{t('level4.socialMeter')}</Text>
        <Text style={[styles.meterValue, social <= 20 && styles.dangerText]}>{social}%</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.microText}>{t('level4.accountBalance')}: ₪{level.balance}</Text>
      <Text style={styles.microText}>{t('level4.savingsBalance')}: ₪{savingsBalance}</Text>
      {bankDebt > 0 && <Text style={styles.microDanger}>{t('level4.bankDebt')}: ₪{bankDebt}</Text>}
      {creditCardBalance > 0 && (
        <Text style={styles.microDanger}>{t('level4.creditCardDebt')}: ₪{creditCardBalance}</Text>
      )}
    </View>
  );

  if (view === 'intro') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.bigEmoji}>🚧</Text>
        <Text style={styles.title}>{t('levels.level4.title')}</Text>
        <Text style={styles.subtitle}>{t('levels.level4.subtitle')}</Text>
        <Text style={{fontSize: 18, color: '#526174', textAlign: 'center', marginBottom: 16, lineHeight: 26}}>Coming Soon!{String.fromCharCode(10)}{String.fromCharCode(10)}We are rebuilding this level with new features, better investing, and more realistic expenses. Check back soon!</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onHome}>
          <Text style={styles.primaryBtnText}>← Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'characterSelect') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <Text style={styles.title}>{t('common.chooseCharacter')}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.selectCard, level.gender === 'boy' && styles.selectedCard]}
            onPress={() => setGender(4, 'boy')}
          >
            <Text style={styles.charEmoji}>👦</Text>
            <Text style={styles.cardTitle}>{t('levels.level4.boyName')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectCard, level.gender === 'girl' && styles.selectedCard]}
            onPress={() => setGender(4, 'girl')}
          >
            <Text style={styles.charEmoji}>👧</Text>
            <Text style={styles.cardTitle}>{t('levels.level4.girlName')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, !level.gender && styles.disabledBtn]}
          disabled={!level.gender}
          onPress={() => {
            if (!level.gender) return;
            startLevel(4, 800);
            setShowMaaser(true);
          }}
        >
          <Text style={styles.primaryBtnText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
        <MaaserModal
          visible={showMaaser}
          onAccept={() => {
            toggleMaaser(4, true);
            setShowMaaser(false);
            setView('howItWorks');
          }}
          onDecline={() => {
            setShowMaaser(false);
            setView('howItWorks');
          }}
        />
      </SafeAreaView>
    );
  }

  if (view === 'howItWorks') {
    const steps = [
      { title: t('level4.how.steps.payslipTitle'), text: t('level4.how.steps.payslipText') },
      { title: t('level4.how.steps.cardTitle'), text: t('level4.how.steps.cardText') },
      { title: t('level4.how.steps.investTitle'), text: t('level4.how.steps.investText') },
      { title: t('level4.how.steps.winTitle'), text: t('level4.how.steps.winText') },
    ];

    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.how.title')}</Text>
          <Text style={styles.subtitle}>{t('level4.how.greeting', { name: charName })}</Text>
          {steps.map(step => (
            <View key={step.title} style={styles.infoCard}>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardText}>{step.text}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('jobSelect')}>
            <Text style={styles.primaryBtnText}>{t('level4.how.cta')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'jobSelect') {
    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.jobs.title')}</Text>
          {JOBS.map(job => {
            const tipsRange = job.id === 'barista' ? t('level4.jobs.tipsRange') : '';
            return (
              <TouchableOpacity
                key={job.id}
                style={[styles.infoCard, selectedJob?.id === job.id && styles.selectedCard]}
                onPress={() => setSelectedJob(job)}
              >
                <Text style={styles.jobEmoji}>{job.emoji}</Text>
                <Text style={styles.cardTitle}>{t(`level4.jobs.${job.id}`)}</Text>
                <Text style={styles.cardText}>{t(`level4.${job.descKey}`)}</Text>
                <Text style={styles.moneyText}>
                  ₪{job.monthlyGross}{tipsRange}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.primaryBtn, !selectedJob && styles.disabledBtn]}
            disabled={!selectedJob}
            onPress={() => setView('savingsGoal')}
          >
            <Text style={styles.primaryBtnText}>{t('level4.jobs.select')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'savingsGoal') {
    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.goals.title')}</Text>
          {GOALS.map(goal => (
            <TouchableOpacity
              key={goal.id}
              style={[styles.infoCard, selectedGoal?.id === goal.id && styles.selectedCard]}
              onPress={() => {
                setSelectedGoal(goal);
                setSavingGoal(4, {
                  itemId: goal.id,
                  targetAmount: goal.amount,
                  currentAmount: 0,
                  completed: false,
                });
                startMonth(1, selectedJob || JOBS[0]);
              }}
            >
              <Text style={styles.jobEmoji}>{goal.emoji}</Text>
              <Text style={styles.cardTitle}>{t(`level4.${goal.nameKey}`)}</Text>
              <Text style={styles.moneyText}>₪{goal.amount}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'payslip' && payslip) {
    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.monthHeader}>{t('level4.monthOf', { month: currentMonth, total: TOTAL_MONTHS })}</Text>
          <Text style={styles.title}>{t('level4.payslip.title')}</Text>
          <MetersBar />
          <View style={styles.statementCard}>
            <Text style={styles.statementRow}>{t('level4.payslip.gross')}: ₪{payslip.gross}</Text>
            {payslip.tips > 0 && (
              <Text style={styles.statementRow}>{t('level4.payslip.tips')}: +₪{payslip.tips}</Text>
            )}
            {payslip.transport > 0 && (
              <Text style={styles.statementRowDanger}>
                {t('level4.payslip.transport')}: -₪{payslip.transport}
              </Text>
            )}
            <Text style={styles.statementRow}>{t('level4.payslip.taxable')}: ₪{payslip.taxable}</Text>
            <Text style={styles.statementRowDanger}>
              {t('level4.payslip.bituachLeumi')}: -₪{payslip.bituachLeumi}
            </Text>
            <Text style={styles.statementRowDanger}>
              {t('level4.payslip.masHachnasa')}: -₪{payslip.masHachnasa}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.statementNet}>{t('level4.payslip.net')}: ₪{payslip.net}</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePayslipContinue}>
            <Text style={styles.primaryBtnText}>{t('level4.payslip.continue')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'monthDecisions') {
    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.monthDecisions.title')}</Text>
          <MetersBar />
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('level4.monthDecisions.fixedCosts')}</Text>
            <Text style={styles.cardText}>• {t('level4.monthDecisions.parentsContribution')}: ₪{PARENTS_CONTRIBUTION}</Text>
            <Text style={styles.cardText}>• {t('level4.monthDecisions.busPass')}: ₪{BUS_PASS}</Text>
            <Text style={styles.cardText}>• {t('level4.monthDecisions.foodLine')}: ₪{FOOD_BASELINE}</Text>
            <Text style={styles.cardText}>• {t('level4.monthDecisions.phoneBillLine')}: ₪{PHONE_BILL}</Text>
            <View style={styles.divider} />
            <Text style={styles.moneyText}>
              {t('level4.monthDecisions.totalMandatory', { amount: TOTAL_MANDATORY_MONTHLY })}
            </Text>
          </View>
          {currentMonth === 2 && (
            <View style={styles.alertCard}>
              <Text style={styles.cardTitle}>{t('level4.monthDecisions.cardUnlockedTitle')}</Text>
              <Text style={styles.cardText}>{t('level4.monthDecisions.cardUnlockedText')}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleMonthDecisionsContinue}>
            <Text style={styles.primaryBtnText}>{t('level4.monthDecisions.continue')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'investmentChoice') {
    const balance = getLiveBalance();
    const options = [0, 200, 500, 1000].filter(v => v <= balance || v === 0);
    const chartMax = Math.max(investedPrincipal, Math.round(investmentValue), 1);

    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.investing.title')}</Text>
          <MetersBar />

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('level4.investing.brandTitle')}</Text>
            <Text style={styles.cardText}>{t('level4.investing.brandText')}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('level4.investing.chooseFund')}</Text>
            {(['safe', 'balanced', 'aggressive'] as FundType[]).map(fund => (
              <TouchableOpacity
                key={fund}
                style={[styles.secondaryBtn, selectedFund === fund && styles.selectedCard]}
                onPress={() => setSelectedFund(fund)}
              >
                <Text style={styles.secondaryBtnText}>{t(`level4.investing.fund.${fund}.name`)}</Text>
                <Text style={styles.cardText}>{t(`level4.investing.fund.${fund}.desc`)}</Text>
                <Text style={styles.microText}>{t(`level4.investing.fund.${fund}.range`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statementCard}>
            <Text style={styles.statementRow}>{t('level4.investing.available', { amount: balance })}</Text>
            <Text style={styles.statementRow}>{t('level4.win.principal')}: ₪{investedPrincipal}</Text>
            <Text style={styles.statementRow}>{t('level4.investing.currentValue')}: ₪{Math.round(investmentValue)}</Text>

            <View style={styles.divider} />
            <Text style={styles.cardText}>{t('level4.win.principal')}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((investedPrincipal / chartMax) * 100)}%` }]} />
            </View>
            <Text style={styles.cardText}>{t('level4.investing.currentValue')}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((Math.max(0, investmentValue) / chartMax) * 100)}%` }]} />
            </View>
          </View>

          {options.map(amount => (
            <TouchableOpacity
              key={amount}
              style={styles.secondaryBtn}
              onPress={() => handleInvest(amount)}
            >
              <Text style={styles.secondaryBtnText}>
                {amount === 0
                  ? t('level4.investing.skip')
                  : t('level4.investing.investAmount', { amount })}
              </Text>
            </TouchableOpacity>
          ))}

          {investmentHistory.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>{t('level4.investing.history')}</Text>
              {investmentHistory.slice(-4).map((item, idx) => (
                <Text key={`${item.month}-${idx}`} style={styles.cardText}>
                  M{item.month}: ₪{item.principal} → ₪{Math.round(item.value)}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'monthEvents' && monthEvents[eventIndex]) {
    const evt = monthEvents[eventIndex];

    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.monthHeader}>
            {t('level4.events.header', {
              current: eventIndex + 1,
              total: monthEvents.length,
              month: currentMonth,
            })}
          </Text>
          <MetersBar />
          <View style={styles.infoCard}>
            <Text style={styles.bigEmoji}>{evt.emoji}</Text>
            <Text style={styles.cardText}>{t(`level4.${evt.textKey}`)}</Text>
            {evt.choices.map((choice, idx) => (
              <TouchableOpacity
                key={`${evt.id}-${idx}`}
                style={styles.primaryBtn}
                onPress={() => handleEventChoice(choice)}
              >
                <Text style={styles.primaryBtnText}>{t(`level4.${choice.labelKey}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'phoneBill') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <Text style={styles.title}>{t('level4.phoneBill.title')}</Text>
        <Text style={styles.description}>{t('level4.phoneBill.text', { amount: PHONE_BILL })}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePhoneBill}>
          <Text style={styles.primaryBtnText}>{t('level4.phoneBill.continue')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'creditCardStatement') {
    const minimum = Math.max(0, Math.ceil(creditCardBalance * 0.1));

    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.statement.title')}</Text>
          <MetersBar />
          {!creditCardUnlocked ? (
            <View style={styles.infoCard}>
              <Text style={styles.cardText}>{t('level4.statement.notYet')}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('monthSummary')}>
                <Text style={styles.primaryBtnText}>{t('common.continueGame')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statementCard}>
              {cardLines.length === 0 ? (
                <Text style={styles.cardText}>{t('level4.statement.noPurchases')}</Text>
              ) : (
                cardLines.map(line => (
                  <View key={line.id} style={styles.statementLineRow}>
                    <Text style={styles.cardText}>{t(`level4.${line.labelKey}`)}</Text>
                    <Text style={[styles.cardText, line.amount < 0 && styles.successText]}>
                      {line.amount < 0 ? '-' : ''}₪{Math.abs(line.amount)}
                    </Text>
                  </View>
                ))
              )}
              <View style={styles.divider} />
              <Text style={styles.statementNet}>{t('level4.statement.balanceDue')}: ₪{creditCardBalance}</Text>
              <Text style={styles.microText}>{t('level4.statement.minimum')}: ₪{minimum}</Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => payCardAmount(creditCardBalance)}>
                <Text style={styles.primaryBtnText}>{t('level4.statement.payFull')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => payCardAmount(minimum)}>
                <Text style={styles.secondaryBtnText}>{t('level4.statement.payMinimum')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'monthSummary') {
    const goalTarget = selectedGoal?.amount || 0;
    const goalPercent = goalTarget > 0 ? Math.min(100, Math.round((goalSaved / goalTarget) * 100)) : 0;

    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.summary.title', { month: currentMonth })}</Text>
          <MetersBar />

          <View style={styles.statementCard}>
            <Text style={styles.statementRow}>{t('level4.summary.gross')}: ₪{monthGross}</Text>
            <Text style={styles.statementRowDanger}>{t('level4.summary.tax')}: -₪{monthTax}</Text>
            <Text style={styles.statementRow}>{t('level4.summary.net')}: ₪{monthNet}</Text>
            <Text style={styles.statementRowDanger}>{t('level4.summary.cashSpent')}: -₪{monthCashSpent}</Text>
            <Text style={styles.statementRowDanger}>{t('level4.summary.cardSpent')}: ₪{monthCardSpent}</Text>
            <Text style={styles.statementRowDanger}>{t('level4.summary.cardPaid')}: -₪{monthCardPayment}</Text>
            <Text style={styles.statementRow}>{t('level4.summary.investedThisMonth')}: ₪{monthInvestAmount}</Text>
            {lastFundRate > 0 && (
              <Text style={styles.statementRow}>
                {t('level4.summary.fundGrowth', { rate: Math.round(lastFundRate * 100) })}
              </Text>
            )}
            {lastFundRate < 0 && (
              <Text style={styles.statementRowDanger}>
                {t('level4.summary.fundLoss', { rate: Math.abs(Math.round(lastFundRate * 100)) })}
              </Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('level4.summary.goalProgress')}</Text>
            <Text style={styles.cardText}>
              {selectedGoal ? t(`level4.${selectedGoal.nameKey}`) : ''}: ₪{goalSaved} / ₪{goalTarget} ({goalPercent}%)
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${goalPercent}%` }]} />
            </View>
          </View>

          {level.balance > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>{t('level4.summary.moveToSavings')}</Text>
              <View style={styles.rowWrap}>
                {[200, 500, 1000]
                  .filter(v => v <= level.balance)
                  .map(amount => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.chipBtn}
                      onPress={() => handleSaveToBank(amount)}
                    >
                      <Text style={styles.chipText}>₪{amount}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}

          {bankDebt > 0 && level.balance > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>{t('level4.summary.payDebt')}</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleDebtPayment(Math.min(bankDebt, level.balance))}
              >
                <Text style={styles.primaryBtnText}>
                  {t('level4.summary.payDebtNow', { amount: Math.min(bankDebt, level.balance) })}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleNextMonth}>
            <Text style={styles.primaryBtnText}>
              {currentMonth === TOTAL_MONTHS
                ? t('level4.summary.finish')
                : t('level4.summary.nextMonth', { month: currentMonth + 1 })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'gameWin') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.bigEmoji}>🏆</Text>
        <Text style={styles.title}>{t('level4.win.title')}</Text>
        <Text style={styles.description}>{t('level4.win.text')}</Text>
        <View style={styles.statementCard}>
          <Text style={styles.statementRow}>{t('level4.win.cash')}: ₪{level.balance}</Text>
          <Text style={styles.statementRow}>{t('level4.win.savings')}: ₪{savingsBalance}</Text>
          <Text style={styles.statementRow}>{t('level4.win.invested')}: ₪{Math.round(investmentValue)}</Text>
          <Text style={styles.statementRow}>{t('level4.win.principal')}: ₪{investedPrincipal}</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
          <Text style={styles.primaryBtnText}>{t('level4.win.playAgain')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'gameOver') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.bigEmoji}>📉</Text>
        <Text style={styles.title}>{t('level4.gameOver.title')}</Text>
        <Text style={styles.description}>{failReason}</Text>
        <View style={styles.statementCard}>
          <Text style={styles.statementRow}>{t('level4.gameOver.cash')}: ₪{level.balance}</Text>
          <Text style={styles.statementRowDanger}>{t('level4.gameOver.bankDebt')}: ₪{bankDebt}</Text>
          <Text style={styles.statementRowDanger}>{t('level4.gameOver.cardDebt')}: ₪{creditCardBalance}</Text>
          <Text style={styles.statementRow}>{t('level4.gameOver.effective')}: ₪{effectiveBalance}</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
          <Text style={styles.primaryBtnText}>{t('level4.gameOver.playAgain')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#edf2f7',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#edf2f7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  monthHeader: {
    color: '#526174',
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: '#1f3b57',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: '#526174',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fonts.sizes.md,
    color: '#31475f',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#d7e0e8',
  },
  alertCard: {
    backgroundColor: '#e8f0f8',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#aac2db',
  },
  brandCard: {
    backgroundColor: '#f7fbff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#a9c3de',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: '#20486f',
    marginBottom: spacing.xs,
  },
  selectCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7e0e8',
  },
  selectedCard: {
    borderColor: '#2f6da4',
    backgroundColor: '#eaf3fb',
  },
  cardTitle: {
    color: '#1f3b57',
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  cardText: {
    color: '#3a546f',
    fontSize: fonts.sizes.sm,
    lineHeight: 20,
  },
  moneyText: {
    marginTop: spacing.xs,
    color: '#1e6b4a',
    fontSize: fonts.sizes.md,
    fontWeight: '700',
  },
  charEmoji: {
    fontSize: 42,
    marginBottom: spacing.xs,
  },
  jobEmoji: {
    fontSize: 30,
    marginBottom: spacing.xs,
  },
  bigEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  metersCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#d7e0e8',
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  meterLabel: {
    fontSize: fonts.sizes.sm,
    color: '#526174',
    fontWeight: '700',
  },
  meterValue: {
    fontSize: fonts.sizes.sm,
    color: '#1f3b57',
    fontWeight: '700',
  },
  microText: {
    fontSize: fonts.sizes.sm,
    color: '#526174',
    marginBottom: 2,
  },
  microDanger: {
    fontSize: fonts.sizes.sm,
    color: colors.danger,
    marginBottom: 2,
  },
  statementCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#d7e0e8',
    marginBottom: spacing.md,
  },
  statementRow: {
    color: '#31475f',
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.xs,
  },
  statementRowDanger: {
    color: '#8d2f2f',
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.xs,
  },
  statementLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statementNet: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: '#1f3b57',
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2f5f8f',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fonts.sizes.md,
    textAlign: 'center',
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#e2ebf3',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#244a70',
    fontWeight: '700',
    fontSize: fonts.sizes.md,
    textAlign: 'center',
  },
  chipBtn: {
    backgroundColor: '#2f5f8f',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fonts.sizes.sm,
  },
  progressTrack: {
    marginTop: spacing.sm,
    height: 10,
    borderRadius: borderRadius.round,
    backgroundColor: '#d9e6f2',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2f8f6d',
  },
  divider: {
    height: 1,
    backgroundColor: '#d7e0e8',
    marginVertical: spacing.sm,
  },
  dangerText: {
    color: colors.danger,
  },
  successText: {
    color: '#1f8b57',
  },
  disabledBtn: {
    opacity: 0.45,
  },
});
