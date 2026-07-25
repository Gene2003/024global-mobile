import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../lib/api';
import { isLoggedIn } from '../lib/auth';
import { useTheme } from '../lib/theme-context';
import { Screen, AppHeader, Card, Field, Button } from '../components/ui';

export default function RequestTransport() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!pickup.trim()) {
      Alert.alert('Missing pickup', 'Enter where the goods should be picked up from.');
      return;
    }
    if (!(await isLoggedIn())) {
      Alert.alert('Login required', 'Please log in to request a transporter.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setBusy(true);
    try {
      await api.post('/service-bookings/', {
        service: Number(id),
        pickup_location: pickup,
        dropoff_location: dropoff,
        quantity_kg: quantity ? parseInt(quantity, 10) : null,
        agreed_price: price ? Number(price) : 0,
      });
      Alert.alert('Request sent', 'The transporter has received your pickup request and will respond shortly.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Could not send', err.response?.data?.detail || err.response?.data?.error || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Request Pickup" subtitle={title ? String(title) : undefined} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: c.infoTint, borderColor: 'transparent', marginBottom: 14 }}>
          <Text style={{ color: c.info, fontSize: 13, lineHeight: 19, flex: 1 }}>
            Tell the transporter where to collect and deliver your goods. They&apos;ll accept, log the pickup, and confirm
            delivery — you can track it under My Orders.
          </Text>
        </Card>

        <Card>
          <Field label="Pickup location *" placeholder="Town, market, farm…" value={pickup} onChangeText={setPickup} />
          <Field label="Drop-off location" placeholder="Delivery destination" value={dropoff} onChangeText={setDropoff} />
          <Field label="Quantity (kg)" placeholder="e.g. 500" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          <Field label="Offer price (KES, optional)" placeholder="Leave blank to negotiate" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <Button title="Send request" icon="send" onPress={submit} loading={busy} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
