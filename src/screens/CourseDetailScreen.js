import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function CourseDetailScreen({ route, navigation }) {
  const { pathId } = route.params;
  const { profile } = useAuth();

  const [path, setPath] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    const [{ data: pathData }, { data: lecturesData }] = await Promise.all([
      supabase.from('paths').select('*').eq('id', pathId).single(),
      supabase.from('lectures').select('*').eq('path_id', pathId).order('order_index', { ascending: true }),
    ]);

    setPath(pathData || null);
    setLectures(lecturesData || []);

    if (profile?.id) {
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('id, progress_percent')
        .eq('student_id', profile.id)
        .eq('path_id', pathId)
        .maybeSingle();
      setEnrollment(enrollData || null);

      const lectureIds = (lecturesData || []).map((l) => l.id);
      if (lectureIds.length) {
        const { data: progressData } = await supabase
          .from('lecture_progress')
          .select('lecture_id')
          .eq('student_id', profile.id)
          .in('lecture_id', lectureIds);
        setCompletedIds((progressData || []).map((p) => p.lecture_id));
      }
    }

    setLoading(false);
  }, [pathId, profile?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleEnroll() {
    if (!profile?.id || !path) return;
    setEnrolling(true);
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ student_id: profile.id, path_id: path.id, progress_percent: 0 })
      .select('id, progress_percent')
      .single();
    setEnrolling(false);

    if (error) {
      Alert.alert('تعذّر التسجيل', error.message);
      return;
    }
    setEnrollment(data);
    Alert.alert('تم التسجيل ✅', `تم تسجيلك بمسار "${path.title}".`);
  }

  if (loading) {
    return (
      <View style={[styles.wrap, { alignItems: 'center', justifyContent: 'center' }]}>
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
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <View style={styles.banner}>
        <Text style={styles.bannerTxt}>{path.title?.charAt(0) ?? '؟'}</Text>
      </View>

      <Text style={styles.title}>{path.title}</Text>
      <Text style={styles.teacher}>{path.provider} · {path.university}</Text>

      <View style={styles.tagRow}>
        {!!path.specialization && <Text style={styles.tag}>{path.specialization}</Text>}
        {!!path.duration && <Text style={styles.tag}>{path.duration}</Text>}
        <Text style={[styles.tag, styles.tagPrice]}>{path.price || 'مجانًا'}</Text>
      </View>

      {!!path.summary && <Text style={styles.summary}>{path.summary}</Text>}
      {!!path.full_description && <Text style={styles.description}>{path.full_description}</Text>}

      {Array.isArray(path.outcomes) && path.outcomes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>وش راح تتعلم</Text>
          <View style={styles.card}>
            {path.outcomes.map((o, i) => (
              <View key={i} style={styles.outcomeRow}>
                <Text style={styles.outcomeTxt}>{o}</Text>
                <Text style={styles.outcomeCheck}>✓</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {!!path.audience && (
        <>
          <Text style={styles.sectionTitle}>لمن هذا المسار</Text>
          <Text style={styles.description}>{path.audience}</Text>
        </>
      )}

      {enrollment ? (
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${enrollment.progress_percent}%` }]} />
            </View>
            <Text style={styles.progressPct}>{enrollment.progress_percent}%</Text>
          </View>
          <Text style={styles.progressLbl}>أنت مسجّل بهذا المسار</Text>
        </View>
      ) : path.status === 'waitlist' ? (
        <View style={styles.waitBadge}>
          <Text style={styles.waitBadgeTxt}>قائمة انتظار — لم يُفتح بعد</Text>
        </View>
      ) : (
        <Pressable style={styles.enrollBtn} onPress={handleEnroll} disabled={enrolling}>
          {enrolling ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.enrollBtnTxt}>سجّل الآن</Text>}
        </Pressable>
      )}

      <View style={styles.lecturesHead}>
        <Text style={styles.sectionTitle}>محتوى الدورة</Text>
        <Text style={styles.lecturesCount}>{lectures.length} محاضرة</Text>
      </View>

      {lectures.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه محاضرات مضافة بعد لهذا المسار.</Text>
      ) : (
        <View style={styles.card}>
          {lectures.map((lecture, i) => {
            const isDone = completedIds.includes(lecture.id);
            return (
              <Pressable
                key={lecture.id}
                style={[styles.lectureRow, i === lectures.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('Lecture', { lectureId: lecture.id, pathId })}
              >
                <View style={[styles.lectureCheck, isDone && styles.lectureCheckDone]}>
                  {isDone && <Text style={styles.lectureCheckTxt}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lectureTitle}>{lecture.title}</Text>
                  {!!lecture.duration_minutes && (
                    <Text style={styles.lectureMeta}>{lecture.duration_minutes} دقيقة</Text>
                  )}
                </View>
                <Text style={styles.lectureIndex}>{i + 1}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },

  banner: {
    width: '100%', aspectRatio: 16 / 8, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(242,183,5,0.10)', borderWidth: 1, borderColor: colors.line, marginBottom: 16,
  },
  bannerTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 40 },

  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 22, textAlign: 'right', marginBottom: 4 },
  teacher: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', marginBottom: 12 },

  tagRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { borderWidth: 1, borderColor: colors.line, color: colors.muted, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, fontSize: 11, fontFamily: fonts.body },
  tagPrice: { borderColor: colors.goldDim, color: colors.gold, fontFamily: fonts.bodyBold },

  summary: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14.5, textAlign: 'right', lineHeight: 22, marginBottom: 10 },
  description: { fontFamily: fonts.body, color: colors.muted, fontSize: 13.5, textAlign: 'right', lineHeight: 22, marginBottom: 16 },

  sectionTitle: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 1, textAlign: 'right', marginBottom: 10 },

  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16, marginBottom: 16,
  },

  outcomeRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  outcomeTxt: { flex: 1, fontFamily: fonts.body, color: colors.ink, fontSize: 13.5, textAlign: 'right' },
  outcomeCheck: { color: colors.gold, fontSize: 14 },

  progressCard: {
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 24,
  },
  progressRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 6 },
  progressPct: { color: colors.muted, fontFamily: fonts.body, fontSize: 11.5 },
  progressLbl: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5, textAlign: 'right' },

  waitBadge: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 13, alignItems: 'center', marginBottom: 24 },
  waitBadgeTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 12.5 },

  enrollBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  enrollBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14.5 },

  lecturesHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lecturesCount: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },

  lectureRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  lectureCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  lectureCheckDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  lectureCheckTxt: { color: colors.bg, fontSize: 12, fontFamily: fonts.bodyBold },
  lectureTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5, textAlign: 'right', marginBottom: 2 },
  lectureMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 11.5, textAlign: 'right' },
  lectureIndex: { fontFamily: fonts.mono, color: colors.muted, fontSize: 11 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 20, lineHeight: 22 },
});
