import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';

export default function ContactServiceProvider() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/services/${id}/`)
      .then((res) => setService(res.data))
      .catch(() => Alert.alert('Error', 'Could not load service details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  if (!service) return <View style={styles.center}><Text>Service not found</Text></View>;

  const rawPhone = service.provider_phone || '';
  const formattedPhone = rawPhone.startsWith('0') ? '+254' + rawPhone.slice(1) : rawPhone;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="car" size={36} color="#1d4ed8" />
        </View>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceType}>{service.service_type?.toUpperCase()}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>PROVIDER</Text>
          <Text style={styles.infoValue}>{service.provider_name}</Text>
        </View>

        {formattedPhone ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>PHONE</Text>
            <Text style={styles.infoValue}>{service.provider_phone}</Text>
          </View>
        ) : null}

        {formattedPhone ? (
          <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${formattedPhone}`)}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callBtnText}>Call Provider</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noPhone}>Phone number not available</Text>
        )}

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
          <Ionicons name="home" size={18} color="#6b7280" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff', justifyContent: 'center', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', elevation: 4 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  serviceTitle: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 6 },
  serviceType: { fontSize: 12, fontWeight: '700', color: '#1d4ed8', backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  infoBox: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, width: '100%', marginBottom: 10 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 2 },
  infoValue: { fontSize: 17, fontWeight: '700', color: '#111827' },
  callBtn: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, width: '100%', marginTop: 16, marginBottom: 10 },
  callBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  noPhone: { color: '#9ca3af', fontSize: 14, marginTop: 16, marginBottom: 10 },
  homeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  homeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
});
