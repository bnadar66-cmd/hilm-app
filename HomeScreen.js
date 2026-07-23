import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';

// ملاحظة: هذي شاشة بداية بسيطة تثبت إن المصادقة الحقيقية شغّالة كاملة.
// شاشات الرئيسية/دوراتي/استكشف/حسابي (Bottom Navigation) هي الخطوة القادمة.
export default function HomeScreen() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.wrap}>
      <Text style={styles.greet}>أهلًا، {profile?.full_name ?? '...'} 👋</Text>
      <Text style={styles.meta}>{profile?.university} · {profile?.specialization}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTxt}>
          تسجيل الدخول شغّال فعليًا الحين عبر Supabase Auth الحقيقي — هذا أول جزء كامل من التطبيق.
          باقي الشاشات (الرئيسية بتفاصيلها، دوراتي، استكشف، حسابي، صفحة الدورة والمحاضرة) هي الخطوة القادمة.
        </Text>
      </View>

      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutTxt}>تسجيل الخروج</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 22, paddingTop: 60 },
  greet: { fontFamily: fonts.display, color: colors.ink, fontSize: 22, marginBottom: 6 },
  meta: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, marginBottom: 24 },
  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    backgroundColor: colors.card, padding: 16, marginBottom: 24,
  },
  cardTxt: { fontFamily: fonts.body, color: colors.ink, fontSize: 13.5, lineHeight: 22, textAlign: 'right' },
  signOutBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  signOutTxt: { fontFamily: fonts.bodyBold, color: '#F0928C', fontSize: 14 },
});
