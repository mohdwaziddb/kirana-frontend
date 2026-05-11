import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const FeatureCard = ({ 
  emoji, 
  title, 
  description, 
  count, 
  color = COLORS.PRIMARY,
  style = {} 
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={[styles.emoji, { color }]}>{emoji}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {count !== undefined && (
          <View style={[styles.countBadge, { backgroundColor: color }]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_BASE,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_BASE,
    ...SHADOWS.SMALL,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: SIZES.RADIUS_BASE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.MARGIN_BASE,
  },
  emoji: {
    fontSize: SIZES.FONT_2XL,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_XS,
  },
  description: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SIZES.MARGIN_SM,
  },
  countBadge: {
    paddingHorizontal: SIZES.PADDING_SM,
    paddingVertical: SIZES.PADDING_XS,
    borderRadius: SIZES.RADIUS_FULL,
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.TEXT_WHITE,
  },
});

export default FeatureCard;
