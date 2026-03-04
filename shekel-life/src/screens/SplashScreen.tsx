import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💰</Text>
      <Text style={styles.title}>Shekel Life</Text>
      <Text style={styles.tagline}>Learn money. Live smart.</Text>

      <View style={styles.brandingContainer}>
        <Text style={styles.presentedBy}>A game by</Text>
        <View style={styles.logoRow}>
          <Text style={styles.brand}>Philip Stein & Associates</Text>
        </View>
        <Text style={styles.ampersand}>&</Text>
        <Text style={styles.brand}>Blue & White Finance</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fonts.sizes.lg,
    color: colors.secondaryLight,
    fontStyle: 'italic',
    marginBottom: spacing.xxl,
  },
  brandingContainer: {
    alignItems: 'center',
  },
  presentedBy: {
    fontSize: fonts.sizes.sm,
    color: colors.white,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  logoRow: {
    alignItems: 'center',
  },
  brand: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.white,
  },
  ampersand: {
    fontSize: fonts.sizes.md,
    color: colors.secondaryLight,
    marginVertical: spacing.xs,
  },
});
