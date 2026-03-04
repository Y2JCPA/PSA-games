import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore, BasketItem, ShopItem } from '../../store';
import { level1Items, getGoalItems, getImmediateItems, getItemById } from '../../mechanics/shopItems';
import { isNoSpendDay, getDayName } from '../../mechanics/shabbatCalendar';
import { checkBadges } from '../../mechanics/badgeSystem';
import { ShoppingCart } from '../../components/ShoppingCart';
import { SavingGoalTracker } from '../../components/SavingGoalTracker';
import { ConsequenceModal } from '../../components/ConsequenceModal';
import { colors, fonts, spacing, borderRadius } from '../../theme';

interface MakoletShopProps {
  onSetGoal: () => void;
  onNextDay: () => void;
}

export const MakoletShop: React.FC<MakoletShopProps> = ({ onSetGoal, onNextDay }) => {
  const { t } = useTranslation();
  const {
    levels,
    language,
    badges,
    spend,
    addIncome,
    addToSavingGoal,
    incrementImpulseResist,
    advanceDay,
    earnBadge,
  } = useGameStore();

  const level = levels[1];
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [showConsequence, setShowConsequence] = useState(false);
  const [consequenceKey, setConsequenceKey] = useState('');
  const [showingTab, setShowingTab] = useState<'snacks' | 'toys'>('snacks');

  const basketTotal = basket.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const isShabbat = isNoSpendDay(level.currentDay, level.currentWeek);

  const addToBasket = useCallback((item: ShopItem) => {
    if (isShabbat) return;
    if (basketTotal + item.price > level.balance) return;

    setBasket((prev) => {
      const existing = prev.find((b) => b.item.id === item.id);
      if (existing) {
        return prev.map((b) =>
          b.item.id === item.id ? { ...b, quantity: b.quantity + 1 } : b
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, [isShabbat, basketTotal, level.balance]);

  const removeFromBasket = useCallback((itemId: string) => {
    setBasket((prev) => {
      const existing = prev.find((b) => b.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((b) =>
          b.item.id === itemId ? { ...b, quantity: b.quantity - 1 } : b
        );
      }
      return prev.filter((b) => b.item.id !== itemId);
    });
  }, []);

  const handleCheckout = useCallback(() => {
    const totalCost = basket.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
    const success = spend(1, totalCost);

    if (success) {
      // Track immediate vs lasting purchases
      const boughtImmediate = basket.some((b) => b.item.isImmediate);
      const boughtLasting = basket.some((b) => !b.item.isImmediate);

      // If player chose to save (bought lasting) over impulse (immediate available), track it
      if (boughtLasting && !boughtImmediate) {
        incrementImpulseResist(1);
      }

      // Add lasting items to inventory
      basket.forEach((b) => {
        if (!b.item.isImmediate) {
          useGameStore.getState().addToInventory(1, b.item.id);
        }
      });

      // Check for new badges
      const newBadges = checkBadges(useGameStore.getState().levels[1], badges);
      newBadges.forEach((badgeId) => earnBadge(badgeId));

      setBasket([]);
    }
  }, [basket, spend, incrementImpulseResist, badges, earnBadge]);

  const handleSaveToGoal = useCallback((amount: number) => {
    if (amount > level.balance) return;
    addToSavingGoal(1, amount);

    // Check badges after saving
    const newBadges = checkBadges(useGameStore.getState().levels[1], badges);
    newBadges.forEach((badgeId) => earnBadge(badgeId));
  }, [level.balance, addToSavingGoal, badges, earnBadge]);

  const handleNextDay = useCallback(() => {
    onNextDay();
  }, [onNextDay]);

  const snackItems = getImmediateItems();
  const toyItems = getGoalItems();
  const displayItems = showingTab === 'snacks' ? snackItems : toyItems;

  const goalItem = level.savingGoal ? getItemById(level.savingGoal.itemId) : undefined;

  // Check if player can't afford anything (cheapest item is ₪2)
  const cheapestPrice = Math.min(...level1Items.map(i => i.price));
  const cantAffordAnything = level.balance < cheapestPrice && level.balance > 0;

  const handleGiveTzedakah = useCallback(() => {
    const amount = level.balance;
    if (amount <= 0) return;
    // Use addMaaser to track tzedakah giving
    const { addMaaser, earnBadge } = useGameStore.getState();
    addMaaser(1, amount);
    // Check badges after giving
    const newBadges = checkBadges(useGameStore.getState().levels[1], useGameStore.getState().badges);
    newBadges.forEach((badgeId) => earnBadge(badgeId));
  }, [level.balance]);

  const handleSkipToNextWeek = useCallback(() => {
    // Advance to Sunday (day 1) of next week — chores will be available there
    const { advanceWeek } = useGameStore.getState();
    advanceWeek(1);
    onNextDay(); // Go back to chore board for new week
  }, [onNextDay]);

  const renderShelfItem = ({ item }: { item: ShopItem }) => {
    const canAfford = item.price <= level.balance - basketTotal;
    return (
      <TouchableOpacity
        style={[styles.shelfItem, !canAfford && styles.cantAfford, isShabbat && styles.closed]}
        onPress={() => addToBasket(item)}
        disabled={!canAfford || isShabbat}
      >
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <Text style={styles.itemName}>{t(`items.${item.nameKey}`)}</Text>
        <Text style={[styles.itemPrice, !canAfford && styles.priceRed]}>₪{item.price}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dayLabel}>
              {getDayName(level.currentDay, language)} — {t('common.week')} {level.currentWeek}
            </Text>
            {isShabbat && (
              <Text style={styles.shabbatLabel}>{t('shopping.shabbatClosed')}</Text>
            )}
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>{t('common.balance')}</Text>
            <Text style={styles.balanceAmount}>₪{level.balance}</Text>
          </View>
        </View>

        {/* Saving Goal */}
        {level.savingGoal ? (
          <View style={styles.section}>
            <SavingGoalTracker goal={level.savingGoal} goalItem={goalItem} />
            {!level.savingGoal.completed && level.balance >= 5 && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveToGoal(5)}
              >
                <Text style={styles.saveButtonText}>{t('common.save')} ₪5</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.setGoalButton} onPress={onSetGoal}>
            <Text style={styles.setGoalText}>{t('shopping.setSavingGoal')}</Text>
          </TouchableOpacity>
        )}

        {/* Low Balance Actions */}
        {cantAffordAnything && (
          <View style={styles.lowBalanceBox}>
            <Text style={styles.lowBalanceEmoji}>🤔</Text>
            <Text style={styles.lowBalanceText}>
              {t('shopping.cantAffordAnything', { balance: level.balance })}
            </Text>
            <View style={styles.lowBalanceActions}>
              <TouchableOpacity
                style={styles.tzedakahButton}
                onPress={handleGiveTzedakah}
              >
                <Text style={styles.tzedakahButtonText}>
                  🤝 {t('shopping.giveTzedakah', { amount: level.balance })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.holdMoneyButton}
                onPress={handleSkipToNextWeek}
              >
                <Text style={styles.holdMoneyText}>
                  💰 {t('shopping.holdAndWait')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Shop Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, showingTab === 'snacks' && styles.activeTab]}
            onPress={() => setShowingTab('snacks')}
          >
            <Text style={[styles.tabText, showingTab === 'snacks' && styles.activeTabText]}>
              🍬 {t('shopping.shelf')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showingTab === 'toys' && styles.activeTab]}
            onPress={() => setShowingTab('toys')}
          >
            <Text style={[styles.tabText, showingTab === 'toys' && styles.activeTabText]}>
              🎁 {t('shopping.goalShelf')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Shelf */}
        <View style={styles.shelf}>
          <FlatList
            data={displayItems}
            renderItem={renderShelfItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.shelfGrid}
          />
        </View>

        {/* Cart */}
        <View style={styles.section}>
          <ShoppingCart
            items={basket}
            total={basketTotal}
            budget={level.balance}
            onRemoveItem={removeFromBasket}
            onCheckout={handleCheckout}
          />
        </View>

        {/* Next Day Button */}
        <TouchableOpacity style={styles.nextDayButton} onPress={handleNextDay}>
          <Text style={styles.nextDayText}>{t('common.next')} →</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConsequenceModal
        visible={showConsequence}
        consequenceKey={consequenceKey}
        onDismiss={() => setShowConsequence(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  dayLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.darkGray,
  },
  shabbatLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.shabbat,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  balanceContainer: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.white,
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.white,
  },
  section: {
    marginBottom: spacing.md,
  },
  setGoalButton: {
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
  },
  setGoalText: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.darkGray,
  },
  saveButton: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fonts.sizes.md,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.lightGray,
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.gray,
  },
  activeTabText: {
    color: colors.primary,
  },
  shelf: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shelfGrid: {
    paddingVertical: spacing.xs,
  },
  shelfItem: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    margin: spacing.xs,
    alignItems: 'center',
    minWidth: 90,
    maxWidth: '33%',
  },
  cantAfford: {
    opacity: 0.4,
  },
  closed: {
    opacity: 0.3,
  },
  itemEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  itemName: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  priceRed: {
    color: colors.danger,
  },
  nextDayButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  nextDayText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  lowBalanceBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD54F',
  },
  lowBalanceEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  lowBalanceText: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  lowBalanceActions: {
    width: '100%',
    gap: spacing.sm,
  },
  tzedakahButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#66BB6A',
  },
  tzedakahButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: '#2E7D32',
  },
  holdMoneyButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#42A5F5',
  },
  holdMoneyText: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: '#1565C0',
  },
});
