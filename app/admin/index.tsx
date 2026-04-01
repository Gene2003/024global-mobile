import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/admin/dashboard-stats/')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tools = [
    { title: 'User Management', desc: 'View and manage all registered users', icon: 'people', color: '#3b82f6', route: '/admin/users' },
    { title: 'Product Monitor', desc: 'Browse all vendor product submissions', icon: 'cube', color: '#8b5cf6', route: '/admin/products' },
    { title: 'Commission Reports', desc: 'Approve commissions and review payouts', icon: 'cash', color: '#10b981', route: '/admin/commissions' },
    { title: 'Payout Manager', desc: 'Mark affiliate commissions as paid', icon: 'wallet', color: '#f59e0b', route: '/admin/payouts' },
    { title: 'System Logs', desc: 'Track user activity and referral usage', icon: 'document-text', color: '#6b7280', route: '/admin/logs' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : stats ? (
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: stats.total_users, color: '#eff6ff', text: '#1d4ed8' },
            { label: 'Vendors', value: stats.total_vendors, color: '#f0fdf4', text: '#16a34a' },
            { label: 'Affiliates', value: stats.total_affiliates, color: '#faf5ff', text: '#7c3aed' },
            { label: 'Orders', value: stats.total_orders ?? '—', color: '#fff7ed', text: '#ea580c' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.color }]}>
              <Text style={[styles.statValue, { color: s.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.text }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.tools}>
        {tools.map((t) => (
          <TouchableOpacity key={t.route} style={styles.toolCard} onPress={() => router.push(t.route as any)}>
            <View style={[styles.toolIcon, { backgroundColor: t.color + '20' }]}>
              <Ionicons name={t.icon as any} size={24} color={t.color} />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>{t.title}</Text>
              <Text style={styles.toolDesc}>{t.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tools: { padding: 16 },
  toolCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  toolIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toolText: { flex: 1 },
  toolTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  toolDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
