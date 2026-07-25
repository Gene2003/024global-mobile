import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../lib/api';
import { addToCart } from '../../lib/cart';
import { Screen, AppHeader, Button, Field, Loader, useThemedStyles } from '../../components/ui';

/** API returns farmer/wholesaler/retailer prices; `price` may be absent on GET. */
const priceOf = (p: any): number =>
  Number(p?.price) || Number(p?.retailer_price) || Number(p?.wholesaler_price) || Number(p?.farmer_price) || 0;

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    body: { padding: 20 },
    image: { width: '100%' as const, height: 260 },
    name: { fontSize: 22, fontWeight: '800' as const, color: t.colors.text, marginBottom: 8 },
    price: { fontSize: 24, fontWeight: '800' as const, color: t.colors.success, marginBottom: 4 },
    vendor: { fontSize: 13, color: t.colors.textMuted, marginBottom: 2 },
    stock: { fontSize: 13, color: t.colors.success, marginBottom: 12 },
    descLabel: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text, marginBottom: 4 },
    desc: { fontSize: 14, color: t.colors.textMuted, lineHeight: 22, marginBottom: 16 },
    divider: { borderTopWidth: 1, borderTopColor: t.colors.border, marginVertical: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: t.colors.text, marginBottom: 12 },
    notFound: { color: t.colors.text, fontSize: 15 },
  }));

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('1');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [goodsDesc, setGoodsDesc] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}/`)
      .then((res) => setProduct(res.data))
      .catch(() => Alert.alert('Error', 'Could not load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!name || !phone || !address || !email) {
      Alert.alert('Error', 'Please fill in all your details');
      return;
    }
    setBuying(true);
    try {
      const res = await api.post('/orders/checkout/', {
        items: [{ product_id: product?.id, quantity: parseInt(quantity) }],
        guest_name: name,
        guest_phone: phone,
        guest_address: address,
        guest_email: email,
        goods_description: goodsDesc,
      });
      const paymentUrl = res.data.payment_urls?.[0]?.payment_url;
      if (paymentUrl) {
        await Linking.openURL(paymentUrl);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not initiate payment');
    } finally {
      setBuying(false);
    }
  };

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

  return (
    <Screen>
      <AppHeader title="Product" />
      <ScrollView>
        <Image source={{ uri: product.image || 'https://via.placeholder.com/400' }} style={styles.image} resizeMode="cover" />

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>KES {priceOf(product).toLocaleString()}</Text>
          <Text style={styles.vendor}>Sold by: {product.vendor_name}</Text>
          <Text style={styles.stock}>In stock: {product.stock}</Text>
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.desc}>{product.description}</Text>

          <Button
            title="Add to Cart"
            icon="cart-outline"
            variant="outline"
            onPress={async () => {
              await addToCart({
                id: product.id,
                name: product.name,
                price: priceOf(product),
                image: product.image,
                is_farm_product: product.is_farm_product,
                vendor_name: product.vendor_name,
              });
              Alert.alert('Added to cart', `${product.name} was added to your cart.`, [
                { text: 'Keep shopping' },
                { text: 'View cart', onPress: () => router.push('/cart' as any) },
              ]);
            }}
          />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Or buy this item now</Text>

          <Field label="Full Name *" placeholder="Enter your name" value={name} onChangeText={setName} />
          <Field label="Phone Number *" placeholder="07XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Email *" placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Delivery Address *" placeholder="Town, County" value={address} onChangeText={setAddress} />
          <Field label="Quantity" placeholder="1" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
          <Field label="Goods Description (optional)" placeholder="Describe the goods..." value={goodsDesc} onChangeText={setGoodsDesc} multiline style={{ height: 80, textAlignVertical: 'top' }} />

          <Button
            title={buying ? 'Processing...' : `Buy Now — KES ${(parseFloat(product.price || '0') * parseInt(quantity || '1')).toLocaleString()}`}
            icon="cart"
            onPress={handleBuy}
            loading={buying}
            disabled={buying}
            style={{ marginTop: 10, marginBottom: 32 }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
