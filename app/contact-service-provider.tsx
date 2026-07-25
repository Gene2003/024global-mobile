import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { Screen, AppHeader, Card, Button, Loader, useThemedStyles } from '../components/ui';
import { useTheme } from '../lib/theme-context';

export default function ContactServiceProvider() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    container: { flex: 1, justifyContent: 'center' as const, padding: 20 },
    card: { alignItems: 'center' as const },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: t.colors.infoTint, justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 16 },
    serviceTitle: { fontSize: 22, fontWeight: '800' as const, color: t.colors.text, textAlign: 'center' as const, marginBottom: 6 },
    serviceType: { fontSize: 12, fontWeight: '700' as const, color: t.colors.info, backgroundColor: t.colors.infoTint, paddingHorizontal: 14, paddingVertical: 4, borderRadius: t.radius.pill, overflow: 'hidden' as const, marginBottom: 24 },
    infoBox: { backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md, padding: 14, width: '100%' as const, marginBottom: 10 },
    infoLabel: { fontSize: 11, fontWeight: '600' as const, color: t.colors.textMuted, marginBottom: 2 },
    infoValue: { fontSize: 17, fontWeight: '700' as const, color: t.colors.text },
    noPhone: { color: t.colors.textMuted, fontSize: 14, marginTop: 16, marginBottom: 10 },
    homeBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 8 },
    homeBtnText: { color: t.colors.textMuted, fontWeight: '600' as const, fontSize: 14 },
    notFound: { color: t.colors.text, fontSize: 15 },
  }));

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/services/${id}/`)
      .then((res) => setService(res.data))
      .catch(() => Alert.alert('Error', 'Could not load service details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!service) {
    return (
      <Screen>
        <AppHeader title="Contact Provider" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.notFound}>Service not found</Text>
        </View>
      </Screen>
    );
  }

  const rawPhone = service.provider_phone || '';
  const formattedPhone = rawPhone.startsWith('0') ? '+254' + rawPhone.slice(1) : rawPhone;

  return (
    <Screen>
      <AppHeader title="Contact Provider" />
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="car" size={36} color={c.primary} />
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
            <Button
              title="Call Provider"
              icon="call"
              variant="success"
              onPress={() => Linking.openURL(`tel:${formattedPhone}`)}
              style={{ marginTop: 16, marginBottom: 10 }}
            />
          ) : (
            <Text style={styles.noPhone}>Phone number not available</Text>
          )}

          <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
            <Ionicons name="home" size={18} color={c.textMuted} />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </Screen>
  );
}
