import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function MyCoursesScreen() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, progress_percent, enrolled_at, path:paths(id, title, provider, university, duration)')
      .eq('student_id', profile.id)
      .order('enrolled_at', { ascending: false });

    if (!error) setRows(data || []);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />
      }
    >
      <Text style={styles.title}>دوراتي المسجّلة</Text>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 30 }} />
      ) : rows.length === 0 ? (
        <Text style={styles.emptyTxt}>ما سجّلت بأي مسار بعد. روح تبويب "استكشف" وسجّل بأول مسار لك 🎓</Text>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <View style={styles.cardImg}>
              <Text style={styles.cardImgTxt}>{row.path?.title?.charAt(0) ?? '؟'}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{row.path?.title}</Text>
              <Text style={styles.cardTeacher}>{row.path?.provider} · {row.path?.university}</Text>

              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${row.progress_percent}%` }]} />
                </View>
                <Text style={styles.progressPct}>{row.progress_percent}%</Text>
              </View>

              <Pressable style={styles.enterBtn}>
                <Text style={styles.enterBtnTxt}>الدخول إلى الدورة</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 20 },
  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 22 },

  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    overflow: 'hidden', marginBottom: 16,
  },
  cardImg: {
    width: '100%', aspectRatio: 16 / 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(242,183,5,0.10)', borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  cardImgTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 30 },
  cardBody: { padding: 14 },
  cardTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 15, textAlign: 'right', marginBottom: 4 },
  cardTeacher: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, textAlign: 'right', marginBottom: 12 },

  progressRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressBar: { flex: 1, height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 6 },
  progressPct: { color: colors.muted, fontFamily: fonts.body, fontSize: 11.5 },

  enterBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center' },
  enterBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 13.5 },
});
