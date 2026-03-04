import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LevelNavBar } from '../../components/LevelNavBar';
import { colors, fonts, spacing, borderRadius } from '../../theme';

interface Level4Props {
  onHome: () => void;
  onRestart: () => void;
}

export const Level4Screen: React.FC<Level4Props> = ({ onHome, onRestart }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <LevelNavBar onHome={onHome} onRestart={onRestart} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🏦</Text>
        <Text style={styles.title}>{t('levels.level4.title')}</Text>
        <Text style={styles.subtitle}>{t('levels.level4.subtitle')}</Text>
        <Text style={styles.description}>{t('levels.level4.description')}</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🚧</Text>
          <Text style={styles.placeholderText}>Coming in Phase 3!</Text>
          <Text style={styles.placeholderSub}>
            Full monthly budget simulation, bank account management, and a complete investing education module.
          </Text>
        </View>

        <View style={styles.features}>
          <Text style={styles.featureTitle}>What you'll learn:</Text>
          <Text style={styles.feature}>• Managing a real bank account</Text>
          <Text style={styles.feature}>• Checking vs. savings vs. investment accounts</Text>
          <Text style={styles.feature}>• Passive vs. active investing</Text>
          <Text style={styles.feature}>• Index funds, ETFs, and diversification</Text>
          <Text style={styles.feature}>• Stocks vs. bonds</Text>
          <Text style={styles.feature}>• Surviving a market crash</Text>
          <Text style={styles.feature}>• Emergency funds</Text>
          <Text style={styles.feature}>• Planning for gap year / army prep</Text>
        </View>

        <View style={styles.creditBox}>
          <Text style={styles.creditText}>
            Investing curriculum inspired by Nadav Ellinson at Blue & White Finance
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
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
    marginBottom: spacing.lg,
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
  creditBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
  },
  creditText: {
    fontSize: fonts.sizes.sm,
    color: colors.white,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
