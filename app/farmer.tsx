import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import { getUser } from '../lib/auth';
import { greeting } from '../lib/constants';
import { useTheme } from '../lib/theme-context';
import { Card, Badge, ThemeToggle } from '../components/ui';

/* Sample market prices (KES/kg). Replace with a live price feed when available. */
const MARKET_PRICES = [
  { name: 'Tomatoes', price: 85, change: 4.2 },
  { name: 'Irish Potatoes', price: 60, change: -2.1 },
  { name: 'Onions', price: 110, change: 1.5 },
  { name: 'Cabbage', price: 35, change: -3.4 },
  { name: 'Maize', price: 55, change: 0.8 },
  { name: 'Sukuma Wiki', price: 40, change: 2.6 },
];

const priceOf = (p: any): number =>
  Number(p?.retailer_price) || Number(p?.wholesaler_price) || Number(p?.farmer_price) || Number(p?.price) || 0;

export default function FarmerDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [pending, setPending] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const u = await getUser();
    setUser(u);
    const [prodRes, salesRes, ordersRes] = await Promise.all([
      api.get('/mobile/products/my_products/').catch(() => ({ data: [] })),
      api.get('/orders/vendor-sales/').catch(() => ({ data: [] })),
      api.get('/orders/my-orders/').catch(() => ({ data: [] })),
    ]);
    const prods = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || [];
    setListings(prods);
    const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
    setEarnings(sales.reduce((s: number, r: any) => s + (Number(r.total_collected) || 0), 0));
    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
    setPending(orders.filter((o: any) => o.status && o.status !== 'completed').length);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const verified = !!user?.verification_code;
  const firstName = user?.first_name || 'Farmer';

  // Trust score (out of 100) — simple, deterministic heuristic.
  const trust = Math.min(
    100,
    40 + (verified ? 25 : 0) + Math.min(listings.length * 3, 20) + (earnings > 0 ? 15 : 0)
  );

  const actions = [
    { label: 'Sell Produce', icon: 'add-circle', route: '/vendor/add-product' },
    { label: 'Check Price', icon: 'pricetags', route: '/(tabs)/products' },
    { label: 'Book Transport', icon: 'car', route: '/book-transporter' },
    { label: 'My Wallet', icon: 'wallet', route: '/vendor' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      {/* Navy header: greeting + verified avatar */}
      <View style={[styles.header, { backgroundColor: c.headerBg, paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.onHeaderMuted, fontSize: 13 }}>{greeting()},</Text>
          <Text style={{ color: c.onHeader, fontSize: 22, fontWeight: '800' }} numberOfLines={1}>
            {firstName} 👋
          </Text>
        </View>
        <ThemeToggle />
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ marginLeft: 10 }}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={c.primary} />
            {verified ? (
              <View style={[styles.verifiedDot, { backgroundColor: c.success, borderColor: c.headerBg }]}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      {verified ? (
        <View style={{ paddingHorizontal: 16, marginTop: -10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: c.successTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Ionicons name="shield-checkmark" size={14} color={c.success} />
            <Text style={{ color: c.success, fontWeight: '700', fontSize: 12 }}>Verified Farmer</Text>
          </View>
        </View>
      ) : null}

      {/* Trust score */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={[styles.scoreRing, { borderColor: c.primary }]}>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{trust}</Text>
            <Text style={{ color: c.textMuted, fontSize: 10 }}>/ 100</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Trust Score</Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>
              Build trust by verifying, listing produce, and completing orders.
            </Text>
            <View style={{ height: 8, backgroundColor: c.surfaceAlt, borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
              <View style={{ width: `${trust}%`, height: 8, backgroundColor: c.primary }} />
            </View>
          </View>
        </Card>
      </View>

      {/* 3 metric cards */}
      <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 0 }}>
        <Metric icon="cube" tint={c.infoTint} color={c.primary} value={String(listings.length)} label="Active Listings" c={c} />
        <Metric icon="cash" tint={c.successTint} color={c.success} value={`KES ${earnings.toLocaleString()}`} label="This Month" c={c} />
        <Metric icon="time" tint={c.goldTint} color={c.gold} value={String(pending)} label="Pending Orders" c={c} />
      </View>

      {/* 4 circular actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 16 }}>
        {actions.map((a) => (
          <TouchableOpacity key={a.label} style={{ alignItems: 'center', width: 74 }} onPress={() => router.push(a.route as any)}>
            <View style={[styles.circle, { backgroundColor: c.primary }]}>
              <Ionicons name={a.icon as any} size={24} color={c.onPrimary} />
            </View>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 }}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Market prices */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={styles.sectionHead}>
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 17 }}>Today&apos;s Market Prices</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>per kg</Text>
        </View>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {MARKET_PRICES.map((m, i) => {
            const up = m.change >= 0;
            return (
              <View
                key={m.name}
                style={[styles.priceRow, { borderBottomColor: c.border, borderBottomWidth: i < MARKET_PRICES.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
              >
                <Text style={{ color: c.text, fontWeight: '600', flex: 1 }}>{m.name}</Text>
                <Text style={{ color: c.text, fontWeight: '700', marginRight: 12 }}>KES {m.price}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, width: 66, justifyContent: 'flex-end' }}>
                  <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={14} color={up ? c.success : c.danger} />
                  <Text style={{ color: up ? c.success : c.danger, fontWeight: '700', fontSize: 13 }}>
                    {Math.abs(m.change).toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>
      </View>

      {/* Active listings */}
      <View style={{ padding: 16 }}>
        <View style={styles.sectionHead}>
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 17 }}>Active Listings</Text>
          <TouchableOpacity onPress={() => router.push('/vendor')}>
            <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>Manage →</Text>
          </TouchableOpacity>
        </View>
        {listings.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
            <Ionicons name="cube-outline" size={36} color={c.border} />
            <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center' }}>No active listings yet.</Text>
            <TouchableOpacity
              onPress={() => router.push('/vendor/add-product')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: theme.radius.md }}
            >
              <Ionicons name="add" size={16} color={c.onPrimary} />
              <Text style={{ color: c.onPrimary, fontWeight: '700' }}>Sell Produce</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          listings.slice(0, 6).map((p) => (
            <Card key={p.id} onPress={() => router.push(`/vendor/edit-product?id=${p.id}` as any)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              {p.image ? (
                <Image source={{ uri: p.image }} style={{ width: 56, height: 56, borderRadius: 10 }} />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="leaf" size={22} color={c.placeholder} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: c.success, fontWeight: '700', fontSize: 13, marginTop: 2 }}>KES {priceOf(p).toLocaleString()}</Text>
              </View>
              {p.approved ? <Badge label="Verified" tone="success" /> : <Badge label="Pending" tone="gold" />}
            </Card>
          ))
        )}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function Metric({ icon, tint, color, value, label, c }: { icon: any; tint: string; color: string; value: string; label: string; c: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 22, borderBottomLeftRadius: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  verifiedDot: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  scoreRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
});
