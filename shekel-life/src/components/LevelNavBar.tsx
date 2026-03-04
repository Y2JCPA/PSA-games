import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface LevelNavBarProps {
  onHome: () => void;
  onRestart: () => void;
}

export const LevelNavBar: React.FC<LevelNavBarProps> = ({ onHome, onRestart }) => {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState<'home' | 'restart' | null>(null);

  const handleConfirm = () => {
    if (showConfirm === 'home') onHome();
    if (showConfirm === 'restart') onRestart();
    setShowConfirm(null);
  };

  return (
    <>
      <View style={styles.bar}>
        <TouchableOpacity style={styles.btn} onPress={() => setShowConfirm('home')}>
          <Text style={styles.btnIcon}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setShowConfirm('restart')}>
          <Text style={styles.btnIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showConfirm !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogEmoji}>
              {showConfirm === 'home' ? '🏠' : '🔄'}
            </Text>
            <Text style={styles.dialogTitle}>
              {showConfirm === 'home' ? 'Go Home?' : 'Start Over?'}
            </Text>
            <Text style={styles.dialogText}>
              {showConfirm === 'home'
                ? 'Your progress in this level will be lost.'
                : 'This will restart the level from the beginning.'}
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirm(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmText}>
                  {showConfirm === 'home' ? 'Go Home' : 'Restart'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 100,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  btnIcon: {
    fontSize: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  dialogEmoji: { fontSize: 48, marginBottom: spacing.md },
  dialogTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  dialogText: {
    fontSize: fonts.sizes.md,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.gray,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.white,
  },
});
