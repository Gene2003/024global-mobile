import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'delivery_profile';

export type DeliveryProfile = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export async function getDeliveryProfile(): Promise<DeliveryProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveDeliveryProfile(p: DeliveryProfile) {
  await AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
}
