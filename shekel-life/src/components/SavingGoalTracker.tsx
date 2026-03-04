import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SavingGoal, ShopItem } from '../store/types';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface SavingGoalTrackerProps {
  goal: SavingGoal;
  goalItem?: ShopItem;
}

export const SavingGoalTracker: React.FC<SavingGoalTrackerProps> = ({ goal, goalItem }) => {
  const { t } = useTranslation();
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  return (
    <View style={[styles.container, goal.completed && styles.completed]}>
      <View style={styles.header}>
        {goalItem && <Text style={styles.emoji}>{goalItem.emoji}</Text>}
        <Text style={styles.title}>{t('shopping.savingGoal')}</Text>
      </View>

      {goalItem && (
        <Text style={styles.itemName}>{t(`items.${goalItem.nameKey}`)}</Text>
      )}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
      </View>

      <Text style={styles.progressText}>
        {t('shopping.savingProgress', {
          current: goal.currentAmount,
          goal: goal.targetAmount,
        })}
      </Text>

      {goal.completed && (
        <Text style={styles.completedText}>{t('shopping.goalReached')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completed: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  emoji: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  itemName: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
    textAlign: 'center',
  },
  completedText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
