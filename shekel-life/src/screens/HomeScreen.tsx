import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore, LevelId } from '../store';
import { LanguageToggle } from '../components/LanguageToggle';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface HomeScreenProps {
  onSelectLevel: (level: LevelId) => void;
  onViewBadges: () => void;
}

const levelConfig: Record<LevelId, { emoji: string; age: string; gradient: [string, string]; icon: string }> = {
  1: { emoji: '🛒', age: '6-8', gradient: ['#E8F5E9', '#C8E6C9'], icon: '🧹' },
  2: { emoji: '📚', age: '9-11', gradient: ['#E3F2FD', '#BBDEFB'], icon: '😊' },
  3: { emoji: '📱', age: '12-14', gradient: ['#FFF3E0', '#FFE0B2'], icon: '📅' },
  4: { emoji: '🏦', age: '15-17', gradient: ['#F3E5F5', '#E1BEE7'], icon: '📈' },
};

const { width: screenWidth } = Dimensions.get('window');

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectLevel, onViewBadges }) => {
  const { t } = useTranslation();
  const { levels, badges, resetGame } = useGameStore();
  const earnedBadges = badges.filter((b) => b.earned).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft} />
          <LanguageToggle />
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.coinStack}>
            <Text style={styles.coinLarge}>🪙</Text>
            <Text style={styles.coinMedium}>🪙</Text>
            <Text style={styles.coinSmall}>🪙</Text>
          </View>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <View style={styles.taglineBox}>
            <Text style={styles.tagline}>{t('common.tagline')}</Text>
          </View>
        </View>

        {/* Level Cards */}
        <Text style={styles.sectionTitle}>{t('home.selectLevel')}</Text>

        {([1, 2, 3, 4] as LevelId[]).map((levelId) => {
          const level = levels[levelId];
          const config = levelConfig[levelId];
          const isCompleted = level.status === 'completed';
          const isInProgress = level.status === 'in_progress';

          return (
            <TouchableOpacity
              key={levelId}
              style={[styles.levelCard, { backgroundColor: config.gradient[0] }]}
              onPress={() => onSelectLevel(levelId)}
              activeOpacity={0.8}
            >
              <View style={[styles.levelAccent, { backgroundColor: config.gradient[1] }]} />
              <View style={styles.levelContent}>
                <View style={styles.levelLeft}>
                  <Text style={styles.levelEmoji}>{config.emoji}</Text>
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageText}>{config.age}</Text>
                  </View>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>
                    {t(`levels.level${levelId}.title`)}
                  </Text>
                  <Text style={styles.levelSubtitle}>
                    {t(`levels.level${levelId}.subtitle`)}
                  </Text>
                </View>
                <View style={styles.levelRight}>
                  {isCompleted ? (
                    <View style={styles.completedCheck}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  ) : isInProgress ? (
                    <View style={styles.inProgressDot}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                  ) : (
                    <View style={styles.playButton}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Badges Row */}
        <TouchableOpacity style={styles.badgesCard} onPress={onViewBadges} activeOpacity={0.8}>
          <View style={styles.badgesLeft}>
            <Text style={styles.trophyEmoji}>🏆</Text>
            <View>
              <Text style={styles.badgesTitle}>Badges</Text>
              <Text style={styles.badgesCount}>
                {earnedBadges} / {badges.length} earned
              </Text>
            </View>
          </View>
          <View style={styles.badgesPreview}>
            {badges.slice(0, 5).map((b, i) => (
              <Text key={i} style={[styles.badgeMini, !b.earned && styles.badgeUnearned]}>
                {b.emoji}
              </Text>
            ))}
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.brandRow}>
            <View style={styles.brandPill}>
              <Text style={styles.brandText}>PSA</Text>
            </View>
            <Text style={styles.brandX}>×</Text>
            <View style={styles.brandPill}>
              <Text style={styles.brandText}>B&W Finance</Text>
            </View>
          </View>
          <Text style={styles.footerTagline}>Teaching kids to be money-smart 🇮🇱</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  topBarLeft: { width: 60 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  coinStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coinLarge: { fontSize: 56 },
  coinMedium: { fontSize: 40, marginLeft: -12, marginTop: 8 },
  coinSmall: { fontSize: 28, marginLeft: -8, marginTop: 16 },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F4D03F',
    letterSpacing: 1,
    textShadowColor: 'rgba(244, 208, 63, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: spacing.sm,
  },
  taglineBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  tagline: {
    fontSize: fonts.sizes.md,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },

  // Section title
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },

  // Level cards
  levelCard: {
    borderRadius: 20,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  levelAccent: {
    height: 4,
    width: '100%',
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  levelLeft: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  levelEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  ageBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ageText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.darkGray,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800',
    color: colors.darkGray,
    marginBottom: 2,
  },
  levelSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
    lineHeight: 18,
  },
  levelRight: {
    marginLeft: spacing.sm,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inProgressDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 2,
  },
  checkText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },

  // Badges
  badgesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(244, 208, 63, 0.2)',
  },
  badgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trophyEmoji: { fontSize: 32 },
  badgesTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: '#F4D03F',
  },
  badgesCount: {
    fontSize: fonts.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  badgesPreview: {
    flexDirection: 'row',
    gap: 4,
  },
  badgeMini: { fontSize: 20 },
  badgeUnearned: { opacity: 0.25 },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  brandText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  brandX: {
    fontSize: fonts.sizes.sm,
    color: 'rgba(255,255,255,0.2)',
  },
  footerTagline: {
    fontSize: fonts.sizes.xs,
    color: 'rgba(255,255,255,0.3)',
    marginTop: spacing.xs,
  },
});
