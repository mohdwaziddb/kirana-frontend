import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const QuickActionCard = ({
  emoji,
  title,
  subtitle,
  color = COLORS.PRIMARY,
  onPress,
  style = {},
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_BASE,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: SIZES.RADIUS_BASE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_SM,
  },
  emoji: {
    fontSize: SIZES.FONT_2XL,
  },
  title: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_XS,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default QuickActionCard;
