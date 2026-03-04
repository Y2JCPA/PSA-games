import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store';
import { BadgeCard } from '../components/BadgeCard';
import { colors, fonts, spacing } from '../theme';

interface BadgesScreenProps {
  onBack: () => void;
}

export const BadgesScreen: React.FC<BadgesScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { badges } = useGameStore();
  const earned = badges.filter((b) => b.earned).length;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Badges</Text>
      <Text style={styles.subtitle}>{earned} of {badges.length} earned</Text>

      <FlatList
        data={badges}
        renderItem={({ item }) => <BadgeCard badge={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
    padding: spacing.md,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: fonts.sizes.md,
    color: colors.primary,
    fontWeight: '600',
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
    marginBottom: spacing.lg,
  },
  list: {
    paddingVertical: spacing.sm,
  },
});
