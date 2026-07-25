import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, Card, Badge, Button, EmptyState, Loader, Segmented } from '../../components/ui';

type Listing = {
  id: number;
  name: string;
  vendor_name: string;
  category_name: string;
  approved: boolean;
  image: string | null;
  created_at: string;
};

export default function VerifyListings() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tab, setTab] = useState<'pending' | 'verified'>('pending');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/users/agent/pending-listings/');
      setListings(Array.isArray(res.data?.listings) ? res.data.listings : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const verify = async (l: Listing, approved: boolean) => {
    setBusyId(l.id);
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, approved } : x)));
    try {
      await api.post(`/users/agent/listings/${l.id}/verify/`, { approved });
    } catch (err: any) {
      load(true);
      Alert.alert('Failed', err.response?.data?.error || 'Could not update the listing.');
    } finally {
      setBusyId(null);
    }
  };

  const shown = listings.filter((l) => (tab === 'pending' ? !l.approved : l.approved));

  if (loading) return <Loader />;

  return (
    <Screen>
      <AppHeader title="Verify Listings" subtitle="Approve produce from farmers you onboarded" />
      <Segmented
        options={[
          { key: 'pending', label: 'Pending' },
          { key: 'verified', label: 'Verified' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        {shown.length === 0 ? (
          <EmptyState
            icon={tab === 'pending' ? 'checkmark-done-circle-outline' : 'leaf-outline'}
            text={
              tab === 'pending'
                ? 'No listings waiting for verification. New produce from your farmers appears here.'
                : 'No verified listings yet.'
            }
          />
        ) : (
          shown.map((l) => (
            <Card key={l.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }} padded>
              {l.image ? (
                <Image source={{ uri: l.image }} style={{ width: 60, height: 60, borderRadius: 10 }} />
              ) : (
                <View style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="leaf" size={22} color={c.placeholder} />
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                  {l.name}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={1}>
                  {l.vendor_name}
                  {l.category_name ? ` · ${l.category_name}` : ''}
                </Text>
                {l.approved ? (
                  <Badge label="VERIFIED" tone="success" />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                    <Button title="Verify" icon="checkmark" onPress={() => verify(l, true)} loading={busyId === l.id} fullWidth={false} style={{ paddingVertical: 8, paddingHorizontal: 16 }} />
                  </View>
                )}
              </View>
              {l.approved ? (
                <Button title="Unverify" variant="ghost" onPress={() => verify(l, false)} fullWidth={false} style={{ paddingVertical: 6, paddingHorizontal: 10 }} />
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
