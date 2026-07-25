import { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  Alert, Switch, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { useTheme } from '../lib/theme-context';
import { Screen, AppHeader, Button, Field, ScrollView, useThemedStyles } from '../components/ui';

const COUNTRY_CITY_DATA: Record<string, string[]> = {
  Kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru', 'Machakos'],
  Nigeria: ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt'],
  Ghana: ['Accra', 'Kumasi', 'Takoradi', 'Tamale'],
  Uganda: ['Kampala', 'Entebbe', 'Jinja'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Durban'],
  Other: ['Other'],
};

const PROMOTION_METHODS = ['Blog', 'Social Media', 'Email Marketing', 'YouTube', 'Referral', 'Other'];

type Role = 'user' | 'vendor' | 'service_provider';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useStyles();

  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    country: '',
    city: '',
    role: 'user' as Role,
    // affiliate
    certificate_number: '',
    social_media_handles: '',
    promotion_methods: [] as string[],
    // vendor
    vendor_type: '',
    affiliate_certificate_number: '',
    // service provider
    service_provider_type: '',
    // terms
    termsAccepted: false,
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const togglePromoMethod = (method: string) => {
    setForm((f) => ({
      ...f,
      promotion_methods: f.promotion_methods.includes(method)
        ? f.promotion_methods.filter((m) => m !== method)
        : [...f.promotion_methods, method],
    }));
  };

  const validate = () => {
    if (!form.first_name.trim()) return 'First name is required';
    if (!form.last_name.trim()) return 'Last name is required';
    if (!form.username.trim()) return 'Username is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.password) return 'Password is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirm_password) return 'Passwords do not match';
    if (form.role === 'user' && !form.certificate_number.trim()) return 'Certificate number is required for affiliates';
    if (form.role === 'vendor' && !form.vendor_type) return 'Please select a vendor type';
    if (form.role === 'service_provider' && !form.service_provider_type) return 'Please select a service provider type';
    if (!form.termsAccepted) return 'You must accept the terms and policies';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert('Error', err); return; }

    setLoading(true);
    try {
      if (form.role === 'vendor' || form.role === 'service_provider') {
        const endpoint = form.role === 'vendor'
          ? '/users/vendor/initiate-payment/'
          : '/users/service-provider/initiate-payment/';
        const res = await api.post(endpoint, form);
        if (res.data.payment_url) {
          await Linking.openURL(res.data.payment_url);
        } else {
          Alert.alert('Error', 'Payment URL not received. Please try again.');
        }
      } else {
        await api.post('/users/register/', {
          first_name: form.first_name,
          last_name: form.last_name,
          username: form.username,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirm_password: form.confirm_password,
          country: form.country,
          city: form.city,
          certificate_number: form.certificate_number,
          social_media_handles: form.social_media_handles,
          promotion_methods: form.promotion_methods,
          role: 'user',
        });
        Alert.alert(
          'Registration Submitted',
          'Your account is pending admin approval. You will receive an email once activated.',
          [{ text: 'OK', onPress: () => router.replace('/login') }],
        );
      }
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

  const countryOptions = Object.keys(COUNTRY_CITY_DATA);
  const cityOptions = form.country ? COUNTRY_CITY_DATA[form.country] || [] : [];

  const btnLabel = (form.role === 'vendor' || form.role === 'service_provider')
    ? 'Pay Registration Fee (KES 200)'
    : 'Register Now';

  return (
    <Screen>
      <AppHeader title="Create Account" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.sub}>Register for 024 Global Connect</Text>

        {/* Basic fields */}
        <Field label="First Name *" value={form.first_name} onChangeText={(v) => set('first_name', v)} placeholder="First name" autoCapitalize="words" />
        <Field label="Last Name *" value={form.last_name} onChangeText={(v) => set('last_name', v)} placeholder="Last name" autoCapitalize="words" />
        <Field label="Username *" value={form.username} onChangeText={(v) => set('username', v)} placeholder="Choose a username" autoCapitalize="none" />
        <Field label="Email *" value={form.email} onChangeText={(v) => set('email', v)} placeholder="Your email address" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Password *" value={form.password} onChangeText={(v) => set('password', v)} placeholder="At least 8 characters" secureTextEntry autoCapitalize="words" />
        <Field label="Confirm Password *" value={form.confirm_password} onChangeText={(v) => set('confirm_password', v)} placeholder="Repeat your password" secureTextEntry autoCapitalize="words" />

        {/* Country picker */}
        <Text style={styles.label}>Country</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowCountryPicker(!showCountryPicker)}>
          <Text style={form.country ? styles.pickerText : styles.pickerPlaceholder}>
            {form.country || 'Select Country'}
          </Text>
          <Ionicons name={showCountryPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
        </TouchableOpacity>
        {showCountryPicker && (
          <View style={styles.dropdown}>
            {countryOptions.map((co) => (
              <TouchableOpacity key={co} style={styles.dropdownItem} onPress={() => { set('country', co); set('city', ''); setShowCountryPicker(false); }}>
                <Text style={styles.dropdownText}>{co}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* City picker */}
        <Text style={styles.label}>City</Text>
        <TouchableOpacity style={[styles.picker, !form.country && styles.disabled]} onPress={() => form.country && setShowCityPicker(!showCityPicker)}>
          <Text style={form.city ? styles.pickerText : styles.pickerPlaceholder}>
            {form.city || 'Select City'}
          </Text>
          <Ionicons name={showCityPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
        </TouchableOpacity>
        {showCityPicker && (
          <View style={styles.dropdown}>
            {cityOptions.map((ci) => (
              <TouchableOpacity key={ci} style={styles.dropdownItem} onPress={() => { set('city', ci); setShowCityPicker(false); }}>
                <Text style={styles.dropdownText}>{ci}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Promotion Methods */}
        <Text style={styles.label}>Promotion Methods</Text>
        <View style={styles.checkboxGroup}>
          {PROMOTION_METHODS.map((m) => (
            <TouchableOpacity key={m} style={styles.checkboxRow} onPress={() => togglePromoMethod(m)}>
              <View style={[styles.checkbox, form.promotion_methods.includes(m) && styles.checkboxChecked]}>
                {form.promotion_methods.includes(m) && <Ionicons name="checkmark" size={14} color={c.onPrimary} />}
              </View>
              <Text style={styles.checkboxLabel}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Role */}
        <Text style={styles.label}>Register as</Text>
        <View style={styles.roleRow}>
          {(['user', 'vendor', 'service_provider'] as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
              onPress={() => set('role', r)}
            >
              <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>
                {r === 'user' ? 'Affiliate' : r === 'vendor' ? 'Vendor' : 'Service Provider'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.roleHint}>
          {form.role === 'user' && 'Promote products and earn commission.'}
          {form.role === 'vendor' && 'Upload products to sell. Requires KES 200 registration fee.'}
          {form.role === 'service_provider' && 'Offer services to users. Requires KES 200 registration fee.'}
        </Text>

        {/* Affiliate fields */}
        {form.role === 'user' && (
          <>
            <Field label="Certificate Number *" value={form.certificate_number} onChangeText={(v) => set('certificate_number', v)} placeholder="Enter your affiliate certificate number" autoCapitalize="none" />
            <Field label="Social Media Handles" value={form.social_media_handles} onChangeText={(v) => set('social_media_handles', v)} placeholder="e.g. @yourhandle" autoCapitalize="none" />
          </>
        )}

        {/* Vendor fields */}
        {form.role === 'vendor' && (
          <>
            <Text style={styles.label}>Vendor Type *</Text>
            <SegmentPicker
              options={[{ label: 'Farmer', value: 'farmer' }, { label: 'Wholesaler', value: 'wholesaler' }, { label: 'Retailer', value: 'retailer' }]}
              selected={form.vendor_type}
              onSelect={(v) => set('vendor_type', v)}
            />
            <Field label="Phone Number (for buyer contact)" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="e.g. 0712345678" keyboardType="phone-pad" autoCapitalize="words" />
            <Field label="Affiliate Certificate Number (optional)" value={form.affiliate_certificate_number} onChangeText={(v) => set('affiliate_certificate_number', v)} placeholder="If referred by an affiliate" autoCapitalize="none" />
          </>
        )}

        {/* Service Provider fields */}
        {form.role === 'service_provider' && (
          <>
            <Text style={styles.label}>Service Provider Type *</Text>
            <SegmentPicker
              options={[
                { label: 'Veterinary', value: 'veterinary' },
                { label: 'Transporter', value: 'transport' },
                { label: 'Storage', value: 'storage' },
              ]}
              selected={form.service_provider_type}
              onSelect={(v) => set('service_provider_type', v)}
            />
            <Field label="Phone Number (for client contact)" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="e.g. 0712345678" keyboardType="phone-pad" autoCapitalize="words" />
            <Field label="Affiliate Certificate Number (optional)" value={form.affiliate_certificate_number} onChangeText={(v) => set('affiliate_certificate_number', v)} placeholder="If referred by an affiliate" autoCapitalize="none" />
          </>
        )}

        {/* Terms */}
        <View style={styles.termsRow}>
          <Switch
            value={form.termsAccepted}
            onValueChange={(v) => set('termsAccepted', v)}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={c.surface}
          />
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://www.024global.com/terms')}>
              terms and policies
            </Text>
          </Text>
        </View>

        {/* Submit */}
        <Button title={btnLabel} onPress={handleSubmit} loading={loading} style={{ marginTop: 24 }} />

        <TouchableOpacity style={styles.link} onPress={() => router.replace('/login')}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function SegmentPicker({ options, selected, onSelect }: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.segmentRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.segmentBtn, selected === o.value && styles.segmentBtnActive]}
          onPress={() => onSelect(o.value)}
        >
          <Text style={[styles.segmentText, selected === o.value && styles.segmentTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((t) => {
    const c = t.colors;
    return {
      container: { flexGrow: 1, padding: 24, paddingTop: 24, paddingBottom: 48 },
      title: { fontSize: 26, fontWeight: '800' as const, color: c.text, marginBottom: 6 },
      sub: { fontSize: 14, color: c.textMuted, marginBottom: 24 },
      label: { fontSize: 13, fontWeight: '600' as const, color: c.textMuted, marginTop: 14, marginBottom: 4 },
      picker: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 13, flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
      pickerText: { fontSize: 15, color: c.text },
      pickerPlaceholder: { fontSize: 15, color: c.placeholder },
      disabled: { opacity: 0.5 },
      dropdown: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, marginTop: 2, zIndex: 99 },
      dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: c.border },
      dropdownText: { fontSize: 15, color: c.text },
      checkboxGroup: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 4 },
      checkboxRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, width: '47%' as const },
      checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: c.border, alignItems: 'center' as const, justifyContent: 'center' as const },
      checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
      checkboxLabel: { fontSize: 14, color: c.text },
      roleRow: { flexDirection: 'row' as const, gap: 8, marginTop: 4 },
      roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: c.border, alignItems: 'center' as const },
      roleBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
      roleBtnText: { fontSize: 12, fontWeight: '600' as const, color: c.textMuted },
      roleBtnTextActive: { color: c.onPrimary },
      roleHint: { fontSize: 12, color: c.textMuted, marginTop: 6, fontStyle: 'italic' as const },
      segmentRow: { flexDirection: 'row' as const, gap: 8, marginTop: 4 },
      segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: c.border, alignItems: 'center' as const },
      segmentBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
      segmentText: { fontSize: 12, fontWeight: '600' as const, color: c.textMuted },
      segmentTextActive: { color: c.onPrimary },
      termsRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginTop: 20 },
      termsText: { fontSize: 14, color: c.text, flex: 1 },
      termsLink: { color: c.primary, textDecorationLine: 'underline' as const },
      link: { alignItems: 'center' as const, marginTop: 16 },
      linkText: { color: c.textMuted, fontSize: 14 },
      linkBold: { color: c.primary, fontWeight: '700' as const },
    };
  });
}
