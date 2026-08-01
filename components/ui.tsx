import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TextInputProps,
  StyleProp,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme-context';
import { Theme } from '../lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/* ── Screen: themed page background ── */
export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}>{children}</View>;
}

/* ── AppHeader: navy header bar with optional back button + theme toggle ── */
export function AppHeader({
  title,
  subtitle,
  showBack = true,
  right,
  showThemeToggle = false,
  showHome = false,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  showThemeToggle?: boolean;
  showHome?: boolean;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: theme.colors.headerBg,
        paddingTop: insets.top + 8,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {showBack && router.canGoBack() ? (
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.onHeader} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.onHeader, fontSize: 19, fontWeight: '800' }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: theme.colors.onHeaderMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showHome ? (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/products' as any)}
          hitSlop={10}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 36,
            borderRadius: 10,
            paddingHorizontal: 12,
            backgroundColor: 'rgba(255,255,255,0.10)',
          }}
        >
          <Ionicons name="storefront" size={18} color={theme.colors.onHeader} />
          <Text style={{ color: theme.colors.onHeader, fontWeight: '700', fontSize: 13 }}>Market</Text>
        </TouchableOpacity>
      ) : null}
      {showThemeToggle ? <ThemeToggle /> : null}
      {right}
    </View>
  );
}

/* ── ThemeToggle: light/dark switch ── */
export function ThemeToggle() {
  const { scheme, toggle, theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={toggle}
      hitSlop={10}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={scheme === 'dark' ? 'sunny' : 'moon'} size={19} color={theme.colors.onHeader} />
    </TouchableOpacity>
  );
}

/* ── Card ── */
export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
}) {
  const { theme } = useTheme();
  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: padded ? 16 : 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  };
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[cardStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
}

/* ── Button ── */
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  fullWidth = true,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  let bg = c.primary;
  let fg = c.onPrimary;
  let border = 'transparent';
  if (variant === 'outline') {
    bg = 'transparent';
    fg = c.primary;
    border = c.primary;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    fg = c.primary;
  } else if (variant === 'danger') {
    bg = c.danger;
    fg = '#fff';
  } else if (variant === 'success') {
    bg = c.success;
    fg = '#fff';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border === 'transparent' ? 0 : 1.5,
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: theme.radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ── Field: labelled themed text input ── */
export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string; style?: StyleProp<TextStyle> }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={c.placeholder}
        style={[
          {
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: 14,
            paddingVertical: 13,
            fontSize: 15,
            color: c.text,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

/* ── PasswordField: labelled password input with show/hide eye ── */
export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [show, setShow] = React.useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          style={{ flex: 1, paddingVertical: 13, fontSize: 15, color: c.text }}
        />
        <TouchableOpacity onPress={() => setShow((s) => !s)} hitSlop={10}>
          <Ionicons name={show ? 'eye-off' : 'eye'} size={20} color={c.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Badge ── */
type BadgeTone = 'primary' | 'gold' | 'success' | 'danger' | 'info' | 'neutral';
export function Badge({ label, tone = 'primary', style }: { label: string; tone?: BadgeTone; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    primary: { bg: c.infoTint, fg: c.info },
    info: { bg: c.infoTint, fg: c.info },
    gold: { bg: c.goldTint, fg: theme.scheme === 'dark' ? c.gold : '#8A6D0B' },
    success: { bg: c.successTint, fg: c.success },
    danger: { bg: c.dangerTint, fg: c.danger },
    neutral: { bg: c.surfaceAlt, fg: c.textMuted },
  };
  const { bg, fg } = map[tone];
  return (
    <View
      style={[
        { backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill, alignSelf: 'flex-start' },
        style,
      ]}
    >
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

/* ── StatCard ── */
export function StatCard({
  value,
  label,
  icon,
  tone = 'primary',
  style,
}: {
  value: string | number;
  label: string;
  icon?: IconName;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const toneColor: Record<BadgeTone, string> = {
    primary: c.primary,
    info: c.info,
    gold: c.gold,
    success: c.success,
    danger: c.danger,
    neutral: c.textMuted,
  };
  const accent = toneColor[tone];
  const tintMap: Record<BadgeTone, string> = {
    primary: c.infoTint,
    info: c.infoTint,
    gold: c.goldTint,
    success: c.successTint,
    danger: c.dangerTint,
    neutral: c.surfaceAlt,
  };
  return (
    <Card style={[{ flex: 1 }, style]}>
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: tintMap[tone],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Ionicons name={icon} size={19} color={accent} />
        </View>
      ) : null}
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>{label}</Text>
    </Card>
  );
}

/* ── Segmented tabs ── */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.surfaceAlt,
        borderRadius: theme.radius.md,
        padding: 4,
        marginHorizontal: 16,
        marginTop: 12,
      }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: theme.radius.sm,
              backgroundColor: active ? c.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: active ? c.onPrimary : c.textMuted, fontWeight: '700', fontSize: 13 }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ── EmptyState ── */
export function EmptyState({ icon = 'file-tray-outline', text }: { icon?: IconName; text: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12 }}>
      <Ionicons name={icon} size={48} color={theme.colors.border} />
      <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

/* ── Loader ── */
export function Loader() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

/* ── SectionTitle ── */
export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { theme } = useTheme();
  return (
    <Text style={[{ fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 12 }, style]}>
      {children}
    </Text>
  );
}

/* helper for screens that still need a themed StyleSheet */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (t: Theme) => T): T {
  const { theme } = useTheme();
  return React.useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}

export { ScrollView };
