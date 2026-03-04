import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store';
import { colors, fonts, spacing, borderRadius } from '../../theme';

interface CharacterSelectProps {
  onSelect: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect }) => {
  const { t } = useTranslation();
  const { levels, setGender, startLevel } = useGameStore();
  const gender = levels[1].gender;

  const handleStart = () => {
    if (!gender) return;
    startLevel(1, 20); // Start with ₪20 from Savta & Saba
    onSelect();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('levels.level1.title')}</Text>
      <Text style={styles.subtitle}>{t('levels.level1.subtitle')}</Text>
      <Text style={styles.description}>{t('levels.level1.description')}</Text>

      <Text style={styles.chooseLabel}>{t('common.chooseCharacter')}</Text>

      <View style={styles.characters}>
        <TouchableOpacity
          style={[styles.characterCard, gender === 'boy' && styles.selected]}
          onPress={() => setGender(1, 'boy')}
        >
          <Text style={styles.avatar}>👦</Text>
          <Text style={styles.characterName}>{t('levels.level1.boyName')}</Text>
          <Text style={styles.genderLabel}>{t('common.boy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.characterCard, gender === 'girl' && styles.selected]}
          onPress={() => setGender(1, 'girl')}
        >
          <Text style={styles.avatar}>👧</Text>
          <Text style={styles.characterName}>{t('levels.level1.girlName')}</Text>
          <Text style={styles.genderLabel}>{t('common.girl')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.startButton, !gender && styles.disabledButton]}
        onPress={handleStart}
        disabled={!gender}
      >
        <Text style={styles.startText}>{t('common.startPlaying')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
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
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fonts.sizes.lg,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  chooseLabel: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: spacing.lg,
  },
  characters: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  characterCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: 140,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#e8f4fd',
  },
  avatar: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  characterName: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  genderLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.gray,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
  },
  disabledButton: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  startText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
});
