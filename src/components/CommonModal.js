import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

const CommonModal = ({
  visible,
  type = 'info', // 'info', 'success', 'error', 'confirm'
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false,
  image = null, // Optional image URL or local require
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: '✅', color: COLORS.SUCCESS };
      case 'error':
        return { icon: '❌', color: COLORS.ERROR };
      case 'confirm':
        return { icon: '❓', color: COLORS.WARNING };
      default:
        return { icon: 'ℹ️', color: COLORS.PRIMARY };
    }
  };

  const { icon, color } = getIconAndColor();

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onCancel || onConfirm}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.popupContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          {image && (
            <View style={styles.imageContainer}>
              {typeof image === 'string' && image.length <= 2 ? (
                <Text style={styles.emojiImage}>{image}</Text>
              ) : (
                <Image source={typeof image === 'string' ? { uri: image } : image} style={styles.image} />
              )}
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: COLORS.ERROR },
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_XL,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.MEDIUM,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_BASE,
  },
  icon: {
    fontSize: 36,
  },
  imageContainer: {
    marginBottom: SIZES.MARGIN_BASE,
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: SIZES.RADIUS_LG,
    resizeMode: 'cover',
  },
  emojiImage: {
    fontSize: 80,
    textAlign: 'center',
  },
  title: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SM,
    textAlign: 'center',
  },
  message: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.PADDING_LG,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SIZES.MARGIN_BASE,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: SIZES.RADIUS_LG,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_100,
  },
  confirmButton: {
    flex: 2,
  },
  cancelButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
  },
  confirmButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
});

export default CommonModal;