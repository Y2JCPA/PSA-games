import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore, LevelId } from '../store';
import { LanguageToggle } from '../components/LanguageToggle';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface HomeScreenProps {
  onSelectLevel: (level: LevelId) => void;
  onViewBadges: () => void;
}

const levelEmojis: Record<LevelId, string> = {
  1: '🛒',
  2: '📚',
  3: '💼',
  4: '🏦',
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectLevel, onViewBadges }) => {
  const { t } = useTranslation();
  const { levels, badges } = useGameStore();
  const earnedBadges = badges.filter((b) => b.earned).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <LanguageToggle />
        </View>

        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>💰</Text>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.tagline}>{t('common.tagline')}</Text>
        </View>

        {/* Level Cards */}
        <Text style={styles.sectionTitle}>{t('home.selectLevel')}</Text>

        {([1, 2, 3, 4] as LevelId[]).map((levelId) => {
          const level = levels[levelId];
          const isCompleted = level.status === 'completed';
          const isInProgress = level.status === 'in_progress';

          return (
            <TouchableOpacity
              key={levelId}
              style={styles.levelCard}
              onPress={() => onSelectLevel(levelId)}
            >
              <Text style={styles.levelEmoji}>{levelEmojis[levelId]}</Text>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>
                  {t(`levels.level${levelId}.title`)}
                </Text>
                <Text style={styles.levelSubtitle}>
                  {t(`levels.level${levelId}.subtitle`)}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                isCompleted && styles.completedBadge,
                isInProgress && styles.inProgressBadge,
              ]}>
                <Text style={styles.statusText}>
                  {isCompleted
                    ? t('home.completed')
                    : isInProgress
                    ? t('home.inProgress')
                    : t('home.play')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Badges Summary */}
        <TouchableOpacity style={styles.badgesRow} onPress={onViewBadges}>
          <Text style={styles.badgesEmoji}>🏆</Text>
          <Text style={styles.badgesText}>
            {earnedBadges} / {badges.length} Badges Earned
          </Text>
          <Text style={styles.badgesArrow}>→</Text>
        </TouchableOpacity>

        {/* Footer Branding */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('branding.cobranded')}</Text>
          <View style={styles.logoRow}>
            <Text style={styles.brandLogo}>PSA</Text>
            <Text style={styles.brandDivider}>|</Text>
            <Text style={styles.brandLogo}>B&W Finance</Text>
          </View>
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    width: 60,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: fonts.sizes.title,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: spacing.md,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedCard: {
    opacity: 0.5,
  },
  levelEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.darkGray,
  },
  levelSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
  },
  lockedText: {
    color: colors.gray,
  },
  statusBadge: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  completedBadge: {
    backgroundColor: colors.success,
  },
  inProgressBadge: {
    backgroundColor: colors.primaryLight,
  },
  statusText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.white,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  badgesEmoji: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  badgesText: {
    flex: 1,
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.darkGray,
  },
  badgesArrow: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  footerText: {
    fontSize: fonts.sizes.xs,
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    color: colors.primary,
  },
  brandDivider: {
    fontSize: fonts.sizes.sm,
    color: colors.lightGray,
    marginHorizontal: spacing.sm,
  },
});
