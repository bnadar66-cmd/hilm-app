import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator,
  TextInput, Alert, Linking, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const TABS = [
  { key: 'video', label: 'الفيديو' },
  { key: 'files', label: 'الملفات' },
  { key: 'discussion', label: 'نقاش وأسئلة' },
];

export default function LectureScreen({ route, navigation }) {
  const { lectureId, pathId } = route.params;
  const { profile } = useAuth();
  const { width } = useWindowDimensions();

  const [lecture, setLecture] = useState(null);
  const [siblingLectures, setSiblingLectures] = useState([]);
  const [files, setFiles] = useState([]);
  const [comments, setComments] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  const load = useCallback(async () => {
    const [{ data: lectureData }, { data: allLectures }, { data: filesData }, { data: commentsData }] = await Promise.all([
      supabase.from('lectures').select('*').eq('id', lectureId).single(),
      supabase.from('lectures').select('id, order_index').eq('path_id', pathId).order('order_index', { ascending: true }),
      supabase.from('lecture_files').select('*').eq('lecture_id', lectureId).order('created_at', { ascending: true }),
      supabase.from('lecture_comments').select('id, body, created_at, student_id, student:students(full_name)').eq('lecture_id', lectureId).order('created_at', { ascending: true }),
    ]);
    setLecture(lectureData || null);
    setSiblingLectures(allLectures || []);
    setFiles(filesData || []);
    setComments(commentsData || []);

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
    setActiveTab('video');
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

  async function handlePostComment() {
    if (!profile?.id || !newComment.trim()) return;
    setPostingComment(true);
    const { error } = await supabase
      .from('lecture_comments')
      .insert({ lecture_id: lectureId, student_id: profile.id, body: newComment.trim() });
    setPostingComment(false);

    if (error) {
      Alert.alert('تعذّر إرسال التعليق', error.message);
      return;
    }
    setNewComment('');
    load();
  }

  function handleDeleteComment(comment) {
    Alert.alert('حذف التعليق', 'تحذف تعليقك من النقاش؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setComments((prev) => prev.filter((c) => c.id !== comment.id));
          await supabase.from('lecture_comments').delete().eq('id', comment.id);
        },
      },
    ]);
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
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.title}>{lecture.title}</Text>
      {!!lecture.duration_minutes && <Text style={styles.meta}>{lecture.duration_minutes} دقيقة</Text>}

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabPillTxt, activeTab === tab.key && styles.tabPillTxtActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'video' && (
        lecture.video_url ? (
          <VideoView style={[styles.video, { width: width - 44 }]} player={player} allowsFullscreen nativeControls />
        ) : (
          <View style={[styles.video, styles.videoPlaceholder]}>
            <Text style={styles.videoPlaceholderTxt}>الفيديو غير متوفر بعد لهذي المحاضرة</Text>
          </View>
        )
      )}

      {activeTab === 'files' && (
        files.length === 0 ? (
          <Text style={styles.emptyTxt}>ما فيه ملفات مضافة بعد لهذي المحاضرة.</Text>
        ) : (
          <View style={styles.card}>
            {files.map((file, i) => (
              <Pressable
                key={file.id}
                style={[styles.fileRow, i === files.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => Linking.openURL(file.file_url)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileTitle}>{file.title}</Text>
                  {!!file.file_type && <Text style={styles.fileMeta}>{file.file_type}</Text>}
                </View>
                <Text style={styles.fileOpen}>فتح ‹</Text>
              </Pressable>
            ))}
          </View>
        )
      )}

      {activeTab === 'discussion' && (
        <View>
          {comments.length === 0 ? (
            <Text style={styles.emptyTxt}>كن أول من يبدأ النقاش على هذي المحاضرة.</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarTxt}>{comment.student?.full_name?.charAt(0) ?? '؟'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentHead}>
                    <Text style={styles.commentName}>{comment.student?.full_name ?? 'طالب'}</Text>
                    {comment.student_id === profile?.id && (
                      <Pressable onPress={() => handleDeleteComment(comment)}>
                        <Text style={styles.commentDelete}>حذف</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.commentBody}>{comment.body}</Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.commentForm}>
            <TextInput
              style={styles.commentInput}
              placeholder="اكتب سؤال أو تعليق..."
              placeholderTextColor={colors.muted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable style={styles.commentSendBtn} onPress={handlePostComment} disabled={postingComment}>
              {postingComment ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.commentSendBtnTxt}>إرسال</Text>}
            </Pressable>
          </View>
        </View>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  center: { alignItems: 'center', justifyContent: 'center' },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },

  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 4 },
  meta: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', marginBottom: 18 },

  tabRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 18 },
  tabPill: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 9, alignItems: 'center' },
  tabPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tabPillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12.5 },
  tabPillTxtActive: { color: colors.bg },

  video: { aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: '#000', marginBottom: 18 },
  videoPlaceholder: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: colors.line,
  },
  videoPlaceholderTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16, marginBottom: 18,
  },
  fileRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  fileTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5, textAlign: 'right', marginBottom: 2 },
  fileMeta: { fontFamily: fonts.mono, color: colors.muted, fontSize: 11, textAlign: 'right' },
  fileOpen: { color: colors.gold, fontFamily: fonts.body, fontSize: 12.5 },

  commentRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 16 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(242,183,5,0.15)',
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 14 },
  commentHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  commentName: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13, textAlign: 'right' },
  commentDelete: { color: '#F0928C', fontFamily: fonts.body, fontSize: 11.5 },
  commentBody: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', lineHeight: 20 },

  commentForm: {
    flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 8, marginTop: 4, marginBottom: 22,
  },
  commentInput: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.card,
    color: colors.ink, fontFamily: fonts.body, fontSize: 13.5, padding: 11, textAlign: 'right', minHeight: 44, maxHeight: 100,
  },
  commentSendBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingHorizontal: 18, paddingVertical: 13 },
  commentSendBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 13 },

  doneBtn: {
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.sm, paddingVertical: 14,
    alignItems: 'center', marginBottom: 12,
  },
  doneBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  doneBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14.5 },
  doneBtnTxtActive: { color: colors.bg },

  nextBtn: { alignItems: 'center', paddingVertical: 12 },
  nextBtnTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13.5 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 20, lineHeight: 22 },
});
