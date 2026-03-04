import React, { useState, useMemo } from 'react';
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
import { MaaserModal } from '../../components/MaaserModal';
import { colors, fonts, spacing, borderRadius } from '../../theme';

// ─── Types ───────────────────────────────────────────────────
type Level2View =
  | 'intro'
  | 'characterSelect'
  | 'howItWorks'
  | 'weekChoices'
  | 'weekSummary'
  | 'gameWin'
  | 'gameOver';

interface WeeklyChoice {
  id: string;
  textKey: string;
  emoji: string;
  cost: number;
  category: 'need' | 'want' | 'social' | 'surprise';
  happinessEffect: number;   // -20 to +20
  friendEffect: number;      // -15 to +15
}

// ─── Choice Pools ────────────────────────────────────────────
const NEED_CHOICES: WeeklyChoice[] = [
  { id: 'notebooks', textKey: 'notebooks', emoji: '📓', cost: 25, category: 'need', happinessEffect: 5, friendEffect: 0 },
  { id: 'busFare', textKey: 'busFare', emoji: '🚌', cost: 30, category: 'need', happinessEffect: 0, friendEffect: 0 },
  { id: 'lunchBox', textKey: 'lunchBox', emoji: '🥪', cost: 20, category: 'need', happinessEffect: 5, friendEffect: 0 },
  { id: 'artSupplies', textKey: 'artSupplies', emoji: '🎨', cost: 35, category: 'need', happinessEffect: 8, friendEffect: 0 },
  { id: 'waterBottle', textKey: 'waterBottle', emoji: '🧴', cost: 18, category: 'need', happinessEffect: 3, friendEffect: 0 },
  { id: 'newBackpack', textKey: 'newBackpack', emoji: '🎒', cost: 75, category: 'need', happinessEffect: 12, friendEffect: 5 },
  { id: 'gymShoes', textKey: 'gymShoes', emoji: '👟', cost: 60, category: 'need', happinessEffect: 10, friendEffect: 3 },
];

const WANT_CHOICES: WeeklyChoice[] = [
  { id: 'candy', textKey: 'candy', emoji: '🍬', cost: 15, category: 'want', happinessEffect: 10, friendEffect: 5 },
  { id: 'stickerPack', textKey: 'stickerPack', emoji: '⭐', cost: 20, category: 'want', happinessEffect: 12, friendEffect: 3 },
  { id: 'iceCream', textKey: 'iceCream', emoji: '🍦', cost: 18, category: 'want', happinessEffect: 15, friendEffect: 5 },
  { id: 'comicBook', textKey: 'comicBook', emoji: '📚', cost: 35, category: 'want', happinessEffect: 12, friendEffect: 0 },
  { id: 'coolPencilCase', textKey: 'coolPencilCase', emoji: '✏️', cost: 45, category: 'want', happinessEffect: 10, friendEffect: 8 },
  { id: 'toyFigure', textKey: 'toyFigure', emoji: '🤖', cost: 55, category: 'want', happinessEffect: 18, friendEffect: 5 },
  { id: 'videoGame', textKey: 'videoGame', emoji: '🎮', cost: 90, category: 'want', happinessEffect: 25, friendEffect: 8 },
  { id: 'sneakers', textKey: 'sneakers', emoji: '👑', cost: 120, category: 'want', happinessEffect: 22, friendEffect: 15 },
];

const SOCIAL_CHOICES: WeeklyChoice[] = [
  { id: 'pizzaFriends', textKey: 'pizzaFriends', emoji: '🍕', cost: 40, category: 'social', happinessEffect: 15, friendEffect: 15 },
  { id: 'birthdayGift', textKey: 'birthdayGift', emoji: '🎁', cost: 55, category: 'social', happinessEffect: 5, friendEffect: 20 },
  { id: 'shareSeat', textKey: 'shareSeat', emoji: '🎪', cost: 0, category: 'social', happinessEffect: 10, friendEffect: 10 },
  { id: 'tiyulDeposit', textKey: 'tiyulDeposit', emoji: '🏕️', cost: 65, category: 'social', happinessEffect: 20, friendEffect: 15 },
  { id: 'classTreat', textKey: 'classTreat', emoji: '🧁', cost: 30, category: 'social', happinessEffect: 8, friendEffect: 12 },
  { id: 'bowlingTrip', textKey: 'bowlingTrip', emoji: '🎳', cost: 50, category: 'social', happinessEffect: 18, friendEffect: 18 },
  { id: 'escapeRoom', textKey: 'escapeRoom', emoji: '🔐', cost: 80, category: 'social', happinessEffect: 22, friendEffect: 20 },
];

