import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface MaaserModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const MaaserModal: React.FC<MaaserModalProps> = ({ visible, onAccept, onDecline }) => {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>🤝</Text>
          <Text style={styles.title}>{t('maaser.title')}</Text>
          <Text style={styles.explanation}>{t('maaser.explanation')}</Text>

          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptText}>{t('maaser.yes')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineText}>{t('maaser.no')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  explanation: {
    fontSize: fonts.sizes.md,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  acceptButton: {
    backgroundColor: colors.maaser,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  acceptText: {
    color: colors.white,
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
  },
  declineButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  declineText: {
    color: colors.gray,
    fontSize: fonts.sizes.md,
  },
});
