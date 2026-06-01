export const theme = {
  colors: {
    background: '#0F172A', // Slate 900
    surface: '#1E293B',    // Slate 800
    surfaceHighlight: '#334155', // Slate 700
    primary: '#D4AF37',    // Warm muted gold
    primaryVariant: '#B5952F',
    text: '#F8FAFC',       // Slate 50
    textMuted: '#94A3B8',  // Slate 400
    success: '#10B981',    // Emerald 500
    successBg: '#064E3B',  // Emerald 900
    danger: '#EF4444',     // Red 500
    dangerBg: '#7F1D1D',   // Red 900
    warning: '#F59E0B',    // Amber 500
    warningBg: '#78350F',  // Amber 900
    info: '#3B82F6',       // Blue 500
    infoBg: '#1E3A8A',     // Blue 900
    border: '#334155',     // Slate 700
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: '#F8FAFC',
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: '#F8FAFC',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#F8FAFC',
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      color: '#F8FAFC',
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#94A3B8',
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: '#94A3B8',
    },
  },
  shadows: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  }
};
