import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';

export default function TransporterScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/services/?service_type=transport')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setServices(data.filter((s: any) => s.service_type === 'transport'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = services.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transporters</Text>
        <Text style={styles.sub}>Find verified transporters for your goods</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput placeholder="Search transporters..." value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/contact-service-provider?id=${item.id}` as any)}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/400x200' }} style={styles.image} resizeMode="cover" />
            <View style={styles.cardBody}>
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.provider}>Provider: {item.provider_name}</Text>
              <TouchableOpacity style={styles.contactBtn} onPress={() => router.push(`/contact-service-provider?id=${item.id}` as any)}>
                <Ionicons name="car" size={16} color="#fff" />
                <Text style={styles.contactBtnText}>Contact Transporter</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No transporters available yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', height: 160 },
  cardBody: { padding: 14 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  provider: { fontSize: 12, color: '#4b5563', marginBottom: 12 },
  contactBtn: { backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 10 },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 16, marginTop: 12 },
});