const SURPRISE_CHOICES: WeeklyChoice[] = [
  { id: 'chanukahGelt', textKey: 'chanukahGelt', emoji: '🕎', cost: -40, category: 'surprise', happinessEffect: 20, friendEffect: 5 },
  { id: 'foundMoney', textKey: 'foundMoney', emoji: '💵', cost: -15, category: 'surprise', happinessEffect: 10, friendEffect: 0 },
  { id: 'brokePen', textKey: 'brokePen', emoji: '🖊️', cost: 25, category: 'surprise', happinessEffect: -10, friendEffect: 0 },
  { id: 'purimCostume', textKey: 'purimCostume', emoji: '🎭', cost: 70, category: 'surprise', happinessEffect: 15, friendEffect: 10 },
  { id: 'lostLunch', textKey: 'lostLunch', emoji: '😤', cost: 25, category: 'surprise', happinessEffect: -12, friendEffect: 0 },
  { id: 'rainGear', textKey: 'rainGear', emoji: '🌧️', cost: 35, category: 'surprise', happinessEffect: -5, friendEffect: 0 },
  { id: 'brokenPhone', textKey: 'brokenPhone', emoji: '📱💥', cost: 100, category: 'surprise', happinessEffect: -20, friendEffect: -5 },
  { id: 'dentist', textKey: 'dentist', emoji: '🦷', cost: 45, category: 'surprise', happinessEffect: -15, friendEffect: 0 },
];

const TOTAL_WEEKS = 8;
const WEEKLY_INCOME = 50;
const STARTING_HAPPINESS = 60;
const STARTING_FRIENDS = 60;

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateWeekChoices(week: number): WeeklyChoice[] {
  const choices: WeeklyChoice[] = [];
  // Each week: 1 need or social, 1 want, 1 social or surprise
  choices.push(...pickRandom(NEED_CHOICES, 1));
  choices.push(...pickRandom(WANT_CHOICES, 1));
  // Alternate social and surprise events
  if (week % 2 === 0) {
    choices.push(...pickRandom(SURPRISE_CHOICES, 1));
  } else {
    choices.push(...pickRandom(SOCIAL_CHOICES, 1));
  }
  return choices;
}

function getMoodFace(value: number): string {
  if (value >= 80) return '😄';
  if (value >= 60) return '🙂';
  if (value >= 40) return '😐';
  if (value >= 20) return '😟';
  return '😢';
}

function getFriendFace(value: number): string {
  if (value >= 80) return '👫';
  if (value >= 60) return '🤝';
  if (value >= 40) return '👋';
  if (value >= 20) return '😶';
  return '😔';
}

function getStarRating(value: number): string {
  if (value >= 80) return '⭐⭐⭐';
  if (value >= 50) return '⭐⭐';
  if (value >= 20) return '⭐';
  return '—';
}

