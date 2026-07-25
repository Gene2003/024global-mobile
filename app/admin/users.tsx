import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, useThemedStyles } from '../../components/ui';

export default function AdminUsers() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    count: { backgroundColor: 'rgba(255,255,255,0.15)', color: t.colors.onHeader, fontWeight: '700' as const, fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' as const },
    searchRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: t.colors.surface, margin: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: 12 },
    searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: t.colors.text },
    filterScroll: { flexGrow: 0, marginBottom: 4 },
    filterRow: { flexDirection: 'row' as const, paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
    filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: t.colors.surfaceAlt },
    filterBtnActive: { backgroundColor: t.colors.primary },
    filterText: { fontSize: 13, fontWeight: '600' as const, color: t.colors.textMuted },
    filterTextActive: { color: t.colors.onPrimary },
    center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 },
    loadingText: { fontSize: 14, color: t.colors.textMuted },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center' as const, color: t.colors.textMuted, marginTop: 40, fontSize: 15 },
    card: { backgroundColor: t.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: t.colors.border, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
    cardHeader: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10, marginBottom: 12 },
    userAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: t.colors.infoTint, alignItems: 'center' as const, justifyContent: 'center' as const },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text },
    userEmail: { fontSize: 13, color: t.colors.textMuted, marginTop: 1 },
    userMeta: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700' as const },
    actions: { flexDirection: 'row' as const, gap: 8 },
    actionBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, paddingVertical: 10, borderRadius: 10 },
    actionBtnDisabled: { opacity: 0.6 },
    actionText: { fontSize: 13, fontWeight: '700' as const },
  }));

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null); // tracks which user action is in progress

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = {};
      if (filter === 'affiliate') params.role = 'user';
      else if (filter === 'vendor') params.role = 'vendor';
      else if (filter === 'service_provider') params.role = 'service_provider';
      if (search) params.search = search;

      const res = await api.get('/users/admin/users/', { params });
      let list = Array.isArray(res.data) ? res.data : (res.data.users || []);

      if (filter === 'pending') {
        const allRes = await api.get('/users/admin/users/');
        const allList = Array.isArray(allRes.data) ? allRes.data : (allRes.data.users || []);
        list = allList.filter((u: any) => !u.is_active);
      }
      setUsers(list);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const toggleStatus = async (user: any) => {
    setBusyId(user.id);
    // Optimistic update
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    try {
      await api.patch(`/users/admin/users/${user.id}/update-status/`, {
        is_active: !user.is_active,
      });
      // Silently refresh to sync server state
      fetchUsers(true);
    } catch (err: any) {
      // Revert optimistic update on failure
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: user.is_active } : u));
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to update user status';
      Alert.alert('Error', msg);
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = (user: any) => {
    Alert.alert(
      'Delete User',
      `Delete "${user.username}"?\n\nThis will also remove all their products and data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setBusyId(user.id);
            try {
              await api.delete(`/users/admin/users/${user.id}/delete/`);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (err: any) {
              const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to delete user';
              Alert.alert('Error', msg);
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'affiliate', label: 'Affiliates' },
    { key: 'vendor', label: 'Vendors' },
    { key: 'service_provider', label: 'Service Providers' },
    { key: 'pending', label: 'Pending' },
  ];

  return (
    <Screen>
      <AppHeader
        title="User Management"
        subtitle="Manage registered users"
        right={<Text style={styles.count}>{users.length}</Text>}
      />

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={c.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search username or email..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchUsers()}
          returnKeyType="search"
          placeholderTextColor={c.placeholder}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchUsers(); }}>
            <Ionicons name="close-circle" size={18} color={c.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <FlatList
        data={filters}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterBtn, filter === item.key && styles.filterBtnActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
          renderItem={({ item: u }) => {
            const isBusy = busyId === u.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={20} color={c.primary} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.first_name} {u.last_name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <Text style={styles.userMeta}>
                      @{u.username} · {u.role === 'user' ? 'Affiliate' : u.role?.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: u.is_active ? c.successTint : c.dangerTint }]}>
                    <Text style={[styles.statusText, { color: u.is_active ? c.success : c.danger }]}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: u.is_active ? c.dangerTint : c.successTint },
                      isBusy && styles.actionBtnDisabled,
                    ]}
                    onPress={() => toggleStatus(u)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={u.is_active ? c.danger : c.success} />
                    ) : (
                      <Ionicons
                        name={u.is_active ? 'close-circle' : 'checkmark-circle'}
                        size={16}
                        color={u.is_active ? c.danger : c.success}
                      />
                    )}
                    <Text style={[styles.actionText, { color: u.is_active ? c.danger : c.success }]}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: c.dangerTint }, isBusy && styles.actionBtnDisabled]}
                    onPress={() => deleteUser(u)}
                    disabled={isBusy}
                  >
                    <Ionicons name="trash" size={16} color={c.danger} />
                    <Text style={[styles.actionText, { color: c.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
