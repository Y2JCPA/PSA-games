import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, BadgeId } from '../store/types';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface BadgeCardProps {
  badge: Badge;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, badge.earned && styles.earned]}>
      <Text style={styles.emoji}>{badge.earned ? badge.emoji : '🔒'}</Text>
      <Text style={[styles.name, !badge.earned && styles.locked]}>
        {t(`badges.${badge.id}.name`)}
      </Text>
      <Text style={[styles.description, !badge.earned && styles.locked]}>
        {t(`badges.${badge.id}.description`)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    width: 140,
    marginRight: spacing.sm,
    opacity: 0.5,
  },
  earned: {
    backgroundColor: colors.secondaryLight,
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  emoji: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fonts.sizes.xs,
    color: colors.gray,
    textAlign: 'center',
  },
  locked: {
    color: colors.gray,
  },
});
