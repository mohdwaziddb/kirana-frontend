export const COLORS = {
  // Primary Colors
  PRIMARY: '#315CFF',
  PRIMARY_DARK: '#1E3A8A',
  PRIMARY_LIGHT: '#6D8BFF',
  
  // Secondary Colors
  SECONDARY: '#0EA5A4',
  SECONDARY_DARK: '#0F766E',
  SECONDARY_LIGHT: '#5EEAD4',
  
  // Accent Colors
  ACCENT: '#F97316',
  ACCENT_DARK: '#EA580C',
  
  // Neutral Colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
  
  // Status Colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // Background Colors
  BACKGROUND: '#F4F7FB',
  CARD_BACKGROUND: '#FFFFFF',
  INPUT_BACKGROUND: '#FFFFFF',
  
  // Text Colors
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6B7280',
  TEXT_TERTIARY: '#9CA3AF',
  TEXT_WHITE: '#FFFFFF',
  
  // Border Colors
  BORDER: '#DDE5F0',
  BORDER_FOCUS: '#315CFF',
  BORDER_ERROR: '#EF4444',
};

export const SIZES = {
  // Font Sizes
  FONT_XS: 12,
  FONT_SM: 14,
  FONT_BASE: 16,
  FONT_LG: 18,
  FONT_XL: 20,
  FONT_2XL: 24,
  FONT_3XL: 30,
  FONT_4XL: 36,
  
  // Spacing
  PADDING_XS: 8,
  PADDING_SM: 12,
  PADDING_BASE: 16,
  PADDING_LG: 20,
  PADDING_XL: 24,
  PADDING_2XL: 32,
  
  MARGIN_XS: 4,
  MARGIN_SM: 8,
  MARGIN_BASE: 16,
  MARGIN_LG: 20,
  MARGIN_XL: 24,
  MARGIN_2XL: 32,
  
  // Border Radius
  RADIUS_SM: 6,
  RADIUS_BASE: 8,
  RADIUS_LG: 12,
  RADIUS_XL: 16,
  RADIUS_2XL: 24,
  RADIUS_FULL: 9999,
  
  // Heights
  INPUT_HEIGHT: 48,
  BUTTON_HEIGHT: 48,
  BUTTON_HEIGHT_LG: 56,
};

export const FONTS = {
  // Font Families
  PRIMARY: 'System',
  SECONDARY: 'System',
  
  // Font Weights
  LIGHT: '300',
  NORMAL: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
  EXTRABOLD: '800',
};

export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
};

export const THEME = {
  colors: COLORS,
  sizes: SIZES,
  fonts: FONTS,
  shadows: SHADOWS,
};
