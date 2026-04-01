import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/users/admin/products/');
      const raw = res.data;
      setProducts(Array.isArray(raw) ? raw : (raw.results || []));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleVisibility = async (product: any) => {
    setBusyId(product.id);
    const newValue = product.is_visible === false ? true : false;
    // Optimistic update
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_visible: newValue } : p));
    try {
      await api.patch(`/users/admin/products/${product.id}/toggle/`, {});
      fetchProducts(true);
    } catch (err: any) {
      // Revert on failure
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_visible: product.is_visible } : p));
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to update product visibility';
      Alert.alert('Error', msg);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Product Monitor</Text>
        <Text style={styles.count}>{products.length}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
          renderItem={({ item: p }) => {
            const visible = p.is_visible !== false;
            const isBusy = busyId === p.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={styles.productImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image" size={24} color="#d1d5db" />
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.vendorName}>Vendor: {p.vendor_name || p.vendor || '—'}</Text>
                    <Text style={styles.price}>
                      KES {Number(p.price || p.retailer_price || p.farmer_price || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={[styles.badge, { backgroundColor: visible ? '#dcfce7' : '#fee2e2' }]}>
                    <Ionicons
                      name={visible ? 'eye' : 'eye-off'}
                      size={12}
                      color={visible ? '#16a34a' : '#dc2626'}
                    />
                    <Text style={[styles.badgeText, { color: visible ? '#16a34a' : '#dc2626' }]}>
                      {visible ? 'Visible' : 'Hidden'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      { backgroundColor: visible ? '#fee2e2' : '#dcfce7' },
                      isBusy && styles.disabled,
                    ]}
                    onPress={() => toggleVisibility(p)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={visible ? '#dc2626' : '#16a34a'} />
                    ) : (
                      <Ionicons
                        name={visible ? 'eye-off' : 'eye'}
                        size={14}
                        color={visible ? '#dc2626' : '#16a34a'}
                      />
                    )}
                    <Text style={[styles.toggleText, { color: visible ? '#dc2626' : '#16a34a' }]}>
                      {visible ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#111827' },
  count: { backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: '700', fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  productImage: { width: 64, height: 64, borderRadius: 10 },
  imagePlaceholder: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  vendorName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  price: { fontSize: 13, fontWeight: '600', color: '#16a34a', marginTop: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  toggleText: { fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
