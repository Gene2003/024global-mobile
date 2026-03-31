import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const features = [
    { icon: 'bag-handle', color: '#1d4ed8', title: 'Products', desc: 'Browse and buy farm products', route: '/products' },
    { icon: 'briefcase', color: '#16a34a', title: 'Services', desc: 'Find veterinary, storage & more', route: '/services' },
    { icon: 'car', color: '#d97706', title: 'Transporters', desc: 'Hire transport for your goods', route: '/transporter' },
    { icon: 'person', color: '#7c3aed', title: 'Profile', desc: 'Login or manage your account', route: '/profile' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.logo}>024 GLOBAL CONNECT</Text>
        <Text style={styles.tagline}>Your Agricultural Marketplace</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Buy & Sell Farm Products</Text>
        <Text style={styles.heroSub}>Connect with vendors, service providers and transporters across Kenya</Text>
        <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/products')}>
          <Text style={styles.heroBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Offer</Text>
        <View style={styles.grid}>
          {features.map((f, i) => (
            <TouchableOpacity key={i} style={styles.card} onPress={() => router.push(f.route as any)}>
              <Ionicons name={f.icon as any} size={32} color={f.color} style={{ marginBottom: 10 }} />
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Are you a vendor or service provider?</Text>
        <Text style={styles.ctaSub}>Register today and start selling on 024 Global Connect</Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/register')}>
          <Text style={styles.ctaBtnText}>Register Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#1d4ed8', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
  logo: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: '#bfdbfe', fontSize: 13, marginTop: 4 },
  hero: { backgroundColor: '#eff6ff', padding: 24, margin: 16, borderRadius: 16 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#1e3a8a', marginBottom: 8 },
  heroSub: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 16 },
  heroBtn: { backgroundColor: '#1d4ed8', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '47%', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  cta: { backgroundColor: '#1d4ed8', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 32 },
  ctaTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  ctaSub: { color: '#bfdbfe', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  ctaBtn: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  ctaBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 15 },
});
