import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveTokens(access: string, refresh: string) {
  await AsyncStorage.multiSet([
    ['access_token', access],
    ['refresh_token', refresh],
  ]);
}

export async function saveUser(user: object) {
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function getUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function logout() {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
}

export async function isLoggedIn() {
  const token = await AsyncStorage.getItem('access_token');
  return !!token;
}

/* ── guest (browse-only) mode ── */
export async function setGuest() {
  await AsyncStorage.setItem('guest_mode', '1');
}
export async function isGuest() {
  return (await AsyncStorage.getItem('guest_mode')) === '1';
}
export async function clearGuest() {
  await AsyncStorage.removeItem('guest_mode');
}

/** Route a signed-in user to their home dashboard based on role. */
export function dashboardRoute(user: any): string {
  if (!user) return '/(tabs)';
  const role = user.role;
  const vt = user.vendor_type;
  const spt = user.service_provider_type;
  if (role === 'admin') return '/admin';
  if (role === 'user') return '/affiliate';
  if (role === 'vendor') return vt === 'farmer' ? '/farmer' : '/vendor';
  if (role === 'service_provider') return spt === 'transport' ? '/transporter-dashboard' : '/service-provider';
  return '/(tabs)'; // customer / buyer -> marketplace
}
