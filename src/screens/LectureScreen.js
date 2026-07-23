import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function LectureScreen({ route, navigation }) {
  const { lectureId, pathId } = route.params;
  const { profile } = useAuth();
  const { width } = useWindowDimensions();

  const [lecture, setLecture] = useState(null);
  const [siblingLectures, setSiblingLectures] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  const load = useCallback(async () => {
    const [{ data: lectureData }, { data: allLectures }] = await Promise.all([
      supabase.from('lectures').select('*').eq('id', lectureId).single(),
      supabase.from('lectures').select('id, order_index').eq('path_id', pathId).order('order_index', { ascending: true }),
    ]);
    setLecture(lectureData || null);
    setSiblingLectures(allLectures || []);

    if (profile?.id) {
      const { data } = await supabase
        .from('lecture_progress')
        .select('id')
        .eq('student_id', profile.id)
        .eq('lecture_id', lectureId)
        .maybeSingle();
      setIsDone(!!data);
    }
    setLoading(false);
  }, [lectureId, pathId, profile?.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (lecture?.video_url) {
      player.replace(lecture.video_url);
    }
  }, [lecture?.video_url, player]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        player.pause();
      };
    }, [player])
  );

  async function syncEnrollmentProgress() {
    if (!profile?.id || siblingLectures.length === 0) return;
    const { data: doneRows } = await supabase
      .from('lecture_progress')
      .select('lecture_id')
      .eq('student_id', profile.id)
      .in('lecture_id', siblingLectures.map((l) => l.id));

    const pct = Math.round(((doneRows || []).length / siblingLectures.length) * 100);

    await supabase
      .from('enrollments')
      .update({ progress_percent: pct })
      .eq('student_id', profile.id)
      .eq('path_id', pathId);
  }

  async function handleToggleDone() {
    if (!profile?.id) return;
    setSaving(true);
    if (isDone) {
      await supabase.from('lecture_progress').delete().eq('student_id', profile.id).eq('lecture_id', lectureId);
    } else {
      await supabase.from('lecture_progress').insert({ student_id: profile.id, lecture_id: lectureId });
    }
    setIsDone((v) => !v);
    await syncEnrollmentProgress();
    setSaving(false);
  }

  const currentIndex = siblingLectures.findIndex((l) => l.id === lectureId);
  const nextLecture = currentIndex >= 0 ? siblingLectures[currentIndex + 1] : null;

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!lecture) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backTxt}>‹ رجوع</Text>
        </Pressable>
        <Text style={styles.emptyTxt}>ما قدرنا نلقى هذي المحاضرة.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      {lecture.video_url ? (
        <VideoView style={[styles.video, { width: width - 44 }]} player={player} allowsFullscreen nativeControls />
      ) : (
        <View style={[styles.video, styles.videoPlaceholder]}>
          <Text style={styles.videoPlaceholderTxt}>الفيديو غير متوفر بعد لهذي المحاضرة</Text>
        </View>
      )}

      <Text style={styles.title}>{lecture.title}</Text>
      {!!lecture.duration_minutes && <Text style={styles.meta}>{lecture.duration_minutes} دقيقة</Text>}

      <Pressable style={[styles.doneBtn, isDone && styles.doneBtnActive]} onPress={handleToggleDone} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={isDone ? colors.gold : colors.bg} />
        ) : (
          <Text style={[styles.doneBtnTxt, isDone && styles.doneBtnTxtActive]}>
            {isDone ? '✓ تم إنجازها' : 'حدد كمكتملة'}
          </Text>
        )}
      </Pressable>

      {nextLecture && (
        <Pressable
          style={styles.nextBtn}
          onPress={() => navigation.replace('Lecture', { lectureId: nextLecture.id, pathId })}
        >
          <Text style={styles.nextBtnTxt}>المحاضرة التالية ‹</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  center: { alignItems: 'center', justifyContent: 'center' },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },

  video: { aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: '#000', marginBottom: 18 },
  videoPlaceholder: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: colors.line,
  },
  videoPlaceholderTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 4 },
  meta: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', marginBottom: 22 },

  doneBtn: {
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.sm, paddingVertical: 14,
    alignItems: 'center', marginBottom: 12,
  },
  doneBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  doneBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14.5 },
  doneBtnTxtActive: { color: colors.bg },

  nextBtn: { alignItems: 'center', paddingVertical: 12 },
  nextBtnTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13.5 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});
