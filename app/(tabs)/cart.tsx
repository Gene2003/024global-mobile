import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import api from '../../lib/api';
import { useCart, setQuantity, removeFromCart, clearCart, cartTotal } from '../../lib/cart';
import { saveOrders, LocalOrder } from '../../lib/orders';
import { useTheme } from '../../lib/theme-context';
import { AppHeader, Card, Button, Field, EmptyState } from '../../components/ui';

export default function CartScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const { items } = useCart();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [goods, setGoods] = useState('');
  const [busy, setBusy] = useState(false);

  const total = cartTotal(items);
  const hasFarm = items.some((i) => i.is_farm_product);

  const checkout = async () => {
    if (!name || !email || !phone || !address) {
      Alert.alert('Missing details', 'Please fill in your name, email, phone and delivery address.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price })),
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
        guest_address: address,
        goods_description: hasFarm ? goods : '',
      };
      const res = await api.post('/orders/cart-checkout/', payload);
      const urls = res.data?.payment_urls || [];
      if (!urls.length) {
        Alert.alert('Checkout failed', 'No payment link was returned. Please try again.');
        return;
      }
      const now = new Date().toISOString();
      const orders: LocalOrder[] = urls.map((u: any) => ({
        order_id: u.order_id,
        product_name: u.product_name,
        amount: Number(u.amount) || 0,
        reference: u.reference,
        payment_url: u.payment_url,
        status: 'pending',
        created_at: now,
      }));
      await saveOrders(orders);
      await clearCart();
      // open the first payment; the rest can be paid from the Orders screen
      await WebBrowser.openBrowserAsync(urls[0].payment_url);
      router.push('/orders' as any);
    } catch (err: any) {
      Alert.alert('Checkout failed', err.response?.data?.error || 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader title="Your Cart" showBack={false} showThemeToggle />
      {items.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="cart-outline" text="Your cart is empty. Browse products and add items to get started." />
          <View style={{ paddingHorizontal: 24 }}>
            <Button title="Browse Products" icon="storefront" onPress={() => router.push('/products')} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {items.map((item) => (
            <Card key={item.id} padded={false} style={{ flexDirection: 'row', padding: 10, gap: 12, alignItems: 'center' }}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: 64, height: 64, borderRadius: 10 }} />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: c.surfaceAlt }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ color: c.success, fontWeight: '700', marginTop: 2 }}>
                  KES {(item.price * item.quantity).toLocaleString()}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity onPress={() => setQuantity(item.id, item.quantity - 1)}>
                    <Ionicons name="remove-circle" size={26} color={c.textMuted} />
                  </TouchableOpacity>
                  <Text style={{ color: c.text, fontWeight: '700', minWidth: 22, textAlign: 'center' }}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => setQuantity(item.id, item.quantity + 1)}>
                    <Ionicons name="add-circle" size={26} color={c.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={c.danger} />
              </TouchableOpacity>
            </Card>
          ))}

          <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Total</Text>
            <Text style={{ color: c.success, fontWeight: '800', fontSize: 20 }}>KES {total.toLocaleString()}</Text>
          </Card>

          <Card>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>Delivery details</Text>
            <Field label="Full name" placeholder="Your name" value={name} onChangeText={setName} />
            <Field label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Phone" placeholder="07XXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Delivery address" placeholder="Town, street, building, landmark…" value={address} onChangeText={setAddress} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
            {hasFarm ? (
              <Field label="Description of goods (optional)" placeholder="e.g. big potatoes for making fries" value={goods} onChangeText={setGoods} multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
            ) : null}
          </Card>

          <Button title={`Pay KES ${total.toLocaleString()}`} icon="card" onPress={checkout} loading={busy} />
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center' }}>
            Secure payment via Paystack (M-Pesa & card). Each vendor is paid separately.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
