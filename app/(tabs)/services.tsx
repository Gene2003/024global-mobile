import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/services/')
      .then((res) => setServices(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = services.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const typeColor: Record<string, string> = {
    veterinary: '#16a34a', transport: '#1d4ed8', storage: '#d97706',
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput placeholder="Search services..." value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/contact-service-provider?id=${item.id}` as any)}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/400x200' }} style={styles.image} resizeMode="cover" />
            <View style={[styles.badge, { backgroundColor: typeColor[item.service_type] || '#6b7280' }]}>
              <Text style={styles.badgeText}>{item.service_type}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.serviceName}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.provider}>Provider: {item.provider_name}</Text>
              <TouchableOpacity style={styles.contactBtn} onPress={() => router.push(`/contact-service-provider?id=${item.id}` as any)}>
                <Text style={styles.contactBtnText}>Contact Provider</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No services found</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  header: { backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', height: 160 },
  badge: { position: 'absolute', top: 12, right: 12, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardBody: { padding: 14 },
  serviceName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  provider: { fontSize: 12, color: '#4b5563', marginBottom: 12 },
  contactBtn: { backgroundColor: '#1d4ed8', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { color: '#6b7280', fontSize: 16 },
});
