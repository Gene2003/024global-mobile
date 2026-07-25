import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { useThemedStyles } from '../../components/ui';

export default function ServicesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.background },
    center: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingTop: 60 },
    header: { backgroundColor: t.colors.surface, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    title: { fontSize: 24, fontWeight: '800' as const, color: t.colors.text, marginBottom: 12 },
    searchBox: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md, paddingHorizontal: 12, paddingVertical: 8 },
    searchInput: { flex: 1, fontSize: 14, color: t.colors.text },
    list: { padding: 16 },
    card: { backgroundColor: t.colors.surface, borderRadius: t.radius.md, marginBottom: 16, overflow: 'hidden' as const, borderWidth: 1, borderColor: t.colors.border, elevation: 2 },
    image: { width: '100%' as const, height: 160 },
    badge: { position: 'absolute' as const, top: 12, right: 12, borderRadius: t.radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { color: t.colors.onPrimary, fontSize: 11, fontWeight: '700' as const, textTransform: 'capitalize' as const },
    cardBody: { padding: 14 },
    serviceName: { fontSize: 17, fontWeight: '700' as const, color: t.colors.text, marginBottom: 6 },
    desc: { fontSize: 13, color: t.colors.textMuted, marginBottom: 8 },
    provider: { fontSize: 12, color: t.colors.textMuted, marginBottom: 12 },
    contactBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.md, paddingVertical: 10, alignItems: 'center' as const },
    contactBtnText: { color: t.colors.onPrimary, fontWeight: '700' as const, fontSize: 14 },
    empty: { color: t.colors.textMuted, fontSize: 16 },
  }));

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
    veterinary: c.success, transport: c.primary, storage: c.gold,
  };

  if (loading) return <View style={[styles.center, { backgroundColor: c.background }]}><ActivityIndicator size="large" color={c.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={c.textMuted} style={{ marginRight: 8 }} />
          <TextInput placeholder="Search services..." placeholderTextColor={c.placeholder} value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/contact-service-provider?id=${item.id}` as any)}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/400x200' }} style={styles.image} resizeMode="cover" />
            <View style={[styles.badge, { backgroundColor: typeColor[item.service_type] || c.textMuted }]}>
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
