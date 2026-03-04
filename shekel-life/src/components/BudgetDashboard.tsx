import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface BudgetCategory {
  label: string;
  amount: number;
  color: string;
}

interface BudgetDashboardProps {
  income: number;
  categories: BudgetCategory[];
  balance: number;
  period: 'week' | 'month';
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  income,
  categories,
  balance,
  period,
}) => {
  const { t } = useTranslation();
  const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const isOverBudget = balance < 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {period === 'week' ? t('budget.weeklyBudget') : t('budget.monthlyBudget')}
      </Text>

      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>{t('budget.income')}</Text>
        <Text style={styles.incomeAmount}>₪{income}</Text>
      </View>

      <View style={styles.barContainer}>
        {categories.map((cat, index) => {
          const widthPercent = income > 0 ? (cat.amount / income) * 100 : 0;
          return (
            <View
              key={index}
              style={[
                styles.barSegment,
                { width: `${Math.min(widthPercent, 100)}%`, backgroundColor: cat.color },
              ]}
            />
          );
        })}
      </View>

      {categories.map((cat, index) => (
        <View key={index} style={styles.categoryRow}>
          <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
          <Text style={styles.categoryLabel}>{cat.label}</Text>
          <Text style={styles.categoryAmount}>₪{cat.amount}</Text>
        </View>
      ))}

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>{t('budget.remaining')}</Text>
        <Text style={[styles.balanceAmount, isOverBudget && styles.overBudget]}>
          ₪{balance}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  incomeLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.darkGray,
  },
  incomeAmount: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.success,
  },
  barContainer: {
    flexDirection: 'row',
    height: 20,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    marginBottom: spacing.md,
  },
  barSegment: {
    height: '100%',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryLabel: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.darkGray,
  },
  categoryAmount: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    color: colors.darkGray,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  balanceLabel: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.darkGray,
  },
  balanceAmount: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  overBudget: {
    color: colors.danger,
  },
});
