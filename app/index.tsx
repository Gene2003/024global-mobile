import { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme-context';
import { isLoggedIn, getUser, dashboardRoute } from '../lib/auth';

const logo = require('../assets/home/logo.png');

export default function Splash() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  useEffect(() => {
    const t = setTimeout(async () => {
      if (await isLoggedIn()) {
        const user = await getUser();
        router.replace(dashboardRoute(user) as any);
      } else {
        router.replace('/login' as any);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: c.headerBg }]}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.name}>024 GLOBAL CONNECT</Text>
      <Text style={[styles.tagline, { color: c.onHeaderMuted }]}>An Agricultural Marketplace</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 120, height: 120, borderRadius: 24, marginBottom: 18, backgroundColor: '#fff' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  tagline: { fontSize: 15, marginTop: 4, fontWeight: '500' },
});
