import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, Field, Button, Loader, Badge, useThemedStyles } from '../../components/ui';

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    content: { paddingBottom: 40 },
    form: { padding: 16 },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: t.colors.primary,
      marginTop: 20,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      paddingBottom: 4,
    },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 12 },
    metaText: { color: t.colors.textMuted, fontSize: 13 },
    multiline: { minHeight: 80, textAlignVertical: 'top' as const },
  }));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    farmer_price: '',
    wholesaler_price: '',
    retailer_price: '',
    quantity_kg: '',
    stock: '',
  });
  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    api
      .get(`/mobile/products/${id}/`)
      .then((res) => {
        const p = res.data;
        setProduct(p);
        setForm({
          name: p.name ?? '',
          description: p.description ?? '',
          farmer_price: p.farmer_price != null ? String(p.farmer_price) : '',
          wholesaler_price: p.wholesaler_price != null ? String(p.wholesaler_price) : '',
          retailer_price: p.retailer_price != null ? String(p.retailer_price) : '',
          quantity_kg: p.quantity_kg != null ? String(p.quantity_kg) : '',
          stock: p.stock != null ? String(p.stock) : '',
        });
      })
      .catch(() => Alert.alert('Error', 'Could not load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const isFarm = !!product?.is_farm_product;

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    // enforce farm minimum quantity (matches add-product rules)
    if (isFarm && form.quantity_kg) {
      const user = await getUser();
      const vendorType = user?.vendor_type || '';
      const minQty = vendorType === 'farmer' ? 600 : vendorType === 'wholesaler' ? 300 : 100;
      if (parseInt(form.quantity_kg, 10) < minQty) {
        Alert.alert('Error', `Minimum quantity for ${vendorType} is ${minQty} kg`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = { name: form.name, description: form.description };
      if (form.farmer_price !== '') payload.farmer_price = form.farmer_price;
      if (form.wholesaler_price !== '') payload.wholesaler_price = form.wholesaler_price;
      if (form.retailer_price !== '') payload.retailer_price = form.retailer_price;
      if (isFarm && form.quantity_kg !== '') payload.quantity_kg = parseInt(form.quantity_kg, 10);
      if (!isFarm && form.stock !== '') payload.stock = parseInt(form.stock, 10);

      await api.patch(`/mobile/products/${id}/`, payload);
      Alert.alert('Saved', 'Product updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        data && typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
          : 'Failed to update product';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete product', 'This will permanently remove the listing. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/mobile/products/${id}/`);
            Alert.alert('Deleted', 'Product removed.', [{ text: 'OK', onPress: () => router.back() }]);
          } catch {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  if (loading) return <Loader />;
  if (!product) {
    return (
      <Screen>
        <AppHeader title="Edit Product" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.text }}>Product not found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Edit Product" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.metaRow}>
            {product.category_name ? <Badge label={product.category_name} tone="info" /> : null}
            {isFarm ? <Badge label="Farm produce" tone="success" /> : null}
          </View>

          <Field label="Product Name *" value={form.name} onChangeText={(v) => set('name', v)} placeholder="Product name" />
          <Field label="Description" value={form.description} onChangeText={(v) => set('description', v)} placeholder="Describe your product" multiline numberOfLines={3} style={styles.multiline} />

          <Text style={styles.sectionLabel}>Pricing (KES)</Text>
          <Field label="Farmer Price" value={form.farmer_price} onChangeText={(v) => set('farmer_price', v)} placeholder="0" keyboardType="numeric" />
          <Field label="Wholesaler Price" value={form.wholesaler_price} onChangeText={(v) => set('wholesaler_price', v)} placeholder="0" keyboardType="numeric" />
          <Field label="Retailer Price" value={form.retailer_price} onChangeText={(v) => set('retailer_price', v)} placeholder="0" keyboardType="numeric" />

          <Text style={styles.sectionLabel}>Stock</Text>
          {isFarm ? (
            <Field label="Quantity (kg)" value={form.quantity_kg} onChangeText={(v) => set('quantity_kg', v)} placeholder="Available kg" keyboardType="numeric" />
          ) : (
            <Field label="Stock (units)" value={form.stock} onChangeText={(v) => set('stock', v)} placeholder="Units available" keyboardType="numeric" />
          )}

          <Button title="Save Changes" icon="checkmark" onPress={handleSave} loading={saving} disabled={saving} style={{ marginTop: 16 }} />
          <Button title="Delete Listing" icon="trash" variant="danger" onPress={handleDelete} style={{ marginTop: 10 }} />
        </View>
      </ScrollView>
    </Screen>
  );
}
