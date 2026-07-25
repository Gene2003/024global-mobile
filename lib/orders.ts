import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'my_orders';

/** A locally-remembered order so guests can find/track what they bought. */
export type LocalOrder = {
  order_id: number;
  product_name: string;
  amount: number;
  reference: string;
  payment_url: string;
  status: string; // pending | completed | failed | processing
  created_at: string; // ISO
};

export async function getOrders(): Promise<LocalOrder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: LocalOrder[] = raw ? JSON.parse(raw) : [];
    // newest first
    return list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  } catch {
    return [];
  }
}

export async function saveOrders(newOrders: LocalOrder[]) {
  const existing = await getOrders();
  const byId = new Map<number, LocalOrder>();
  [...existing, ...newOrders].forEach((o) => byId.set(o.order_id, o));
  await AsyncStorage.setItem(KEY, JSON.stringify([...byId.values()])).catch(() => {});
}

export async function updateOrderStatus(order_id: number, status: string) {
  const list = await getOrders();
  const next = list.map((o) => (o.order_id === order_id ? { ...o, status } : o));
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}
