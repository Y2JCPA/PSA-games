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

// ─── Types ──────────────────────────────────────────────────
type ServicePathId = 'combat' | 'jobnik' | 'sherut' | 'mechina';
type JobId = 'grocery' | 'barista' | 'pizza' | 'freelance';
type GoalId = 'drivingLessons' | 'gapYearTrip' | 'armyLaptop';
type InvestmentTier = 'kupat_gemel' | 'index_fund' | 'stocks';

type Level4View =
  | 'intro'
  | 'characterSelect'
  | 'howItWorks'
  | 'servicePathSelect'
  | 'jobSelect'
  | 'savingsGoal'
  | 'payslip'
  | 'monthDecisions'
  | 'foodChoice'
  | 'investmentChoice'
  | 'monthEvents'
  | 'phoneBill'
  | 'creditCardStatement'
  | 'monthSummary'
  | 'roommateOffer'
  | 'gameWin'
  | 'gameOver';

interface ServicePath {
  id: ServicePathId;
  emoji: string;
  stipend: number;
  rentFree: boolean;
  energyMod: number;
  socialMod: number;
  descKey: string;
  costPerMonth: number;
}

interface JobOption {
  id: JobId;
  emoji: string;
  monthlyGross: number;
  descKey: string;
  isFreelance?: boolean;
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
  setInsured?: boolean;
  investStartup?: boolean;
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

// ─── Constants ──────────────────────────────────────────────
const TOTAL_MONTHS = 6;
const BANK_SAVINGS_INTEREST = 0.015;
const BANK_DEBT_INTEREST = 0.03;
const CREDIT_CARD_INTEREST = 0.025;
const PHONE_BILL = 50;
const FOOD_CASH = 400;
const FOOD_CARD = 400;
const GYM_MONTHLY = 150;
const ROOMMATE_RENT = 900;
const ROOMMATE_ARNONA = 200;
const ROOMMATE_ELECTRIC = 150;
const ROOMMATE_INTERNET = 100;

const SERVICE_PATHS: ServicePath[] = [
  { id: 'combat', emoji: '🪖', stipend: 1800, rentFree: true, energyMod: 15, socialMod: -10, descKey: 'service.combatDesc', costPerMonth: 0 },
  { id: 'jobnik', emoji: '🎖️', stipend: 1200, rentFree: true, energyMod: 0, socialMod: 0, descKey: 'service.jobnikDesc', costPerMonth: 0 },
  { id: 'sherut', emoji: '🤝', stipend: 800, rentFree: false, energyMod: 0, socialMod: 10, descKey: 'service.sherutDesc', costPerMonth: 0 },
  { id: 'mechina', emoji: '📚', stipend: 0, rentFree: false, energyMod: 10, socialMod: 10, descKey: 'service.mechinaDesc', costPerMonth: 500 },
];

const JOBS: JobOption[] = [
  { id: 'grocery', emoji: '🛒', monthlyGross: 3800, descKey: 'jobs.groceryDesc' },
  { id: 'barista', emoji: '☕', monthlyGross: 3200, descKey: 'jobs.baristaDesc' },
  { id: 'pizza', emoji: '🍕', monthlyGross: 4200, descKey: 'jobs.pizzaDesc' },
  { id: 'freelance', emoji: '💻', monthlyGross: 0, descKey: 'jobs.freelanceDesc', isFreelance: true },
];

const GOALS: SavingsGoalOption[] = [
  { id: 'drivingLessons', emoji: '🚗', amount: 3500, nameKey: 'goals.drivingLessons' },
  { id: 'gapYearTrip', emoji: '✈️', amount: 5000, nameKey: 'goals.gapYearTrip' },
  { id: 'armyLaptop', emoji: '💻', amount: 4000, nameKey: 'goals.armyLaptop' },
];

const INVESTMENT_TIERS: { id: InvestmentTier; nameKey: string; emoji: string; minReturn: number; maxReturn: number; descKey: string }[] = [
  { id: 'kupat_gemel', emoji: '🏦', nameKey: 'investing.kupat', minReturn: 1, maxReturn: 3, descKey: 'investing.kupatDesc' },
  { id: 'index_fund', emoji: '📈', nameKey: 'investing.indexFund', minReturn: -8, maxReturn: 12, descKey: 'investing.indexDesc' },
  { id: 'stocks', emoji: '🎰', nameKey: 'investing.stocks', minReturn: -20, maxReturn: 25, descKey: 'investing.stocksDesc' },
];

interface Level4Props {
  onHome: () => void;
  onRestart: () => void;
}

const clampMeter = (v: number) => Math.max(0, Math.min(100, v));

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Component ──────────────────────────────────────────────
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

