import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    certificate_number: '',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    const { first_name, last_name, username, email, phone, password, confirm_password, certificate_number } = form;
    if (!first_name || !last_name || !username || !email || !password || !confirm_password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirm_password) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/register/', {
        first_name,
        last_name,
        username,
        email,
        phone,
        password,
        confirm_password,
        certificate_number,
        role: 'user',
      });
      Alert.alert(
        'Registration Submitted',
        'Your account is pending admin approval. You will receive an email once activated.',
        [{ text: 'OK', onPress: () => router.replace('/login') }],
      );
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
        Alert.alert('Registration Failed', messages);
      } else {
        Alert.alert('Registration Failed', 'Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.sub}>Register for 024 Global Connect</Text>

      <View style={styles.form}>
        <Field label="First Name *" value={form.first_name} onChange={(v) => set('first_name', v)} placeholder="First name" />
        <Field label="Last Name *" value={form.last_name} onChange={(v) => set('last_name', v)} placeholder="Last name" />
        <Field label="Username *" value={form.username} onChange={(v) => set('username', v)} placeholder="Choose a username" autoCapitalize="none" />
        <Field label="Email *" value={form.email} onChange={(v) => set('email', v)} placeholder="Your email address" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="e.g. +254712345678" keyboardType="phone-pad" />
        <Field label="Affiliate Certificate Number *" value={form.certificate_number} onChange={(v) => set('certificate_number', v)} placeholder="Enter your certificate number" />
        <Field label="Password *" value={form.password} onChange={(v) => set('password', v)} placeholder="Create a password" secureTextEntry />
        <Field label="Confirm Password *" value={form.confirm_password} onChange={(v) => set('confirm_password', v)} placeholder="Repeat your password" secureTextEntry />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.replace('/login')}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType, autoCapitalize, secureTextEntry,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  keyboardType?: any; autoCapitalize?: any; secureTextEntry?: boolean;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#9ca3af"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f9fafb', padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  form: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827' },
  btn: { backgroundColor: '#1d4ed8', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkBold: { color: '#1d4ed8', fontWeight: '700' },
});
