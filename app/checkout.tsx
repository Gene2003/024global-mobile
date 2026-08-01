import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import api from '../lib/api';
import { getCart, clearCart, cartTotal, CartItem } from '../lib/cart';
import { orderFees } from '../lib/constants';
import { getDeliveryProfile, DeliveryProfile } from '../lib/prefs';
import { saveOrders, LocalOrder } from '../lib/orders';
import { useTheme } from '../lib/theme-context';
import { Screen, AppHeader, Card, Button, Loader } from '../components/ui';

export default function Checkout() {
  const { method } = useLocalSearchParams<{ method?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const isMpesa = (method || 'mpesa') === 'mpesa';

  const [items, setItems] = useState<CartItem[] | null>(null);
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<{ reference: string; orderId: number } | null>(null);

  useEffect(() => {
    Promise.all([getCart(), getDeliveryProfile()]).then(([cart, prof]) => {
      setItems(cart);
      setProfile(prof);
    });
  }, []);

  if (!items) return <Loader />;

  const subtotal = cartTotal(items);
  const fees = orderFees(subtotal);

  const pay = async () => {
    if (!profile) {
      Alert.alert('Delivery address', 'Please set a delivery address in your cart first.');
      return;
    }
    setPaying(true);
    try {
      const res = await api.post('/orders/mobile/checkout/', {
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price })),
        guest_name: profile.name,
        guest_email: profile.email,
        guest_phone: profile.phone,
        guest_address: profile.address,
        total_amount: fees.total,
        goods_description: '',
      });
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
      const reference = urls[0].reference;
      const orderId = urls[0].order_id;
      await saveOrders(orders); // saved as 'pending' so it appears in My Orders
      // open the secure Paystack page — M-Pesa STK requires the PIN to complete
      await WebBrowser.openBrowserAsync(urls[0].payment_url);

      // only confirm the order once Paystack says the payment actually succeeded
      let paid = false;
      for (let i = 0; i < 3 && !paid; i++) {
        try {
          const v = await api.get(`/orders/mobile/verify/${reference}/`);
          if (v.data?.paid) paid = true;
        } catch {
          /* ignore, retry */
        }
        if (!paid && i < 2) await new Promise((r) => setTimeout(r, 2500));
      }

      if (paid) {
        await clearCart();
        setDone({ reference, orderId });
      } else {
        Alert.alert(
          'Payment not completed',
          "We haven't received your M-Pesa payment. If you entered your PIN it may still be processing — check My Orders shortly, or tap Pay now there to retry.",
          [
            { text: 'View Orders', onPress: () => router.replace('/orders' as any) },
            { text: 'OK' },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Checkout failed', err.response?.data?.error || 'Please try again in a moment.');
    } finally {
      setPaying(false);
    }
  };

  /* ── SUCCESS ── */
  if (done) {
    return (
      <Screen>
        <AppHeader title="Order Placed" showBack={false} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: c.successTint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="checkmark-circle" size={44} color={c.success} />
            </View>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>Order placed!</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 6 }}>Reference: {done.reference}</Text>
          </View>

          <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 }}>
            <Ionicons name="notifications" size={20} color={c.primary} />
            <Text style={{ color: c.text, flex: 1, fontSize: 14 }}>The farmer has been notified of your order.</Text>
          </Card>

          <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 }}>
            <Ionicons name="shield-checkmark" size={20} color={c.success} />
            <Text style={{ color: c.text, flex: 1, fontSize: 13 }}>Payment processed securely via Paystack.</Text>
          </Card>

          <Button title="Track Order" icon="navigate" style={{ marginTop: 22 }} onPress={() => router.replace(`/track-order?id=${done.orderId}` as any)} />
          <Button title="Back to Market" variant="ghost" onPress={() => router.replace('/(tabs)/products' as any)} />
        </ScrollView>
      </Screen>
    );
  }

  /* ── CONFIRM / PAY ── */
  return (
    <Screen>
      <AppHeader title="Checkout" />
      {paying ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Loader />
          <Text style={{ color: c.textMuted, marginTop: 16, textAlign: 'center' }}>Placing your order…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>Payment</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Ionicons name={isMpesa ? 'phone-portrait' : 'card'} size={22} color={c.primary} />
              <Text style={{ color: c.textMuted, flex: 1, fontSize: 14, lineHeight: 20 }}>
                {isMpesa
                  ? "You'll be taken to a secure Paystack page. Choose M-Pesa and you'll get a prompt on your phone — enter your PIN to complete payment."
                  : "You'll be taken to a secure Paystack page to complete your card / bank payment."}
              </Text>
            </View>
          </Card>

          <Card style={{ gap: 10, marginTop: 12 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>Summary</Text>
            <Row label="Subtotal" value={`KES ${fees.subtotal.toLocaleString()}`} c={c} />
            <Row label="Delivery fee" value={`KES ${fees.delivery.toLocaleString()}`} c={c} />
            <Row label="Platform fee (5%)" value={`KES ${fees.platform.toLocaleString()}`} c={c} />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Total</Text>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 18 }}>KES {fees.total.toLocaleString()}</Text>
            </View>
          </Card>

          <Button title={`Pay KES ${fees.total.toLocaleString()}`} icon="lock-closed" onPress={pay} style={{ marginTop: 16 }} />
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            Secure payment via Paystack (M-Pesa & card).
          </Text>
        </ScrollView>
      )}
    </Screen>
  );
}

function Row({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: c.textMuted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
