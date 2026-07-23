import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';

const STATUS_STYLE = {
  'منتظم': { color: '#4ADE80' },
  'غير منتظم': { color: '#F0928C' },
};

export default function StaffStudentsScreen() {
  const navigation = useNavigation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [universityFilter, setUniversityFilter] = useState('الكل');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, university, specialization, student_number, payment_status')
      .order('student_number', { ascending: true });

    if (!error) setStudents(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const universities = useMemo(() => {
    const set = new Set(students.map((s) => s.university).filter(Boolean));
    return ['الكل', ...Array.from(set)];
  }, [students]);

  const filteredStudents = universityFilter === 'الكل'
    ? students
    : students.filter((s) => s.university === universityFilter);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
    >
      <Text style={styles.title}>الطلاب</Text>

      {universities.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {universities.map((u) => (
            <Pressable
              key={u}
              style={[styles.filterPill, universityFilter === u && styles.filterPillActive]}
              onPress={() => setUniversityFilter(u)}
            >
              <Text style={[styles.filterPillTxt, universityFilter === u && styles.filterPillTxtActive]}>{u}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 30 }} />
      ) : filteredStudents.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه طلاب مطابقين.</Text>
      ) : (
        filteredStudents.map((s) => {
          const statusStyle = STATUS_STYLE[s.payment_status] ?? { color: colors.muted };
          return (
            <Pressable
              key={s.id}
              style={styles.card}
              onPress={() => navigation.navigate('StudentDetail', { studentId: s.id })}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.cardHead}>
                  <Text style={styles.studentName}>{s.full_name}</Text>
                  <Text style={styles.studentNumber}>#{s.student_number}</Text>
                </View>
                <Text style={styles.studentMeta}>{s.university} · {s.specialization}</Text>
              </View>
              <View style={[styles.statusTag, { borderColor: statusStyle.color }]}>
                <Text style={[styles.statusTagTxt, { color: statusStyle.color }]}>{s.payment_status}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, marginBottom: 16 },

  filterRow: { flexDirection: 'row-reverse', gap: 8, paddingBottom: 18 },
  filterPill: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  filterPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterPillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12.5 },
  filterPillTxtActive: { color: colors.bg },

  card: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 12,
  },
  cardHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  studentName: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14.5, textAlign: 'right' },
  studentNumber: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11.5 },
  studentMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 11.5, textAlign: 'right' },
  statusTag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  statusTagTxt: { fontFamily: fonts.bodyBold, fontSize: 10.5 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 22 },
});
