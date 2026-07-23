import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';
import { SUBJECTS } from '../data/mockStudyContent';

const CATEGORY_META = {
  lessons: { title: 'الدروس', destination: 'LessonsContent' },
  files: { title: 'الملفات', destination: 'FilesContent' },
  flashcards: { title: 'Flash Cards', destination: 'FlashCardsContent' },
  questions: { title: 'الأسئلة', destination: 'QuestionsContent' },
};

export default function SubjectListScreen({ route, navigation }) {
  const { category } = route.params;
  const meta = CATEGORY_META[category];

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.title}>{meta.title}</Text>
      <Text style={styles.sub}>اختر المادة</Text>

      {SUBJECTS.map((subject) => (
        <Pressable
          key={subject.id}
          style={styles.card}
          onPress={() => navigation.navigate(meta.destination, { subjectId: subject.id })}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={subject.icon} size={22} color={colors.gold} />
          </View>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 22, textAlign: 'right', marginBottom: 4 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', marginBottom: 20 },

  card: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 15, marginBottom: 12,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(242,183,5,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  subjectName: { flex: 1, fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 15, textAlign: 'right' },
});
