import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUser, logout } from '../../lib/auth';
import { useTheme, ThemeMode } from '../../lib/theme-context';
import { Button, Card, ThemeToggle } from '../../components/ui';

type MenuItem = { label: string; icon: any; route: string };

const ROLE_MENUS: Record<string, MenuItem[]> = {
  admin: [
    { label: 'Dashboard Stats', icon: 'grid', route: '/admin' },
    { label: 'User Management', icon: 'people', route: '/admin/users' },
    { label: 'Product Monitor', icon: 'cube', route: '/admin/products' },
    { label: 'Commission Logs', icon: 'cash', route: '/admin/commissions' },
    { label: 'Payout Manager', icon: 'wallet', route: '/admin/payouts' },
    { label: 'System Logs', icon: 'document-text', route: '/admin/logs' },
  ],
  vendor: [
    { label: 'My Products', icon: 'cube', route: '/vendor' },
    { label: 'Add Product', icon: 'add-circle', route: '/vendor/add-product' },
  ],
  user: [
    { label: 'Affiliate Dashboard', icon: 'grid', route: '/affiliate' },
    { label: 'My Referrals', icon: 'people', route: '/affiliate/referrals' },
    { label: 'Verify Farmer', icon: 'shield-checkmark', route: '/affiliate/verify-farmer' },
    { label: 'Verify Listings', icon: 'checkmark-done-circle', route: '/affiliate/verify-listings' },
    { label: 'Browse Products', icon: 'storefront', route: '/(tabs)/products' },
  ],
  service_provider: [{ label: 'My Services', icon: 'briefcase', route: '/service-provider' }],
};

const TRANSPORT_MENU: MenuItem = { label: 'Transporter Dashboard', icon: 'car', route: '/transporter-dashboard' };

const APPEARANCE: { key: ThemeMode; label: string; icon: any }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait' },
  { key: 'light', label: 'Light', icon: 'sunny' },
  { key: 'dark', label: 'Dark', icon: 'moon' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, mode, setMode } = useTheme();
  const c = theme.colors;
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          setUser(null);
        },
      },
    ]);
  };

  /* ── Appearance selector (always visible) ── */
  const AppearanceCard = (
    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
      <Text style={styles(c).sectionTitle}>Appearance</Text>
      <Card padded={false} style={{ padding: 6, flexDirection: 'row', gap: 6 }}>
        {APPEARANCE.map((a) => {
          const active = mode === a.key;
          return (
            <TouchableOpacity
              key={a.key}
              onPress={() => setMode(a.key)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                borderRadius: theme.radius.md,
                backgroundColor: active ? c.primary : 'transparent',
                gap: 6,
              }}
            >
              <Ionicons name={a.icon} size={20} color={active ? c.onPrimary : c.textMuted} />
              <Text style={{ color: active ? c.onPrimary : c.textMuted, fontWeight: '700', fontSize: 13 }}>
                {a.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Card>
    </View>
  );

  if (!user) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: c.background }}>
        <View style={[styles(c).topBar, { paddingTop: insets.top + 10 }]}>
          <Text style={styles(c).topBarTitle}>Profile</Text>
          <ThemeToggle />
        </View>
        <View style={styles(c).guestHero}>
          <View style={styles(c).avatar}>
            <Ionicons name="person" size={48} color={c.primary} />
          </View>
          <Text style={styles(c).guestTitle}>Welcome to 024 Global Connect</Text>
          <Text style={styles(c).guestSub}>Login or register to access your dashboard</Text>
        </View>
        <View style={{ padding: 20, gap: 12 }}>
          <Button title="Login" icon="log-in" onPress={() => router.push('/login')} />
          <Button title="Create Account" variant="outline" onPress={() => router.push('/register')} />
          <Button title="My Orders" variant="ghost" icon="receipt-outline" onPress={() => router.push('/orders' as any)} />
        </View>
        {AppearanceCard}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  const isTransport = user.service_provider_type === 'transport' || user.vendor_type === 'transport';
  const menuItems: MenuItem[] = [
    { label: 'My Orders', icon: 'receipt-outline', route: '/orders' },
    ...(ROLE_MENUS[user.role] || []),
    ...(user.role === 'service_provider' && isTransport ? [TRANSPORT_MENU] : []),
  ];
  const roleName = user.role === 'user' ? 'AFFILIATE' : user.role?.toUpperCase().replace('_', ' ');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Navy top bar */}
      <View style={[styles(c).topBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles(c).topBarTitle}>Profile</Text>
        <ThemeToggle />
      </View>

      {/* Identity hero */}
      <View style={styles(c).hero}>
        <View style={styles(c).avatar}>
          <Ionicons name="person" size={44} color={c.primary} />
        </View>
        <Text style={styles(c).name}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles(c).email}>{user.email}</Text>
        {user.username ? <Text style={styles(c).username}>@{user.username}</Text> : null}
        <View style={styles(c).roleBadge}>
          <Text style={styles(c).roleText}>{roleName}</Text>
        </View>
        {user.city || user.country ? (
          <View style={styles(c).locationRow}>
            <Ionicons name="location" size={14} color={c.textMuted} />
            <Text style={styles(c).locationText}>{[user.city, user.country].filter(Boolean).join(', ')}</Text>
          </View>
        ) : null}
      </View>

      {/* Role menu */}
      <View style={{ padding: 16 }}>
        <Text style={styles(c).sectionTitle}>Dashboard</Text>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.route} style={styles(c).menuItem} onPress={() => router.push(item.route as any)}>
            <View style={styles(c).menuIcon}>
              <Ionicons name={item.icon} size={20} color={c.primary} />
            </View>
            <Text style={styles(c).menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={c.placeholder} />
          </TouchableOpacity>
        ))}
      </View>

      {AppearanceCard}

      {/* Account */}
      <View style={{ padding: 16 }}>
        <Text style={styles(c).sectionTitle}>Account</Text>
        <TouchableOpacity style={styles(c).menuItem} onPress={handleLogout}>
          <View style={[styles(c).menuIcon, { backgroundColor: c.dangerTint }]}>
            <Ionicons name="log-out" size={20} color={c.danger} />
          </View>
          <Text style={[styles(c).menuLabel, { color: c.danger }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={18} color={c.placeholder} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = (c: ReturnType<typeof useTheme>['theme']['colors']) =>
  StyleSheet.create({
    topBar: {
      backgroundColor: c.headerBg,
      paddingHorizontal: 16,
      paddingBottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    topBarTitle: { color: c.onHeader, fontSize: 19, fontWeight: '800' },
    guestHero: { alignItems: 'center', paddingTop: 40, paddingBottom: 20, paddingHorizontal: 24 },
    hero: {
      backgroundColor: c.surface,
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: 24,
      paddingHorizontal: 24,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.infoTint,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    guestTitle: { fontSize: 20, fontWeight: '800', color: c.text, textAlign: 'center', marginBottom: 8 },
    guestSub: { fontSize: 14, color: c.textMuted, textAlign: 'center' },
    name: { fontSize: 22, fontWeight: '800', color: c.text, marginBottom: 2 },
    email: { fontSize: 14, color: c.textMuted, marginBottom: 2 },
    username: { fontSize: 13, color: c.placeholder, marginBottom: 10 },
    roleBadge: { backgroundColor: c.infoTint, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 8 },
    roleText: { color: c.info, fontWeight: '700', fontSize: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 13, color: c.textMuted },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginLeft: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    menuIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: c.infoTint, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
  });
