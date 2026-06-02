export const theme = {
  colors: {
    // Base
    background: '#020C17', // Very dark blue
    backgroundAlt: '#051121',
    midnight: '#001B3D',
    midnightSoft: '#0D2342',

    // Surfaces (Glassmorphism)
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceStrong: 'rgba(255, 255, 255, 0.10)',
    surfaceMuted: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    glassBorderMuted: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.15)', // fallback for existing usage

    // Text
    text: '#F4F4F5', // mapping textPrimary to text for backwards compatibility
    textPrimary: '#F4F4F5',
    textSecondary: '#C4C6CF',
    textMuted: '#8E9099',
    textDisabled: 'rgba(244, 244, 245, 0.35)',

    // Gold Accents
    primary: '#D4AF37', // mapping gold to primary
    gold: '#D4AF37',
    goldDark: '#B8860B',
    goldLight: '#F9E27E',
    goldMuted: '#E9C349',

    // Functional
    success: '#10B981', // desaturated emerald
    successBg: 'rgba(16, 185, 129, 0.1)',
    danger: '#E11D48', // muted crimson
    dangerBg: 'rgba(225, 29, 72, 0.1)',
    warning: '#D97706', // muted amber
    warningBg: 'rgba(217, 119, 6, 0.1)',
    info: '#2563EB', // muted blue
    infoBg: 'rgba(37, 99, 235, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20, // requested 20 for card padding / horizontal padding
    xxl: 28, // section gap
    xxxl: 36, // section gap
  },
  radii: {
    sm: 8,
    md: 14, // Inputs
    lg: 18, // Buttons
    xl: 22, // Glass cards (requested 20-24)
    xxl: 30, // Bottom tab bar
    round: 9999,
  },
  typography: {
    hero: {
      fontSize: 40,
      fontFamily: 'HankenGrotesk_700Bold',
      color: '#F4F4F5',
    },
    h1: {
      fontSize: 28,
      fontFamily: 'HankenGrotesk_700Bold',
      color: '#F4F4F5',
    },
    h2: {
      fontSize: 22,
      fontFamily: 'HankenGrotesk_600SemiBold',
      color: '#F4F4F5',
    },
    h3: {
      fontSize: 18,
      fontFamily: 'HankenGrotesk_600SemiBold',
      color: '#F4F4F5',
    },
    body1: {
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: '#F4F4F5',
    },
    body2: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: '#C4C6CF',
    },
    caption: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: '#8E9099',
    },
    labelCaps: {
      fontSize: 11,
      fontFamily: 'JetBrainsMono_700Bold',
      color: '#8E9099',
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    metadata: {
      fontSize: 12,
      fontFamily: 'JetBrainsMono_400Regular',
      color: '#C4C6CF',
    },
  },
  shadows: {
    // Almost no shadow for glass cards, per requirements
    subtle: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    medium: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }
};
