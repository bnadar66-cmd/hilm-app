import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';
import { SUBJECTS, FLASHCARDS_BY_SUBJECT } from '../data/mockStudyContent';

export default function FlashCardsContentScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const cards = FLASHCARDS_BY_SUBJECT[subjectId] ?? [];

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  function handleNext() {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  function handlePrev() {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  if (cards.length === 0) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backTxt}>‹ رجوع</Text>
        </Pressable>
        <Text style={styles.emptyTxt}>ما فيه بطاقات مضافة بعد لهذي المادة.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.title}>Flash Cards — {subject?.name}</Text>
      <Text style={styles.sub}>بطاقة {index + 1} من {cards.length}</Text>

      <Pressable style={styles.card} onPress={() => setFlipped((f) => !f)}>
        <Text style={styles.cardEyebrow}>{flipped ? 'الإجابة' : 'السؤال'}</Text>
        <Text style={styles.cardText}>{flipped ? card.back : card.front}</Text>
        <View style={styles.flipHint}>
          <Ionicons name="sync-outline" size={14} color={colors.muted} />
          <Text style={styles.flipHintTxt}>اضغط للقلب</Text>
        </View>
      </Pressable>

      <View style={styles.navRow}>
        <Pressable style={styles.navBtn} onPress={handlePrev}>
          <Ionicons name="chevron-forward" size={20} color={colors.ink} />
        </Pressable>
        <Pressable style={[styles.navBtn, styles.navBtnPrimary]} onPress={handleNext}>
          <Text style={styles.navBtnPrimaryTxt}>البطاقة التالية</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 4 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', marginBottom: 24 },

  card: {
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.lg, backgroundColor: colors.card,
    minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14,
  },
  cardEyebrow: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 2 },
  cardText: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 18, textAlign: 'center', lineHeight: 28 },
  flipHint: { flexDirection: 'row', alignItems: 'center', gap: 5, position: 'absolute', bottom: 16 },
  flipHintTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },

  navRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginTop: 22 },
  navBtn: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', width: 50,
  },
  navBtnPrimary: { flex: 1, backgroundColor: colors.gold, borderColor: colors.gold, width: undefined },
  navBtnPrimaryTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 22 },
});
