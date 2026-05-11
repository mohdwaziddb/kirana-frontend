import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error = '',
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style = {},
  inputStyle = {},
  labelStyle = {},
  ...props
}) => {
  const getInputStyle = () => ({
    height: multiline ? numberOfLines * 24 : SIZES.INPUT_HEIGHT,
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderWidth: 1,
    borderColor: error ? COLORS.ERROR : COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    paddingHorizontal: SIZES.PADDING_BASE,
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_PRIMARY,
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, getInputStyle(), inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.GRAY_400}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...props}
      />
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.MARGIN_LG,
  },
  label: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SM,
  },
  input: {
    // Base styles are applied dynamically
  },
  errorText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.ERROR,
    marginTop: SIZES.MARGIN_XS,
  },
});

export default Input;
