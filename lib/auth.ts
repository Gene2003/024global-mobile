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
