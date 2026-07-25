import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import api from '../../lib/api';
import { useTheme } from '../../lib/theme-context';
import { Screen, AppHeader, useThemedStyles } from '../../components/ui';

export default function AdminLogs() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) => ({
    list: { flex: 1, padding: 16 },
    empty: { textAlign: 'center' as const, color: t.colors.textMuted, marginTop: 40, fontSize: 15 },
    card: { backgroundColor: t.colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: t.colors.border },
    cardTop: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 6 },
    levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    levelText: { fontSize: 11, fontWeight: '700' as const },
    date: { fontSize: 11, color: t.colors.textMuted },
    message: { fontSize: 13, color: t.colors.text, lineHeight: 18 },
    logUser: { fontSize: 12, color: t.colors.textMuted, marginTop: 4 },
  }));

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
    if (level === 'ERROR') return { bg: c.dangerTint, text: c.danger };
    if (level === 'WARNING') return { bg: c.goldTint, text: theme.scheme === 'dark' ? c.gold : '#8A6D0B' };
    return { bg: c.surfaceAlt, text: c.textMuted };
  };

  return (
    <Screen>
      <AppHeader title="System Logs" subtitle="User activity and referral usage" />

      {loading ? (
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
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
    </Screen>
  );
}
