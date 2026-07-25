import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';
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

export default function AddProduct() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    content: { paddingBottom: 40 },
    form: { padding: 16 },
    label: { fontSize: 13, fontWeight: '600' as const, color: t.colors.textMuted, marginBottom: 6 },
    sectionLabel: { fontSize: 14, fontWeight: '700' as const, color: t.colors.primary, marginTop: 20, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: t.colors.border, paddingBottom: 4 },
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
  }));

  const [loading, setLoading] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    farmer_price: '',
    wholesaler_price: '',
    retailer_price: '',
    quantity_kg: '',
    stock: '',
    product_type: 'good',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const selectedCat = CATEGORIES.find((c) => c.value === form.category);
  const isFarm = selectedCat?.isFarm || false;

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
      const payload: any = {
        name: form.name,
        description: form.description,
        category: form.category,
        product_type: form.product_type,
        is_farm_product: isFarm,
      };
      if (form.farmer_price) payload.farmer_price = form.farmer_price;
      if (form.wholesaler_price) payload.wholesaler_price = form.wholesaler_price;
      if (form.retailer_price) payload.retailer_price = form.retailer_price;
      if (isFarm && form.quantity_kg) payload.quantity_kg = parseInt(form.quantity_kg, 10);
      if (!isFarm && form.stock) payload.stock = parseInt(form.stock, 10);

      await api.post('/products/', payload);
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
        Alert.alert('Error', msg);
      } else {
        Alert.alert('Error', 'Failed to add product');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Add Product" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Field label="Product Name *" value={form.name} onChangeText={(v) => set('name', v)} placeholder="e.g. Fresh Maize" />
          <Field label="Description" value={form.description} onChangeText={(v) => set('description', v)} placeholder="Describe your product" multiline numberOfLines={3} style={styles.multiline} />

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

          {/* Pricing */}
          <Text style={styles.sectionLabel}>Pricing (KES)</Text>
          <Field label="Farmer Price" value={form.farmer_price} onChangeText={(v) => set('farmer_price', v)} placeholder="0" keyboardType="numeric" />
          <Field label="Wholesaler Price" value={form.wholesaler_price} onChangeText={(v) => set('wholesaler_price', v)} placeholder="0" keyboardType="numeric" />
          <Field label="Retailer Price" value={form.retailer_price} onChangeText={(v) => set('retailer_price', v)} placeholder="0" keyboardType="numeric" />

          {/* Stock */}
          {isFarm ? (
            <Field label="Quantity (kg) *" value={form.quantity_kg} onChangeText={(v) => set('quantity_kg', v)} placeholder="Minimum depends on vendor type" keyboardType="numeric" />
          ) : (
            <Field label="Stock (units) *" value={form.stock} onChangeText={(v) => set('stock', v)} placeholder="Number of units available" keyboardType="numeric" />
          )}

          <Button title="Add Product" onPress={handleSubmit} loading={loading} disabled={loading} style={{ marginTop: 14 }} />
        </View>
      </ScrollView>
    </Screen>
  );
}
