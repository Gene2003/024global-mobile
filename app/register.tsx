import { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, Modal, FlatList, TextInput, StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { saveTokens, saveUser, clearGuest, dashboardRoute } from '../lib/auth';
import { KENYA_COUNTIES } from '../lib/constants';
import { useTheme } from '../lib/theme-context';
import { Screen, AppHeader, Card, Button, Field, PasswordField } from '../components/ui';

type RoleKey = 'farmer' | 'buyer' | 'transporter' | 'affiliate';

const ROLES: { key: RoleKey; label: string; desc: string; icon: any }[] = [
  { key: 'farmer', label: 'Farmer', desc: 'Sell your produce directly to buyers', icon: 'leaf' },
  { key: 'buyer', label: 'Buyer', desc: 'Browse and order fresh farm produce', icon: 'cart' },
  { key: 'transporter', label: 'Transporter', desc: 'Offer transport, handle pickups & deliveries', icon: 'car' },
  { key: 'affiliate', label: 'Affiliate', desc: 'Onboard farmers and earn commissions', icon: 'people' },
];

const STEPS = ['Role', 'Details', 'Verify'];

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<RoleKey | null>(null);

  // step 2
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [county, setCounty] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCounties, setShowCounties] = useState(false);
  const [countyQuery, setCountyQuery] = useState('');

  // step 3
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // success
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const code = digits.join('');

  /* ── step 2 → request OTP ── */
  const requestOtp = async (advance: boolean) => {
    if (advance) {
      if (!fullName.trim()) return Alert.alert('Error', 'Enter your full name');
      if (!phone.trim()) return Alert.alert('Error', 'Enter your phone number');
      if (!email.trim() || !email.includes('@')) return Alert.alert('Error', 'Enter a valid email');
      if (!county) return Alert.alert('Error', 'Select your county');
      if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
      if (password !== confirm) return Alert.alert('Error', 'Passwords do not match');
    }
    setSending(true);
    try {
      const res = await api.post('/users/otp/request/', { phone: phone.trim() });
      if (res.data?.dev_code) {
        setDigits(String(res.data.dev_code).padStart(6, '0').slice(0, 6).split(''));
      }
      if (advance) setStep(3);
      else Alert.alert('Code sent', 'A new verification code has been sent to your phone.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not send the verification code.');
    } finally {
      setSending(false);
    }
  };

  /* ── step 3 → create account ── */
  const createAccount = async () => {
    if (code.length !== 6) return Alert.alert('Error', 'Enter the 6-digit code');
    setVerifying(true);
    try {
      const res = await api.post('/users/mobile-signup/', {
        role_card: role,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        county,
        password,
        otp: code,
      });
      await saveTokens(res.data.access, res.data.refresh);
      await saveUser(res.data.user);
      await clearGuest();
      setCreatedUser(res.data.user);
      setVerificationCode(res.data.verification_code);
    } catch (err: any) {
      Alert.alert('Sign-up failed', err.response?.data?.error || 'Please check the code and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const setDigit = (i: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length > 1) {
      const next = [...digits];
      clean.split('').slice(0, 6 - i).forEach((ch, k) => (next[i + k] = ch));
      setDigits(next);
      const last = Math.min(i + clean.length, 5);
      otpRefs.current[last]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const filteredCounties = KENYA_COUNTIES.filter((x) => x.toLowerCase().includes(countyQuery.toLowerCase()));

  /* ── SUCCESS SCREEN ── */
  if (verificationCode) {
    return (
      <Screen>
        <AppHeader title="You're all set" showBack={false} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.successTint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="checkmark-circle" size={40} color={c.success} />
            </View>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>Account created!</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', marginTop: 6 }}>
              Welcome to 024 Global Connect{createdUser?.first_name ? `, ${createdUser.first_name}` : ''}.
            </Text>
          </View>

          <Card style={{ alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: c.infoTint, borderColor: 'transparent' }}>
            <Text style={{ color: c.info, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>YOUR 024 VERIFICATION CODE</Text>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: '800', letterSpacing: 2 }}>{verificationCode}</Text>
            <TouchableOpacity
              onPress={async () => { await Clipboard.setStringAsync(verificationCode); Alert.alert('Copied', 'Verification code copied.'); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name="copy-outline" size={16} color={c.info} />
              <Text style={{ color: c.info, fontWeight: '700' }}>Copy code</Text>
            </TouchableOpacity>
          </Card>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-start' }}>
            <Ionicons name="logo-whatsapp" size={18} color={c.success} />
            <Text style={{ color: c.textMuted, fontSize: 13, flex: 1, lineHeight: 19 }}>
              Save this code for WhatsApp access. It&apos;s also stored in your dashboard, so you can find it anytime.
            </Text>
          </View>

          <Button
            title="Go to My Dashboard"
            icon="arrow-forward"
            style={{ marginTop: 24 }}
            onPress={() => router.replace(dashboardRoute(createdUser) as any)}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Create Account" showBack={step === 1} />

      {/* Step indicator */}
      <View style={styles.stepper}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  { backgroundColor: active || done ? c.primary : c.surfaceAlt, borderColor: active ? c.primary : 'transparent' },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={16} color={c.onPrimary} />
                ) : (
                  <Text style={{ color: active ? c.onPrimary : c.textMuted, fontWeight: '800', fontSize: 13 }}>{n}</Text>
                )}
              </View>
              <Text style={{ color: active ? c.text : c.textMuted, fontSize: 12, fontWeight: '600', marginTop: 4 }}>{label}</Text>
              {i < STEPS.length - 1 ? <View style={[styles.stepLine, { backgroundColor: done ? c.primary : c.border }]} /> : null}
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* ── STEP 1: ROLE ── */}
        {step === 1 && (
          <>
            <Text style={[styles.h, { color: c.text }]}>Who are you joining as?</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>Choose the role that fits you. You can pick only one.</Text>
            {ROLES.map((r) => {
              const selected = role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  activeOpacity={0.85}
                  onPress={() => setRole(r.key)}
                  style={[
                    styles.roleCard,
                    { backgroundColor: c.surface, borderColor: selected ? c.primary : c.border, borderWidth: selected ? 2 : 1 },
                  ]}
                >
                  <View style={[styles.roleIcon, { backgroundColor: selected ? c.primary : c.infoTint }]}>
                    <Ionicons name={r.icon} size={24} color={selected ? c.onPrimary : c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{r.label}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{r.desc}</Text>
                  </View>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? c.primary : c.placeholder}
                  />
                </TouchableOpacity>
              );
            })}
            <Button title="Continue" icon="arrow-forward" disabled={!role} onPress={() => setStep(2)} style={{ marginTop: 8 }} />
          </>
        )}

        {/* ── STEP 2: DETAILS ── */}
        {step === 2 && (
          <>
            <Text style={[styles.h, { color: c.text }]}>Your details</Text>
            <Field label="Full name" placeholder="e.g. Jane Wanjiku" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <Field label="Phone number" placeholder="07XXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>County</Text>
            <TouchableOpacity
              onPress={() => setShowCounties(true)}
              style={[styles.picker, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <Text style={{ color: county ? c.text : c.placeholder, fontSize: 15 }}>{county || 'Select your county'}</Text>
              <Ionicons name="chevron-down" size={18} color={c.textMuted} />
            </TouchableOpacity>
            <View style={{ height: 14 }} />

            <PasswordField label="Password (min 8 characters)" placeholder="Create a password" value={password} onChangeText={setPassword} />
            <PasswordField label="Confirm password" placeholder="Re-enter password" value={confirm} onChangeText={setConfirm} />

            <Button title="Send verification code" icon="arrow-forward" loading={sending} onPress={() => requestOtp(true)} style={{ marginTop: 6 }} />
            <Button title="Back" variant="ghost" onPress={() => setStep(1)} />
          </>
        )}

        {/* ── STEP 3: OTP ── */}
        {step === 3 && (
          <>
            <Text style={[styles.h, { color: c.text }]}>Verify your phone</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>Enter the 6-digit code we sent to {phone}.</Text>

            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  value={d}
                  onChangeText={(v) => setDigit(i, v)}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) otpRefs.current[i - 1]?.focus();
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.otpBox, { backgroundColor: c.surface, borderColor: d ? c.primary : c.border, color: c.text }]}
                />
              ))}
            </View>

            <TouchableOpacity onPress={() => requestOtp(false)} disabled={sending} style={{ alignItems: 'center', marginTop: 18 }}>
              <Text style={{ color: c.textMuted, fontSize: 14 }}>
                Didn&apos;t receive code? <Text style={{ color: c.primary, fontWeight: '700' }}>Resend</Text>
              </Text>
            </TouchableOpacity>

            <Button title="Verify & Create Account" icon="checkmark" loading={verifying} onPress={createAccount} style={{ marginTop: 24 }} />
            <Button title="Back" variant="ghost" onPress={() => setStep(2)} />
          </>
        )}
      </ScrollView>

      {/* County picker modal */}
      <Modal visible={showCounties} animationType="slide" transparent onRequestClose={() => setShowCounties(false)}>
        <View style={styles.modalWrap}>
          <View style={[styles.modalCard, { backgroundColor: c.background }]}>
            <View style={styles.modalHead}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Select County</Text>
              <TouchableOpacity onPress={() => setShowCounties(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.picker, { backgroundColor: c.surface, borderColor: c.border, marginBottom: 8 }]}>
              <Ionicons name="search" size={18} color={c.textMuted} />
              <TextInput
                placeholder="Search counties..."
                placeholderTextColor={c.placeholder}
                value={countyQuery}
                onChangeText={setCountyQuery}
                style={{ flex: 1, marginLeft: 8, color: c.text }}
              />
            </View>
            <FlatList
              data={filteredCounties}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setCounty(item); setShowCounties(false); setCountyQuery(''); }}
                  style={[styles.countyRow, { borderBottomColor: c.border }]}
                >
                  <Text style={{ color: c.text, fontSize: 15 }}>{item}</Text>
                  {county === item ? <Ionicons name="checkmark" size={18} color={c.primary} /> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 16 },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepLine: { position: 'absolute', top: 16, left: '60%', right: '-40%', height: 2 },
  h: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 16 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, marginBottom: 12 },
  roleIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  otpBox: { width: 48, height: 56, borderWidth: 1.5, borderRadius: 12, textAlign: 'center', fontSize: 22, fontWeight: '800' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { height: '75%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
