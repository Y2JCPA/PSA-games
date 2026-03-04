import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store';
import { colors, fonts, spacing, borderRadius } from '../theme';

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useGameStore();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'he' : 'en';
    setLanguage(newLang);
    I18nManager.forceRTL(newLang === 'he');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggleLanguage}>
      <Text style={[styles.text, language === 'en' && styles.active]}>EN</Text>
      <View style={styles.divider} />
      <Text style={[styles.text, language === 'he' && styles.active]}>עב</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  text: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    color: colors.gray,
    paddingHorizontal: spacing.xs,
  },
  active: {
    color: colors.primary,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.lightGray,
  },
});
