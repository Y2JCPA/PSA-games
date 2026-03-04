import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store';
import { CharacterSelect } from './CharacterSelect';
import { MakoletShop } from './MakoletShop';
import { GoalPicker } from './GoalPicker';
import { colors, fonts, spacing } from '../../theme';

type Level1View = 'intro' | 'characterSelect' | 'shop' | 'goalPicker';

export const Level1Screen: React.FC = () => {
  const { t } = useTranslation();
  const { levels } = useGameStore();
  const level = levels[1];
  const [view, setView] = useState<Level1View>(
    level.status === 'in_progress' ? 'shop' : 'intro'
  );

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
    return <CharacterSelect onSelect={() => setView('shop')} />;
  }

  if (view === 'goalPicker') {
    return (
      <GoalPicker
        onGoalSet={() => setView('shop')}
        onBack={() => setView('shop')}
      />
    );
  }

  return <MakoletShop onSetGoal={() => setView('goalPicker')} />;
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
});
