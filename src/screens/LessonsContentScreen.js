import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';
import { SUBJECTS, LECTURES_BY_SUBJECT } from '../data/mockStudyContent';

export default function LessonsContentScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const lectures = LECTURES_BY_SUBJECT[subjectId] ?? [];
  const completedCount = lectures.filter((l) => l.completed).length;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.title}>دروس {subject?.name}</Text>
      <Text style={styles.sub}>{completedCount} من {lectures.length} محاضرة مكتملة</Text>

      {lectures.map((lecture, i) => (
        <Pressable key={lecture.id} style={styles.card}>
          <View style={styles.thumb}>
            <Ionicons name="play" size={20} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lectureTitle}>{i + 1}. {lecture.title}</Text>
            <Text style={styles.lectureMeta}>{lecture.duration} دقيقة</Text>
          </View>
          {lecture.completed ? (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark" size={13} color={colors.bg} />
            </View>
          ) : (
            <View style={styles.pendingBadge} />
          )}
        </Pressable>
      ))}
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
    padding: 13, marginBottom: 10,
  },
  thumb: {
    width: 46, height: 46, borderRadius: radius.sm, backgroundColor: 'rgba(242,183,5,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  lectureTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5, textAlign: 'right', marginBottom: 2 },
  lectureMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 11.5, textAlign: 'right' },
  doneBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.line },
});
