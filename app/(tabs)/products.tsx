import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { addToCart } from '../../lib/cart';
import { useTheme } from '../../lib/theme-context';
import { useThemedStyles } from '../../components/ui';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  vendor_name: string;
  stock: number;
  is_farm_product?: boolean;
  farmer_price?: string;
  wholesaler_price?: string;
  retailer_price?: string;
}

const priceOf = (p: any): number =>
  Number(p?.price) || Number(p?.retailer_price) || Number(p?.wholesaler_price) || Number(p?.farmer_price) || 0;

export default function ProductsScreen() {
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
    list: { padding: 12 },
    row: { justifyContent: 'space-between' as const },
    card: { backgroundColor: t.colors.surface, borderRadius: t.radius.md, width: '48%' as const, marginBottom: 16, overflow: 'hidden' as const, borderWidth: 1, borderColor: t.colors.border, elevation: 2 },
    image: { width: '100%' as const, height: 130 },
    cardBody: { padding: 10 },
    productName: { fontSize: 13, fontWeight: '700' as const, color: t.colors.text, marginBottom: 4 },
    price: { fontSize: 15, fontWeight: '800' as const, color: t.colors.primary, marginBottom: 2 },
    vendor: { fontSize: 11, color: t.colors.textMuted, marginBottom: 8 },
    actionRow: { flexDirection: 'row' as const, gap: 6 },
    buyBtn: { flex: 1, backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.sm, paddingVertical: 7, alignItems: 'center' as const },
    buyBtnText: { color: t.colors.text, fontSize: 12, fontWeight: '700' as const },
    addBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.sm, paddingVertical: 7, paddingHorizontal: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
    empty: { color: t.colors.textMuted, fontSize: 16 },
  }));

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/products/')
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <View style={[styles.center, { backgroundColor: c.background }]}><ActivityIndicator size="large" color={c.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={c.textMuted} style={{ marginRight: 8 }} />
          <TextInput placeholder="Search products..." placeholderTextColor={c.placeholder} value={search} onChangeText={setSearch} style={styles.searchInput} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${item.id}` as any)}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/200' }} style={styles.image} resizeMode="cover" />
            <View style={styles.cardBody}>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.price}>KES {priceOf(item).toLocaleString()}</Text>
              <Text style={styles.vendor} numberOfLines={1}>{item.vendor_name}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.buyBtn} onPress={() => router.push(`/product/${item.id}` as any)}>
                  <Text style={styles.buyBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() =>
                    addToCart({
                      id: item.id,
                      name: item.name,
                      price: priceOf(item),
                      image: item.image,
                      is_farm_product: item.is_farm_product,
                      vendor_name: item.vendor_name,
                    })
                  }
                >
                  <Ionicons name="cart" size={16} color={c.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No products found</Text></View>}
      />
    </View>
  );
}
