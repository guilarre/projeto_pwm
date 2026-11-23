/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const BusTheme = {
  colors: {
    // Base & Superfícies (60%)
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',

    // Texto & Estrutura (30%)
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    textMuted: '#64748B',
    badgeNeutral: '#334155',

    // Cor da Marca / Ação (10% - Laranja queimado)
    brand: '#EA580C',
    brandSoft: '#FFF7ED',
    brandText: '#FFFFFF',

    // Semântica Funcional
    live: '#16A34A',
    liveSoft: '#F0FDF4',
    favorite: '#EAB308',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
} as const;