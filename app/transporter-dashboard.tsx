import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { getUser } from '../lib/auth';
import { useTheme } from '../lib/theme-context';
import { Screen, AppHeader, Segmented, Card, Field, Button, Badge, EmptyState, Loader } from '../components/ui';

type Svc = {
  id: number;
  title: string;
  description: string;
  county?: string;
  is_active?: boolean;
  service_type: string;
};

type Booking = {
  id: number;
  service_title: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  dropoff_location: string;
  quantity_kg: number | null;
  agreed_price: string | number;
  status: string;
  created_at: string;
};

const statusTone = (s: string): 'gold' | 'primary' | 'success' | 'danger' | 'neutral' => {
  if (s === 'completed') return 'success';
  if (s === 'in_transit') return 'primary';
  if (s === 'accepted') return 'info' as any;
  if (s === 'cancelled') return 'danger';
  return 'gold'; // pending / matched
};

export default function TransporterDashboard() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<'listings' | 'requests'>('requests');

  const [listings, setListings] = useState<Svc[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', county: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const fetchListings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/services/', { params: { service_type: 'transport' } });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setListings(data.filter((s: Svc) => s.service_type === 'transport'));
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/service-bookings/', { params: { service__service_type: 'transport' } });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  useEffect(() => {
    if (tab === 'listings') fetchListings();
    else fetchBookings();
  }, [tab, fetchListings, fetchBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await (tab === 'listings' ? fetchListings(true) : fetchBookings(true));
    setRefreshing(false);
  };

  /* ── booking actions ── */
  const act = async (b: Booking, action: 'accept' | 'pickup' | 'deliver' | 'decline') => {
    // optimistic
    const nextStatus =
      action === 'accept' ? 'accepted' : action === 'pickup' ? 'in_transit' : action === 'deliver' ? 'completed' : 'cancelled';
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: nextStatus } : x)));
    try {
      await api.post(`/service-bookings/${b.id}/${action}/`);
    } catch (err: any) {
      fetchBookings(true);
      Alert.alert('Action failed', err.response?.data?.error || 'Please try again.');
    }
  };

  /* ── listing actions ── */
  const submitListing = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Give your transport service a title (e.g. "10-ton truck — Nakuru").');
      return;
    }
    setSaving(true);
    try {
      await api.post('/services/', {
        title: form.title,
        description: form.description,
        service_type: 'transport',
        county: form.county,
      });
      setForm({ title: '', description: '', county: '' });
      setShowForm(false);
      await fetchListings(true);
      Alert.alert('Published', 'Your transport service is now listed.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not publish the service.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Svc) => {
    setListings((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
    try {
      await api.patch(`/services/${s.id}/`, { is_active: !s.is_active });
    } catch {
      fetchListings(true);
    }
  };

  const removeListing = (s: Svc) => {
    Alert.alert('Remove listing', `Delete "${s.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/services/${s.id}/`);
            fetchListings(true);
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  /* ── action buttons per booking status ── */
  const actionsFor = (b: Booking) => {
    const btn = (label: string, icon: any, tone: 'primary' | 'success' | 'danger' | 'neutral', onPress: () => void) => {
      const bg = tone === 'danger' ? c.dangerTint : tone === 'neutral' ? c.surfaceAlt : tone === 'success' ? c.successTint : c.infoTint;
      const fg = tone === 'danger' ? c.danger : tone === 'neutral' ? c.text : tone === 'success' ? c.success : c.info;
      return (
        <TouchableOpacity
          key={label}
          onPress={onPress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: bg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radius.md }}
        >
          <Ionicons name={icon} size={15} color={fg} />
          <Text style={{ color: fg, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        </TouchableOpacity>
      );
    };
    if (b.status === 'pending' || b.status === 'matched') {
      return [btn('Accept', 'checkmark-circle', 'success', () => act(b, 'accept')), btn('Decline', 'close-circle', 'danger', () => act(b, 'decline'))];
    }
    if (b.status === 'accepted') {
      return [btn('Log pickup', 'cube', 'primary', () => act(b, 'pickup')), btn('Decline', 'close-circle', 'danger', () => act(b, 'decline'))];
    }
    if (b.status === 'in_transit') {
      return [btn('Confirm delivery', 'checkmark-done', 'success', () => act(b, 'deliver'))];
    }
    return [];
  };

  return (
    <Screen>
      <AppHeader
        title="Transporter Dashboard"
        subtitle={user ? `${user.first_name} · Transport` : 'Transport'}
        right={
          tab === 'listings' ? (
            <TouchableOpacity
              hitSlop={10}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setShowForm((s) => !s)}
            >
              <Ionicons name={showForm ? 'close' : 'add'} size={22} color={c.onHeader} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <Segmented
        options={[
          { key: 'requests', label: 'Booking Requests' },
          { key: 'listings', label: 'My Listings' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <Loader />
      ) : tab === 'requests' ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        >
          {bookings.length === 0 ? (
            <EmptyState icon="cube-outline" text="No booking requests yet. New pickup requests from vendors and buyers appear here." />
          ) : (
            bookings.map((b) => (
              <Card key={b.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={2}>
                    {b.customer_name || 'Customer'}
                  </Text>
                  <Badge label={b.status.replace('_', ' ').toUpperCase()} tone={statusTone(b.status)} />
                </View>
                <View style={{ gap: 4 }}>
                  <Row icon="location" text={`Pickup: ${b.pickup_location}`} c={c} />
                  {b.dropoff_location ? <Row icon="flag" text={`Drop-off: ${b.dropoff_location}`} c={c} /> : null}
                  {b.quantity_kg ? <Row icon="scale" text={`${b.quantity_kg} kg`} c={c} /> : null}
                  {b.customer_phone ? <Row icon="call" text={b.customer_phone} c={c} /> : null}
                  {Number(b.agreed_price) > 0 ? (
                    <Text style={{ color: c.success, fontWeight: '800', fontSize: 15, marginTop: 2 }}>
                      KES {Number(b.agreed_price).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
                {actionsFor(b).length > 0 ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>{actionsFor(b)}</View>
                ) : null}
              </Card>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        >
          {showForm ? (
            <Card style={{ gap: 4 }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 15, marginBottom: 8 }}>New transport service</Text>
              <Field label="Title *" placeholder='e.g. "10-ton truck — Rift Valley"' value={form.title} onChangeText={(v) => set('title', v)} />
              <Field label="Description" placeholder="Vehicle, capacity, routes, availability…" value={form.description} onChangeText={(v) => set('description', v)} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
              <Field label="County / base" placeholder="e.g. Nakuru" value={form.county} onChangeText={(v) => set('county', v)} />
              <Button title="Publish service" icon="cloud-upload" onPress={submitListing} loading={saving} />
            </Card>
          ) : null}

          {listings.length === 0 && !showForm ? (
            <View>
              <EmptyState icon="car-outline" text="No transport listings yet. Tap + to add your first service." />
              <Button title="Add transport service" icon="add" onPress={() => setShowForm(true)} />
            </View>
          ) : (
            listings.map((s) => (
              <Card key={s.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={2}>
                    {s.title}
                  </Text>
                  <Badge label={s.is_active === false ? 'PAUSED' : 'ACTIVE'} tone={s.is_active === false ? 'neutral' : 'success'} />
                </View>
                {s.description ? <Text style={{ color: c.textMuted, fontSize: 13 }}>{s.description}</Text> : null}
                {s.county ? <Text style={{ color: c.textMuted, fontSize: 12 }}>{s.county}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    onPress={() => toggleActive(s)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surfaceAlt, paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.md }}
                  >
                    <Ionicons name={s.is_active === false ? 'play' : 'pause'} size={15} color={c.text} />
                    <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{s.is_active === false ? 'Resume' : 'Pause'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeListing(s)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.dangerTint, paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.md }}
                  >
                    <Ionicons name="trash-outline" size={15} color={c.danger} />
                    <Text style={{ color: c.danger, fontWeight: '700', fontSize: 13 }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function Row({ icon, text, c }: { icon: any; text: string; c: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={14} color={c.textMuted} />
      <Text style={{ color: c.textMuted, fontSize: 13, flex: 1 }}>{text}</Text>
    </View>
  );
}
