import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny stale-while-revalidate cache. Screens show cached data instantly, then
 * refresh from the network in the background — so navigation feels fast even when
 * the API is slow (e.g. a cold backend).
 */
export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(data));
  } catch {
    /* ignore cache write failures */
  }
}
