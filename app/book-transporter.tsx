import { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { isLoggedIn } from '../lib/auth';
import { getCurrentPlace } from '../lib/location';
import { useTheme } from '../lib/theme-context';
import {
  Screen,
  AppHeader,
  Card,
  Field,
  Button,
  EmptyState,
  Loader,
  SectionTitle,
  ScrollView,
} from '../components/ui';

const SAMPLE_RATING = 4.5;
const EST_DISTANCE_KM = 15;
const DEFAULT_PRICE_PER_KM = 120;

export default function BookTransporter() {
  const { produce, quantity, pickup: pickupParam } = useLocalSearchParams<{
    produce?: string;
    quantity?: string;
    pickup?: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const [pickup, setPickup] = useState(pickupParam ?? '');
  const [delivery, setDelivery] = useState('');
  const [produceDetails, setProduceDetails] = useState(
    produce ? `${quantity ? `${quantity} kg ` : ''}${produce}`.trim() : ''
  );
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [transporters, setTransporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    api
      .get('/services/', { params: { service_type: 'transport' } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setTransporters(data.filter((s: any) => s.service_type === 'transport'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const useFarmGps = async () => {
    setLocating(true);
    try {
      const place = await getCurrentPlace();
      if (!place || !place.place) {
        Alert.alert(
          'Location unavailable',
          'Could not detect your farm location. Please enable location permission or type it manually.'
        );
        return;
      }
      setPickup(place.place);
    } catch {
      Alert.alert('Location unavailable', 'Could not detect your farm location. Please type it manually.');
    } finally {
      setLocating(false);
    }
  };

  const book = async (transporter: any) => {
    if (!pickup.trim() || !delivery.trim()) {
      Alert.alert('Missing details', 'Please fill in both the pickup and delivery locations first.');
      return;
    }
    if (!(await isLoggedIn())) {
      Alert.alert('Sign in required', 'Please sign in to book a transporter.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }
    const pricePerKm = Number(transporter.price || DEFAULT_PRICE_PER_KM);
    setBookingId(transporter.id);
    try {
      await api.post('/service-bookings/', {
        service: transporter.id,
        pickup_location: pickup,
        dropoff_location: delivery,
        quantity_kg: quantity ? parseInt(quantity, 10) || null : null,
        agreed_price: pricePerKm * EST_DISTANCE_KM,
      });
      setBooked(true);
    } catch (err: any) {
      Alert.alert(
        'Could not book',
        err.response?.data?.detail || err.response?.data?.error || 'Please try again.'
      );
    } finally {
      setBookingId(null);
    }
  };

  if (booked) {
    return (
      <Screen>
        <AppHeader title="Book a Transporter" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: c.successTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={52} color={c.success} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.text, textAlign: 'center' }}>Booking sent!</Text>
          <Text style={{ fontSize: 15, color: c.textMuted, textAlign: 'center', lineHeight: 22 }}>
            The transporter will confirm within one hour.
          </Text>
          <Button title="Done" icon="checkmark-done" onPress={() => router.back()} style={{ marginTop: 8, minWidth: 200 }} fullWidth={false} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Book a Transporter" />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {/* PICKUP LOCATION */}
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Pickup location"
                placeholder="Your farm location"
                value={pickup}
                onChangeText={setPickup}
                style={{ marginBottom: 0 } as any}
              />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Button
                title="Use farm GPS"
                icon="location"
                variant="outline"
                onPress={useFarmGps}
                loading={locating}
                fullWidth={false}
              />
            </View>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
            Auto-detected from your farm, editable.
          </Text>
        </Card>

        {/* DELIVERY LOCATION */}
        <Card style={{ marginBottom: 14 }}>
          <Field
            label="Delivery location"
            placeholder="Type the destination"
            value={delivery}
            onChangeText={setDelivery}
            style={{ marginBottom: 0 } as any}
          />
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>or pin on map (coming soon)</Text>
        </Card>

        {/* PRODUCE DETAILS */}
        <Card style={{ marginBottom: 14 }}>
          <Field
            label="Produce details"
            placeholder="e.g. 500 kg maize"
            value={produceDetails}
            onChangeText={setProduceDetails}
            style={{ marginBottom: 0 } as any}
          />
        </Card>

        {/* DATE & TIME OF PICKUP */}
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Date of pickup"
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                style={{ marginBottom: 0 } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Time of pickup"
                placeholder="e.g. 9:00 AM"
                value={time}
                onChangeText={setTime}
                style={{ marginBottom: 0 } as any}
              />
            </View>
          </View>
        </Card>

        {/* AVAILABLE TRANSPORTERS */}
        <SectionTitle style={{ marginTop: 8 }}>Available transporters (sorted by proximity)</SectionTitle>

        {loading ? (
          <View style={{ height: 200 }}>
            <Loader />
          </View>
        ) : transporters.length === 0 ? (
          <EmptyState icon="car-outline" text="No transporters available right now." />
        ) : (
          transporters.map((t) => {
            const pricePerKm = Number(t.price || DEFAULT_PRICE_PER_KM);
            const estTotal = pricePerKm * EST_DISTANCE_KM;
            return (
              <Card key={t.id} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {/* avatar */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: c.infoTint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="car-sport" size={26} color={c.info} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: c.text }}>
                      {t.provider_name || 'Transporter'}
                    </Text>
                    <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{t.title || 'Truck'}</Text>
                    <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>Cargo: general goods</Text>

                    {/* rating */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 }}>
                      {[0, 1, 2, 3, 4].map((i) => {
                        const name =
                          i + 1 <= Math.floor(SAMPLE_RATING)
                            ? 'star'
                            : i < SAMPLE_RATING
                            ? 'star-half'
                            : 'star-outline';
                        return <Ionicons key={i} name={name} size={15} color={c.gold} />;
                      })}
                      <Text style={{ fontSize: 13, color: c.gold, fontWeight: '700', marginLeft: 4 }}>
                        {SAMPLE_RATING.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: c.border,
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 14, color: c.text }}>
                    Price per km: <Text style={{ fontWeight: '700' }}>KES {pricePerKm}/km</Text>
                  </Text>
                  <Text style={{ fontSize: 14, color: c.text }}>
                    Est. total: <Text style={{ fontWeight: '800', color: c.primary }}>KES {estTotal.toLocaleString()}</Text>{' '}
                    <Text style={{ fontSize: 12, color: c.textMuted }}>(est. ~{EST_DISTANCE_KM} km trip)</Text>
                  </Text>
                </View>

                <Button
                  title="Book"
                  icon="cube"
                  onPress={() => book(t)}
                  loading={bookingId === t.id}
                  style={{ marginTop: 12 }}
                />
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
