import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function AdminCommissions() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchCommissions = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/users/admin/commissions/');
      const raw = res.data;
      setCommissions(Array.isArray(raw) ? raw : (raw.results || []));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommissions(); }, []);

  const approve = async (c: any) => {
    setBusyId(c.id);
    // Optimistic update
    setCommissions((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'approved' } : x));
    try {
      await api.post(`/users/admin/commissions/${c.id}/approve/`, {});
      fetchCommissions(true);
    } catch (err: any) {
      setCommissions((prev) => prev.map((x) => x.id === c.id ? { ...x, status: c.status } : x));
      Alert.alert('Error', err.response?.data?.detail || err.response?.data?.error || 'Failed to approve commission');
    } finally {
      setBusyId(null);
    }
  };

  const payout = async (c: any) => {
    setBusyId(c.id);
    setCommissions((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'paid' } : x));
    try {
      await api.post(`/users/admin/commissions/${c.id}/payout/`, {});
      fetchCommissions(true);
    } catch (err: any) {
      setCommissions((prev) => prev.map((x) => x.id === c.id ? { ...x, status: c.status } : x));
      Alert.alert('Error', err.response?.data?.detail || err.response?.data?.error || 'Failed to mark payout');
    } finally {
      setBusyId(null);
    }
  };

  const statusStyle = (status: string) => {
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
        <Text style={styles.title}>Commission Logs</Text>
        <Text style={styles.count}>{commissions.length}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text style={styles.loadingText}>Loading commissions...</Text>
        </View>
      ) : (
        <FlatList
          data={commissions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No commission records found.</Text>}
          renderItem={({ item: c }) => {
            const colors = statusStyle(c.status);
            const isBusy = busyId === c.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.leftInfo}>
                    <Text style={styles.affiliate}>{c.affiliate_name || c.affiliate || 'Affiliate'}</Text>
                    <Text style={styles.meta}>Order #{c.order || c.order_id}</Text>
                    <Text style={styles.amount}>KES {c.commission_earned}</Text>
                    <Text style={styles.date}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>
                      {c.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {c.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#dcfce7' }, isBusy && styles.disabled]}
                    onPress={() => approve(c)}
                    disabled={isBusy}
                  >
                    {isBusy
                      ? <ActivityIndicator size="small" color="#16a34a" />
                      : <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                    }
                    <Text style={[styles.actionText, { color: '#16a34a' }]}>Approve Commission</Text>
                  </TouchableOpacity>
                )}

                {c.status === 'approved' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#dbeafe' }, isBusy && styles.disabled]}
                    onPress={() => payout(c)}
                    disabled={isBusy}
                  >
                    {isBusy
                      ? <ActivityIndicator size="small" color="#1d4ed8" />
                      : <Ionicons name="cash" size={18} color="#1d4ed8" />
                    }
                    <Text style={[styles.actionText, { color: '#1d4ed8' }]}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}

                {c.status === 'paid' && (
                  <View style={styles.paidRow}>
                    <Ionicons name="checkmark-done-circle" size={16} color="#16a34a" />
                    <Text style={styles.paidText}>Commission paid</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#111827' },
  count: { backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: '700', fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  leftInfo: { flex: 1 },
  affiliate: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: '#16a34a', marginTop: 4 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  actionText: { fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8 },
  paidText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
});
