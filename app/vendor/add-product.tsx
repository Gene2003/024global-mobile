import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Product</Text>
      </View>

      <View style={styles.form}>
        <Field label="Product Name *" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Fresh Maize" />
        <Field label="Description" value={form.description} onChange={(v) => set('description', v)} placeholder="Describe your product" multiline />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowCatPicker(!showCatPicker)}>
          <Text style={selectedCat ? styles.pickerText : styles.pickerPlaceholder}>
            {selectedCat?.label || 'Select Category'}
          </Text>
          <Ionicons name={showCatPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
        </TouchableOpacity>
        {showCatPicker && (
          <View style={styles.dropdown}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c.value} style={styles.dropdownItem}
                onPress={() => { set('category', c.value); setShowCatPicker(false); }}>
                <Text style={styles.dropdownText}>{c.label}</Text>
                {c.isFarm && <Text style={styles.farmTag}>Farm</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pricing */}
        <Text style={styles.sectionLabel}>Pricing (KES)</Text>
        <Field label="Farmer Price" value={form.farmer_price} onChange={(v) => set('farmer_price', v)} placeholder="0" keyboardType="numeric" />
        <Field label="Wholesaler Price" value={form.wholesaler_price} onChange={(v) => set('wholesaler_price', v)} placeholder="0" keyboardType="numeric" />
        <Field label="Retailer Price" value={form.retailer_price} onChange={(v) => set('retailer_price', v)} placeholder="0" keyboardType="numeric" />

        {/* Stock */}
        {isFarm ? (
          <Field label="Quantity (kg) *" value={form.quantity_kg} onChange={(v) => set('quantity_kg', v)} placeholder="Minimum depends on vendor type" keyboardType="numeric" />
        ) : (
          <Field label="Stock (units) *" value={form.stock} onChange={(v) => set('stock', v)} placeholder="Number of units available" keyboardType="numeric" />
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add Product</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 8 },
  back: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  form: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1d4ed8', marginTop: 20, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#dbeafe', paddingBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 13, fontSize: 15, color: '#111827' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  picker: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: 15, color: '#111827' },
  pickerPlaceholder: { fontSize: 15, color: '#9ca3af' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginTop: 2 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 15, color: '#111827' },
  farmTag: { fontSize: 11, color: '#16a34a', fontWeight: '700', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  submitBtn: { backgroundColor: '#1d4ed8', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 28 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
