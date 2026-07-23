import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';
import { pickAndUploadMedia } from '../lib/uploadMedia';

export default function StaffLectureManageScreen({ route, navigation }) {
  const { lectureId, pathId } = route.params;

  const [lecture, setLecture] = useState(null);
  const [files, setFiles] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const load = useCallback(async () => {
    const [{ data: lectureData }, { data: filesData }, { data: commentsData }] = await Promise.all([
      supabase.from('lectures').select('*').eq('id', lectureId).single(),
      supabase.from('lecture_files').select('*').eq('lecture_id', lectureId).order('created_at', { ascending: true }),
      supabase.from('lecture_comments').select('id, body, created_at, student:students(full_name)').eq('lecture_id', lectureId).order('created_at', { ascending: true }),
    ]);
    setLecture(lectureData || null);
    setFiles(filesData || []);
    setComments(commentsData || []);
    setLoading(false);
  }, [lectureId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleUploadVideo() {
    try {
      setUploadingVideo(true);
      const result = await pickAndUploadMedia(`lectures/${lectureId}/video`, { type: 'video/*' });
      if (!result) {
        setUploadingVideo(false);
        return;
      }
      const { error } = await supabase.from('lectures').update({ video_url: result.url }).eq('id', lectureId);
      setUploadingVideo(false);
      if (error) {
        Alert.alert('تعذّر الحفظ', error.message);
        return;
      }
      load();
    } catch (err) {
      setUploadingVideo(false);
      Alert.alert('تعذّر رفع الفيديو', err.message);
    }
  }

  async function handleUploadFile() {
    try {
      setUploadingFile(true);
      const result = await pickAndUploadMedia(`lectures/${lectureId}/files`);
      if (!result) {
        setUploadingFile(false);
        return;
      }
      const { error } = await supabase.from('lecture_files').insert({
        lecture_id: lectureId,
        title: result.name,
        file_url: result.url,
        file_type: result.mimeType,
      });
      setUploadingFile(false);
      if (error) {
        Alert.alert('تعذّر الحفظ', error.message);
        return;
      }
      load();
    } catch (err) {
      setUploadingFile(false);
      Alert.alert('تعذّر رفع الملف', err.message);
    }
  }

  function handleDeleteFile(file) {
    Alert.alert('حذف الملف', `تحذف "${file.title}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setFiles((prev) => prev.filter((f) => f.id !== file.id));
          await supabase.from('lecture_files').delete().eq('id', file.id);
        },
      },
    ]);
  }

  function handleDeleteComment(comment) {
    Alert.alert('حذف التعليق', 'تحذف هذا التعليق من النقاش؟', [
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
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.title}>{lecture.title}</Text>

      <Text style={styles.sectionTitle}>الفيديو</Text>
      <View style={styles.card}>
        <Text style={styles.statusTxt}>{lecture.video_url ? '✓ يوجد فيديو مرفوع' : 'ما فيه فيديو مرفوع بعد'}</Text>
        <Pressable style={styles.uploadBtn} onPress={handleUploadVideo} disabled={uploadingVideo}>
          {uploadingVideo ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.uploadBtnTxt}>{lecture.video_url ? 'استبدال الفيديو' : 'رفع فيديو'}</Text>}
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>الملفات ({files.length})</Text>
        <Pressable style={styles.addBtn} onPress={handleUploadFile} disabled={uploadingFile}>
          {uploadingFile ? <ActivityIndicator color={colors.gold} /> : <Text style={styles.addBtnTxt}>+ رفع ملف</Text>}
        </Pressable>
      </View>

      {files.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه ملفات مرفوعة بعد.</Text>
      ) : (
        <View style={styles.listCard}>
          {files.map((file, i) => (
            <View key={file.id} style={[styles.fileRow, i === files.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileTitle}>{file.title}</Text>
                {!!file.file_type && <Text style={styles.fileMeta}>{file.file_type}</Text>}
              </View>
              <Pressable onPress={() => handleDeleteFile(file)}>
                <Text style={styles.deleteTxt}>حذف</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>مراقبة النقاش ({comments.length})</Text>
      {comments.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه نقاش على هذي المحاضرة بعد.</Text>
      ) : (
        comments.map((comment) => (
          <View key={comment.id} style={styles.commentRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.commentHead}>
                <Text style={styles.commentName}>{comment.student?.full_name ?? 'طالب'}</Text>
                <Pressable onPress={() => handleDeleteComment(comment)}>
                  <Text style={styles.deleteTxt}>حذف</Text>
                </Pressable>
              </View>
              <Text style={styles.commentBody}>{comment.body}</Text>
            </View>
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

  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 22 },
  sectionTitle: { fontFamily: fonts.display, color: colors.ink, fontSize: 16, textAlign: 'right', marginBottom: 12 },
  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5 },

  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 16, marginBottom: 22, alignItems: 'center', gap: 12,
  },
  statusTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  uploadBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  uploadBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 13.5 },

  listCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16, marginBottom: 22,
  },
  fileRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  fileTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5, textAlign: 'right', marginBottom: 2 },
  fileMeta: { fontFamily: fonts.mono, color: colors.muted, fontSize: 11, textAlign: 'right' },
  deleteTxt: { color: '#F0928C', fontFamily: fonts.body, fontSize: 12 },

  commentRow: {
    flexDirection: 'row-reverse',
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 13, marginBottom: 10,
  },
  commentHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentName: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13, textAlign: 'right' },
  commentBody: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', lineHeight: 20 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 20, lineHeight: 22 },
});
