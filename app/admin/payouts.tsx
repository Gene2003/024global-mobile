import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function AdminPayouts() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchApproved = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/users/admin/commissions/');
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw.results || []);
      setCommissions(list.filter((c: any) => c.status === 'approved'));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApproved(); }, []);

  const markPaid = async (c: any) => {
    setBusyId(c.id);
    // Optimistic: remove from list immediately
    setCommissions((prev) => prev.filter((x) => x.id !== c.id));
    try {
      await api.post(`/users/admin/commissions/${c.id}/payout/`, {});
      Alert.alert('Done', `Commission of KES ${c.commission_earned} marked as paid.`);
    } catch (err: any) {
      // Revert on failure
      setCommissions((prev) => [...prev, c].sort((a, b) => a.id - b.id));
      Alert.alert('Error', err.response?.data?.detail || err.response?.data?.error || 'Failed to mark payout');
    } finally {
      setBusyId(null);
    }
  };

  const totalPending = commissions.reduce((s, c) => s + parseFloat(c.commission_earned || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Payout Manager</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text style={styles.loadingText}>Loading payouts...</Text>
        </View>
      ) : (
        <FlatList
          data={commissions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            commissions.length > 0 ? (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Pending Payouts</Text>
                <Text style={styles.totalValue}>KES {totalPending.toFixed(2)}</Text>
                <Text style={styles.totalSub}>{commissions.length} affiliate{commissions.length !== 1 ? 's' : ''} awaiting payment</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={56} color="#16a34a" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No approved commissions pending payout.</Text>
            </View>
          }
          renderItem={({ item: c }) => {
            const isBusy = busyId === c.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{c.affiliate_name || c.affiliate || 'Affiliate'}</Text>
                  <Text style={styles.amount}>KES {c.commission_earned}</Text>
                  <Text style={styles.meta}>Order #{c.order || c.order_id}</Text>
                  <Text style={styles.date}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.payBtn, isBusy && styles.disabled]}
                  onPress={() => markPaid(c)}
                  disabled={isBusy}
                >
                  {isBusy
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="cash" size={18} color="#fff" />
                  }
                  <Text style={styles.payBtnText}>{isBusy ? 'Processing...' : 'Mark Paid'}</Text>
                </TouchableOpacity>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  list: { padding: 16, paddingBottom: 40 },
  totalCard: { backgroundColor: '#1d4ed8', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#bfdbfe', fontWeight: '600' },
  totalValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
  totalSub: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  amount: { fontSize: 20, fontWeight: '800', color: '#16a34a', marginTop: 2 },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 12, color: '#9ca3af' },
  payBtn: { backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.6 },
});
