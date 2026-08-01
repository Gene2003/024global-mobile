import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';
import { useTheme } from '../../lib/theme-context';
import {
  Screen, AppHeader, Segmented, Loader, EmptyState, Badge, useThemedStyles,
} from '../../components/ui';

export default function ServiceProviderDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    list: { flex: 1, padding: 16 },
    serviceCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: t.colors.border },
    serviceHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 6, gap: 8 },
    serviceName: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text, flex: 1 },
    serviceDesc: { fontSize: 13, color: t.colors.textMuted, marginBottom: 8 },
    serviceMeta: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    servicePrice: { fontSize: 15, fontWeight: '700' as const, color: t.colors.success },
    serviceLocation: { fontSize: 12, color: t.colors.textMuted },
    bookingCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: t.colors.border },
    bookingService: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text },
    bookingClient: { fontSize: 13, color: t.colors.textMuted, marginTop: 4 },
    bookingDate: { fontSize: 12, color: t.colors.placeholder, marginTop: 2 },
  }));

  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<'services' | 'bookings'>('services');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then(setUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, bkRes] = await Promise.all([
        api.get('/services/my_services/').catch(() => ({ data: [] })),
        api.get('/services/bookings/').catch(() => ({ data: [] })),
      ]);
      setServices(Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data.results || []));
      setBookings(Array.isArray(bkRes.data) ? bkRes.data : (bkRes.data.results || []));
    } catch {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const serviceTypeLabel = (t: string) => {
    if (t === 'veterinary') return 'Veterinary';
    if (t === 'transport') return 'Transport';
    if (t === 'storage') return 'Storage';
    return t;
  };

  return (
    <Screen>
      <AppHeader
        title="Service Provider"
        subtitle={user ? `${user.first_name} · ${serviceTypeLabel(user.vendor_type || '')}` : undefined}
        showHome
      />

      <Segmented
        options={[
          { key: 'services', label: 'My Services' },
          { key: 'bookings', label: 'Bookings' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <Loader />
      ) : tab === 'services' ? (
        <ScrollView style={styles.list}>
          {services.length === 0 ? (
            <EmptyState icon="briefcase-outline" text="No services yet. Your services will appear here once added via the website dashboard." />
          ) : services.map((s) => (
            <View key={s.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Badge label={serviceTypeLabel(s.service_type)} tone="info" />
              </View>
              {s.description ? <Text style={styles.serviceDesc} numberOfLines={2}>{s.description}</Text> : null}
              <View style={styles.serviceMeta}>
                {s.price ? <Text style={styles.servicePrice}>KES {s.price}</Text> : null}
                {s.city ? <Text style={styles.serviceLocation}><Ionicons name="location" size={12} color={c.textMuted} /> {s.city}</Text> : null}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.list}>
          {bookings.length === 0 ? (
            <EmptyState icon="calendar-outline" text="No bookings yet. Client bookings will appear here." />
          ) : bookings.map((b) => (
            <View key={b.id} style={styles.bookingCard}>
              <Text style={styles.bookingService}>{b.service_name || b.service}</Text>
              <Text style={styles.bookingClient}>Client: {b.client_name || b.client}</Text>
              <Text style={styles.bookingDate}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</Text>
              <Badge label={b.status?.toUpperCase() || 'PENDING'} tone="gold" style={{ marginTop: 6 }} />
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
