import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { Screen, AppHeader, Button, EmptyState, Loader, useThemedStyles } from '../components/ui';
import { useTheme } from '../lib/theme-context';

export default function TransporterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    header: { backgroundColor: t.colors.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    sub: { fontSize: 13, color: t.colors.textMuted, marginBottom: 12 },
    searchBox: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.md, paddingHorizontal: 12, paddingVertical: 8 },
    searchInput: { flex: 1, fontSize: 14, color: t.colors.text },
    list: { padding: 16 },
    card: { backgroundColor: t.colors.surface, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, marginBottom: 16, overflow: 'hidden' as const, elevation: 2 },
    image: { width: '100%' as const, height: 160 },
    cardBody: { padding: 14 },
    name: { fontSize: 17, fontWeight: '700' as const, color: t.colors.text, marginBottom: 6 },
    desc: { fontSize: 13, color: t.colors.textMuted, marginBottom: 8 },
    provider: { fontSize: 12, color: t.colors.textMuted, marginBottom: 12 },
  }));

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

  if (loading) return <Loader />;

  return (
    <Screen>
      <AppHeader title="Transporters" />
      <View style={styles.header}>
        <Text style={styles.sub}>Find verified transporters for your goods</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={c.placeholder} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search transporters..."
            placeholderTextColor={c.placeholder}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
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
              <Button
                title="Request Pickup"
                icon="cube"
                onPress={() => router.push(`/request-transport?id=${item.id}&title=${encodeURIComponent(item.title || 'Transport')}` as any)}
              />
              <Button
                title="Contact Transporter"
                icon="call"
                variant="outline"
                onPress={() => router.push(`/contact-service-provider?id=${item.id}` as any)}
                style={{ marginTop: 8 }}
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon="car" text="No transporters available yet" />}
      />
    </Screen>
  );
}
