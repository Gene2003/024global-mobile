import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import api from '../lib/api';
import { getOrders, updateOrderStatus, LocalOrder } from '../lib/orders';
import { useTheme } from '../lib/theme-context';
import { AppHeader, Card, Badge, Button, EmptyState, Loader } from '../components/ui';

const statusTone = (s: string): 'success' | 'gold' | 'danger' | 'neutral' => {
  if (s === 'completed') return 'success';
  if (s === 'failed') return 'danger';
  if (s === 'pending' || s === 'processing') return 'gold';
  return 'neutral';
};

export default function OrdersScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await getOrders();
    setOrders(list);
    setLoading(false);
    // best-effort live status refresh (works when signed in as the buyer)
    await Promise.all(
      list
        .filter((o) => o.status !== 'completed')
        .map(async (o) => {
          try {
            const res = await api.get(`/orders/check-status/${o.order_id}/`);
            if (res.data?.status && res.data.status !== o.status) {
              await updateOrderStatus(o.order_id, res.data.status);
            }
          } catch {
            /* guest / not authorized — keep local status */
          }
        })
    );
    setOrders(await getOrders());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pay = (o: LocalOrder) => WebBrowser.openBrowserAsync(o.payment_url);

  const contactVendor = async (o: LocalOrder) => {
    try {
      const res = await api.get(`/orders/vendor-contact/`, { params: { order_id: o.order_id } });
      const d = res.data || {};
      Alert.alert(
        d.vendor_name || 'Vendor',
        `${d.product_name || o.product_name}\n\nPhone: ${d.vendor_phone || 'Not available yet'}`,
      );
    } catch {
      Alert.alert('Not available', 'Vendor contact is available after payment is confirmed.');
    }
  };

  if (loading) return <Loader />;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader title="My Orders" subtitle="Track your purchases & deliveries" />
      {orders.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="receipt-outline" text="You have no orders yet. Once you check out, your orders appear here." />
          <View style={{ paddingHorizontal: 24 }}>
            <Button title="Browse Products" icon="storefront" onPress={() => router.push('/products')} />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        >
          {orders.map((o) => (
            <Card key={o.order_id} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={2}>
                  {o.product_name}
                </Text>
                <Badge label={o.status.toUpperCase()} tone={statusTone(o.status)} />
              </View>
              <Text style={{ color: c.success, fontWeight: '800', fontSize: 16 }}>KES {o.amount.toLocaleString()}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                Order #{o.order_id} · {new Date(o.created_at).toLocaleDateString()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={() => router.push(`/track-order?id=${o.order_id}` as any)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primary, paddingVertical: 9, paddingHorizontal: 14, borderRadius: theme.radius.md }}
                >
                  <Ionicons name="navigate" size={16} color={c.onPrimary} />
                  <Text style={{ color: c.onPrimary, fontWeight: '700', fontSize: 13 }}>Track</Text>
                </TouchableOpacity>
                {o.status !== 'completed' ? (
                  <TouchableOpacity
                    onPress={() => pay(o)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surfaceAlt, paddingVertical: 9, paddingHorizontal: 14, borderRadius: theme.radius.md }}
                  >
                    <Ionicons name="card" size={16} color={c.text} />
                    <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>Pay now</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => contactVendor(o)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.infoTint, paddingVertical: 9, paddingHorizontal: 14, borderRadius: theme.radius.md }}
                >
                  <Ionicons name="call" size={16} color={c.info} />
                  <Text style={{ color: c.info, fontWeight: '700', fontSize: 13 }}>Contact vendor</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            Pull down to refresh delivery status.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
