// Aesthetic direction: a jewellery boutique back office with warm metal accents,
// velvet-dark night mode, and a polished ivory showroom light mode.

export const darkColors = {
  bg: '#14120F',
  bgElevated: '#1B1815',
  surface: '#211D18',
  surfaceAlt: '#2A251E',
  border: '#3A342A',
  borderLight: '#453E32',

  gold: '#C9A664',
  goldSoft: '#E3C888',
  goldDim: '#8A7343',

  ivory: '#F4EFE4',
  ivoryMuted: '#B7AE9C',
  ivoryFaint: '#7C7566',

  success: '#7FA37A',
  successBg: '#243024',
  warning: '#D4A054',
  warningBg: '#332A1B',
  danger: '#C07A6C',
  dangerBg: '#332120',
  info: '#8098AD',
  infoBg: '#1E2731',

  accentBg: '#2E2717',
  vipBg: '#332C1C',
  logoutBorder: '#4A2E28',
  overlay: 'rgba(0,0,0,0.18)',

  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors = {
  bg: '#F7F2EA',
  bgElevated: '#FFFDF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F0E7DA',
  border: '#E2D4BF',
  borderLight: '#D4BF9E',

  gold: '#A77925',
  goldSoft: '#C9983E',
  goldDim: '#D9BC7A',

  ivory: '#211B14',
  ivoryMuted: '#695D4D',
  ivoryFaint: '#958774',

  success: '#547B50',
  successBg: '#E6F0E1',
  warning: '#A86F24',
  warningBg: '#F8E9CF',
  danger: '#A8574A',
  dangerBg: '#F4DDDA',
  info: '#526F8D',
  infoBg: '#E0E9F2',

  accentBg: '#F4E7CD',
  vipBg: '#F6E8C5',
  logoutBorder: '#E2B8AE',
  overlay: 'rgba(167,121,37,0.08)',

  white: '#FFFFFF',
  black: '#000000',
};

export const colors = darkColors;
export const themes = {
  dark: darkColors,
  light: lightColors,
};
export const Colors = {
  dark: darkColors,
  light: lightColors,
};

export type AppColors = typeof darkColors;
export type ThemeName = keyof typeof themes;

export const fonts = {
  display: 'PlayfairDisplay_700Bold',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  body: 'Manrope_500Medium',
  bodyRegular: 'Manrope_400Regular',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtra: 'Manrope_800ExtraBold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const layout = {
  maxWidth: 1160,
};

export function makeShadow(color: AppColors) {
  return {
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: color === darkColors ? 0.35 : 0.1,
    shadowRadius: 16,
    elevation: 6,
  };
}

export const shadow = {
  card: makeShadow(darkColors),
};
