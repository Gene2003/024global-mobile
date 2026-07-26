import * as Location from 'expo-location';

export type Place = { latitude: number; longitude: number; place: string };

/** Ask for permission and return the device's current location + a readable place string. */
export async function getCurrentPlace(): Promise<Place | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  let place = '';
  try {
    const geo = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    if (geo[0]) {
      const g = geo[0];
      place = [g.name, g.subregion || g.city, g.region].filter(Boolean).join(', ');
    }
  } catch {
    /* reverse geocode is best-effort */
  }
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, place };
}
