import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function StaffCourseManageScreen({ route, navigation }) {
  const { pathId } = route.params;
  const { staffProfile, isAdmin } = useAuth();

  const [path, setPath] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [university, setUniversity] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [summary, setSummary] = useState('');
  const [teacherId, setTeacherId] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  const [lectureFormOpen, setLectureFormOpen] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [addingLecture, setAddingLecture] = useState(false);

  const load = useCallback(async () => {
    const [{ data: pathData }, { data: lecturesData }] = await Promise.all([
      supabase.from('paths').select('*').eq('id', pathId).single(),
      supabase.from('lectures').select('*').eq('path_id', pathId).order('order_index', { ascending: true }),
    ]);
    if (pathData) {
      setPath(pathData);
      setTitle(pathData.title ?? '');
      setProvider(pathData.provider ?? '');
      setUniversity(pathData.university ?? '');
      setSpecialization(pathData.specialization ?? '');
      setDuration(pathData.duration ?? '');
      setPrice(pathData.price ?? '');
      setSummary(pathData.summary ?? '');
      setTeacherId(pathData.teacher_id);
      setIsVisible(pathData.is_visible);
    }
    setLectures(lecturesData || []);

    if (isAdmin) {
      const { data: teacherRows } = await supabase
        .from('admins')
        .select('id, full_name, email')
        .eq('role', 'teacher')
        .order('full_name', { ascending: true });
      setTeachers(teacherRows || []);
    }
    setLoading(false);
  }, [pathId, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isOwner = isAdmin || path?.teacher_id === staffProfile?.id;

  async function handleSavePath() {
    if (!title.trim() || !provider.trim()) {
      Alert.alert('تحقق من البيانات', 'أدخل العنوان والجهة المقدّمة على الأقل.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('paths')
      .update({
        title: title.trim(),
        provider: provider.trim(),
        university: university.trim() || null,
        specialization: specialization.trim() || null,
        duration: duration.trim() || null,
        price: price.trim() || null,
        summary: summary.trim() || null,
        teacher_id: teacherId,
        is_visible: isVisible,
      })
      .eq('id', pathId);
    setSaving(false);

    if (error) {
      Alert.alert('تعذّر الحفظ', error.message);
      return;
    }
    load();
  }

  async function handleAddLecture() {
    if (!lectureTitle.trim()) {
      Alert.alert('تحقق من البيانات', 'أدخل عنوان المحاضرة.');
      return;
    }
    setAddingLecture(true);
    const { error } = await supabase.from('lectures').insert({
      path_id: pathId,
      title: lectureTitle.trim(),
      duration_minutes: lectureDuration.trim() ? Number(lectureDuration.trim()) : null,
      order_index: lectures.length + 1,
    });
    setAddingLecture(false);

    if (error) {
      Alert.alert('تعذّر الإضافة', error.message);
      return;
    }
    setLectureTitle('');
    setLectureDuration('');
    setLectureFormOpen(false);
    load();
  }

  function handleDeleteLecture(lecture) {
    Alert.alert('حذف المحاضرة', `تحذف "${lecture.title}" وكل مرفقاتها؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setLectures((prev) => prev.filter((l) => l.id !== lecture.id));
          await supabase.from('lectures').delete().eq('id', lecture.id);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!path) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backTxt}>‹ رجوع</Text>
        </Pressable>
        <Text style={styles.emptyTxt}>ما قدرنا نلقى هذا المسار.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      {isAdmin ? (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="عنوان المسار" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="الجهة المقدّمة" placeholderTextColor={colors.muted} value={provider} onChangeText={setProvider} />
          <TextInput style={styles.input} placeholder="الجامعة" placeholderTextColor={colors.muted} value={university} onChangeText={setUniversity} />
          <TextInput style={styles.input} placeholder="التخصص" placeholderTextColor={colors.muted} value={specialization} onChangeText={setSpecialization} />
          <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="المدة" placeholderTextColor={colors.muted} value={duration} onChangeText={setDuration} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="السعر" placeholderTextColor={colors.muted} value={price} onChangeText={setPrice} />
          </View>
          <TextInput style={[styles.input, { minHeight: 70 }]} placeholder="ملخص قصير" placeholderTextColor={colors.muted} value={summary} onChangeText={setSummary} multiline />

          <Text style={styles.pickerLabel}>إسناد لمعلم</Text>
          <View style={styles.teacherRow}>
            <Pressable style={[styles.teacherPill, !teacherId && styles.teacherPillActive]} onPress={() => setTeacherId(null)}>
              <Text style={[styles.teacherPillTxt, !teacherId && styles.teacherPillTxtActive]}>بدون</Text>
            </Pressable>
            {teachers.map((t) => (
              <Pressable key={t.id} style={[styles.teacherPill, teacherId === t.id && styles.teacherPillActive]} onPress={() => setTeacherId(t.id)}>
                <Text style={[styles.teacherPillTxt, teacherId === t.id && styles.teacherPillTxtActive]}>{t.full_name || t.email}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.visibilityBtn, isVisible && styles.visibilityBtnActive]} onPress={() => setIsVisible((v) => !v)}>
            <Text style={[styles.visibilityBtnTxt, isVisible && styles.visibilityBtnTxtActive]}>
              {isVisible ? '✓ ظاهر للطلاب' : 'مخفي عن الطلاب'}
            </Text>
          </Pressable>

          <Pressable style={styles.saveBtn} onPress={handleSavePath} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>حفظ التغييرات</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={styles.readCard}>
          <Text style={styles.readTitle}>{path.title}</Text>
          <Text style={styles.readMeta}>{path.provider} · {path.university}</Text>
        </View>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>المحاضرات ({lectures.length})</Text>
        {isOwner && (
          <Pressable style={styles.addBtn} onPress={() => setLectureFormOpen((v) => !v)}>
            <Text style={styles.addBtnTxt}>{lectureFormOpen ? '✕ إغلاق' : '+ إضافة'}</Text>
          </Pressable>
        )}
      </View>

      {lectureFormOpen && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="عنوان المحاضرة" placeholderTextColor={colors.muted} value={lectureTitle} onChangeText={setLectureTitle} />
          <TextInput style={styles.input} placeholder="المدة بالدقائق (اختياري)" placeholderTextColor={colors.muted} value={lectureDuration} onChangeText={setLectureDuration} keyboardType="number-pad" />
          <Pressable style={styles.saveBtn} onPress={handleAddLecture} disabled={addingLecture}>
            {addingLecture ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>إضافة المحاضرة</Text>}
          </Pressable>
        </View>
      )}

      {lectures.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه محاضرات مضافة بعد.</Text>
      ) : (
        lectures.map((lecture, i) => (
          <View key={lecture.id} style={styles.lectureRow}>
            <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('StaffLectureManage', { lectureId: lecture.id, pathId })}>
              <Text style={styles.lectureTitle}>{i + 1}. {lecture.title}</Text>
              {!!lecture.duration_minutes && <Text style={styles.lectureMeta}>{lecture.duration_minutes} دقيقة</Text>}
            </Pressable>
            {isOwner && (
              <Pressable onPress={() => handleDeleteLecture(lecture)}>
                <Text style={styles.deleteTxt}>حذف</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  center: { alignItems: 'center', justifyContent: 'center' },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },

  readCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 16, marginBottom: 24,
  },
  readTitle: { fontFamily: fonts.display, color: colors.ink, fontSize: 18, textAlign: 'right', marginBottom: 4 },
  readMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right' },

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

  visibilityBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center', marginBottom: 12 },
  visibilityBtnActive: { borderColor: colors.goldDim },
  visibilityBtnTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 13 },
  visibilityBtnTxtActive: { color: colors.gold },

  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  saveBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },

  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: fonts.display, color: colors.ink, fontSize: 17 },
  addBtn: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5 },

  lectureRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 10,
  },
  lectureTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5, textAlign: 'right', marginBottom: 2 },
  lectureMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 11.5, textAlign: 'right' },
  deleteTxt: { color: '#F0928C', fontFamily: fonts.body, fontSize: 12 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 10, lineHeight: 22 },
});
