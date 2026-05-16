import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const ErrorPopup = ({ visible, title = 'Something went wrong', message, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.popupContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.errorIconBox}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorTitle}>{title}</Text>
          <Text style={styles.errorMessage}>{message}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING_XL,
  },
  popupContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_XL,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    ...SHADOWS.LARGE,
  },
  errorIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_BASE,
  },
  errorIconText: {
    fontSize: SIZES.FONT_2XL,
    fontWeight: FONTS.EXTRABOLD,
    color: COLORS.ERROR,
  },
  errorTitle: {
    fontSize: SIZES.FONT_XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SM,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.MARGIN_LG,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: COLORS.PRIMARY,
    height: SIZES.BUTTON_HEIGHT,
    borderRadius: SIZES.RADIUS_LG,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SMALL,
  },
  closeButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
});

export default ErrorPopup;
