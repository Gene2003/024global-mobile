import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  vendor_name: string;
  stock: number;
}

export default function ProductsScreen() {
  const router = useRouter();
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput placeholder="Search products..." value={search} onChangeText={setSearch} style={styles.searchInput} />
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
              <Text style={styles.price}>KES {parseFloat(item.price).toLocaleString()}</Text>
              <Text style={styles.vendor} numberOfLines={1}>{item.vendor_name}</Text>
              <TouchableOpacity style={styles.buyBtn} onPress={() => router.push(`/product/${item.id}` as any)}>
                <Text style={styles.buyBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No products found</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  header: { backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  list: { padding: 12 },
  row: { justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', borderRadius: 12, width: '48%', marginBottom: 16, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', height: 130 },
  cardBody: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '800', color: '#1d4ed8', marginBottom: 2 },
  vendor: { fontSize: 11, color: '#6b7280', marginBottom: 8 },
  buyBtn: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  buyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { color: '#6b7280', fontSize: 16 },
});
