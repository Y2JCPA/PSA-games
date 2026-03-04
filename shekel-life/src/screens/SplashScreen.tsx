import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, fonts, spacing } from '../theme';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeTitle] = useState(new Animated.Value(0));
  const [fadeTagline] = useState(new Animated.Value(0));
  const [fadeBranding] = useState(new Animated.Value(0));
  const [scaleCoins] = useState(new Animated.Value(0.3));
  const [coinBounce] = useState(new Animated.Value(-30));

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      // Coins bounce in
      Animated.parallel([
        Animated.spring(scaleCoins, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(coinBounce, {
          toValue: 0,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      // Title fades in
      Animated.timing(fadeTitle, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Tagline fades in
      Animated.timing(fadeTagline, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Branding fades in
      Animated.timing(fadeBranding, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Decorative background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Animated coins */}
      <Animated.View style={[
        styles.coinContainer,
        {
          transform: [
            { scale: scaleCoins },
            { translateY: coinBounce },
          ],
        },
      ]}>
        <Text style={styles.coin1}>🪙</Text>
        <Text style={styles.coin2}>🪙</Text>
        <Text style={styles.coin3}>🪙</Text>
        <Text style={styles.coin4}>💰</Text>
        <Text style={styles.coin5}>🪙</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: fadeTitle }}>
        <Text style={styles.title}>Shekel Life</Text>
        <View style={styles.titleUnderline} />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: fadeTagline }]}>
        <Text style={styles.tagline}>Learn money. Live smart.</Text>
      </Animated.View>

      {/* Branding */}
      <Animated.View style={[styles.brandingContainer, { opacity: fadeBranding }]}>
        <View style={styles.brandDivider} />
        <Text style={styles.presentedBy}>A financial literacy game by</Text>
        <View style={styles.brandRow}>
          <View style={styles.brandPill}>
            <Text style={styles.brandName}>PSA</Text>
          </View>
          <Text style={styles.brandX}>×</Text>
          <View style={styles.brandPill}>
            <Text style={styles.brandName}>B&W Finance</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom accent */}
      <View style={styles.bottomBar}>
        <Text style={styles.madeWith}>🇮🇱 Made in Israel</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },

  // Background decoration
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(244, 208, 63, 0.03)',
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244, 208, 63, 0.05)',
    bottom: -60,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(41, 128, 185, 0.05)',
    top: '40%',
    left: -40,
  },

  // Coins
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    height: 80,
  },
  coin1: { fontSize: 32, transform: [{ rotate: '-15deg' }], marginRight: -6 },
  coin2: { fontSize: 28, transform: [{ rotate: '10deg' }], marginTop: -20, marginRight: -4 },
  coin3: { fontSize: 24, transform: [{ rotate: '-5deg' }], marginRight: -2 },
  coin4: { fontSize: 64 },
  coin5: { fontSize: 28, transform: [{ rotate: '12deg' }], marginLeft: -4, marginTop: -18 },

  // Title
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F4D03F',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(244, 208, 63, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  titleUnderline: {
    height: 3,
    width: 120,
    backgroundColor: '#F4D03F',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    opacity: 0.5,
  },

  // Tagline
  taglineContainer: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  tagline: {
    fontSize: fonts.sizes.lg,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    letterSpacing: 1,
  },

  // Branding
  brandingContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  brandDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: spacing.md,
  },
  presentedBy: {
    fontSize: fonts.sizes.sm,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandName: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  brandX: {
    fontSize: fonts.sizes.md,
    color: 'rgba(255,255,255,0.2)',
  },

  // Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 40,
  },
  madeWith: {
    fontSize: fonts.sizes.xs,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
});
