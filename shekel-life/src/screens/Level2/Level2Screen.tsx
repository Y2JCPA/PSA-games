import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store';
import { BudgetDashboard } from '../../components/BudgetDashboard';
import { MaaserModal } from '../../components/MaaserModal';
import { colors, fonts, spacing, borderRadius } from '../../theme';

export const Level2Screen: React.FC = () => {
  const { t } = useTranslation();
  const { levels, setGender, startLevel, toggleMaaser } = useGameStore();
  const level = levels[2];
  const [showMaaser, setShowMaaser] = useState(false);
  const [started, setStarted] = useState(level.status === 'in_progress');

  if (!started) {
    return (
      <SafeAreaView style={styles.introContainer}>
        <Text style={styles.emoji}>📚</Text>
        <Text style={styles.title}>{t('levels.level2.title')}</Text>
        <Text style={styles.subtitle}>{t('levels.level2.subtitle')}</Text>
        <Text style={styles.description}>{t('levels.level2.intro')}</Text>

        <Text style={styles.chooseLabel}>{t('common.chooseCharacter')}</Text>
        <View style={styles.characters}>
          <TouchableOpacity
            style={[styles.charCard, level.gender === 'boy' && styles.selected]}
            onPress={() => setGender(2, 'boy')}
          >
            <Text style={styles.avatar}>👦</Text>
            <Text style={styles.charName}>{t('levels.level2.boyName')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.charCard, level.gender === 'girl' && styles.selected]}
            onPress={() => setGender(2, 'girl')}
          >
            <Text style={styles.avatar}>👧</Text>
            <Text style={styles.charName}>{t('levels.level2.girlName')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.startButton, !level.gender && styles.disabled]}
          onPress={() => {
            if (level.gender) {
              startLevel(2, 50); // ₪50 weekly pocket money
              setStarted(true);
              setShowMaaser(true);
            }
          }}
          disabled={!level.gender}
        >
          <Text style={styles.startText}>{t('common.startPlaying')}</Text>
        </TouchableOpacity>

        <MaaserModal
          visible={showMaaser}
          onAccept={() => { toggleMaaser(2, true); setShowMaaser(false); }}
          onDecline={() => setShowMaaser(false)}
        />
      </SafeAreaView>
    );
  }

  // Placeholder gameplay for Level 2
  const maaserAmount = level.maaserEnabled ? Math.round(level.balance * 0.1) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('levels.level2.title')}</Text>
        <Text style={styles.weekLabel}>{t('common.week')} {level.currentWeek}</Text>

        <BudgetDashboard
          income={50}
          categories={[
            { label: t('budget.needs'), amount: 20, color: colors.primary },
            { label: t('budget.wants'), amount: 15, color: colors.warning },
            { label: t('budget.savings'), amount: 10, color: colors.success },
            ...(level.maaserEnabled
              ? [{ label: t('budget.maaser'), amount: maaserAmount, color: colors.maaser }]
              : []),
          ]}
          balance={level.balance}
          period="week"
        />

        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🚧</Text>
          <Text style={styles.placeholderText}>
            Full Level 2 gameplay coming in Phase 2!
          </Text>
          <Text style={styles.placeholderSub}>
            Weekly budget management, needs vs. wants decisions, tiyul expenses, and yom tov surprises.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
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
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  weekLabel: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  chooseLabel: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: spacing.md,
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
    width: 120,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#e8f4fd',
  },
  avatar: {
    fontSize: 48,
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
  disabled: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  startText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  placeholder: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  placeholderSub: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
