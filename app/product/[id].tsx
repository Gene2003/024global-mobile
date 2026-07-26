import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { addToCart } from '../../lib/cart';
import { isLoggedIn } from '../../lib/auth';
import { Screen, AppHeader, Button, Loader, useThemedStyles } from '../../components/ui';
import { useTheme } from '../../lib/theme-context';

/** API returns farmer/wholesaler/retailer prices; `price` may be absent on GET. */
const priceOf = (p: any): number =>
  Number(p?.price) || Number(p?.retailer_price) || Number(p?.wholesaler_price) || Number(p?.farmer_price) || 0;

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const styles = useThemedStyles((t) => ({
    image: { width: '100%' as const, height: 260 },
    placeholder: {
      width: '100%' as const,
      height: 260,
      backgroundColor: t.colors.surfaceAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    body: { padding: 20, gap: 12 },
    name: { fontSize: 24, fontWeight: '800' as const, color: t.colors.text },
    price: { fontSize: 24, fontWeight: '800' as const, color: t.colors.success },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
    metaText: { fontSize: 14, color: t.colors.text },
    locationText: { fontSize: 14, color: t.colors.textMuted },
    qtyLabel: { fontSize: 13, fontWeight: '700' as const, color: t.colors.textMuted, marginBottom: 6 },
    qtyRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 18 },
    qtyBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    qtyValue: { fontSize: 20, fontWeight: '800' as const, color: t.colors.text, minWidth: 40, textAlign: 'center' as const },
    divider: { borderTopWidth: 1, borderTopColor: t.colors.border, marginVertical: 4 },
    descHeading: { fontSize: 18, fontWeight: '800' as const, color: t.colors.text, marginBottom: 6 },
    desc: { fontSize: 14, color: t.colors.textMuted, lineHeight: 22 },
    actions: { gap: 12, marginTop: 8, marginBottom: 32 },
    notFound: { color: t.colors.text, fontSize: 15 },
  }));

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get(`/mobile/products/${id}/`)
      .then((res) => setProduct(res.data))
      .catch(() => Alert.alert('Error', 'Could not load product'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!product) {
    return (
      <Screen>
        <AppHeader title="Product" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.notFound}>Product not found</Text>
        </View>
      </Screen>
    );
  }

  const unit: string = product.unit || 'kg';
  const price = priceOf(product);
  const available = product.quantity_kg ?? product.stock;
  const maxQty = product.quantity_kg != null ? Number(product.quantity_kg) : undefined;
  const location = product.location || product.vendor_city || product.vendor_name;

  const dec = () => setQuantity((q) => Math.max(1, q - 1));
  const inc = () => setQuantity((q) => (maxQty ? Math.min(maxQty, q + 1) : q + 1));

  const cartItem = () => ({
    id: product.id,
    name: product.name,
    price,
    image: product.image,
    is_farm_product: product.is_farm_product,
    vendor_name: product.vendor_name,
  });

  const requireLogin = async (): Promise<boolean> => {
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

  const handleAddToCart = async () => {
    if (!(await requireLogin())) return;
    await addToCart(cartItem(), quantity);
    Alert.alert('Added to cart', `${product.name} (x${quantity}) was added to your cart.`, [
      { text: 'Keep shopping' },
      { text: 'View cart', onPress: () => router.push('/cart' as any) },
    ]);
  };

  const handleOrderNow = async () => {
    if (!(await requireLogin())) return;
    await addToCart(cartItem(), quantity);
    router.push('/cart' as any);
  };

  return (
    <Screen>
      <AppHeader title="Product" />
      <ScrollView>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={56} color={c.border} />
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>

          <Text style={styles.price}>
            KES {price.toLocaleString()} <Text style={{ fontSize: 16, fontWeight: '600', color: c.textMuted }}>/ {unit}</Text>
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="cube-outline" size={16} color={c.primary} />
            <Text style={styles.metaText}>{available} {unit} available</Text>
          </View>

          {location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={c.textMuted} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={dec} activeOpacity={0.8} style={styles.qtyBtn} hitSlop={6}>
                <Ionicons name="remove" size={22} color={c.onPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity onPress={inc} activeOpacity={0.8} style={styles.qtyBtn} hitSlop={6}>
                <Ionicons name="add" size={22} color={c.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View>
            <Text style={styles.descHeading}>Description</Text>
            <Text style={styles.desc}>{product.description}</Text>
          </View>

          <View style={styles.actions}>
            <Button title="Add to Cart" icon="cart-outline" onPress={handleAddToCart} />
            <Button title="Order Now" icon="flash-outline" variant="outline" onPress={handleOrderNow} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
