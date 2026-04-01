import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function AdminLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/admin/system-logs/')
      .then((r) => {
        const raw = r.data;
        setLogs(Array.isArray(raw) ? raw : (raw.results || []));
      })
      .catch(() => Alert.alert('Error', 'Failed to load logs'))
      .finally(() => setLoading(false));
  }, []);

  const levelColor = (level: string) => {
    if (level === 'ERROR') return { bg: '#fee2e2', text: '#dc2626' };
    if (level === 'WARNING') return { bg: '#fef9c3', text: '#92400e' };
    return { bg: '#f3f4f6', text: '#374151' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>System Logs</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.list}>
          {logs.length === 0 ? (
            <Text style={styles.empty}>No logs found.</Text>
          ) : logs.map((log, i) => {
            const colors = levelColor(log.level);
            return (
              <View key={i} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.levelBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.levelText, { color: colors.text }]}>{log.level || 'INFO'}</Text>
                  </View>
                  <Text style={styles.date}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</Text>
                </View>
                <Text style={styles.message}>{log.message || log.action || JSON.stringify(log)}</Text>
                {log.user && <Text style={styles.logUser}>User: {log.user}</Text>}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  list: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 11, color: '#9ca3af' },
  message: { fontSize: 13, color: '#374151', lineHeight: 18 },
  logUser: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
