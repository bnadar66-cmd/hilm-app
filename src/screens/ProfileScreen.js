import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({ courses: 0, avgProgress: 0 });

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      supabase
        .from('enrollments')
        .select('progress_percent')
        .eq('student_id', profile.id)
        .then(({ data }) => {
          const rows = data || [];
          const avg = rows.length
            ? Math.round(rows.reduce((s, r) => s + (r.progress_percent || 0), 0) / rows.length)
            : 0;
          setStats({ courses: rows.length, avgProgress: avg });
        });
    }, [profile?.id])
  );

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{profile?.full_name?.charAt(0) ?? '؟'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name ?? '...'}</Text>
          <Text style={styles.sub}>{profile?.university} · {profile?.specialization}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.courses}</Text>
          <Text style={styles.statLbl}>دورات مسجّلة</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.avgProgress}%</Text>
          <Text style={styles.statLbl}>متوسط الإنجاز</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>الحساب</Text>
      <View style={styles.rowsCard}>
        <Pressable style={styles.row}>
          <Text style={styles.rowTxt}>تعديل البيانات الشخصية</Text>
          <Text style={styles.chev}>‹</Text>
        </Pressable>
        <Pressable style={styles.row}>
          <Text style={styles.rowTxt}>الإشعارات</Text>
          <Text style={styles.chev}>‹</Text>
        </Pressable>
        <Pressable style={styles.row}>
          <Text style={styles.rowTxt}>الدعم والمساعدة</Text>
          <Text style={styles.chev}>‹</Text>
        </Pressable>
        <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={signOut}>
          <Text style={[styles.rowTxt, styles.dangerTxt]}>تسجيل الخروج</Text>
          <Text style={[styles.chev, styles.dangerTxt]}>‹</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  head: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 22 },
  avatar: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(242,183,5,0.15)',
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 24 },
  name: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16, textAlign: 'right', marginBottom: 4 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5, textAlign: 'right' },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 26 },
  statBox: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, alignItems: 'center',
  },
  statNum: { fontFamily: fonts.bodyBold, color: colors.gold, fontSize: 20, marginBottom: 4 },
  statLbl: { fontFamily: fonts.body, color: colors.muted, fontSize: 11.5 },
  sectionTitle: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 1, textAlign: 'right', marginBottom: 10 },
  rowsCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  rowTxt: { fontFamily: fonts.body, color: colors.ink, fontSize: 14 },
  chev: { color: colors.muted, fontSize: 16 },
  dangerTxt: { color: '#F0928C' },
});
