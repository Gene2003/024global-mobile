import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';
import { getCurrentPlace } from '../../lib/location';
import { PRODUCE_UNITS, QUALITY_GRADES } from '../../lib/constants';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, Field, Button, useThemedStyles } from '../../components/ui';

const CATEGORIES = [
  { label: 'Farm Products', value: 'farm_products', isFarm: true },
  { label: 'Food & Grocery', value: 'food', isFarm: true },
  { label: 'Electronics', value: 'electronics', isFarm: false },
  { label: 'Fashion', value: 'fashion', isFarm: false },
  { label: 'Health & Beauty', value: 'health_beauty', isFarm: false },
  { label: 'Home & Kitchen', value: 'home_kitchen', isFarm: false },
  { label: 'Books', value: 'books', isFarm: false },
  { label: 'Sports & Outdoors', value: 'sports', isFarm: false },
  { label: 'Automotive', value: 'automotive', isFarm: false },
  { label: 'Others', value: 'others', isFarm: false },
];

/** Small static market-price hint keyed on a lowercased product-name keyword. */
const PRICE_HINTS: { keyword: string; price: number }[] = [
  { keyword: 'tomato', price: 85 },
  { keyword: 'potato', price: 60 },
  { keyword: 'onion', price: 110 },
  { keyword: 'cabbage', price: 35 },
  { keyword: 'maize', price: 55 },
];

function suggestedPrice(name: string): number {
  const n = name.toLowerCase();
  const hit = PRICE_HINTS.find((h) => n.includes(h.keyword));
  return hit ? hit.price : 70;
}

