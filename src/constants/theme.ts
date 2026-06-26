/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#09090B',
    background: '#FAFAFA',
    backgroundElement: '#F4F4F5',
    backgroundSelected: '#E4E4E7',
    textSecondary: '#71717A',
    accent: '#D4FF13',
    accentSecondary: '#10B981',
    warning: '#EF4444',
    border: '#E4E4E7',
  },
  dark: {
    text: '#FFFFFF',
    background: '#09090B', // Deep Carbon Black
    backgroundElement: '#18181B', // Dark Card
    backgroundSelected: '#27272A', // Selected Item
    textSecondary: '#A1A1AA', // Muted Grey
    accent: '#D4FF13', // Neon Lime Flagship
    accentSecondary: '#10B981', // Emerald Success
    warning: '#EF4444', // Red Danger
    border: '#27272A',
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
