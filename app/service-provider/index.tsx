import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';

export default function ServiceProviderDashboard() {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Service Provider</Text>
          {user && <Text style={styles.subtitle}>{user.first_name} · {serviceTypeLabel(user.vendor_type || '')}</Text>}
        </View>
      </View>

      <View style={styles.tabs}>
        {(['services', 'bookings'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'services' ? 'My Services' : 'Bookings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : tab === 'services' ? (
        <ScrollView style={styles.list}>
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No services yet</Text>
              <Text style={styles.emptyText}>Your services will appear here once added via the website dashboard.</Text>
            </View>
          ) : services.map((s) => (
            <View key={s.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                  <Text style={[styles.badgeText, { color: '#1d4ed8' }]}>{serviceTypeLabel(s.service_type)}</Text>
                </View>
              </View>
              {s.description ? <Text style={styles.serviceDesc} numberOfLines={2}>{s.description}</Text> : null}
              <View style={styles.serviceMeta}>
                {s.price ? <Text style={styles.servicePrice}>KES {s.price}</Text> : null}
                {s.city ? <Text style={styles.serviceLocation}><Ionicons name="location" size={12} color="#6b7280" /> {s.city}</Text> : null}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.list}>
          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Client bookings will appear here.</Text>
            </View>
          ) : bookings.map((b) => (
            <View key={b.id} style={styles.bookingCard}>
              <Text style={styles.bookingService}>{b.service_name || b.service}</Text>
              <Text style={styles.bookingClient}>Client: {b.client_name || b.client}</Text>
              <Text style={styles.bookingDate}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</Text>
              <View style={[styles.badge, { backgroundColor: '#fef9c3', alignSelf: 'flex-start', marginTop: 6 }]}>
                <Text style={[styles.badgeText, { color: '#92400e' }]}>{b.status?.toUpperCase() || 'PENDING'}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1d4ed8' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#1d4ed8' },
  list: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 20 },
  serviceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  serviceDesc: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  serviceMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  servicePrice: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  serviceLocation: { fontSize: 12, color: '#6b7280' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  bookingCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  bookingService: { fontSize: 15, fontWeight: '700', color: '#111827' },
  bookingClient: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  bookingDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
