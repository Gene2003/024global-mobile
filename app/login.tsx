import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { saveTokens, saveUser } from '../lib/auth';

export default function LoginScreen() {
  const router = useRouter();
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
      const res = await api.post('/token/', { email, password });
      await saveTokens(res.data.access, res.data.refresh);
      const userRes = await api.get('/users/me/');
      await saveUser(userRes.data);
      router.replace('/(tabs)/profile');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.sub}>Login to your 024 Global Connect account</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f9fafb', padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827' },
  btn: { backgroundColor: '#1d4ed8', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkBold: { color: '#1d4ed8', fontWeight: '700' },
});
