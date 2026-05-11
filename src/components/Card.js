import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const Card = ({
  children,
  title,
  subtitle,
  rightComponent,
  onPress,
  style = {},
  contentStyle = {},
  headerStyle = {},
  ...props
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      {(title || subtitle || rightComponent) && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            {title && (
              <Text style={styles.title}>{title}</Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
          {rightComponent && (
            <View style={styles.headerRight}>
              {rightComponent}
            </View>
          )}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_LG,
    marginBottom: SIZES.MARGIN_BASE,
    ...SHADOWS.SMALL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.MARGIN_BASE,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: SIZES.MARGIN_BASE,
  },
  title: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_XS,
  },
  subtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
  },
  content: {
    // Content styles are applied dynamically
  },
});

export default Card;
