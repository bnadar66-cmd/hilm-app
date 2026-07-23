import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function StaffCoursesScreen() {
  const navigation = useNavigation();
  const { staffProfile, isAdmin } = useAuth();

  const [paths, setPaths] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [university, setUniversity] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    let query = supabase.from('paths').select('*').order('sort_order', { ascending: true });
    if (!isAdmin && staffProfile?.id) query = query.eq('teacher_id', staffProfile.id);
    const { data } = await query;
    setPaths(data || []);

    if (isAdmin) {
      const { data: teacherRows } = await supabase
        .from('admins')
        .select('id, full_name, email')
        .eq('role', 'teacher')
        .order('full_name', { ascending: true });
      setTeachers(teacherRows || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [isAdmin, staffProfile?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function resetForm() {
    setTitle('');
    setProvider('');
    setUniversity('');
    setSpecialization('');
    setDuration('');
    setPrice('');
    setSummary('');
    setSelectedTeacherId(null);
  }

  async function handleCreate() {
    if (!title.trim() || !provider.trim()) {
      Alert.alert('تحقق من البيانات', 'أدخل العنوان والجهة المقدّمة على الأقل.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('paths').insert({
      title: title.trim(),
      provider: provider.trim(),
      university: university.trim() || null,
      specialization: specialization.trim() || null,
      duration: duration.trim() || null,
      price: price.trim() || null,
      summary: summary.trim() || null,
      teacher_id: selectedTeacherId,
    });
    setSaving(false);

    if (error) {
      Alert.alert('تعذّر الإضافة', error.message);
      return;
    }
    resetForm();
    setFormOpen(false);
    load();
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
    >
      <View style={styles.sectionHead}>
        <Text style={styles.title}>{isAdmin ? 'إدارة الدورات' : 'دوراتي'}</Text>
        {isAdmin && (
          <Pressable style={styles.addBtn} onPress={() => setFormOpen((v) => !v)}>
            <Text style={styles.addBtnTxt}>{formOpen ? '✕ إغلاق' : '+ إضافة مسار'}</Text>
          </Pressable>
        )}
      </View>

      {formOpen && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="عنوان المسار" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="الجهة المقدّمة" placeholderTextColor={colors.muted} value={provider} onChangeText={setProvider} />
          <TextInput style={styles.input} placeholder="الجامعة (اختياري)" placeholderTextColor={colors.muted} value={university} onChangeText={setUniversity} />
          <TextInput style={styles.input} placeholder="التخصص (اختياري)" placeholderTextColor={colors.muted} value={specialization} onChangeText={setSpecialization} />
          <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="المدة" placeholderTextColor={colors.muted} value={duration} onChangeText={setDuration} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="السعر" placeholderTextColor={colors.muted} value={price} onChangeText={setPrice} />
          </View>
          <TextInput style={[styles.input, { minHeight: 70 }]} placeholder="ملخص قصير (اختياري)" placeholderTextColor={colors.muted} value={summary} onChangeText={setSummary} multiline />

          <Text style={styles.pickerLabel}>إسناد لمعلم (اختياري)</Text>
          <View style={styles.teacherRow}>
            <Pressable
              style={[styles.teacherPill, !selectedTeacherId && styles.teacherPillActive]}
              onPress={() => setSelectedTeacherId(null)}
            >
              <Text style={[styles.teacherPillTxt, !selectedTeacherId && styles.teacherPillTxtActive]}>بدون</Text>
            </Pressable>
            {teachers.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.teacherPill, selectedTeacherId === t.id && styles.teacherPillActive]}
                onPress={() => setSelectedTeacherId(t.id)}
              >
                <Text style={[styles.teacherPillTxt, selectedTeacherId === t.id && styles.teacherPillTxtActive]}>
                  {t.full_name || t.email}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>إضافة المسار</Text>}
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 30 }} />
      ) : paths.length === 0 ? (
        <Text style={styles.emptyTxt}>{isAdmin ? 'ما فيه مسارات مضافة بعد.' : 'ما تم إسناد أي مسار لك بعد.'}</Text>
      ) : (
        paths.map((path) => (
          <Pressable
            key={path.id}
            style={styles.card}
            onPress={() => navigation.navigate('StaffCourseManage', { pathId: path.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{path.title}</Text>
              <Text style={styles.cardMeta}>{path.provider} · {path.university}</Text>
            </View>
            {!path.is_visible && (
              <View style={styles.hiddenTag}>
                <Text style={styles.hiddenTagTxt}>مخفي</Text>
              </View>
            )}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20 },
  addBtn: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5 },

  formCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 18,
  },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.bg,
    color: colors.ink, fontFamily: fonts.body, fontSize: 14, padding: 11, marginBottom: 10, textAlign: 'right',
  },
  pickerLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, textAlign: 'right', marginBottom: 8 },
  teacherRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  teacherPill: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  teacherPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  teacherPillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12 },
  teacherPillTxtActive: { color: colors.bg },
  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  saveBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },

  card: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 12,
  },
  cardTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14.5, textAlign: 'right', marginBottom: 3 },
  cardMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, textAlign: 'right' },
  hiddenTag: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  hiddenTagTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 10.5 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 22 },
});
