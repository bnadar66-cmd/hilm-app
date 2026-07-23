import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.mark}>حلم</Text>
      <Text style={styles.tag}>رحلتك الأكاديمية تبدأ من هنا</Text>

      <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.primaryBtnTxt}>إنشاء حساب جديد</Text>
      </Pressable>

      <Pressable style={styles.ghostBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.ghostBtnTxt}>تسجيل الدخول</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  mark: { fontFamily: fonts.display, fontSize: 52, color: colors.gold, marginBottom: 6 },
  tag: { fontFamily: fonts.body, color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 44, lineHeight: 22 },
  primaryBtn: {
    backgroundColor: colors.gold, paddingVertical: 15, borderRadius: radius.sm,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  primaryBtnTxt: { fontFamily: fonts.bodyBold, color: colors.bg, fontSize: 15 },
  ghostBtn: {
    borderWidth: 1, borderColor: colors.line, paddingVertical: 15, borderRadius: radius.sm,
    width: '100%', alignItems: 'center',
  },
  ghostBtnTxt: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 15 },
});
