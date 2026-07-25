/**
 * 024 Global Connect — design system tokens.
 *
 * Semantic color roles (per brand spec):
 *  - primary        teal — CTAs, active states, highlights, links, icons
 *  - surface        pure white — cards, input fields, content surfaces
 *  - headerBg       navy blue — headers / dark surfaces (same in both modes)
 *  - background     off-white (light) / deep navy (dark) — page background
 *  - textMuted      muted blue — labels, subtitles, placeholder text
 *  - infoTint       teal tint — info boxes, callout cards, highlights
 *  - gold           premium badges, warnings, "needs attention"
 *  - success        green — confirmed orders/payments, positive values
 *  - danger         red — errors, failed transactions, negative values
 *
 * Every screen reads these tokens through `useTheme()` — no raw hex in screens.
 * Tweak a value here and it propagates app-wide.
 */

export type ThemeColors = {
  // brand
  primary: string;
  primaryPressed: string;
  onPrimary: string;

  // surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;

  // navy header (constant across modes)
  headerBg: string;
  onHeader: string;
  onHeaderMuted: string;

  // text
  text: string;
  textMuted: string;
  placeholder: string;

  // accents / status
  info: string;
  infoTint: string;
  gold: string;
  goldTint: string;
  success: string;
  successTint: string;
  danger: string;
  dangerTint: string;

  // effects
  shadow: string;
  overlay: string;
};

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  spacing: (n: number) => number;
};

const NAVY = '#0B2545';
const TEAL = '#14B8A6';
const TEAL_PRESSED = '#0D9488';
const MUTED_BLUE = '#8AA0C0';
const GOLD = '#F2B705';

const lightColors: ThemeColors = {
  primary: TEAL,
  primaryPressed: TEAL_PRESSED,
  onPrimary: '#FFFFFF',

  background: '#F5F7FA', // off-white page background
  surface: '#FFFFFF', // pure white cards / inputs
  surfaceAlt: '#EDF1F6', // secondary card surface
  border: '#E3E9F0',

  headerBg: NAVY,
  onHeader: '#FFFFFF',
  onHeaderMuted: MUTED_BLUE,

  text: NAVY, // primary text = navy on light
  textMuted: '#5B6B82', // muted blue (darker for contrast on light)
  placeholder: '#9AA8BC',

  info: TEAL_PRESSED,
  infoTint: '#E0F7F4', // teal tint callouts
  gold: GOLD,
  goldTint: '#FCEFCB',
  success: '#16A34A',
  successTint: '#E4F5EA',
  danger: '#DC2626',
  dangerTint: '#FBE9E9',

  shadow: 'rgba(11,37,69,0.10)',
  overlay: 'rgba(11,37,69,0.45)',
};

const darkColors: ThemeColors = {
  primary: TEAL,
  primaryPressed: '#0F9E8F',
  onPrimary: '#04231E',

  background: '#071A30', // deep navy page background
  surface: '#0F2A4A', // navy card surface
  surfaceAlt: '#143257',
  border: '#1E3A5F',

  headerBg: NAVY,
  onHeader: '#FFFFFF',
  onHeaderMuted: MUTED_BLUE,

  text: '#F2F7FC',
  textMuted: MUTED_BLUE, // muted blue labels/subtitles
  placeholder: '#5F7491',

  info: '#5EEAD4',
  infoTint: 'rgba(20,184,166,0.16)',
  gold: GOLD,
  goldTint: 'rgba(242,183,5,0.18)',
  success: '#22C55E',
  successTint: 'rgba(34,197,94,0.16)',
  danger: '#F87171',
  dangerTint: 'rgba(248,113,113,0.16)',

  shadow: 'rgba(0,0,0,0.45)',
  overlay: 'rgba(2,10,22,0.60)',
};

const shared = {
  radius: { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 },
  spacing: (n: number) => n * 4,
};

export const lightTheme: Theme = { scheme: 'light', colors: lightColors, ...shared };
export const darkTheme: Theme = { scheme: 'dark', colors: darkColors, ...shared };
