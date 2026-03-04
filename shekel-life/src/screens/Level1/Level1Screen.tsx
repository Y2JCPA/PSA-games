import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store';
import { getDayName } from '../../mechanics/shabbatCalendar';
import { CharacterSelect } from './CharacterSelect';
import { MakoletShop } from './MakoletShop';
import { GoalPicker } from './GoalPicker';
import { ChoreBoard } from '../../components/ChoreBoard';
import { LevelNavBar } from '../../components/LevelNavBar';
import { colors, fonts, spacing } from '../../theme';

type Level1View = 'intro' | 'characterSelect' | 'howItWorks' | 'chores' | 'shop' | 'goalPicker';

interface Level1Props {
  onHome: () => void;
  onRestart: () => void;
}

export const Level1Screen: React.FC<Level1Props> = ({ onHome, onRestart }) => {
  const { t } = useTranslation();
  const { levels, language, addIncome, advanceDay } = useGameStore();
  const level = levels[1];
  const [view, setView] = useState<Level1View>(
    level.status === 'in_progress' ? 'chores' : 'intro'
  );

  const handleChoresComplete = (earnings: number, choresDone: string[]) => {
    if (earnings > 0) {
      addIncome(1, earnings);
    }
    setView('shop');
  };

  const handleChoresSkip = () => {
    setView('shop');
  };

  const handleNextDay = () => {
    advanceDay(1);
    // Go back to chores for the new day
    setView('chores');
  };

  if (view === 'intro') {
    return (
      <SafeAreaView style={styles.introContainer}>
        <Text style={styles.levelEmoji}>🛒</Text>
        <Text style={styles.introTitle}>{t('levels.level1.title')}</Text>
        <Text style={styles.introSubtitle}>{t('levels.level1.subtitle')}</Text>
        <Text style={styles.introText}>{t('levels.level1.intro')}</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setView('characterSelect')}
        >
          <Text style={styles.startText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'characterSelect') {
    return (
      <>
        <LevelNavBar onHome={onHome} onRestart={onRestart} />
        <CharacterSelect onSelect={() => setView('howItWorks')} />
      </>
    );
  }

  if (view === 'howItWorks') {
    const charName = level.gender === 'girl' ? t('levels.level1.girlName') : t('levels.level1.boyName');
    return (
      <SafeAreaView style={styles.howContainer}>
        <ScrollView contentContainerStyle={styles.howScroll}>
          <Text style={styles.howTitle}>{t('howItWorks.title')}</Text>
          <Text style={styles.howGreeting}>
            {t('howItWorks.greeting', { name: charName })}
          </Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>🏠</Text>
            <Text style={styles.stepNumber}>{t('howItWorks.step1title')}</Text>
            <Text style={styles.stepText}>{t('howItWorks.step1text')}</Text>
          </View>

          <View style={styles.stepArrow}><Text style={styles.arrowText}>⬇️</Text></View>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>💰</Text>
            <Text style={styles.stepNumber}>{t('howItWorks.step2title')}</Text>
            <Text style={styles.stepText}>{t('howItWorks.step2text')}</Text>
          </View>

          <View style={styles.stepArrow}><Text style={styles.arrowText}>⬇️</Text></View>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>🛒</Text>
            <Text style={styles.stepNumber}>{t('howItWorks.step3title')}</Text>
            <Text style={styles.stepText}>{t('howItWorks.step3text')}</Text>
          </View>

          <View style={styles.stepArrow}><Text style={styles.arrowText}>⬇️</Text></View>

          <View style={styles.stepCard}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepNumber}>{t('howItWorks.step4title')}</Text>
            <Text style={styles.stepText}>{t('howItWorks.step4text')}</Text>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>{t('howItWorks.tip')}</Text>
          </View>

          <TouchableOpacity
            style={styles.letsGoButton}
            onPress={() => setView('chores')}
          >
            <Text style={styles.letsGoText}>{t('howItWorks.letsGo')} 🎉</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'chores') {
    return (
      <>
      <LevelNavBar onHome={onHome} onRestart={onRestart} />
      <ChoreBoard
        currentDay={level.currentDay}
        currentWeek={level.currentWeek}
        dayName={getDayName(level.currentDay, language)}
        onComplete={handleChoresComplete}
        onSkip={handleChoresSkip}
      />
      </>
    );
  }

  if (view === 'goalPicker') {
    return (
      <GoalPicker
        onGoalSet={() => setView('shop')}
        onBack={() => setView('shop')}
      />
    );
  }

  return (
    <>
      <LevelNavBar onHome={onHome} onRestart={onRestart} />
      <MakoletShop
        onSetGoal={() => setView('goalPicker')}
        onNextDay={handleNextDay}
      />
    </>
  );
};

const styles = StyleSheet.create({
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
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  startText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  // How It Works styles
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
  stepEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  stepNumber: {
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
  stepArrow: {
    paddingVertical: spacing.xs,
  },
  arrowText: {
    fontSize: 24,
  },
  tipBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 2,
    borderColor: '#FFD54F',
  },
  tipEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  letsGoButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  letsGoText: {
    color: colors.white,
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
  },
});
