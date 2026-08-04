import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Animated, Linking, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { getOrders } from '../lib/orders';
import { useTheme } from '../lib/theme-context';
import { AppHeader, Card, Button, Loader } from '../components/ui';

type TrackingStatus = 'placed' | 'agent_verified' | 'transporter_assigned' | 'in_transit' | 'delivered';

type Transporter = { name: string; phone: string; plate?: string | null } | null;

type TrackData = {
  order_id: string;
  status: string;
  tracking_status: TrackingStatus;
  steps?: unknown[];
  delivery_confirmed: boolean;
  payment_released: boolean;
  amount: number;
  produce: { name: string; quantity: number | string; unit: string; quality_grade?: string | null };
  pickup_location: string;
  delivery_location: string;
  transporter: Transporter;
  created_at: string;
};

const STEP_ORDER: TrackingStatus[] = [
  'placed',
  'agent_verified',
  'transporter_assigned',
  'in_transit',
  'delivered',
];

const STEP_LABELS: Record<TrackingStatus, string> = {
  placed: 'Order Placed',
  agent_verified: 'Agent Verified',
  transporter_assigned: 'Transporter Assigned',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

/* ── Pulsing dot for the current step ── */
function PulsingCircle({ color, onColor }: { color: string; onColor: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: onColor }} />
      </View>
    </View>
  );
}

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const c = theme.colors;

  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ref, setRef] = useState<string | undefined>();

  // the order's payment reference (stored locally at checkout) proves this is our order
  useEffect(() => {
    getOrders().then((list) => {
      const o = list.find((x) => String(x.order_id) === String(id));
      if (o?.reference) setRef(o.reference);
    });
  }, [id]);

  const fetchTracking = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/orders/track/${id}/`, { params: ref ? { ref } : undefined });
      setData(res.data as TrackData);
    } catch {
      /* keep last known data; polling will retry */
    } finally {
      setLoading(false);
    }
  }, [id, ref]);

  // initial load + 10s polling for real-time feel
  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTracking();
    setRefreshing(false);
  }, [fetchTracking]);

  const confirmDelivery = useCallback(async () => {
    if (!id) return;
    setConfirming(true);
    try {
      await api.post(`/orders/${id}/confirm-delivery/`, { reference: ref });
      await fetchTracking();
    } catch {
      Alert.alert('Could not confirm', 'Please try again in a moment.');
    } finally {
      setConfirming(false);
    }
  }, [id, ref, fetchTracking]);

  if (loading && !data) return <Loader />;

  const current = data ? Math.max(0, STEP_ORDER.indexOf(data.tracking_status)) : 0;
  const transporter = data?.transporter ?? null;
  const showConfirmButton =
    !!data &&
    (data.tracking_status === 'in_transit' || data.tracking_status === 'delivered') &&
    !data.delivery_confirmed;

  // truck horizontal progress along the route (0 → 1)
  const routeProgress = Math.min(1, Math.max(0, current / 4));

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader title="Track Order" subtitle={`Order #${id}`} />

      {!data ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="cloud-offline-outline" size={44} color={c.border} />
          <Text style={{ color: c.textMuted, marginTop: 12, textAlign: 'center' }}>
            Unable to load tracking. Pull down to retry.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        >
          {/* ── 2. PROGRESS TRACKER ── */}
          <Card>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, marginBottom: 16 }}>Delivery Progress</Text>
            {STEP_ORDER.map((key, index) => {
              const isCompleted = index < current;
              const isCurrent = index === current;
              const isLast = index === STEP_ORDER.length - 1;
              const connectorColor = index < current ? c.primary : c.border;

              return (
                <View key={key} style={{ flexDirection: 'row' }}>
                  {/* marker column */}
                  <View style={{ alignItems: 'center', width: 28 }}>
                    {isCompleted ? (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: c.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="checkmark" size={14} color={c.onPrimary} />
                      </View>
                    ) : isCurrent ? (
                      <PulsingCircle color={c.primary} onColor={c.onPrimary} />
                    ) : (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor: c.border,
                          backgroundColor: c.surface,
                        }}
                      />
                    )}
                    {!isLast ? (
                      <View style={{ width: 2, flex: 1, minHeight: 26, backgroundColor: connectorColor, marginVertical: 2 }} />
                    ) : null}
                  </View>

                  {/* label column */}
                  <View style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 0 : 14 }}>
                    <Text
                      style={{
                        color: isCurrent ? c.text : isCompleted ? c.text : c.textMuted,
                        fontWeight: isCurrent ? '800' : '600',
                        fontSize: 14,
                        marginTop: 2,
                      }}
                    >
                      {STEP_LABELS[key]}
                    </Text>
                    {isCurrent ? (
                      <Text style={{ color: c.primary, fontSize: 12, marginTop: 2, fontWeight: '600' }}>In progress…</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>

          {/* ── 3. MAP VIEW (placeholder) ── */}
          <Card padded={false} style={{ overflow: 'hidden' }}>
            <View
              style={{
                height: 180,
                backgroundColor: c.surfaceAlt,
                // subtle gradient placeholder feel using tokens
                borderTopLeftRadius: theme.radius.lg,
                borderTopRightRadius: theme.radius.lg,
                overflow: 'hidden',
              }}
            >
              {/* route line */}
              <View
                style={{
                  position: 'absolute',
                  left: 34,
                  right: 34,
                  top: 90,
                  height: 0,
                  borderBottomWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: c.primary,
                }}
              />
              {/* pickup pin (top-left) */}
              <View style={{ position: 'absolute', left: 16, top: 22, alignItems: 'center' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="location" size={18} color={c.primary} />
                </View>
                <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 3, fontWeight: '600' }}>Pickup</Text>
              </View>
              {/* delivery pin (bottom-right) */}
              <View style={{ position: 'absolute', right: 16, bottom: 22, alignItems: 'center' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="flag" size={18} color={c.success} />
                </View>
                <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 3, fontWeight: '600' }}>Delivery</Text>
              </View>
              {/* truck along the route based on progress */}
              <View
                style={{
                  position: 'absolute',
                  top: 74,
                  left: `${8 + routeProgress * 78}%`,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: c.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: c.shadow,
                    shadowOpacity: 1,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                  }}
                >
                  <Ionicons name="car" size={18} color={c.onPrimary} />
                </View>
              </View>
            </View>
            <View style={{ padding: 14 }}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>
                Live location — {transporter?.name || 'awaiting transporter'}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 4 }}>
                Live map updates when the transporter shares GPS.
              </Text>
            </View>
          </Card>

          {/* ── 4. TRANSPORTER ── */}
          <Card>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, marginBottom: 12 }}>Transporter</Text>
            {transporter ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: c.infoTint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="person" size={24} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{transporter.name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 1 }}>{transporter.phone}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }}>
                      Plate: {transporter.plate || '—'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Button
                    title="Call"
                    icon="call"
                    fullWidth={false}
                    style={{ flex: 1 }}
                    onPress={() => Linking.openURL(`tel:${transporter.phone}`)}
                  />
                  <Button
                    title="Message"
                    icon="chatbubble"
                    variant="outline"
                    fullWidth={false}
                    style={{ flex: 1 }}
                    onPress={() => Linking.openURL(`sms:${transporter.phone}`)}
                  />
                </View>
              </>
            ) : (
              <Text style={{ color: c.textMuted, fontSize: 13 }}>No transporter assigned yet.</Text>
            )}
          </Card>

          {/* ── 5. PRODUCE SUMMARY ── */}
          <Card>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              You ordered
            </Text>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 18, marginTop: 6 }}>{data.produce?.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <Text style={{ color: c.text, fontSize: 14 }}>
                {data.produce?.quantity} {data.produce?.unit}
              </Text>
              {data.produce?.quality_grade ? (
                <Text style={{ color: c.textMuted, fontSize: 14 }}>· Grade {data.produce.quality_grade}</Text>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <Ionicons name="location-outline" size={16} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 13, flex: 1 }}>Pickup: {data.pickup_location}</Text>
            </View>
          </Card>

          {/* ── 6. PAYMENT ── */}
          <Card>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, marginBottom: 10 }}>Payment</Text>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 22 }}>
              KES {Number(data.amount).toLocaleString()}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Ionicons name="shield-checkmark" size={16} color={c.success} />
              <Text style={{ color: c.textMuted, fontWeight: '700', fontSize: 13 }}>Paid securely via Paystack</Text>
            </View>
          </Card>

          {/* ── 7. CONFIRM DELIVERY ── */}
          {showConfirmButton ? (
            <Button
              title="Confirm Delivery"
              icon="checkmark-done"
              variant="success"
              loading={confirming}
              onPress={confirmDelivery}
            />
          ) : data.delivery_confirmed ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: c.successTint,
                paddingVertical: 14,
                borderRadius: theme.radius.md,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={c.success} />
              <Text style={{ color: c.success, fontWeight: '700', fontSize: 14 }}>Delivery confirmed</Text>
            </View>
          ) : null}

          <Text style={{ color: c.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            Auto-refreshes every 10s · pull down to refresh now.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
