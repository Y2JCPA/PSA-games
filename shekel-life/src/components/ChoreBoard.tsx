import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chore, getDailyChores, MAX_CHORES_PER_DAY } from '../mechanics/chores';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface ChoreBoardProps {
  currentDay: number;
  currentWeek: number;
  dayName: string;
  onComplete: (earnings: number, choresDone: string[]) => void;
  onSkip: () => void;
}

export const ChoreBoard: React.FC<ChoreBoardProps> = ({
  currentDay,
  currentWeek,
  dayName,
  onComplete,
  onSkip,
}) => {
  const { t } = useTranslation();
  const [selectedChores, setSelectedChores] = useState<string[]>([]);

  // Generate daily chores (memoized per day/week so it's stable)
  const dailyChores = useMemo(() => getDailyChores(currentDay + currentWeek * 7), [currentDay, currentWeek]);

  const totalEarnings = dailyChores
    .filter((c) => selectedChores.includes(c.id))
    .reduce((sum, c) => sum + c.payout, 0);

  const toggleChore = useCallback((choreId: string) => {
    setSelectedChores((prev) => {
      if (prev.includes(choreId)) {
        return prev.filter((id) => id !== choreId);
      }
      if (prev.length >= MAX_CHORES_PER_DAY) return prev;
      return [...prev, choreId];
    });
  }, []);

  const handleDone = () => {
    onComplete(totalEarnings, selectedChores);
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#E91E63';
      default: return colors.gray;
    }
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'easy': return t('chores.easy');
      case 'medium': return t('chores.medium');
      case 'hard': return t('chores.hard');
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🏠 {t('chores.title')}</Text>
        <Text style={styles.subtitle}>
          {dayName} — {t('common.week')} {currentWeek}
        </Text>
        <Text style={styles.instructions}>
          {t('chores.instructions', { max: MAX_CHORES_PER_DAY })}
        </Text>

        {/* Chore cards */}
        <View style={styles.choreGrid}>
          {dailyChores.map((chore) => {
            const isSelected = selectedChores.includes(chore.id);
            const isDisabled = !isSelected && selectedChores.length >= MAX_CHORES_PER_DAY;
            return (
              <TouchableOpacity
                key={chore.id}
                style={[
                  styles.choreCard,
                  isSelected && styles.choreSelected,
                  isDisabled && styles.choreDisabled,
                ]}
                onPress={() => toggleChore(chore.id)}
                disabled={isDisabled}
              >
                <Text style={styles.choreEmoji}>{chore.emoji}</Text>
                <Text style={styles.choreName}>{t(`chores.${chore.nameKey}`)}</Text>
                <View style={[styles.payoutBadge, { backgroundColor: categoryColor(chore.category) }]}>
                  <Text style={styles.payoutText}>₪{chore.payout}</Text>
                </View>
                <Text style={[styles.categoryLabel, { color: categoryColor(chore.category) }]}>
                  {categoryLabel(chore.category)}
                </Text>
                {isSelected && (
                  <View style={styles.checkMark}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Earnings summary */}
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>{t('chores.todaysEarnings')}</Text>
          <Text style={styles.earningsAmount}>₪{totalEarnings}</Text>
          <Text style={styles.choreCount}>
            {selectedChores.length}/{MAX_CHORES_PER_DAY} {t('chores.choresDone')}
          </Text>
        </View>

        {/* Action buttons */}
        <TouchableOpacity
          style={[styles.doneButton, selectedChores.length === 0 && styles.disabledButton]}
          onPress={handleDone}
          disabled={selectedChores.length === 0}
        >
          <Text style={styles.doneText}>
            {selectedChores.length > 0
              ? `${t('chores.collectPay')} ₪${totalEarnings}! 💰`
              : t('chores.selectChores')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>{t('chores.skipDay')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  instructions: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  choreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  choreCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    width: '45%',
    minWidth: 140,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative' as const,
  },
  choreSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  choreDisabled: {
    opacity: 0.4,
  },
  choreEmoji: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  choreName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  payoutBadge: {
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  payoutText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: fonts.sizes.md,
  },
  categoryLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
  },
  checkMark: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  earningsBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#FFD54F',
  },
  earningsLabel: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  earningsAmount: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: '#F57F17',
    marginBottom: spacing.xs,
  },
  choreCount: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  disabledButton: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  doneText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  skipButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipText: {
    color: colors.gray,
    fontSize: fonts.sizes.md,
    fontWeight: '600',
  },
});
