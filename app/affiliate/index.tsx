import { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';
import {
  Screen,
  AppHeader,
  ScrollView,
  Segmented,
  StatCard,
  Button,
  Card,
  Badge,
  EmptyState,
  Loader,
  useThemedStyles,
} from '../../components/ui';

type StatTone = 'success' | 'primary' | 'gold' | 'info';

export default function AffiliateDashboard() {
  const router = useRouter();
  const styles = useStyles();

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

  const statCards: { label: string; value: string | number; icon: any; tone: StatTone }[] = stats
    ? [
        { label: 'Total Commission', value: `KES ${stats.total_commission || 0}`, icon: 'cash', tone: 'success' },
        { label: 'Total Referrals', value: stats.total_referrals || 0, icon: 'people', tone: 'primary' },
        { label: 'Purchases', value: stats.total_purchases || 0, icon: 'cart', tone: 'gold' },
        { label: 'Conversion Rate', value: `${stats.conversion_rate || 0}%`, icon: 'trending-up', tone: 'info' },
      ]
    : [];

  const statusTone = (status: string): 'success' | 'info' | 'gold' => {
    if (status === 'approved') return 'success';
    if (status === 'paid') return 'info';
    return 'gold';
  };

  return (
    <Screen>
      <AppHeader
        title="Affiliate Dashboard"
        subtitle={user ? `Welcome back, ${user.first_name}!` : undefined}
        showHome
        showThemeToggle
      />

      <Segmented
        options={[
          { key: 'stats', label: 'Commission Stats' },
          { key: 'referrals', label: 'My Referrals' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <Loader />
      ) : tab === 'stats' ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <View style={styles.statsGrid}>
            {statCards.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} icon={s.icon} tone={s.tone} style={styles.statCard} />
            ))}
          </View>

          <Button
            title="Verify a Farmer"
            icon="shield-checkmark"
            variant="success"
            style={styles.actionBtn}
            onPress={() => router.push('/affiliate/verify-farmer')}
          />
          <Button
            title="Browse Products to Promote"
            icon="storefront"
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/products')}
          />
        </ScrollView>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {referrals.length === 0 ? (
            <EmptyState icon="people-outline" text="No referrals yet. Start promoting products to earn commission." />
          ) : (
            referrals.map((r, i) => (
              <Card key={i} style={styles.referralCard}>
                <View style={styles.referralTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.referralProduct}>{r.product_name || 'Product'}</Text>
                    <Text style={styles.referralMeta}>Order #{r.order_id || r.order}</Text>
                    <Text style={styles.referralDate}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <Badge label={r.status?.toUpperCase()} tone={statusTone(r.status)} />
                </View>
                <View style={styles.referralAmounts}>
                  <Text style={styles.purchaseAmt}>Purchase: KES {r.purchase_amount}</Text>
                  <Text style={styles.commissionAmt}>Commission: KES {r.commission_earned}</Text>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const useStyles = () =>
  useThemedStyles((t) => ({
    list: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 40 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    statCard: { minWidth: '45%' },
    actionBtn: { marginTop: 8 },
    referralCard: { marginBottom: 10 },
    referralTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    referralProduct: { fontSize: 15, fontWeight: '700', color: t.colors.text },
    referralMeta: { fontSize: 13, color: t.colors.textMuted, marginTop: 2 },
    referralDate: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
    referralAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
    purchaseAmt: { fontSize: 13, color: t.colors.textMuted },
    commissionAmt: { fontSize: 13, fontWeight: '700', color: t.colors.success },
  }));
