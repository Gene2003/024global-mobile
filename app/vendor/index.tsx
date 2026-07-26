import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import {
  Screen, AppHeader, Segmented, Loader, EmptyState, useThemedStyles,
} from '../../components/ui';

export default function VendorDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center' as const, color: t.colors.textMuted, marginTop: 40, fontSize: 15 },
    emptyBtn: { backgroundColor: t.colors.primary, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: t.radius.md, marginTop: 14 },
    emptyBtnText: { color: t.colors.onPrimary, fontWeight: '700' as const },
    productCard: { flexDirection: 'row' as const, backgroundColor: t.colors.surface, borderRadius: t.radius.lg, padding: 12, marginBottom: 10, gap: 12, alignItems: 'flex-start' as const, borderWidth: 1, borderColor: t.colors.border, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    productImg: { width: 72, height: 72, borderRadius: t.radius.md },
    imgPlaceholder: { width: 72, height: 72, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceAlt, alignItems: 'center' as const, justifyContent: 'center' as const },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text },
    productPrice: { fontSize: 14, color: t.colors.success, fontWeight: '700' as const, marginTop: 4 },
    productStock: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
    outOfStock: { backgroundColor: t.colors.dangerTint, borderRadius: t.radius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' as const, marginTop: 4 },
    outOfStockText: { fontSize: 11, color: t.colors.danger, fontWeight: '700' as const },
    totalCard: { backgroundColor: t.colors.primary, borderRadius: t.radius.lg, padding: 20, marginBottom: 16, alignItems: 'center' as const },
    totalLabel: { fontSize: 13, color: t.colors.onPrimary, opacity: 0.85, fontWeight: '600' as const },
    totalValue: { fontSize: 32, fontWeight: '800' as const, color: t.colors.onPrimary, marginTop: 4 },
    saleCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: t.colors.border, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    saleName: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text, marginBottom: 6 },
    saleRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 6 },
    saleMeta: { fontSize: 13, color: t.colors.textMuted },
    saleTotal: { fontSize: 18, fontWeight: '800' as const, color: t.colors.success },
  }));

  const [tab, setTab] = useState<'products' | 'sales'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/mobile/products/my_products/');
      const raw = res.data;
      setProducts(Array.isArray(raw) ? raw : (raw.results || []));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/orders/vendor-sales/');
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'products') fetchProducts();
    else fetchSales();
  }, [tab]);

  // refresh product list when returning from the edit/add screen
  useFocusEffect(
    useCallback(() => {
      if (tab === 'products') fetchProducts(true);
    }, [tab])
  );

  const getPrice = (p: any) => {
    if (Number(p.retailer_price) > 0) return Number(p.retailer_price);
    if (Number(p.wholesaler_price) > 0) return Number(p.wholesaler_price);
    return Number(p.farmer_price) || 0;
  };

  const getStockLabel = (p: any) =>
    p.is_farm_product ? `${p.quantity_kg ?? 0} kg` : `${p.stock ?? p.quantity_kg ?? 0} units`;

  const totalCollected = sales.reduce((s, r) => s + (Number(r.total_collected) || 0), 0);

  return (
    <Screen>
      <AppHeader
        title="Vendor Dashboard"
        right={
          <TouchableOpacity
            hitSlop={10}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => router.push('/vendor/add-product')}
          >
            <Ionicons name="add" size={22} color={c.onHeader} />
          </TouchableOpacity>
        }
      />

      <Segmented
        options={[
          { key: 'products', label: 'My Products' },
          { key: 'sales', label: 'Sales Overview' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <Loader />
      ) : tab === 'products' ? (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <EmptyState icon="cube-outline" text="No products yet" />
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/vendor/add-product')}>
                <Ionicons name="add" size={16} color={c.onPrimary} />
                <Text style={styles.emptyBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item: p }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.productCard}
              onPress={() => router.push(`/vendor/edit-product?id=${p.id}` as any)}
            >
              {p.image ? (
                <Image source={{ uri: p.image }} style={styles.productImg} />
              ) : (
                <View style={styles.imgPlaceholder}>
                  <Ionicons name="image" size={24} color={c.placeholder} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.productPrice}>KES {getPrice(p).toLocaleString()}</Text>
                <Text style={styles.productStock}>Stock: {getStockLabel(p)}</Text>
                {Number(p.stock ?? p.quantity_kg ?? 0) === 0 && (
                  <View style={styles.outOfStock}>
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="create-outline" size={16} color={c.primary} />
                <Ionicons name="chevron-forward" size={16} color={c.placeholder} />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => String(item.product_id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            sales.length > 0 ? (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Collected</Text>
                <Text style={styles.totalValue}>KES {totalCollected.toLocaleString()}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>No completed sales yet.</Text>}
          renderItem={({ item: s }) => (
            <View style={styles.saleCard}>
              <Text style={styles.saleName}>{s.product_name}</Text>
              <View style={styles.saleRow}>
                <Text style={styles.saleMeta}>Price: KES {Number(s.price).toLocaleString()}</Text>
                <Text style={styles.saleMeta}>
                  Sold: {s.units_sold}{s.is_farm_product ? ' kg' : ''}
                </Text>
              </View>
              <Text style={styles.saleTotal}>KES {Number(s.total_collected).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
