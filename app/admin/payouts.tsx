import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, useThemedStyles } from '../../components/ui';

export default function AdminPayouts() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 },
    loadingText: { fontSize: 14, color: t.colors.textMuted },
    list: { padding: 16, paddingBottom: 40 },
    totalCard: { backgroundColor: t.colors.primary, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' as const },
    totalLabel: { fontSize: 13, color: t.colors.onPrimary, opacity: 0.85, fontWeight: '600' as const },
    totalValue: { fontSize: 32, fontWeight: '800' as const, color: t.colors.onPrimary, marginTop: 4 },
    totalSub: { fontSize: 13, color: t.colors.onPrimary, opacity: 0.85, marginTop: 4 },
    emptyState: { alignItems: 'center' as const, marginTop: 60, gap: 12 },
    emptyTitle: { fontSize: 20, fontWeight: '800' as const, color: t.colors.text },
    emptyText: { fontSize: 14, color: t.colors.textMuted, textAlign: 'center' as const },
    card: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: t.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: t.colors.border, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
    cardInfo: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text },
    amount: { fontSize: 20, fontWeight: '800' as const, color: t.colors.success, marginTop: 2 },
    meta: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
    date: { fontSize: 12, color: t.colors.textMuted },
    payBtn: { backgroundColor: t.colors.primary, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
    payBtnText: { color: t.colors.onPrimary, fontWeight: '700' as const, fontSize: 13 },
    disabled: { opacity: 0.6 },
  }));

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
    <Screen>
      <AppHeader title="Payout Manager" subtitle="Approved commissions awaiting payment" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
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
              <Ionicons name="checkmark-circle" size={56} color={c.success} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No approved commissions pending payout.</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const isBusy = busyId === item.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{item.affiliate_name || item.affiliate || 'Affiliate'}</Text>
                  <Text style={styles.amount}>KES {item.commission_earned}</Text>
                  <Text style={styles.meta}>Order #{item.order || item.order_id}</Text>
                  <Text style={styles.date}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.payBtn, isBusy && styles.disabled]}
                  onPress={() => markPaid(item)}
                  disabled={isBusy}
                >
                  {isBusy
                    ? <ActivityIndicator size="small" color={c.onPrimary} />
                    : <Ionicons name="cash" size={18} color={c.onPrimary} />
                  }
                  <Text style={styles.payBtnText}>{isBusy ? 'Processing...' : 'Mark Paid'}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
