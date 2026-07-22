import '@/global.css';
import { Platform } from 'react-native';

export const TeekehColors = {
  gold: '#C8A348',
  goldLight: '#E5C365',
  goldDark: '#A6822D',
  goldAlpha: 'rgba(200, 163, 72, 0.15)',
  darkbg: '#09090B',
  charcoal: '#121214',
  charcoalLight: '#1E1E22',
  border: '#24242A',
  borderLight: '#27272A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  success: '#16A34A',
  successLight: '#34d399',
  warning: '#F59E0B',
  error: '#DC2626',
  errorLight: '#f87171',
} as const;

export const Colors = {
  light: {
    text: '#111827',
    background: '#F8F9FA',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#6B7280',
    primary: TeekehColors.gold,
  },
  dark: {
    text: TeekehColors.textPrimary,
    background: TeekehColors.darkbg,
    backgroundElement: TeekehColors.charcoal,
    backgroundSelected: TeekehColors.charcoalLight,
    textSecondary: TeekehColors.textSecondary,
    primary: TeekehColors.gold,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  mono: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
};

export const Spacing = {
  half: 2,
  xs: 4,
  two: 8,
  three: 12,
  sm: 8,
  four: 16,
  five: 20,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const TouchTargetMin = 44;
export const MaxContentWidth = 800;
