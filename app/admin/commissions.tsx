import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, useThemedStyles } from '../../components/ui';

export default function AdminCommissions() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    count: { backgroundColor: 'rgba(255,255,255,0.15)', color: t.colors.onHeader, fontWeight: '700' as const, fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' as const },
    center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 },
    loadingText: { fontSize: 14, color: t.colors.textMuted },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center' as const, color: t.colors.textMuted, marginTop: 40, fontSize: 15 },
    card: { backgroundColor: t.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: t.colors.border, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
    cardTop: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 12 },
    leftInfo: { flex: 1 },
    affiliate: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text },
    meta: { fontSize: 13, color: t.colors.textMuted, marginTop: 2 },
    amount: { fontSize: 16, fontWeight: '800' as const, color: t.colors.success, marginTop: 4 },
    date: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' as const },
    actionBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingVertical: 12, borderRadius: 10 },
    actionText: { fontSize: 14, fontWeight: '700' as const },
    disabled: { opacity: 0.6 },
    paidRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, justifyContent: 'center' as const, paddingVertical: 8 },
    paidText: { fontSize: 13, color: t.colors.success, fontWeight: '600' as const },
  }));

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
    if (status === 'approved') return { bg: c.successTint, text: c.success };
    if (status === 'paid') return { bg: c.infoTint, text: c.info };
    return { bg: c.goldTint, text: theme.scheme === 'dark' ? c.gold : '#8A6D0B' };
  };

  return (
    <Screen>
      <AppHeader
        title="Commission Logs"
        subtitle="Approve and pay commissions"
        right={<Text style={styles.count}>{commissions.length}</Text>}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={styles.loadingText}>Loading commissions...</Text>
        </View>
      ) : (
        <FlatList
          data={commissions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No commission records found.</Text>}
          renderItem={({ item: cItem }: { item: any }) => {
            const colors = statusStyle(cItem.status);
            const isBusy = busyId === cItem.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.leftInfo}>
                    <Text style={styles.affiliate}>{cItem.affiliate_name || cItem.affiliate || 'Affiliate'}</Text>
                    <Text style={styles.meta}>Order #{cItem.order || cItem.order_id}</Text>
                    <Text style={styles.amount}>KES {cItem.commission_earned}</Text>
                    <Text style={styles.date}>
                      {cItem.created_at ? new Date(cItem.created_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>
                      {cItem.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {cItem.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: c.successTint }, isBusy && styles.disabled]}
                    onPress={() => approve(cItem)}
                    disabled={isBusy}
                  >
                    {isBusy
                      ? <ActivityIndicator size="small" color={c.success} />
                      : <Ionicons name="checkmark-circle" size={18} color={c.success} />
                    }
                    <Text style={[styles.actionText, { color: c.success }]}>Approve Commission</Text>
                  </TouchableOpacity>
                )}

                {cItem.status === 'approved' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: c.infoTint }, isBusy && styles.disabled]}
                    onPress={() => payout(cItem)}
                    disabled={isBusy}
                  >
                    {isBusy
                      ? <ActivityIndicator size="small" color={c.primary} />
                      : <Ionicons name="cash" size={18} color={c.primary} />
                    }
                    <Text style={[styles.actionText, { color: c.primary }]}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}

                {cItem.status === 'paid' && (
                  <View style={styles.paidRow}>
                    <Ionicons name="checkmark-done-circle" size={16} color={c.success} />
                    <Text style={styles.paidText}>Commission paid</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