export default function AddProduct() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    content: { paddingBottom: 40 },
    form: { padding: 16 },
    label: { fontSize: 13, fontWeight: '600' as const, color: t.colors.textMuted, marginBottom: 6 },
    photoBtn: {
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderStyle: 'dashed' as const,
      borderRadius: t.radius.lg,
      height: 180,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
    },
    photoPreview: { width: '100%' as const, height: '100%' as const },
    photoHint: { fontSize: 12, color: t.colors.textMuted, marginTop: 8, marginBottom: 14 },
    photoBtnText: { fontSize: 15, color: t.colors.textMuted, fontWeight: '600' as const, marginTop: 8 },
    picker: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.md, padding: 13, flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    pickerText: { fontSize: 15, color: t.colors.text },
    pickerPlaceholder: { fontSize: 15, color: t.colors.placeholder },
    dropdown: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.md, marginTop: 4 },
    dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: t.colors.border, flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    dropdownItemActive: { backgroundColor: t.colors.infoTint },
    dropdownText: { fontSize: 15, color: t.colors.text },
    dropdownTextActive: { fontSize: 15, color: t.colors.info, fontWeight: '700' as const },
    farmTag: { fontSize: 11, color: t.colors.success, fontWeight: '700' as const, backgroundColor: t.colors.successTint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: t.radius.sm },
    multiline: { minHeight: 80, textAlignVertical: 'top' as const },
    suggestChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      alignSelf: 'flex-start' as const,
      gap: 6,
      backgroundColor: t.colors.infoTint,
      borderRadius: t.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 7,
      marginTop: 2,
      marginBottom: 14,
    },
    suggestChipText: { fontSize: 13, color: t.colors.info, fontWeight: '700' as const },
    fieldSpacer: { marginBottom: 14 },
  }));

  const [loading, setLoading] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    farmer_price: '',
    quantity_kg: '',
    unit: 'kg',
    quality_grade: '',
    harvest_date: '',
    available_from: '',
    location: '',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const selectedCat = CATEGORIES.find((cat) => cat.value === form.category);
  const isFarm = selectedCat?.isFarm || false;
  const selectedUnit = PRODUCE_UNITS.find((u) => u.value === form.unit);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!r.canceled) setImage(r.assets[0]);
  };

  const useCurrentLocation = async () => {
    const place = await getCurrentPlace();
    if (place) {
      set('location', place.place);
      setCoords({ latitude: place.latitude, longitude: place.longitude });
    } else {
      Alert.alert('Location needed', 'Location permission is required to use your current location.');
    }
  };

  const applySuggestedPrice = () => {
    set('farmer_price', String(suggestedPrice(form.name)));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Product name is required'); return; }
    if (!form.category) { Alert.alert('Error', 'Please select a category'); return; }

    const user = await getUser();
    const vendorType = user?.vendor_type || '';
    const minQty = vendorType === 'farmer' ? 600 : vendorType === 'wholesaler' ? 300 : 100;

    if (isFarm && form.quantity_kg) {
      const qty = parseInt(form.quantity_kg, 10);
      if (qty < minQty) {
        Alert.alert('Error', `Minimum quantity for ${vendorType} is ${minQty} kg`);
        return;
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('is_farm_product', 'true');
      fd.append('product_type', 'good');
      fd.append('unit', form.unit);
      if (form.farmer_price) fd.append('farmer_price', form.farmer_price);
      if (form.quantity_kg) fd.append('quantity_kg', String(parseInt(form.quantity_kg, 10)));
      if (form.description.trim()) fd.append('description', form.description);
      if (form.quality_grade) fd.append('quality_grade', form.quality_grade);
      if (form.harvest_date.trim()) fd.append('harvest_date', form.harvest_date);
      if (form.available_from.trim()) fd.append('available_from', form.available_from);
      if (form.location.trim()) fd.append('location', form.location);
      if (coords) {
        fd.append('latitude', String(coords.latitude));
        fd.append('longitude', String(coords.longitude));
      }
      if (image) {
        fd.append('image', {
          uri: image.uri,
          name: image.fileName || 'produce.jpg',
          type: image.mimeType || 'image/jpeg',
        } as any);
      }

      await api.post('/mobile/products/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert(
        'Listing submitted',
        'A 024 Global agent will verify your produce within 48 hours. You will receive an SMS when it goes live.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
        Alert.alert('Error', msg);
      } else {
        Alert.alert('Error', 'Failed to submit listing');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="List Your Produce" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          {/* Photo */}
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.85}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={34} color={c.textMuted} />
                <Text style={styles.photoBtnText}>Tap to add photo</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.photoHint}>
            Photo must show the actual produce clearly. Blurry or unrelated photos will be rejected.
          </Text>

          {/* Name */}
          <Field label="Product Name *" value={form.name} onChangeText={(v) => set('name', v)} placeholder="e.g. Fresh Tomatoes" />

          {/* Category */}
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowCatPicker(!showCatPicker)}>
            <Text style={selectedCat ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedCat?.label || 'Select Category'}
            </Text>
            <Ionicons name={showCatPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
          </TouchableOpacity>
          {showCatPicker && (
            <View style={styles.dropdown}>
              {CATEGORIES.map((cat) => {
                const active = cat.value === form.category;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => { set('category', cat.value); setShowCatPicker(false); }}
                  >
                    <Text style={active ? styles.dropdownTextActive : styles.dropdownText}>{cat.label}</Text>
                    {cat.isFarm && <Text style={styles.farmTag}>Farm</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={styles.fieldSpacer} />

          {/* Quantity + Unit */}
          <Field label="Quantity" value={form.quantity_kg} onChangeText={(v) => set('quantity_kg', v)} placeholder="e.g. 600" keyboardType="numeric" />
          <Text style={styles.label}>Unit</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowUnitPicker(!showUnitPicker)}>
            <Text style={styles.pickerText}>{selectedUnit?.label || 'Select unit'}</Text>
            <Ionicons name={showUnitPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
          </TouchableOpacity>
          {showUnitPicker && (
            <View style={styles.dropdown}>
              {PRODUCE_UNITS.map((u) => {
                const active = u.value === form.unit;
                return (
                  <TouchableOpacity
                    key={u.value}
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => { set('unit', u.value); setShowUnitPicker(false); }}
                  >
                    <Text style={active ? styles.dropdownTextActive : styles.dropdownText}>{u.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={styles.fieldSpacer} />

          {/* Price */}
          <Field label="Price (KES)" value={form.farmer_price} onChangeText={(v) => set('farmer_price', v)} placeholder="0" keyboardType="numeric" />
          <TouchableOpacity style={styles.suggestChip} onPress={applySuggestedPrice} activeOpacity={0.85}>
            <Ionicons name="pricetag-outline" size={14} color={c.info} />
            <Text style={styles.suggestChipText}>
              Suggested market price: KES {suggestedPrice(form.name)}/{form.unit}
            </Text>
          </TouchableOpacity>

          {/* Quality grade */}
          <Text style={styles.label}>Quality Grade</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowGradePicker(!showGradePicker)}>
            <Text style={form.quality_grade ? styles.pickerText : styles.pickerPlaceholder}>
              {form.quality_grade || 'Select grade'}
            </Text>
            <Ionicons name={showGradePicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
          </TouchableOpacity>
          {showGradePicker && (
            <View style={styles.dropdown}>
              {QUALITY_GRADES.map((g) => {
                const active = g === form.quality_grade;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => { set('quality_grade', g); setShowGradePicker(false); }}
                  >
                    <Text style={active ? styles.dropdownTextActive : styles.dropdownText}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={styles.fieldSpacer} />

          {/* Dates */}
          <Field label="Harvest Date" value={form.harvest_date} onChangeText={(v) => set('harvest_date', v)} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <Field label="Available From" value={form.available_from} onChangeText={(v) => set('available_from', v)} placeholder="YYYY-MM-DD" autoCapitalize="none" />

          {/* Description */}
          <Field label="Description" value={form.description} onChangeText={(v) => set('description', v)} placeholder="Describe your produce (optional)" multiline numberOfLines={3} style={styles.multiline} />

          {/* Location */}
          <Field label="Location" value={form.location} onChangeText={(v) => set('location', v)} placeholder="e.g. Kiambu, Central" />
          <Button title="Use current location (GPS)" variant="outline" icon="location-outline" onPress={useCurrentLocation} style={{ marginBottom: 6 }} />

          <Button title="Submit Listing" onPress={handleSubmit} loading={loading} disabled={loading} style={{ marginTop: 14 }} />
        </View>
      </ScrollView>
    </Screen>
  );
}
