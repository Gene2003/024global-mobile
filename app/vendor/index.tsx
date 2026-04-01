import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function VendorDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'products' | 'sales'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/products/my_products/');
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

  const getPrice = (p: any) => {
    if (Number(p.retailer_price) > 0) return Number(p.retailer_price);
    if (Number(p.wholesaler_price) > 0) return Number(p.wholesaler_price);
    return Number(p.farmer_price) || 0;
  };

  const getStockLabel = (p: any) =>
    p.is_farm_product ? `${p.quantity_kg ?? 0} kg` : `${p.stock ?? p.quantity_kg ?? 0} units`;

  const totalCollected = sales.reduce((s, r) => s + (Number(r.total_collected) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Vendor Dashboard</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/vendor/add-product')}>
          <Ionicons name="add" size={22} color="#1d4ed8" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'products', label: 'My Products' },
          { key: 'sales', label: 'Sales Overview' },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : tab === 'products' ? (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No products yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/vendor/add-product')}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item: p }) => (
            <View style={styles.productCard}>
              {p.image ? (
                <Image source={{ uri: p.image }} style={styles.productImg} />
              ) : (
                <View style={styles.imgPlaceholder}>
                  <Ionicons name="image" size={24} color="#d1d5db" />
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
            </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#111827' },
  addBtn: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 8 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1d4ed8' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#1d4ed8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 14 },
  emptyTitle: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  emptyBtn: { backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, gap: 12, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  productImg: { width: 72, height: 72, borderRadius: 10 },
  imgPlaceholder: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  productPrice: { fontSize: 14, color: '#16a34a', fontWeight: '700', marginTop: 4 },
  productStock: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  outOfStock: { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  outOfStockText: { fontSize: 11, color: '#dc2626', fontWeight: '700' },
  totalCard: { backgroundColor: '#1d4ed8', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#bfdbfe', fontWeight: '600' },
  totalValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
  saleCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  saleName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  saleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  saleMeta: { fontSize: 13, color: '#6b7280' },
  saleTotal: { fontSize: 18, fontWeight: '800', color: '#16a34a' },
});