// ─── Component ───────────────────────────────────────────────
export const Level2Screen: React.FC = () => {
  const { t } = useTranslation();
  const {
    levels,
    language,
    setGender,
    startLevel,
    addIncome,
    spend,
    toggleMaaser,
    addMaaser,
    advanceWeek,
    completeLevel,
    incrementImpulseResist,
  } = useGameStore();
  const level = levels[2];

  const [view, setView] = useState<Level2View>(
    level.status === 'in_progress' ? 'weekChoices' : 'intro'
  );
  const [showMaaser, setShowMaaser] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [happiness, setHappiness] = useState(STARTING_HAPPINESS);
  const [friends, setFriends] = useState(STARTING_FRIENDS);

  // Weekly choices state
  const [weekChoices, setWeekChoices] = useState<WeeklyChoice[]>(() => generateWeekChoices(1));
  const [decisions, setDecisions] = useState<Record<string, boolean>>({});
  const [weekRevealed, setWeekRevealed] = useState(false);

  const charName = level.gender === 'girl'
    ? t('levels.level2.girlName')
    : t('levels.level2.boyName');

  // ─── Handlers ──────────────────────────────────────────────
  const handleStartGame = () => {
    if (!level.gender) return;
    startLevel(2, WEEKLY_INCOME);
    setShowMaaser(true);
  };

  const handleMaaserAccept = () => {
    toggleMaaser(2, true);
    setShowMaaser(false);
    setView('howItWorks');
  };

  const handleMaaserDecline = () => {
    setShowMaaser(false);
    setView('howItWorks');
  };

  const handleDecision = (choiceId: string, accepted: boolean) => {
    setDecisions((prev) => ({ ...prev, [choiceId]: accepted }));
  };

  const allDecided = weekChoices.every((c) => decisions[c.id] !== undefined);

  const handleConfirmWeek = () => {
    let happinessDelta = -3; // Baseline slight decrease each week (life is hard!)
    let friendsDelta = -2;
    let weekSpend = 0;
    let weekGain = 0;

    weekChoices.forEach((choice) => {
      const accepted = decisions[choice.id];
      if (accepted) {
        if (choice.cost > 0) {
          weekSpend += choice.cost;
        } else {
          weekGain += Math.abs(choice.cost);
        }
        happinessDelta += choice.happinessEffect;
        friendsDelta += choice.friendEffect;
      } else {
        // Skipping has consequences
        if (choice.category === 'social') {
          friendsDelta -= 10; // Friends notice when you skip social stuff
          happinessDelta -= 5;
        } else if (choice.category === 'need') {
          happinessDelta -= 8; // Needs hurt more when skipped
        } else if (choice.category === 'want') {
          // Resisting wants = mild happiness loss but builds discipline
          happinessDelta -= 3;
          incrementImpulseResist(2);
        }
        // Skipping surprises with negative cost means you still pay (can't avoid rain)
        if (choice.category === 'surprise' && choice.cost > 0) {
          // Optional surprises can be skipped
        }
      }
    });

    // Apply income
    addIncome(2, WEEKLY_INCOME);
    if (weekGain > 0) addIncome(2, weekGain);

    // Apply spending
    if (weekSpend > 0) {
      const canAfford = level.balance + WEEKLY_INCOME + weekGain >= weekSpend;
      if (canAfford) {
        spend(2, weekSpend);
      } else {
        // Can't afford — extra penalty
        spend(2, level.balance + WEEKLY_INCOME + weekGain); // Spend everything
        happinessDelta -= 15;
        friendsDelta -= 10;
      }
    }

    // Maaser
    if (level.maaserEnabled) {
      const maaserAmount = Math.round(WEEKLY_INCOME * 0.1);
      if (level.balance >= maaserAmount) {
        addMaaser(2, maaserAmount);
        happinessDelta += 5; // Giving feels good
      }
    }

    // Clamp meters
    setHappiness((prev) => Math.max(0, Math.min(100, prev + happinessDelta)));
    setFriends((prev) => Math.max(0, Math.min(100, prev + friendsDelta)));

    setWeekRevealed(true);
    setView('weekSummary');
  };

  const handleNextWeek = () => {
    if (level.balance < 0 || happiness <= 0) {
      setView('gameOver');
      return;
    }

    if (currentWeek >= TOTAL_WEEKS) {
      completeLevel(2);
      setView('gameWin');
      return;
    }

    const nextWeek = currentWeek + 1;
    setCurrentWeek(nextWeek);
    setWeekChoices(generateWeekChoices(nextWeek));
    setDecisions({});
    setWeekRevealed(false);
    advanceWeek(2);
    setView('weekChoices');
  };

  const handlePlayAgain = () => {
    startLevel(2, WEEKLY_INCOME);
    setCurrentWeek(1);
    setHappiness(STARTING_HAPPINESS);
    setFriends(STARTING_FRIENDS);
    setWeekChoices(generateWeekChoices(1));
    setDecisions({});
    setWeekRevealed(false);
    setView('weekChoices');
  };

  // ─── METERS COMPONENT ─────────────────────────────────────
  const MetersBar = () => (
    <View style={styles.metersBar}>
      <View style={styles.meterItem}>
        <Text style={styles.meterFace}>{getMoodFace(happiness)}</Text>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, {
            width: `${happiness}%`,
            backgroundColor: happiness > 50 ? '#4CAF50' : happiness > 25 ? '#FF9800' : '#E91E63',
          }]} />
        </View>
        <Text style={styles.meterValue}>{happiness}%</Text>
      </View>
      <View style={styles.meterItem}>
        <Text style={styles.meterFace}>{getFriendFace(friends)}</Text>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, {
            width: `${friends}%`,
            backgroundColor: friends > 50 ? '#2196F3' : friends > 25 ? '#FF9800' : '#E91E63',
          }]} />
        </View>
        <Text style={styles.meterValue}>{friends}%</Text>
      </View>
      <View style={styles.meterItem}>
        <Text style={styles.meterFace}>💰</Text>
        <Text style={styles.balanceText}>₪{level.balance}</Text>
      </View>
    </View>
  );

  // ─── INTRO ────────────────────────────────────────────────
  if (view === 'intro') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.bigEmoji}>📚</Text>
        <Text style={styles.title}>{t('levels.level2.title')}</Text>
        <Text style={styles.subtitle}>{t('levels.level2.subtitle')}</Text>
        <Text style={styles.description}>{t('levels.level2.intro')}</Text>
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
        <Text style={styles.bigEmoji}>📚</Text>
        <Text style={styles.title}>{t('common.chooseCharacter')}</Text>
        <View style={styles.charRow}>
          <TouchableOpacity
            style={[styles.charCard, level.gender === 'boy' && styles.charSelected]}
            onPress={() => setGender(2, 'boy')}
          >
            <Text style={styles.charEmoji}>👦</Text>
            <Text style={styles.charName}>{t('levels.level2.boyName')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.charCard, level.gender === 'girl' && styles.charSelected]}
            onPress={() => setGender(2, 'girl')}
          >
            <Text style={styles.charEmoji}>👧</Text>
            <Text style={styles.charName}>{t('levels.level2.girlName')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, !level.gender && styles.disabledBtn]}
          onPress={handleStartGame}
          disabled={!level.gender}
        >
          <Text style={styles.primaryBtnText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
        <MaaserModal
          visible={showMaaser}
          onAccept={handleMaaserAccept}
          onDecline={handleMaaserDecline}
        />
      </SafeAreaView>
    );
  }

  // ─── HOW IT WORKS ──────────────────────────────────────────
  if (view === 'howItWorks') {
    return (
      <SafeAreaView style={styles.scrollContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{t('level2HowItWorks.title')}</Text>
          <Text style={styles.howGreeting}>
            {t('level2HowItWorks.greeting', { name: charName })}
          </Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>💰</Text>
            <Text style={styles.stepTitle}>{t('level2HowItWorks.step1title')}</Text>
            <Text style={styles.stepText}>{t('level2HowItWorks.step1text')}</Text>
          </View>
          <Text style={styles.arrow}>⬇️</Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>🤔</Text>
            <Text style={styles.stepTitle}>{t('level2HowItWorks.step2title')}</Text>
            <Text style={styles.stepText}>{t('level2HowItWorks.step2text')}</Text>
          </View>
          <Text style={styles.arrow}>⬇️</Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>😊</Text>
            <Text style={styles.stepTitle}>{t('level2HowItWorks.step3title')}</Text>
            <Text style={styles.stepText}>{t('level2HowItWorks.step3text')}</Text>
          </View>
          <Text style={styles.arrow}>⬇️</Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>🏆</Text>
            <Text style={styles.stepTitle}>{t('level2HowItWorks.step4title')}</Text>
            <Text style={styles.stepText}>{t('level2HowItWorks.step4text')}</Text>
          </View>

          <View style={styles.metersPreview}>
            <Text style={styles.metersPreviewTitle}>Your Meters:</Text>
            <Text style={styles.meterPreviewItem}>😄 Happiness — stay above 50%</Text>
            <Text style={styles.meterPreviewItem}>👫 Friends — don't ignore your friends!</Text>
            <Text style={styles.meterPreviewItem}>💰 Money — don't go broke!</Text>
          </View>

          <TouchableOpacity style={styles.greenBtn} onPress={() => setView('weekChoices')}>
            <Text style={styles.greenBtnText}>Let's Go! 🎉</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── WEEKLY CHOICES ────────────────────────────────────────
  if (view === 'weekChoices') {
    return (
      <SafeAreaView style={styles.scrollContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Week header */}
          <Text style={styles.weekHeader}>Week {currentWeek} of {TOTAL_WEEKS}</Text>
          <Text style={styles.weekIncome}>+₪{WEEKLY_INCOME} pocket money this week</Text>

          {/* Meters */}
          <MetersBar />

          {/* Choice cards */}
          <Text style={styles.choicesTitle}>This week's decisions:</Text>

          {weekChoices.map((choice) => {
            const decided = decisions[choice.id];
            const isAccepted = decided === true;
            const isDeclined = decided === false;
            const isGain = choice.cost < 0;

            return (
              <View key={choice.id} style={[
                styles.choiceCard,
                isAccepted && styles.choiceAccepted,
                isDeclined && styles.choiceDeclined,
              ]}>
                <View style={styles.choiceTop}>
                  <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
                  <View style={styles.choiceInfo}>
                    <Text style={styles.choiceText}>{t(`level2Choices.${choice.textKey}`)}</Text>
                    <View style={styles.choiceMeta}>
                      <Text style={[styles.choiceCost, isGain && styles.choiceGain]}>
                        {isGain ? `+₪${Math.abs(choice.cost)}` : `₪${choice.cost}`}
                      </Text>
                      {choice.happinessEffect > 5 && <Text style={styles.choiceEffect}>😊+</Text>}
                      {choice.friendEffect > 5 && <Text style={styles.choiceEffect}>👫+</Text>}
                    </View>
                  </View>
                </View>
                <View style={styles.choiceButtons}>
                  <TouchableOpacity
                    style={[styles.yesBtn, isAccepted && styles.yesBtnActive]}
                    onPress={() => handleDecision(choice.id, true)}
                  >
                    <Text style={[styles.yesBtnText, isAccepted && styles.btnTextActive]}>
                      {isGain ? '🎉 Nice!' : '✓ Yes'}
                    </Text>
                  </TouchableOpacity>
                  {!isGain && (
                    <TouchableOpacity
                      style={[styles.noBtn, isDeclined && styles.noBtnActive]}
                      onPress={() => handleDecision(choice.id, false)}
                    >
                      <Text style={[styles.noBtnText, isDeclined && styles.btnTextActive]}>
                        ✗ Skip
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.primaryBtn, !allDecided && styles.disabledBtn]}
            onPress={handleConfirmWeek}
            disabled={!allDecided}
          >
            <Text style={styles.primaryBtnText}>
              {allDecided ? 'End Week →' : 'Decide everything first!'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── WEEK SUMMARY ─────────────────────────────────────────
  if (view === 'weekSummary') {
    const weekSpent = weekChoices.reduce((sum, c) => {
      if (decisions[c.id] && c.cost > 0) return sum + c.cost;
      return sum;
    }, 0);
    const weekGained = weekChoices.reduce((sum, c) => {
      if (decisions[c.id] && c.cost < 0) return sum + Math.abs(c.cost);
      return sum;
    }, 0);

    return (
      <SafeAreaView style={styles.scrollContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>📊 Week {currentWeek} Summary</Text>

          <MetersBar />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pocket money</Text>
              <Text style={[styles.summaryAmount, { color: colors.success }]}>+₪{WEEKLY_INCOME}</Text>
            </View>
            {weekGained > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bonus</Text>
                <Text style={[styles.summaryAmount, { color: colors.success }]}>+₪{weekGained}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={[styles.summaryAmount, { color: colors.danger }]}>-₪{weekSpent}</Text>
            </View>
            {level.maaserEnabled && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Maaser 🤝</Text>
                <Text style={[styles.summaryAmount, { color: colors.maaser }]}>-₪{Math.round(WEEKLY_INCOME * 0.1)}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Balance</Text>
              <Text style={[styles.summaryAmountBold, level.balance < 0 && { color: colors.danger }]}>
                ₪{level.balance}
              </Text>
            </View>
          </View>

          {/* Feedback messages */}
          {happiness < 30 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>😟 {charName} isn't feeling great... Try to do some fun things next week!</Text>
            </View>
          )}
          {friends < 30 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>😶 Your friends miss you! Don't skip too many social events.</Text>
            </View>
          )}
          {level.balance < 10 && level.balance >= 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>💰 Running low on cash! Be careful next week.</Text>
            </View>
          )}
          {happiness > 70 && friends > 70 && level.balance > 30 && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>🌟 Great week! You're balancing money, fun, and friends perfectly!</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleNextWeek}>
            <Text style={styles.primaryBtnText}>
              {currentWeek < TOTAL_WEEKS ? `Start Week ${currentWeek + 1} →` : '🏆 See Results!'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── GAME WIN ──────────────────────────────────────────────
  if (view === 'gameWin') {
    const moneyStars = getStarRating(Math.min(100, level.balance));
    const happyStars = getStarRating(happiness);
    const friendStars = getStarRating(friends);

    return (
      <SafeAreaView style={styles.scrollContainer}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.title}>School Term Complete!</Text>
          <Text style={styles.description}>
            Amazing job, {charName}! You survived {TOTAL_WEEKS} weeks of school with money, happiness, and friends!
          </Text>

          <View style={styles.starReport}>
            <Text style={styles.starReportTitle}>Your Report Card</Text>
            <View style={styles.starRow}>
              <Text style={styles.starLabel}>💰 Money Smart</Text>
              <Text style={styles.starValue}>{moneyStars}</Text>
            </View>
            <View style={styles.starRow}>
              <Text style={styles.starLabel}>😊 Happiness</Text>
              <Text style={styles.starValue}>{happyStars}</Text>
            </View>
            <View style={styles.starRow}>
              <Text style={styles.starLabel}>👫 Friendships</Text>
              <Text style={styles.starValue}>{friendStars}</Text>
            </View>
          </View>

          <Text style={styles.finalBalance}>Final Balance: ₪{level.balance}</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
            <Text style={styles.primaryBtnText}>Play Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── GAME OVER ─────────────────────────────────────────────
  if (view === 'gameOver') {
    const reason = level.balance < 0
      ? `You ran out of money in week ${currentWeek}. Try spending less on wants and saving for surprises!`
      : `${charName}'s happiness dropped too low. Remember — saving is important, but so is having fun and being with friends!`;

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
  centerContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  bigEmoji: { fontSize: 72, marginBottom: spacing.md },
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
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  greenBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  greenBtnText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  disabledBtn: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },

  // Character select
  charRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  charCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: 120,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  charSelected: { borderColor: colors.primary, backgroundColor: '#e8f4fd' },
  charEmoji: { fontSize: 48, marginBottom: spacing.xs },
  charName: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.darkGray },

  // How it works
  howGreeting: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 26,
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
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
  stepTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  stepText: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  arrow: { fontSize: 24, paddingVertical: spacing.xs, textAlign: 'center' },
  metersPreview: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    marginTop: spacing.lg,
    borderWidth: 2,
    borderColor: '#BBDEFB',
  },
  metersPreviewTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  meterPreviewItem: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },

  // Meters bar
  metersBar: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  meterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  meterFace: { fontSize: 24, marginRight: spacing.sm, width: 30 },
  meterTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  meterFill: {
    height: '100%',
    borderRadius: 6,
  },
  meterValue: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.darkGray,
    width: 36,
    textAlign: 'right',
  },
  balanceText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800',
    color: colors.primary,
  },

  // Week header
  weekHeader: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  weekIncome: {
    fontSize: fonts.sizes.md,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  choicesTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: spacing.md,
  },

  // Choice cards
  choiceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceAccepted: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  choiceDeclined: {
    borderColor: '#9E9E9E',
    backgroundColor: '#FAFAFA',
    opacity: 0.7,
  },
  choiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  choiceEmoji: { fontSize: 36, marginRight: spacing.md },
  choiceInfo: { flex: 1 },
  choiceText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.darkGray,
    lineHeight: 22,
  },
  choiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  choiceCost: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.danger,
  },
  choiceGain: {
    color: colors.success,
  },
  choiceEffect: {
    fontSize: 16,
  },
  choiceButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  yesBtn: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  yesBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  yesBtnText: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: '#388E3C',
  },
  noBtn: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  noBtnActive: {
    backgroundColor: '#9E9E9E',
    borderColor: '#757575',
  },
  noBtnText: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: '#757575',
  },
  btnTextActive: {
    color: colors.white,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: { fontSize: fonts.sizes.md, color: colors.darkGray },
  summaryAmount: { fontSize: fonts.sizes.md, fontWeight: '700' },
  summaryDivider: {
    height: 2,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.sm,
  },
  summaryLabelBold: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.darkGray },
  summaryAmountBold: { fontSize: fonts.sizes.lg, fontWeight: '800', color: colors.primary },

  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  warningText: { fontSize: fonts.sizes.md, color: '#E65100', lineHeight: 22 },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  successText: { fontSize: fonts.sizes.md, color: '#2E7D32', lineHeight: 22 },

  // Win screen stars
  starReport: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  starReportTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  starLabel: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
  },
  starValue: {
    fontSize: fonts.sizes.lg,
  },
  finalBalance: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
});
