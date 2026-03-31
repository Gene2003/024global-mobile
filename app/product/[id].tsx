import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  if (!product) return <View style={styles.center}><Text>Product not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image || 'https://via.placeholder.com/400' }} style={styles.image} resizeMode="cover" />

      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>KES {parseFloat(product.price).toLocaleString()}</Text>
        <Text style={styles.vendor}>Sold by: {product.vendor_name}</Text>
        <Text style={styles.stock}>In stock: {product.stock}</Text>
        <Text style={styles.descLabel}>Description</Text>
        <Text style={styles.desc}>{product.description}</Text>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Your Details</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} placeholder="Enter your name" value={name} onChangeText={setName} />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput style={styles.input} placeholder="07XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Delivery Address *</Text>
        <TextInput style={styles.input} placeholder="Town, County" value={address} onChangeText={setAddress} />

        <Text style={styles.label}>Quantity</Text>
        <TextInput style={styles.input} placeholder="1" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />

        <Text style={styles.label}>Goods Description (optional)</Text>
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Describe the goods..." value={goodsDesc} onChangeText={setGoodsDesc} multiline />

        <TouchableOpacity style={styles.buyBtn} onPress={handleBuy} disabled={buying}>
          {buying
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="cart" size={18} color="#fff" />
                <Text style={styles.buyBtnText}>Buy Now — KES {(parseFloat(product.price || '0') * parseInt(quantity || '1')).toLocaleString()}</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 260 },
  body: { padding: 20 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '800', color: '#1d4ed8', marginBottom: 4 },
  vendor: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  stock: { fontSize: 13, color: '#16a34a', marginBottom: 12 },
  descLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  desc: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 16 },
  divider: { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827' },
  buyBtn: { backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12, marginTop: 24, marginBottom: 32 },
  buyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
