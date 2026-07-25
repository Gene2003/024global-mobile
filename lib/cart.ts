import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'guest_cart';

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  is_farm_product?: boolean;
  vendor_name?: string;
  quantity: number;
};

type Listener = (items: CartItem[]) => void;
const listeners = new Set<Listener>();
let cache: CartItem[] | null = null;

async function read(): Promise<CartItem[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

async function write(items: CartItem[]) {
  cache = items;
  await AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  listeners.forEach((l) => l(items));
}

export async function getCart(): Promise<CartItem[]> {
  return read();
}

export async function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
  const items = [...(await read())];
  const existing = items.find((i) => i.id === item.id);
  if (existing) existing.quantity += qty;
  else items.push({ ...item, quantity: qty });
  await write(items);
}

export async function setQuantity(id: number, quantity: number) {
  let items = await read();
  items = items
    .map((i) => (i.id === id ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  await write([...items]);
}

export async function removeFromCart(id: number) {
  const items = (await read()).filter((i) => i.id !== id);
  await write(items);
}

export async function clearCart() {
  await write([]);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/** React hook — live cart with count/total, updates across screens. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>(cache ?? []);
  useEffect(() => {
    let mounted = true;
    read().then((i) => mounted && setItems([...i]));
    const listener: Listener = (i) => setItems([...i]);
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);
  return { items, count: cartCount(items), total: cartTotal(items) };
}
