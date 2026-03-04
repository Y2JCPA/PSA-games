import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BasketItem } from '../store/types';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface ShoppingCartProps {
  items: BasketItem[];
  total: number;
  budget: number;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  total,
  budget,
  onRemoveItem,
  onCheckout,
}) => {
  const { t } = useTranslation();
  const remaining = budget - total;
  const isOverBudget = remaining < 0;

  const renderItem = ({ item }: { item: BasketItem }) => (
    <View style={styles.cartItem}>
      <Text style={styles.itemEmoji}>{item.item.emoji}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{t(`items.${item.item.nameKey}`)}</Text>
        <Text style={styles.itemPrice}>₪{item.item.price} x {item.quantity}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemoveItem(item.item.id)}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('shopping.basket')}</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>{t('shopping.emptyBasket')}</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.item.id}
          style={styles.list}
        />
      )}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('common.total')}</Text>
          <Text style={styles.summaryValue}>₪{total}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('shopping.budgetRemaining')}</Text>
          <Text style={[styles.summaryValue, isOverBudget && styles.overBudget]}>
            ₪{remaining}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.checkoutButton, (items.length === 0 || isOverBudget) && styles.disabledButton]}
        onPress={onCheckout}
        disabled={items.length === 0 || isOverBudget}
      >
        <Text style={styles.checkoutText}>{t('shopping.checkout')}</Text>
      </TouchableOpacity>
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
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  list: {
    maxHeight: 200,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  itemEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.darkGray,
  },
  itemPrice: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: fonts.sizes.sm,
  },
  summary: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.darkGray,
  },
  summaryValue: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.primary,
  },
  overBudget: {
    color: colors.danger,
  },
  checkoutButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  disabledButton: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  checkoutText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
});
