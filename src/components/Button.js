import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, danger
  size = 'medium', // small, medium, large
  loading = false,
  disabled = false,
  style = {},
  textStyle = {},
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: SIZES.RADIUS_BASE,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.SMALL,
    };

    const sizeStyle = {
      small: {
        height: SIZES.BUTTON_HEIGHT - 8,
        paddingHorizontal: SIZES.PADDING_BASE,
      },
      medium: {
        height: SIZES.BUTTON_HEIGHT,
        paddingHorizontal: SIZES.PADDING_LG,
      },
      large: {
        height: SIZES.BUTTON_HEIGHT_LG,
        paddingHorizontal: SIZES.PADDING_XL,
      },
    };

    const variantStyle = {
      primary: {
        backgroundColor: disabled ? COLORS.GRAY_300 : COLORS.PRIMARY,
      },
      secondary: {
        backgroundColor: disabled ? COLORS.GRAY_300 : COLORS.SECONDARY,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? COLORS.GRAY_300 : COLORS.PRIMARY,
      },
      danger: {
        backgroundColor: disabled ? COLORS.GRAY_300 : COLORS.ERROR,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyle[size],
      ...variantStyle[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyle = () => {
    const baseStyle = {
      fontWeight: FONTS.SEMIBOLD,
    };

    const sizeStyle = {
      small: {
        fontSize: SIZES.FONT_SM,
      },
      medium: {
        fontSize: SIZES.FONT_BASE,
      },
      large: {
        fontSize: SIZES.FONT_LG,
      },
    };

    const variantStyle = {
      primary: {
        color: COLORS.TEXT_WHITE,
      },
      secondary: {
        color: COLORS.TEXT_WHITE,
      },
      outline: {
        color: disabled ? COLORS.GRAY_300 : COLORS.PRIMARY,
      },
      danger: {
        color: COLORS.TEXT_WHITE,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyle[size],
      ...variantStyle[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? COLORS.PRIMARY : COLORS.TEXT_WHITE} 
        />
      ) : (
        <Text style={[styles.buttonText, getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Base styles are applied dynamically
  },
  buttonText: {
    // Base styles are applied dynamically
  },
});

export default Button;
