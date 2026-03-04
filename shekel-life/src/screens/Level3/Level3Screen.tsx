import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../../theme';

export const Level3Screen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>💼</Text>
      <Text style={styles.title}>{t('levels.level3.title')}</Text>
      <Text style={styles.subtitle}>{t('levels.level3.subtitle')}</Text>
      <Text style={styles.description}>{t('levels.level3.description')}</Text>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>🚧</Text>
        <Text style={styles.placeholderText}>Coming in Phase 3!</Text>
        <Text style={styles.placeholderSub}>
          Part-time job income, monthly budgeting, maaser tracking, yom tov planning, and real consequences for overspending.
        </Text>
      </View>

      <View style={styles.features}>
        <Text style={styles.featureTitle}>What you'll learn:</Text>
        <Text style={styles.feature}>• Managing your own income</Text>
        <Text style={styles.feature}>• Monthly budgeting with real expenses</Text>
        <Text style={styles.feature}>• Planning for weeks with no work</Text>
        <Text style={styles.feature}>• Setting and reaching bigger savings goals</Text>
        <Text style={styles.feature}>• Maaser as a budget category</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  placeholder: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
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
  },
  placeholderSub: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  features: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  featureTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  feature: {
    fontSize: fonts.sizes.sm,
    color: colors.darkGray,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
});
