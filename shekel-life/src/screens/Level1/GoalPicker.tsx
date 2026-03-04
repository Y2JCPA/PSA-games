import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore, ShopItem } from '../../store';
import { getGoalItems } from '../../mechanics/shopItems';
import { colors, fonts, spacing, borderRadius } from '../../theme';

interface GoalPickerProps {
  onGoalSet: () => void;
  onBack: () => void;
}

export const GoalPicker: React.FC<GoalPickerProps> = ({ onGoalSet, onBack }) => {
  const { t } = useTranslation();
  const { setSavingGoal } = useGameStore();
  const goalItems = getGoalItems();

  const handleSelectGoal = (item: ShopItem) => {
    setSavingGoal(1, {
      itemId: item.id,
      targetAmount: item.price,
      currentAmount: 0,
      completed: false,
    });
    onGoalSet();
  };

  const renderGoalItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity style={styles.goalCard} onPress={() => handleSelectGoal(item)}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.itemName}>{t(`items.${item.nameKey}`)}</Text>
      <Text style={styles.itemPrice}>₪{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('shopping.setSavingGoal')}</Text>
      <Text style={styles.subtitle}>
        Pick something special to save up for!
      </Text>

      <FlatList
        data={goalItems}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
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
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  grid: {
    paddingBottom: spacing.xxl,
  },
  goalCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondaryLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800',
    color: colors.secondary,
  },
});
