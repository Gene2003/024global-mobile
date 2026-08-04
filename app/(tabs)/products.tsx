import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { addToCart } from '../../lib/cart';
import { isLoggedIn } from '../../lib/auth';
import { readCache, writeCache } from '../../lib/cache';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, Badge, Button, EmptyState, Loader, useThemedStyles } from '../../components/ui';

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
  category_name?: string;
  approved?: boolean;
  county?: string;
  vendor_type?: string;
}

const priceOf = (p: any): number =>
  Number(p?.price) || Number(p?.retailer_price) || Number(p?.wholesaler_price) || Number(p?.farmer_price) || 0;

export default function ProductsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const styles = useThemedStyles((t) => ({
    searchWrap: {
      backgroundColor: t.colors.background,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    searchBox: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 15, color: t.colors.text, marginLeft: 8 },
    list: { padding: 16, paddingBottom: 32 },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      marginBottom: 16,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: t.colors.border,
      shadowColor: t.colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    imageWrap: { width: '100%' as const, height: 180, backgroundColor: t.colors.surfaceAlt },
    image: { width: '100%' as const, height: 180 },
    placeholder: {
      width: '100%' as const,
      height: 180,
      backgroundColor: t.colors.surfaceAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    verified: {
      position: 'absolute' as const,
      top: 10,
      right: 10,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#FFFFFF',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: t.colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 3,
    },
    body: { padding: 14 },
    name: { fontSize: 16, fontWeight: '800' as const, color: t.colors.text, marginTop: 8, marginBottom: 4 },
    location: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginBottom: 8 },
    locationText: { fontSize: 13, color: t.colors.textMuted },
    price: { fontSize: 18, fontWeight: '800' as const, color: t.colors.primary, marginBottom: 12 },
    actionRow: { flexDirection: 'row' as const, gap: 10 },
  }));

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    // 1) show cached products instantly (no spinner on repeat visits)
    readCache<Product[]>('mobile_products').then((cached) => {
      if (mounted && cached && cached.length) {
        setProducts(cached);
        setLoading(false);
      }
    });
    // 2) refresh from the network in the background
    api
      .get('/mobile/products/')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        if (mounted) {
          setProducts(list);
          writeCache('mobile_products', list);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  const requireAuth = async (): Promise<boolean> => {
    if (await isLoggedIn()) return true;
    Alert.alert(
      'Sign in to place order',
      'Browsing as a guest is view-only. Please sign in to order or add items to your cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]
    );
    return false;
  };

  const cartPayload = (item: Product) => ({
    id: item.id,
    name: item.name,
    price: priceOf(item),
    image: item.image,
    is_farm_product: item.is_farm_product,
    vendor_name: item.vendor_name,
  });

  const handleAddToCart = async (item: Product) => {
    if (!(await requireAuth())) return;
    await addToCart(cartPayload(item));
    Alert.alert('Added to cart', `${item.name} has been added to your cart.`);
  };

  const handleOrderNow = async (item: Product) => {
    if (!(await requireAuth())) return;
    await addToCart(cartPayload(item));
    router.push('/cart' as any);
  };

  const renderItem = ({ item }: { item: Product }) => {
    const location = item.vendor_type || item.county || item.vendor_name;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => router.push(`/product/${item.id}` as any)}
      >
        <View style={styles.imageWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={40} color={c.placeholder} />
            </View>
          )}
          {item.approved === true ? (
            <View style={styles.verified}>
              <Ionicons name="checkmark-circle" size={24} color={c.success} />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {item.category_name ? <Badge label={item.category_name} tone="info" /> : null}
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.location}>
            <Ionicons name="location-outline" size={14} color={c.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <Text style={styles.price}>KES {priceOf(item).toLocaleString()}</Text>
          <View style={styles.actionRow}>
            <Button
              title="Order Now"
              icon="flash-outline"
              onPress={() => handleOrderNow(item)}
              style={{ flex: 1 }}
            />
            <Button
              title="Add to Cart"
              variant="outline"
              icon="cart-outline"
              onPress={() => handleAddToCart(item)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <AppHeader title="Marketplace" showBack={false} showThemeToggle />

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={c.placeholder}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="storefront-outline" text="No products found" />}
        />
      )}
    </Screen>
  );
}
