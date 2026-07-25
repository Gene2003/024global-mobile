import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { useTheme } from '../lib/theme-context';
import { Screen, AppHeader, Card, Field, Button } from '../components/ui';

export default function ForgotPassword() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post('/users/password/reset/', { email: email.trim() });
      setSent(true);
    } catch {
      // endpoint always returns generic success; treat network errors gracefully
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Reset Password" />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {sent ? (
          <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.successTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="mail-open" size={30} color={c.success} />
            </View>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>Check your email</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              If an account exists for {email}, we&apos;ve sent a link to reset your password. Follow it to choose a new
              password, then come back and log in.
            </Text>
            <Button title="Back to login" icon="log-in" onPress={() => router.replace('/login')} style={{ marginTop: 6 }} />
          </Card>
        ) : (
          <Card>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 17, marginBottom: 6 }}>Forgot your password?</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
              Enter the email you registered with and we&apos;ll send you a link to reset your password.
            </Text>
            <Field
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button title="Send reset link" icon="send" onPress={submit} loading={busy} disabled={!email.trim()} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
