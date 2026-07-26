import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { saveTokens, saveUser, setGuest, clearGuest, dashboardRoute } from '../lib/auth';
import { useTheme } from '../lib/theme-context';
import { Screen, Button, Field, PasswordField, ScrollView, useThemedStyles } from '../components/ui';

const logo = require('../assets/home/logo.png');

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    header: { alignItems: 'center' as const, paddingTop: 56, paddingBottom: 20, backgroundColor: t.colors.headerBg },
    logo: { width: 76, height: 76, borderRadius: 18, backgroundColor: '#fff', marginBottom: 10 },
    brand: { color: '#fff', fontSize: 18, fontWeight: '800' as const, letterSpacing: 0.5 },
    tagline: { color: t.colors.onHeaderMuted, fontSize: 12, marginTop: 2 },
    body: { padding: 24 },
    title: { fontSize: 26, fontWeight: '800' as const, color: t.colors.text, marginBottom: 4 },
    sub: { fontSize: 14, color: t.colors.textMuted, marginBottom: 24 },
    label: { fontSize: 12, fontWeight: '700' as const, color: t.colors.textMuted, letterSpacing: 1, marginBottom: 6 },
    link: { alignItems: 'center' as const, marginTop: 16 },
    linkBold: { color: t.colors.primary, fontWeight: '700' as const, fontSize: 14 },
    dividerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: t.colors.border },
    dividerText: { color: t.colors.textMuted, fontSize: 12, marginHorizontal: 10 },
    signupRow: { flexDirection: 'row' as const, justifyContent: 'center' as const, marginTop: 18 },
    signupText: { color: t.colors.textMuted, fontSize: 14 },
  }));

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter your phone/email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/token/', { username: identifier.trim(), password });
      await saveTokens(res.data.access, res.data.refresh);
      // fetch the full mobile profile (verification_code, service_provider_type, …)
      let user = res.data.user;
      try {
        const me = await api.get('/users/mobile/me/');
        user = me.data;
      } catch {
        /* fall back to the login response user */
      }
      await saveUser(user);
      await clearGuest();
      const name = user?.first_name || '';
      Alert.alert('Welcome back!', name ? `Great to see you again, ${name}.` : 'Great to see you again.', [
        { text: 'Continue', onPress: () => router.replace(dashboardRoute(user) as any) },
      ]);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const browseAsGuest = async () => {
    await setGuest();
    router.replace('/(tabs)' as any);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>024 GLOBAL CONNECT</Text>
          <Text style={styles.tagline}>An Agricultural Marketplace</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.sub}>Log in to your account to continue</Text>

          <Text style={styles.label}>PHONE OR EMAIL</Text>
          <Field
            placeholder="Enter your phone number or email"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <PasswordField placeholder="Enter your password" value={password} onChangeText={setPassword} />

          <Button title="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: 6 }} />

          <TouchableOpacity style={styles.link} onPress={() => router.push('/forgot-password' as any)}>
            <Text style={styles.linkBold}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Button title="Browse as Guest" variant="outline" icon="storefront" onPress={browseAsGuest} />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New here? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.linkBold}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
