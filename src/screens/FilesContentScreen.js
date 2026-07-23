import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';
import { SUBJECTS, FILES_BY_SUBJECT } from '../data/mockStudyContent';

const TYPE_ICONS = { PDF: 'document-text-outline', Slides: 'easel-outline', 'إضافي': 'attach-outline' };

export default function FilesContentScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const files = FILES_BY_SUBJECT[subjectId] ?? [];

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.title}>ملفات {subject?.name}</Text>
      <Text style={styles.sub}>{files.length} ملف متاح</Text>

      {files.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه ملفات مضافة بعد لهذي المادة.</Text>
      ) : (
        files.map((file) => (
          <Pressable key={file.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={TYPE_ICONS[file.type] ?? 'document-outline'} size={20} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileTitle}>{file.title}</Text>
              <Text style={styles.fileMeta}>{file.type} · {file.size}</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={colors.muted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 4 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', marginBottom: 20 },

  card: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 10,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: radius.sm, backgroundColor: 'rgba(242,183,5,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  fileTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5, textAlign: 'right', marginBottom: 2 },
  fileMeta: { fontFamily: fonts.mono, color: colors.muted, fontSize: 11, textAlign: 'right' },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 22 },
});
