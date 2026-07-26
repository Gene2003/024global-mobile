import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart, setQuantity, removeFromCart, cartTotal } from '../../lib/cart';
import { orderFees } from '../../lib/constants';
import { getDeliveryProfile, saveDeliveryProfile, DeliveryProfile } from '../../lib/prefs';
import { useTheme } from '../../lib/theme-context';
import { AppHeader, Card, Button, Field, EmptyState } from '../../components/ui';

type Method = 'mpesa' | 'bank';

export default function CartScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const { items } = useCart();

  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DeliveryProfile>({ name: '', phone: '', email: '', address: '' });
  const [method, setMethod] = useState<Method>('mpesa');

  useEffect(() => {
    getDeliveryProfile().then((p) => {
      if (p) {
        setProfile(p);
        setForm(p);
      }
    });
  }, []);

  const subtotal = cartTotal(items);
  const fees = orderFees(subtotal);

  const saveAddress = async () => {
    if (!form.name || !form.phone || !form.address) {
      Alert.alert('Missing details', 'Enter at least your name, phone and delivery address.');
      return;
    }
    await saveDeliveryProfile(form);
    setProfile(form);
    setEditing(false);
  };

  const placeOrder = () => {
    if (!profile) {
      Alert.alert('Delivery address', 'Please set your delivery address first.');
      return;
    }
    router.push(`/checkout?method=${method}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader title="Your Cart" showBack={false} showThemeToggle />

      {items.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="cart-outline" text="Your cart is empty. Browse the market and add items to get started." />
          <View style={{ paddingHorizontal: 24 }}>
            <Button title="Browse Market" icon="storefront" onPress={() => router.push('/products')} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
            {/* Items — swipe left to remove */}
            <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 4 }}>Swipe an item left to remove it.</Text>
            {items.map((item) => (
              <Swipeable
                key={item.id}
                renderRightActions={() => (
                  <View style={[styles.deleteAction, { backgroundColor: c.danger }]}>
                    <Ionicons name="trash" size={22} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Remove</Text>
                  </View>
                )}
                onSwipeableOpen={() => removeFromCart(item.id)}
              >
                <Card padded={false} style={{ flexDirection: 'row', padding: 10, gap: 12, alignItems: 'center' }}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: c.surfaceAlt }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ color: c.success, fontWeight: '700', marginTop: 2 }}>KES {(item.price * item.quantity).toLocaleString()}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
                      <TouchableOpacity onPress={() => setQuantity(item.id, item.quantity - 1)}>
                        <Ionicons name="remove-circle" size={26} color={c.textMuted} />
                      </TouchableOpacity>
                      <Text style={{ color: c.text, fontWeight: '700', minWidth: 22, textAlign: 'center' }}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => setQuantity(item.id, item.quantity + 1)}>
                        <Ionicons name="add-circle" size={26} color={c.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              </Swipeable>
            ))}

            {/* Order summary */}
            <Card style={{ gap: 10 }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>Order Summary</Text>
              <Row label="Subtotal" value={`KES ${fees.subtotal.toLocaleString()}`} c={c} />
              <Row label="Delivery fee" value={`KES ${fees.delivery.toLocaleString()}`} c={c} />
              <Row label="Platform fee (5%)" value={`KES ${fees.platform.toLocaleString()}`} c={c} />
              <View style={{ height: 1, backgroundColor: c.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Total</Text>
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 18 }}>KES {fees.total.toLocaleString()}</Text>
              </View>
            </Card>

            {/* Delivery address */}
            <Card style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>Delivery Address</Text>
                {profile ? (
                  <TouchableOpacity onPress={() => setEditing(true)}>
                    <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>Change</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {profile ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Ionicons name="location" size={18} color={c.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '600' }}>{profile.name} · {profile.phone}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{profile.address}</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={c.primary} />
                  <Text style={{ color: c.primary, fontWeight: '700' }}>Set delivery address</Text>
                </TouchableOpacity>
              )}
            </Card>

            {/* Payment method */}
            <Card style={{ gap: 10 }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>Payment Method</Text>
              <PayOption
                active={method === 'mpesa'}
                onPress={() => setMethod('mpesa')}
                icon="phone-portrait"
                title="M-Pesa"
                sub="Pay via M-Pesa prompt (default)"
                c={c}
                theme={theme}
              />
              <PayOption
                active={method === 'bank'}
                onPress={() => setMethod('bank')}
                icon="card"
                title="Bank Transfer"
                sub="Pay by card / bank"
                c={c}
                theme={theme}
              />
            </Card>
          </ScrollView>

          {/* Sticky place-order bar */}
          <View style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
            <View>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Total</Text>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 18 }}>KES {fees.total.toLocaleString()}</Text>
            </View>
            <Button title="Place Order" icon="arrow-forward" onPress={placeOrder} fullWidth={false} style={{ flex: 1, marginLeft: 16 }} />
          </View>
        </>
      )}

      {/* Address modal */}
      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={styles.modalWrap}>
          <View style={[styles.modalCard, { backgroundColor: c.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setEditing(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.text} />
              </TouchableOpacity>
            </View>
            <Field label="Full name" placeholder="Your name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Field label="Phone" placeholder="07XXXXXXXX" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <Field label="Email" placeholder="you@example.com" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Delivery address" placeholder="Town, street, building, landmark…" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
            <Button title="Save address" icon="checkmark" onPress={saveAddress} />
          </View>
        </View>
      </Modal>
    </View>
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

function PayOption({ active, onPress, icon, title, sub, c, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: active ? 2 : 1,
        borderColor: active ? c.primary : c.border,
        borderRadius: theme.radius.md,
        padding: 12,
        backgroundColor: active ? c.infoTint : 'transparent',
      }}
    >
      <Ionicons name={icon} size={22} color={active ? c.primary : c.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>{sub}</Text>
      </View>
      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? c.primary : c.placeholder} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 64, height: 64, borderRadius: 10 },
  deleteAction: { width: 92, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginVertical: 0, gap: 4 },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
});
