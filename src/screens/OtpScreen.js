import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';

const OTP_LENGTH = 6;

export default function OtpScreen({ route, navigation }) {
  const { phone, pendingProfile } = route.params;
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  function handleChange(text, index) {
    const clean = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleConfirm() {
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('أدخل الرمز كاملًا', `الرمز مكوّن من ${OTP_LENGTH} أرقام.`);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });

    if (error) {
      setLoading(false);
      Alert.alert('رمز غير صحيح', error.message);
      return;
    }

    // أول تسجيل: نحفظ بيانات الملف الشخصي المعلّقة من شاشة التسجيل
    if (pendingProfile && data?.user?.id) {
      const { error: profileError } = await supabase
        .from('students')
        .upsert({ id: data.user.id, ...pendingProfile });
      if (profileError) {
        setLoading(false);
        Alert.alert('تم التحقق، لكن صار خطأ بحفظ بياناتك', profileError.message);
        return;
      }
    }

    setLoading(false);
    // التنقّل التلقائي للتطبيق الرئيسي يحصل عبر مراقبة الجلسة بـ AuthContext (راجع App.js)
  }

  async function handleResend() {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) Alert.alert('تعذّر إعادة الإرسال', error.message);
    else Alert.alert('تم الإرسال', 'تم إرسال رمز جديد.');
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.eyebrow}>التحقق من الحساب</Text>
      <Text style={styles.title}>أدخل رمز التحقق</Text>
      <Text style={styles.sub}>أرسلنا رمز مكوّن من {OTP_LENGTH} أرقام إلى {phone}</Text>

      <View style={styles.otpRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            style={styles.otpBox}
            value={d}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={handleConfirm} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryBtnTxt}>تأكيد</Text>}
      </Pressable>

      <Pressable onPress={handleResend} style={{ marginTop: 16 }}>
        <Text style={styles.resend}>ما وصلك الرمز? إعادة الإرسال</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 22, paddingTop: 50 },
  backRow: { marginBottom: 14 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  eyebrow: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 24, marginBottom: 10 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 18 },
  otpRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, marginBottom: 22 },
  otpBox: {
    width: 42, height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    backgroundColor: colors.card, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 20,
  },
  primaryBtn: { backgroundColor: colors.gold, paddingVertical: 15, borderRadius: radius.sm, alignItems: 'center' },
  primaryBtnTxt: { fontFamily: fonts.bodyBold, color: colors.bg, fontSize: 15 },
  resend: { color: colors.gold, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
});
