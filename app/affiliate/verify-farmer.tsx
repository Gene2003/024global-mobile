import { useEffect, useState } from 'react';
import { View, Text, Alert, Share, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import {
  Screen,
  AppHeader,
  ScrollView,
  Segmented,
  Card,
  Field,
  Button,
  EmptyState,
  Loader,
  useThemedStyles,
} from '../../components/ui';

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
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useStyles();

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
    <Screen>
      <AppHeader title="Verify Farmer" subtitle="Issue WhatsApp / USSD access codes" />

      <Segmented
        options={[
          { key: 'verify', label: 'Verify Farmer' },
          { key: 'history', label: 'My Verifications' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'verify' ? (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <Card>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color={c.info} />
              <Text style={styles.infoText}>
                Confirm the farmer is physically present, their produce matches their listing, and
                their identity is verified. Then enter their user ID below.
              </Text>
            </View>

            <Field
              label="Farmer’s User ID *"
              value={userId}
              onChangeText={setUserId}
              placeholder="e.g. 42"
              placeholderTextColor={c.placeholder}
              keyboardType="numeric"
            />

            <Button
              title="Verify & Issue Code"
              icon="checkmark-circle"
              loading={submitting}
              disabled={submitting}
              onPress={handleVerify}
            />
          </Card>

          {lastIssued && (
            <Card style={styles.successCard}>
              <View style={styles.successHeader}>
                <Ionicons name="shield-checkmark" size={22} color={c.success} />
                <Text style={styles.successTitle}>Code issued</Text>
              </View>
              <Text style={styles.successUser}>User #{lastIssued.user_id}</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{lastIssued.code}</Text>
              </View>
              <Text style={styles.successHint}>
                Emailed to the farmer. You can also share it with them directly.
              </Text>
              <Button
                title="Share code"
                icon="share-social"
                variant="outline"
                style={styles.shareBtn}
                onPress={() => shareCode(lastIssued.code)}
              />
            </Card>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {loadingHistory ? (
            <Loader />
          ) : verifications.length === 0 ? (
            <EmptyState icon="people-outline" text="No verifications yet. Farmers you verify will appear here." />
          ) : (
            verifications.map((v) => (
              <Card key={v.user_id} style={styles.verifyCard}>
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
                    <Ionicons name="share-social" size={18} color={c.info} />
                  </TouchableOpacity>
                </View>
                <View style={styles.codeBoxSm}>
                  <Text style={styles.codeTextSm}>{v.code}</Text>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const useStyles = () =>
  useThemedStyles((t) => ({
    body: { flex: 1 },
    bodyContent: { padding: 16, paddingBottom: 40 },

    infoRow: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: t.colors.infoTint,
      borderRadius: t.radius.md,
      padding: 12,
      marginBottom: 16,
    },
    infoText: { flex: 1, fontSize: 13, color: t.colors.info, lineHeight: 18 },

    successCard: { marginTop: 16 },
    successHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    successTitle: { fontSize: 16, fontWeight: '700', color: t.colors.success },
    successUser: { fontSize: 13, color: t.colors.textMuted, marginBottom: 10 },
    codeBox: {
      backgroundColor: t.colors.infoTint,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    codeText: {
      fontSize: 22,
      fontWeight: '800',
      color: t.colors.info,
      letterSpacing: 2,
      fontFamily: 'monospace',
    },
    successHint: { fontSize: 12, color: t.colors.textMuted, marginTop: 8, textAlign: 'center' },
    shareBtn: { marginTop: 12 },

    verifyCard: { marginBottom: 10 },
    verifyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    verifyName: { fontSize: 15, fontWeight: '700', color: t.colors.text },
    verifyMeta: { fontSize: 13, color: t.colors.textMuted, marginTop: 2 },
    verifyDate: { fontSize: 12, color: t.colors.textMuted, marginTop: 4 },
    shareIcon: {
      padding: 8,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.infoTint,
    },
    codeBoxSm: {
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.sm,
      paddingVertical: 10,
      marginTop: 10,
      alignItems: 'center',
    },
    codeTextSm: {
      fontSize: 16,
      fontWeight: '700',
      color: t.colors.text,
      letterSpacing: 1.5,
      fontFamily: 'monospace',
    },
  }));
