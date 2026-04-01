import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';

export default function AffiliateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<'stats' | 'referrals'>('stats');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then(setUser);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, referralsRes] = await Promise.all([
        api.get('/users/affiliate/summary/'),
        api.get('/users/affiliate/referrals/'),
      ]);
      setStats(statsRes.data);
      setReferrals(Array.isArray(referralsRes.data) ? referralsRes.data : []);
    } catch {
      Alert.alert('Error', 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Commission', value: `KES ${stats.total_commission || 0}`, icon: 'cash', color: '#16a34a', bg: '#dcfce7' },
    { label: 'Total Referrals', value: stats.total_referrals || 0, icon: 'people', color: '#1d4ed8', bg: '#dbeafe' },
    { label: 'Purchases', value: stats.total_purchases || 0, icon: 'cart', color: '#d97706', bg: '#fef9c3' },
    { label: 'Conversion Rate', value: `${stats.conversion_rate || 0}%`, icon: 'trending-up', color: '#7c3aed', bg: '#ede9fe' },
  ] : [];

  const statusColor = (status: string) => {
    if (status === 'approved') return { bg: '#dcfce7', text: '#16a34a' };
    if (status === 'paid') return { bg: '#dbeafe', text: '#1d4ed8' };
    return { bg: '#fef9c3', text: '#92400e' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Affiliate Dashboard</Text>
          {user && <Text style={styles.subtitle}>Welcome back, {user.first_name}!</Text>}
        </View>
      </View>

      <View style={styles.tabs}>
        {(['stats', 'referrals'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'stats' ? 'Commission Stats' : 'My Referrals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : tab === 'stats' ? (
        <ScrollView style={styles.list}>
          <View style={styles.statsGrid}>
            {statCards.map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/products')}>
            <Ionicons name="storefront" size={18} color="#fff" />
            <Text style={styles.browseBtnText}>Browse Products to Promote</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.list}>
          {referrals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No referrals yet</Text>
              <Text style={styles.emptyText}>Start promoting products to earn commission</Text>
            </View>
          ) : referrals.map((r, i) => {
            const colors = statusColor(r.status);
            return (
              <View key={i} style={styles.referralCard}>
                <View style={styles.referralTop}>
                  <View>
                    <Text style={styles.referralProduct}>{r.product_name || 'Product'}</Text>
                    <Text style={styles.referralMeta}>Order #{r.order_id || r.order}</Text>
                    <Text style={styles.referralDate}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>{r.status?.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.referralAmounts}>
                  <Text style={styles.purchaseAmt}>Purchase: KES {r.purchase_amount}</Text>
                  <Text style={styles.commissionAmt}>Commission: KES {r.commission_earned}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1d4ed8' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#1d4ed8' },
  list: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6 },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  browseBtn: { backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  referralCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  referralTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  referralProduct: { fontSize: 15, fontWeight: '700', color: '#111827' },
  referralMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  referralDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  referralAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  purchaseAmt: { fontSize: 13, color: '#6b7280' },
  commissionAmt: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
});
