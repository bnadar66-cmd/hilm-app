import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';
import { SUBJECTS, QUIZ_BY_SUBJECT } from '../data/mockStudyContent';

export default function QuestionsContentScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const questions = QUIZ_BY_SUBJECT[subjectId] ?? [];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const percent = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);
  const progressPercent = questions.length === 0 ? 0 : Math.round(((index + (selected !== null ? 1 : 0)) / questions.length) * 100);

  function handleSelect(optionIndex) {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnsweredCount((c) => c + 1);
    if (optionIndex === question.correctIndex) setCorrectCount((c) => c + 1);
  }

  function handleNext() {
    setSelected(null);
    if (!isLast) setIndex((i) => i + 1);
  }

  if (questions.length === 0) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backTxt}>‹ رجوع</Text>
        </Pressable>
        <Text style={styles.emptyTxt}>ما فيه أسئلة مضافة بعد لهذي المادة.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.title}>أسئلة {subject?.name}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{percent}%</Text>
          <Text style={styles.statLbl}>نسبتك</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{answeredCount}/{questions.length}</Text>
          <Text style={styles.statLbl}>محلولة</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{progressPercent}%</Text>
          <Text style={styles.statLbl}>الإنجاز</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <Text style={styles.questionCounter}>سؤال {index + 1} من {questions.length}</Text>
      <Text style={styles.questionTxt}>{question.question}</Text>

      {question.options.map((option, i) => {
        const isCorrect = i === question.correctIndex;
        const isSelected = i === selected;
        const showState = selected !== null;

        return (
          <Pressable
            key={i}
            style={[
              styles.option,
              showState && isCorrect && styles.optionCorrect,
              showState && isSelected && !isCorrect && styles.optionWrong,
            ]}
            onPress={() => handleSelect(i)}
          >
            <Text
              style={[
                styles.optionTxt,
                showState && isCorrect && styles.optionTxtCorrect,
                showState && isSelected && !isCorrect && styles.optionTxtWrong,
              ]}
            >
              {option}
            </Text>
            {showState && isCorrect && <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />}
            {showState && isSelected && !isCorrect && <Ionicons name="close-circle" size={18} color="#F0928C" />}
          </Pressable>
        );
      })}

      {selected !== null && (
        <View style={styles.explainCard}>
          <Text style={styles.explainLabel}>{selected === question.correctIndex ? '✓ إجابة صحيحة' : '✕ إجابة خاطئة'}</Text>
          <Text style={styles.explainTxt}>{question.explanation}</Text>
        </View>
      )}

      {selected !== null && !isLast && (
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnTxt}>السؤال التالي</Text>
        </Pressable>
      )}

      {selected !== null && isLast && (
        <View style={styles.doneCard}>
          <Text style={styles.doneTxt}>خلّصت كل الأسئلة! نسبتك النهائية {percent}%</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 18 },

  statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 12, alignItems: 'center',
  },
  statNum: { fontFamily: fonts.bodyBold, color: colors.gold, fontSize: 16, marginBottom: 3 },
  statLbl: { fontFamily: fonts.body, color: colors.muted, fontSize: 10.5 },

  progressBar: { height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 24 },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 6 },

  questionCounter: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, textAlign: 'right', marginBottom: 8 },
  questionTxt: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 17, textAlign: 'right', lineHeight: 26, marginBottom: 18 },

  option: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 10,
  },
  optionCorrect: { borderColor: '#4ADE80', backgroundColor: 'rgba(74,222,128,0.08)' },
  optionWrong: { borderColor: '#F0928C', backgroundColor: 'rgba(240,146,140,0.08)' },
  optionTxt: { fontFamily: fonts.body, color: colors.ink, fontSize: 14, textAlign: 'right', flex: 1 },
  optionTxtCorrect: { color: '#4ADE80', fontFamily: fonts.bodyBold },
  optionTxtWrong: { color: '#F0928C', fontFamily: fonts.bodyBold },

  explainCard: {
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginTop: 6, marginBottom: 18,
  },
  explainLabel: { fontFamily: fonts.bodyBold, color: colors.gold, fontSize: 13, textAlign: 'right', marginBottom: 6 },
  explainTxt: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', lineHeight: 20 },

  nextBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  nextBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14.5 },

  doneCard: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.md, padding: 16, alignItems: 'center' },
  doneTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14, textAlign: 'center' },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 22 },
});
