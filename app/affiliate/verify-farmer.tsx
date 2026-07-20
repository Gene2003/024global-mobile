import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

type Verification = {
  user_id: number;
  username: string;
  first_name: string;
  phone: string | null;
  vendor_type: string | null;
  verified_at: string;
  code: string;
};

export default function VerifyFarmerScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'verify' | 'history'>('verify');
  const [userId, setUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastIssued, setLastIssued] = useState<{ code: string; user_id: number } | null>(null);

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/users/agent/my-verifications/');
      setVerifications(Array.isArray(res.data?.verifications) ? res.data.verifications : []);
    } catch {
      Alert.alert('Error', 'Failed to load your verifications');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleVerify = async () => {
    const id = userId.trim();
    if (!id) {
      Alert.alert('Missing input', 'Enter the farmer’s user ID');
      return;
    }
    if (!/^\d+$/.test(id)) {
      Alert.alert('Invalid ID', 'The user ID should be a number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/users/agent/verify-farmer/', { user_id: Number(id) });
      const code = res.data?.code;
      setLastIssued({ code, user_id: Number(id) });
      setUserId('');
      Alert.alert(
        'Farmer verified',
        `A verification code has been generated and emailed to the farmer.\n\nCode: ${code}`,
      );
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.error ||
        data?.detail ||
        (typeof data === 'object' ? JSON.stringify(data) : 'Failed to verify farmer');
      Alert.alert('Verification failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const shareCode = async (code: string) => {
    try {
      await Share.share({
        message: `Your 024 Global Connect verification code is ${code}. Use it to authenticate on WhatsApp (+254 700 024 024) or USSD (*024#). Keep it private — 5 wrong attempts locks your account.`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Verify Farmer</Text>
          <Text style={styles.subtitle}>Issue WhatsApp / USSD access codes</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['verify', 'history'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'verify' ? 'Verify Farmer' : 'My Verifications'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'verify' ? (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#1d4ed8" />
              <Text style={styles.infoText}>
                Confirm the farmer is physically present, their produce matches their listing, and
                their identity is verified. Then enter their user ID below.
              </Text>
            </View>

            <Text style={styles.label}>Farmer&rsquo;s User ID *</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="e.g. 42"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleVerify} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.submitText}>Verify & Issue Code</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {lastIssued && (
            <View style={styles.successCard}>
              <View style={styles.successHeader}>
                <Ionicons name="shield-checkmark" size={22} color="#16a34a" />
                <Text style={styles.successTitle}>Code issued</Text>
              </View>
              <Text style={styles.successUser}>User #{lastIssued.user_id}</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{lastIssued.code}</Text>
              </View>
              <Text style={styles.successHint}>
                Emailed to the farmer. You can also share it with them directly.
              </Text>
              <TouchableOpacity style={styles.shareBtn} onPress={() => shareCode(lastIssued.code)}>
                <Ionicons name="share-social" size={16} color="#1d4ed8" />
                <Text style={styles.shareBtnText}>Share code</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {loadingHistory ? (
            <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
          ) : verifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No verifications yet</Text>
              <Text style={styles.emptyText}>Farmers you verify will appear here.</Text>
            </View>
          ) : (
            verifications.map((v) => (
              <View key={v.user_id} style={styles.verifyCard}>
                <View style={styles.verifyTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifyName}>{v.first_name || v.username}</Text>
                    <Text style={styles.verifyMeta}>
                      @{v.username} · {v.vendor_type || 'vendor'}
                    </Text>
                    {v.phone && <Text style={styles.verifyMeta}>{v.phone}</Text>}
                    <Text style={styles.verifyDate}>
                      Verified {new Date(v.verified_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.shareIcon} onPress={() => shareCode(v.code)}>
                    <Ionicons name="share-social" size={18} color="#1d4ed8" />
                  </TouchableOpacity>
                </View>
                <View style={styles.codeBoxSm}>
                  <Text style={styles.codeTextSm}>{v.code}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingTop: 56,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  back: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1d4ed8' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#1d4ed8' },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 13,
    fontSize: 16,
    color: '#111827',
  },
  submitBtn: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  successCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#166534' },
  successUser: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  codeBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  successHint: { fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
  },
  shareBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },

  verifyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  verifyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  verifyName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  verifyMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  verifyDate: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  shareIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  codeBoxSm: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  codeTextSm: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
});
