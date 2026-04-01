import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUser, logout } from '../../lib/auth';

type MenuItem = { label: string; icon: any; route: string; color?: string };

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
    { label: 'Sales Overview', icon: 'bar-chart', route: '/vendor/sales' },
  ],
  user: [
    { label: 'Affiliate Dashboard', icon: 'grid', route: '/affiliate' },
    { label: 'My Referrals', icon: 'people', route: '/affiliate/referrals' },
    { label: 'Browse Products', icon: 'storefront', route: '/(tabs)/products' },
  ],
  service_provider: [
    { label: 'My Services', icon: 'briefcase', route: '/service-provider' },
  ],
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => { getUser().then(setUser); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
          setUser(null);
        }
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Ionicons name="person" size={48} color="#9ca3af" /></View>
          <Text style={styles.guestTitle}>Welcome to 024 Global Connect</Text>
          <Text style={styles.guestSub}>Login or register to access your dashboard</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Ionicons name="log-in" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/register')}>
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const menuItems = ROLE_MENUS[user.role] || [];
  const roleName = user.role === 'user' ? 'AFFILIATE' : user.role?.toUpperCase().replace('_', ' ');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#1d4ed8" />
        </View>
        <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.username ? <Text style={styles.username}>@{user.username}</Text> : null}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleName}</Text>
        </View>
        {(user.city || user.country) ? (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text style={styles.locationText}>{[user.city, user.country].filter(Boolean).join(', ')}</Text>
          </View>
        ) : null}
      </View>

      {/* Role-based menu */}
      <View style={styles.menu}>
        <Text style={styles.sectionTitle}>Dashboard</Text>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.route} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon as any} size={20} color="#1d4ed8" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Account</Text>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="log-out" size={20} color="#dc2626" />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  hero: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 64, paddingBottom: 28, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  guestTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  guestSub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  buttons: { padding: 24, gap: 12 },
  loginBtn: { backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  registerBtn: { borderWidth: 2, borderColor: '#1d4ed8', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  registerBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 2 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  username: { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  roleText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#6b7280' },
  menu: { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  logoutItem: {},
  logoutText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#dc2626' },
});