  const [selectedService, setSelectedService] = useState<ServicePath | null>(null);
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

  // Investment state per tier
  const [investmentTier, setInvestmentTier] = useState<InvestmentTier | null>(null);
  const [investedPrincipal, setInvestedPrincipal] = useState(0);
  const [investmentValue, setInvestmentValue] = useState(0);
  const [lastFundRate, setLastFundRate] = useState(0);

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
  const [failReason, setFailReason] = useState('');

  // Roommate state
  const [hasRoommate, setHasRoommate] = useState(false);
  const [roommateFlaked, setRoommateFlaked] = useState(false);
  const [roommateOfferShown, setRoommateOfferShown] = useState(false);

  // Insurance state
  const [hasInsurance, setHasInsurance] = useState(false);

  // Freelance tax tracking
  const [freelanceTaxOwed, setFreelanceTaxOwed] = useState(0);

  // Startup investment
  const [startupInvested, setStartupInvested] = useState(false);
  const [startupResult, setStartupResult] = useState<'pending' | 'won' | 'lost'>('pending');

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
      setBankDebt(prev => prev + (amount - Math.max(0, balance)));
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

  // ─── MATH FIX #1: Payslip — transport no longer double-deducted ───
  const buildPayslipForMonth = (job: JobOption) => {
    if (job.isFreelance) {
      // Freelance: variable daily income, no tax withholding
      const workDays = randomInt(15, 22);
      const dailyRate = randomInt(0, 200);
      const gross = workDays * dailyRate;
      // Track tax owed but don't deduct
      const taxOwed = Math.round(gross * 0.15);
      setFreelanceTaxOwed(prev => prev + taxOwed);
      return { gross, tips: 0, transport: 0, taxable: gross, bituachLeumi: 0, masHachnasa: 0, net: gross };
    }

    const tips = job.id === 'barista' ? randomInt(200, 800) : 0;
    const transport = job.id === 'pizza' ? 400 : 0;
    const gross = job.monthlyGross + tips;
    const taxable = Math.max(0, gross - transport);
    const bituachLeumi = Math.round(taxable * 0.05);
    const masHachnasa = Math.round(taxable * 0.1);
    // FIX: net = gross - transport - taxes (transport deducted once from gross, not again)
    const net = gross - transport - bituachLeumi - masHachnasa;

    return { gross, tips, transport, taxable, bituachLeumi, masHachnasa, net };
  };

