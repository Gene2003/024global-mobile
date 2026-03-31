import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUser, logout } from '../../lib/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => { getUser().then(setUser); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); setUser(null); } },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Ionicons name="person" size={48} color="#9ca3af" /></View>
          <Text style={styles.guestTitle}>Welcome to 024 Global Connect</Text>
          <Text style={styles.guestSub}>Login or register to access your dashboard</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Ionicons name="log-in" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/register')}>
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.avatar}><Ionicons name="person" size={48} color="#1d4ed8" /></View>
        <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>{user.role?.toUpperCase()}</Text></View>
      </View>
      <View style={styles.menu}>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  hero: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 72, paddingBottom: 32, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  guestTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  guestSub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  buttons: { padding: 24, gap: 12 },
  loginBtn: { backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  registerBtn: { borderWidth: 2, borderColor: '#1d4ed8', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  registerBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  menu: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  logoutItem: { marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
});
