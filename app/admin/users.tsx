import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function AdminUsers() {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.count}>{users.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search username or email..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchUsers()}
          returnKeyType="search"
          placeholderTextColor="#9ca3af"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchUsers(); }}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
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
          <ActivityIndicator size="large" color="#1d4ed8" />
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
                    <Ionicons name="person" size={20} color="#1d4ed8" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.first_name} {u.last_name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <Text style={styles.userMeta}>
                      @{u.username} · {u.role === 'user' ? 'Affiliate' : u.role?.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.statusText, { color: u.is_active ? '#16a34a' : '#dc2626' }]}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: u.is_active ? '#fee2e2' : '#dcfce7' },
                      isBusy && styles.actionBtnDisabled,
                    ]}
                    onPress={() => toggleStatus(u)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={u.is_active ? '#dc2626' : '#16a34a'} />
                    ) : (
                      <Ionicons
                        name={u.is_active ? 'close-circle' : 'checkmark-circle'}
                        size={16}
                        color={u.is_active ? '#dc2626' : '#16a34a'}
                      />
                    )}
                    <Text style={[styles.actionText, { color: u.is_active ? '#dc2626' : '#16a34a' }]}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#fee2e2' }, isBusy && styles.actionBtnDisabled]}
                    onPress={() => deleteUser(u)}
                    disabled={isBusy}
                  >
                    <Ionicons name="trash" size={16} color="#dc2626" />
                    <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#111827' },
  count: { backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: '700', fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: '#111827' },
  filterScroll: { flexGrow: 0, marginBottom: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e5e7eb' },
  filterBtnActive: { backgroundColor: '#1d4ed8' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  userAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  userMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnDisabled: { opacity: 0.6 },
  actionText: { fontSize: 13, fontWeight: '700' },
});
