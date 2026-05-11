import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const LoadingSpinner = ({
  size = 'small',
  color = COLORS.PRIMARY,
  text = '',
  overlay = false,
}) => {
  const content = (
    <View style={styles.container}>
      <ActivityIndicator 
        size={size} 
        color={color} 
        style={styles.spinner} 
      />
      {text && (
        <Text style={[styles.loadingText, { color }]}>
          {text}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View style={styles.overlay}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING_LG,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinner: {
    marginBottom: SIZES.MARGIN_BASE,
  },
  loadingText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
