import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, StatCard, useThemedStyles } from '../../components/ui';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    tools: { padding: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
    toolCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.colors.surface, padding: 16, borderRadius: t.radius.lg, marginBottom: 10, borderWidth: 1, borderColor: t.colors.border },
    toolIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.infoTint },
    toolText: { flex: 1 },
    toolTitle: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text },
    toolDesc: { fontSize: 13, color: t.colors.textMuted, marginTop: 2 },
  }));

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/admin/dashboard-stats/')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tools = [
    { title: 'User Management', desc: 'View and manage all registered users', icon: 'people', route: '/admin/users' },
    { title: 'Product Monitor', desc: 'Browse all vendor product submissions', icon: 'cube', route: '/admin/products' },
    { title: 'Commission Reports', desc: 'Approve commissions and review payouts', icon: 'cash', route: '/admin/commissions' },
    { title: 'Payout Manager', desc: 'Mark affiliate commissions as paid', icon: 'wallet', route: '/admin/payouts' },
    { title: 'System Logs', desc: 'Track user activity and referral usage', icon: 'document-text', route: '/admin/logs' },
  ];

  return (
    <Screen>
      <AppHeader title="Admin Dashboard" subtitle="Platform overview and tools" showHome />
      <ScrollView>
        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
        ) : stats ? (
          <View style={styles.statsGrid}>
            <StatCard tone="primary" value={stats.total_users} label="Total Users" style={{ minWidth: '45%' }} />
            <StatCard tone="success" value={stats.total_vendors} label="Vendors" style={{ minWidth: '45%' }} />
            <StatCard tone="primary" value={stats.total_affiliates} label="Affiliates" style={{ minWidth: '45%' }} />
            <StatCard tone="gold" value={stats.total_orders ?? '—'} label="Orders" style={{ minWidth: '45%' }} />
          </View>
        ) : null}

        <View style={styles.tools}>
          {tools.map((t) => (
            <TouchableOpacity key={t.route} style={styles.toolCard} onPress={() => router.push(t.route as any)}>
              <View style={styles.toolIcon}>
                <Ionicons name={t.icon as any} size={24} color={c.primary} />
              </View>
              <View style={styles.toolText}>
                <Text style={styles.toolTitle}>{t.title}</Text>
                <Text style={styles.toolDesc}>{t.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
