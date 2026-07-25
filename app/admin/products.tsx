import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, useThemedStyles } from '../../components/ui';

export default function AdminProducts() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    count: { backgroundColor: 'rgba(255,255,255,0.15)', color: t.colors.onHeader, fontWeight: '700' as const, fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' as const },
    center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 },
    loadingText: { fontSize: 14, color: t.colors.textMuted },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center' as const, color: t.colors.textMuted, marginTop: 40, fontSize: 15 },
    card: { backgroundColor: t.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: t.colors.border, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
    cardRow: { flexDirection: 'row' as const, gap: 12, alignItems: 'center' as const, marginBottom: 12 },
    productImage: { width: 64, height: 64, borderRadius: 10 },
    imagePlaceholder: { width: 64, height: 64, borderRadius: 10, backgroundColor: t.colors.surfaceAlt, alignItems: 'center' as const, justifyContent: 'center' as const },
    info: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text },
    vendorName: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
    price: { fontSize: 13, fontWeight: '600' as const, color: t.colors.success, marginTop: 4 },
    cardFooter: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    badge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '700' as const },
    toggleBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    toggleText: { fontSize: 13, fontWeight: '700' as const },
    disabled: { opacity: 0.6 },
  }));

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
    <Screen>
      <AppHeader
        title="Product Monitor"
        subtitle="Vendor product submissions"
        right={<Text style={styles.count}>{products.length}</Text>}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
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
                      <Ionicons name="image" size={24} color={c.placeholder} />
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
                  <View style={[styles.badge, { backgroundColor: visible ? c.successTint : c.dangerTint }]}>
                    <Ionicons
                      name={visible ? 'eye' : 'eye-off'}
                      size={12}
                      color={visible ? c.success : c.danger}
                    />
                    <Text style={[styles.badgeText, { color: visible ? c.success : c.danger }]}>
                      {visible ? 'Visible' : 'Hidden'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      { backgroundColor: visible ? c.dangerTint : c.successTint },
                      isBusy && styles.disabled,
                    ]}
                    onPress={() => toggleVisibility(p)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={visible ? c.danger : c.success} />
                    ) : (
                      <Ionicons
                        name={visible ? 'eye-off' : 'eye'}
                        size={14}
                        color={visible ? c.danger : c.success}
                      />
                    )}
                    <Text style={[styles.toggleText, { color: visible ? c.danger : c.success }]}>
                      {visible ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