  // ─── Life Curveball System ───────────────────────────────
  const generateMonthEvents = (month: number, goal: SavingsGoalOption | null): MonthEvent[] => {
    const events: MonthEvent[] = [];

    // Month 2: Insurance decision
    if (month === 2) {
      events.push({
        id: 'insurance_decision',
        emoji: '🛡️',
        textKey: 'events.insuranceDecision',
        choices: [
          { labelKey: 'events.buyInsurance', cashCost: 150, social: 0, energy: 0, setInsured: true },
          { labelKey: 'events.skipInsurance2', social: 0, energy: 0 },
        ],
      });
    }

    // Month 4: Car accident (insurance matters!)
    if (month === 4) {
      if (hasInsurance) {
        events.push({
          id: 'car_accident_insured',
          emoji: '🚗💥',
          textKey: 'events.carAccidentInsured',
          choices: [
            { labelKey: 'events.payDeductible', cashCost: 200, social: -3, energy: -5 },
          ],
        });
      } else {
        events.push({
          id: 'car_accident_no_insurance',
          emoji: '🚗💥',
          textKey: 'events.carAccidentNoInsurance',
          choices: [
            { labelKey: 'events.payFullAccident', cashCost: 3000, social: -5, energy: -10 },
          ],
        });
      }
    }

    // Month 5: Friend startup opportunity
    if (month === 5) {
      events.push({
        id: 'friend_startup',
        emoji: '🚀',
        textKey: 'events.friendStartup',
        choices: [
          { labelKey: 'events.investStartup', cashCost: 2000, social: 10, energy: 0, investStartup: true },
          { labelKey: 'events.skipStartup', social: -3, energy: 0 },
        ],
      });
    }

    // Month 6: Parent job loss + freelance tax bill
    if (month === 6) {
      events.push({
        id: 'parent_job_loss',
        emoji: '👨‍👩‍👧',
        textKey: 'events.parentJobLoss',
        choices: [
          { labelKey: 'events.helpFamily', cashCost: 1500, social: 15, energy: -5 },
          { labelKey: 'events.cantHelpFamily', social: -10, energy: -3 },
        ],
      });

      if (selectedJob?.isFreelance && freelanceTaxOwed > 0) {
        events.push({
          id: 'freelance_tax_bill',
          emoji: '📋',
          textKey: 'events.freelanceTaxBill',
          choices: [
            { labelKey: 'events.payTaxBill', cashCost: freelanceTaxOwed, social: 0, energy: -5 },
          ],
        });
      }
    }

    // Regular events pool for remaining slots
    const regularPool: MonthEvent[] = [
      {
        id: 'phone_upgrade',
        emoji: '📱',
        textKey: 'events.phoneUpgrade',
        choices: [
          { labelKey: 'events.buyNow', cardCost: 1500, social: 10, energy: 0 },
          { labelKey: 'events.installmentDeal', social: 6, energy: 0, startInstallment: { monthly: 100, months: 15 } },
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
          { labelKey: 'events.reportFraud', cardCost: 300, social: 0, energy: -5, refundNextMonth: 300 },
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
    ];

    if (goal?.id === 'drivingLessons') {
      regularPool.push({
        id: 'car_insurance',
        emoji: '🚗',
        textKey: 'events.carInsuranceQuote',
        choices: [
          { labelKey: 'events.payInsurance', cardCost: 200, social: 2, energy: 0 },
          { labelKey: 'events.skipInsurance', social: -5, energy: 0 },
        ],
      });
      regularPool.push({
        id: 'car_repair',
        emoji: '🔧',
        textKey: 'events.carRepair',
        choices: [
          { labelKey: 'events.payRepair', cardCost: 800, social: 0, energy: 0 },
          { labelKey: 'events.delayRepair', social: -4, energy: -6 },
        ],
      });
    }

    if (consecutiveMaaserMonths >= 2 && month >= 3) {
      regularPool.push({
        id: 'maaser_reward',
        emoji: '✨',
        textKey: 'events.maaserReward',
        choices: [{ labelKey: 'events.acceptReward', cashGain: 300, social: 10, energy: 5 }],
      });
    }

    // Add 1-2 random regular events (don't duplicate curveball IDs)
    const usedIds = new Set(events.map(e => e.id));
    const available = regularPool.filter(e => !usedIds.has(e.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const extraCount = month >= 3 ? 2 : 1;
    for (const evt of shuffled.slice(0, extraCount)) {
      events.push(evt);
    }

    return events;
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
    setRoommateFlaked(false);

    if (month >= 2 && !creditCardUnlocked) {
      setCreditCardUnlocked(true);
    }

    // Savings interest
    if (savingsBalance > 0) {
      const growth = Math.round(savingsBalance * BANK_SAVINGS_INTEREST);
      setSavingsBalance(prev => prev + growth);
    }

    // Debt interest
    if (bankDebt > 0) {
      setBankDebt(prev => Math.round(prev * (1 + BANK_DEBT_INTEREST)));
    }

    // ─── MATH FIX #2: Investment returns include negatives, guaranteed crash month 4 ───
    if (investmentValue > 0 && investmentTier) {
      const tier = INVESTMENT_TIERS.find(t => t.id === investmentTier)!;
      let fundRatePercent: number;
      if (month === 4) {
        // Guaranteed crash
        fundRatePercent = tier.id === 'kupat_gemel' ? -1 : tier.id === 'index_fund' ? -8 : -20;
      } else {
        fundRatePercent = randomInt(tier.minReturn, tier.maxReturn);
      }
      const fundRate = fundRatePercent / 100;
      setLastFundRate(fundRate);
      setInvestmentValue(prev => Math.max(0, Math.round(prev * (1 + fundRate))));
    } else {
      setLastFundRate(0);
    }

    // Fraud refund
    if (pendingFraudRefund > 0) {
      addCardLine('statement.fraudRefund', -pendingFraudRefund);
      setPendingFraudRefund(0);
    }

    // Recurring card charges
    if (gymActive && month >= 2) {
      addCardLine('statement.gymMembership', GYM_MONTHLY);
    }
    if (phoneInstallmentMonths > 0 && month >= 2) {
      addCardLine('statement.phoneInstallment', 100);
      setPhoneInstallmentMonths(prev => prev - 1);
    }

    // Insurance monthly cost
    if (hasInsurance) {
      spendWithOverdraft(150);
    }

    // Service path monthly cost (mechina)
    if (selectedService?.costPerMonth && selectedService.costPerMonth > 0) {
      spendWithOverdraft(selectedService.costPerMonth);
    }

    // Service path stipend
    if (selectedService && selectedService.stipend > 0) {
      addIncome(4, selectedService.stipend);
    }

    // Roommate costs
    if (hasRoommate) {
      const flaked = Math.random() < 0.2; // 20% chance roommate flakes
      setRoommateFlaked(flaked);
      const myRent = flaked ? ROOMMATE_RENT * 2 : ROOMMATE_RENT;
      const utilities = ROOMMATE_ARNONA + ROOMMATE_ELECTRIC + ROOMMATE_INTERNET;
      spendWithOverdraft(myRent + utilities);
    }

    // Startup result in month 6
    if (startupInvested && month === 6) {
      const won = Math.random() < 0.4;
      setStartupResult(won ? 'won' : 'lost');
      if (won) {
        addIncome(4, 10000); // 5x the 2000 investment
      }
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

  // ─── MATH FIX #4: Food is now a player choice ───
  const handleMonthDecisionsContinue = () => {
    // Show roommate offer at month 3 if not already decided
    if (currentMonth === 3 && !roommateOfferShown) {
      setRoommateOfferShown(true);
      setView('roommateOffer');
      return;
    }
    setView('foodChoice');
  };

  const handleFoodChoice = (payMethod: 'cash' | 'card') => {
    if (payMethod === 'card' && creditCardUnlocked) {
      addCardLine('statement.foodGoingOut', FOOD_CARD);
    } else {
      spendWithOverdraft(FOOD_CASH);
    }
    setView('investmentChoice');
  };

  const handleInvest = (amount: number) => {
    if (amount > 0) {
      const balance = getLiveBalance();
      const actual = Math.min(amount, balance);
      if (actual > 0) {
        spend(4, actual);
        setMonthInvestAmount(actual);
        setInvestedPrincipal(prev => prev + actual);
        setInvestmentValue(prev => prev + actual);
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
    if (choice.setInsured) {
      setHasInsurance(true);
    }
    if (choice.investStartup) {
      setStartupInvested(true);
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

  // ─── MATH FIX #5: Credit card minimum payment floor of 100 NIS ───
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
      setBankDebt(prev => prev + (due - Math.max(0, balance)));
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

  // ─── MATH FIX #3: goalSaved reflects actual savings balance including interest ───
  const handleSaveToBank = (amount: number) => {
    const balance = getLiveBalance();
    const actual = Math.min(amount, balance);
    if (actual <= 0) return;
    spend(4, actual);
    setSavingsBalance(prev => prev + actual);
    // goalSaved will be read from savingsBalance directly
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
      // goalSaved = savingsBalance (FIX #3: includes interest)
      const currentGoalSaved = savingsBalance;
      const goalReached = currentGoalSaved >= (selectedGoal?.amount || 0);
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

    // Service path modifiers
    if (selectedService) {
      setEnergy(prev => clampMeter(prev + selectedService.energyMod));
      setSocial(prev => clampMeter(prev + selectedService.socialMod));
    }

    setEnergy(prev => clampMeter(prev + 8));
    setSocial(prev => clampMeter(prev + 4));

    const nextMonth = currentMonth + 1;
    setCurrentMonth(nextMonth);
    advanceWeek(4);
    startMonth(nextMonth, selectedJob || JOBS[0]);
  };

  const handlePlayAgain = () => {
    startLevel(4, 500);
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
    setInvestedPrincipal(0);
    setInvestmentValue(0);
    setInvestmentTier(null);
    setLastFundRate(0);
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
    setFailReason('');
    setSelectedService(null);
    setSelectedJob(null);
    setSelectedGoal(null);
    setHasRoommate(false);
    setRoommateFlaked(false);
    setRoommateOfferShown(false);
    setHasInsurance(false);
    setFreelanceTaxOwed(0);
    setStartupInvested(false);
    setStartupResult('pending');
  };

  // ─── MetersBar ────────────────────────────────────────────
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
      {investmentValue > 0 && (
        <Text style={styles.microText}>{t('level4.investmentValue')}: ₪{Math.round(investmentValue)}</Text>
      )}
      {bankDebt > 0 && <Text style={styles.microDanger}>{t('level4.bankDebt')}: ₪{bankDebt}</Text>}
      {creditCardBalance > 0 && (
        <Text style={styles.microDanger}>{t('level4.creditCardDebt')}: ₪{creditCardBalance}</Text>
      )}
      {hasRoommate && <Text style={styles.microText}>🏠 {t('level4.roommateActive')}</Text>}
      {hasInsurance && <Text style={styles.microText}>🛡️ {t('level4.insured')}</Text>}
    </View>
  );

  // ─── VIEWS ────────────────────────────────────────────────

  if (view === 'intro') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.bigEmoji}>🎓</Text>
        <Text style={styles.title}>{t('levels.level4.title')}</Text>
        <Text style={styles.subtitle}>{t('levels.level4.subtitle')}</Text>
        <Text style={styles.description}>{t('levels.level4.intro')}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('characterSelect')}>
          <Text style={styles.primaryBtnText}>{t('common.startPlaying')}</Text>
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
            startLevel(4, 500);
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
      { title: t('level4.how.steps.serviceTitle'), text: t('level4.how.steps.serviceText') },
      { title: t('level4.how.steps.payslipTitle'), text: t('level4.how.steps.payslipText') },
      { title: t('level4.how.steps.cardTitle'), text: t('level4.how.steps.cardText') },
      { title: t('level4.how.steps.investTitle'), text: t('level4.how.steps.investText') },
      { title: t('level4.how.steps.curveballTitle'), text: t('level4.how.steps.curveballText') },
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('servicePathSelect')}>
            <Text style={styles.primaryBtnText}>{t('level4.how.cta')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── NEW FEATURE #1: Army/Sherut Decision ───
  if (view === 'servicePathSelect') {
    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.service.title')}</Text>
          <Text style={styles.subtitle}>{t('level4.service.subtitle')}</Text>
          {SERVICE_PATHS.map(sp => (
            <TouchableOpacity
              key={sp.id}
              style={[styles.infoCard, selectedService?.id === sp.id && styles.selectedCard]}
              onPress={() => setSelectedService(sp)}
            >
              <Text style={styles.jobEmoji}>{sp.emoji}</Text>
              <Text style={styles.cardTitle}>{t(`level4.service.${sp.id}`)}</Text>
              <Text style={styles.cardText}>{t(`level4.${sp.descKey}`)}</Text>
              <Text style={styles.moneyText}>
                {sp.stipend > 0 ? `₪${sp.stipend}/mo` : t('level4.service.noIncome')}
                {sp.costPerMonth > 0 ? ` (${t('level4.service.costs')} ₪${sp.costPerMonth}/mo)` : ''}
              </Text>
              {sp.rentFree && <Text style={styles.successText}>{t('level4.service.rentFree')}</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.primaryBtn, !selectedService && styles.disabledBtn]}
            disabled={!selectedService}
            onPress={() => setView('jobSelect')}
          >
            <Text style={styles.primaryBtnText}>{t('level4.service.select')}</Text>
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
                  {job.isFreelance ? t('level4.jobs.freelanceRange') : `₪${job.monthlyGross}${tipsRange}`}
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
            {selectedJob?.isFreelance && (
              <Text style={styles.microDanger}>{t('level4.payslip.freelanceWarning')}</Text>
            )}
          </View>
          {roommateFlaked && (
            <View style={styles.alertCard}>
              <Text style={styles.cardText}>{t('level4.roommate.flaked')}</Text>
            </View>
          )}
          {startupResult === 'won' && currentMonth === 6 && (
            <View style={styles.alertCard}>
              <Text style={styles.cardText}>{t('level4.events.startupWon')}</Text>
            </View>
          )}
          {startupResult === 'lost' && currentMonth === 6 && (
            <View style={styles.alertCard}>
              <Text style={styles.cardText}>{t('level4.events.startupLost')}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePayslipContinue}>
            <Text style={styles.primaryBtnText}>{t('level4.payslip.continue')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'monthDecisions') {
    const rentText = hasRoommate
      ? `₪${ROOMMATE_RENT} + utilities`
      : selectedService?.rentFree
        ? `₪0 (${t('level4.service.rentFree')})`
        : '₪0';

    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.monthDecisions.title')}</Text>
          <MetersBar />
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('level4.monthDecisions.fixedCosts')}</Text>
            <Text style={styles.cardText}>• {t('level4.monthDecisions.rent')}: {rentText}</Text>
            <Text style={styles.cardText}>• {t('level4.monthDecisions.phoneBill')}: ₪{PHONE_BILL}</Text>
            <Text style={styles.cardText}>• {t('level4.monthDecisions.food')}: ₪{FOOD_CASH}</Text>
            {hasInsurance && <Text style={styles.cardText}>• {t('level4.monthDecisions.insurance')}: ₪150</Text>}
            {selectedService?.costPerMonth ? (
              <Text style={styles.cardText}>• {t('level4.monthDecisions.serviceCost')}: ₪{selectedService.costPerMonth}</Text>
            ) : null}
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

  // ─── NEW FEATURE #3: Roommate Offer ───
  if (view === 'roommateOffer') {
    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.roommate.title')}</Text>
          <MetersBar />
          <View style={styles.infoCard}>
            <Text style={styles.bigEmoji}>🏠</Text>
            <Text style={styles.cardText}>{t('level4.roommate.description')}</Text>
            <Text style={styles.cardText}>{t('level4.roommate.costs')}</Text>
            <Text style={styles.cardText}>• {t('level4.roommate.rent')}: ₪{ROOMMATE_RENT}</Text>
            <Text style={styles.cardText}>• {t('level4.roommate.arnona')}: ₪{ROOMMATE_ARNONA}</Text>
            <Text style={styles.cardText}>• {t('level4.roommate.electric')}: ₪{ROOMMATE_ELECTRIC}</Text>
            <Text style={styles.cardText}>• {t('level4.roommate.internet')}: ₪{ROOMMATE_INTERNET}</Text>
            <Text style={styles.microDanger}>{t('level4.roommate.warning')}</Text>
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setHasRoommate(true);
              setSocial(prev => clampMeter(prev + 10));
              setView('foodChoice');
            }}
          >
            <Text style={styles.primaryBtnText}>{t('level4.roommate.moveOut')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setView('foodChoice')}
          >
            <Text style={styles.secondaryBtnText}>{t('level4.roommate.stayHome')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MATH FIX #4: Food choice screen ───
  if (view === 'foodChoice') {
    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.food.title')}</Text>
          <MetersBar />
          <View style={styles.infoCard}>
            <Text style={styles.cardText}>{t('level4.food.description', { amount: FOOD_CASH })}</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleFoodChoice('cash')}>
            <Text style={styles.primaryBtnText}>{t('level4.food.payCash', { amount: FOOD_CASH })}</Text>
          </TouchableOpacity>
          {creditCardUnlocked && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleFoodChoice('card')}>
              <Text style={styles.secondaryBtnText}>{t('level4.food.payCard', { amount: FOOD_CARD })}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── NEW FEATURE #2: Enhanced Investment Simulator ───
  if (view === 'investmentChoice') {
    const balance = getLiveBalance();
    const options = [0, 200, 500, 1000].filter(v => v <= balance || v === 0);

    return (
      <SafeAreaView style={styles.screen}>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('level4.investing.title')}</Text>
          <MetersBar />
          <View style={styles.brandCard}>
            <Text style={styles.brandTitle}>{t('level4.investing.brandTitle')}</Text>
            <Text style={styles.cardText}>{t('level4.investing.brandText')}</Text>
          </View>

          {!investmentTier && (
            <>
              <Text style={styles.subtitle}>{t('level4.investing.chooseTier')}</Text>
              {INVESTMENT_TIERS.map(tier => (
                <TouchableOpacity
                  key={tier.id}
                  style={styles.infoCard}
                  onPress={() => setInvestmentTier(tier.id)}
                >
                  <Text style={styles.jobEmoji}>{tier.emoji}</Text>
                  <Text style={styles.cardTitle}>{t(`level4.${tier.nameKey}`)}</Text>
                  <Text style={styles.cardText}>{t(`level4.${tier.descKey}`)}</Text>
                  <Text style={styles.moneyText}>
                    {tier.minReturn}% to {tier.maxReturn}%
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleInvest(0)}>
                <Text style={styles.secondaryBtnText}>{t('level4.investing.skip')}</Text>
              </TouchableOpacity>
            </>
          )}

          {investmentTier && (
            <>
              <Text style={styles.subtitle}>
                {t('level4.investing.selected', { tier: t(`level4.${INVESTMENT_TIERS.find(t => t.id === investmentTier)!.nameKey}`) })}
              </Text>
              <Text style={styles.subtitle}>{t('level4.investing.available', { amount: balance })}</Text>
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
            </>
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
        <Text style={styles.title}>📱</Text>
        <Text style={styles.subtitle}>{t('level4.monthDecisions.phoneBill')}: ₪{PHONE_BILL}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePhoneBill}>
          <Text style={styles.primaryBtnText}>{t('level4.payslip.continue')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'creditCardStatement') {
    // MATH FIX #5: minimum payment floor of 100 NIS
    const rawMinimum = Math.ceil(creditCardBalance * 0.1);
    const minimum = creditCardBalance > 0 ? Math.max(100, rawMinimum) : 0;

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
              {creditCardBalance > 0 && (
                <Text style={styles.microText}>{t('level4.statement.minimum')}: ₪{minimum}</Text>
              )}

              {creditCardBalance > 0 ? (
                <>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => payCardAmount(creditCardBalance)}>
                    <Text style={styles.primaryBtnText}>{t('level4.statement.payFull')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => payCardAmount(minimum)}>
                    <Text style={styles.secondaryBtnText}>{t('level4.statement.payMinimum')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('monthSummary')}>
                  <Text style={styles.primaryBtnText}>{t('common.continueGame')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'monthSummary') {
    // MATH FIX #3: goal progress reflects savings balance (includes interest)
    const goalTarget = selectedGoal?.amount || 0;
    const currentGoalSaved = savingsBalance;
    const goalPercent = goalTarget > 0 ? Math.min(100, Math.round((currentGoalSaved / goalTarget) * 100)) : 0;

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
            {lastFundRate !== 0 && (
              <Text style={[styles.statementRow, lastFundRate < 0 && styles.dangerText]}>
                {t('level4.summary.fundGrowth', { rate: Math.round(lastFundRate * 100) })}
              </Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('level4.summary.goalProgress')}</Text>
            <Text style={styles.cardText}>
              {selectedGoal ? t(`level4.${selectedGoal.nameKey}`) : ''}: ₪{currentGoalSaved} / ₪{goalTarget} ({goalPercent}%)
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
          {startupResult === 'won' && (
            <Text style={[styles.statementRow, styles.successText]}>{t('level4.events.startupWonSummary')}</Text>
          )}
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
