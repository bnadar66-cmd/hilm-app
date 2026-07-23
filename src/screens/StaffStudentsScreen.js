import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';

export default function StaffStudentsScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, progress_percent, enrolled_at, student:students(full_name, university, specialization), path:paths(title)')
      .order('enrolled_at', { ascending: false });

    if (!error) setRows(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
    >
      <Text style={styles.title}>الطلاب</Text>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 30 }} />
      ) : rows.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه طلاب مسجّلين بدوراتك بعد.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.studentName}>{row.student?.full_name ?? 'طالب'}</Text>
              <Text style={styles.progressPct}>{row.progress_percent}%</Text>
            </View>
            <Text style={styles.pathTitle}>{row.path?.title}</Text>
            <Text style={styles.studentMeta}>{row.student?.university} · {row.student?.specialization}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${row.progress_percent}%` }]} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, marginBottom: 20 },
  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 12,
  },
  cardHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  studentName: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14.5, textAlign: 'right' },
  progressPct: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5 },
  pathTitle: { fontFamily: fonts.body, color: colors.ink, fontSize: 12.5, textAlign: 'right', marginBottom: 2 },
  studentMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 11.5, textAlign: 'right', marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 6 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 22 },
});
