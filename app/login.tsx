import { useState } from 'react';
import { Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { saveTokens, saveUser } from '../lib/auth';
import { useTheme } from '../lib/theme-context';
import { Screen, AppHeader, Button, Field, ScrollView, useThemedStyles } from '../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    container: { flexGrow: 1, padding: 24, justifyContent: 'center' as const },
    title: { fontSize: 28, fontWeight: '800' as const, color: t.colors.text, marginBottom: 8 },
    sub: { fontSize: 14, color: t.colors.textMuted, marginBottom: 32 },
    link: { alignItems: 'center' as const, marginTop: 16 },
    linkText: { color: t.colors.textMuted, fontSize: 14 },
    linkBold: { color: t.colors.primary, fontWeight: '700' as const },
  }));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      // Backend serializer reads 'username' field — send email value under that key
      const res = await api.post('/token/', { username: email, password });
      await saveTokens(res.data.access, res.data.refresh);
      // Login response already includes user object
      await saveUser(res.data.user);
      router.replace('/(tabs)/profile');
    } catch (err: any) {
      const msg = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Invalid email or password';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Login" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Login to your 024 Global Connect account</Text>

        <Field
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button title="Login" onPress={handleLogin} loading={loading} style={{ marginTop: 12 }} />

        <TouchableOpacity style={styles.link} onPress={() => router.push('/forgot-password' as any)}>
          <Text style={styles.linkBold}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
