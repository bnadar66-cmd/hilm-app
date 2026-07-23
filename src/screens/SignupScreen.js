import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import InputCard from '../theme/InputCard';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!fullName || !phone || !email || !university || !specialization) {
      Alert.alert('تحقق من البيانات', 'الرجاء تعبئة كل الحقول.');
      return;
    }

    setLoading(true);
    // مؤقتًا: تسجيل دخول مباشر بدون رمز تحقق (لحين تفعيل مزود SMS الفعلي لاحقًا)
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      setLoading(false);
      Alert.alert('تعذّر إنشاء الحساب', error.message);
      return;
    }

    const { error: profileError } = await supabase
      .from('students')
      .upsert({ id: data.user.id, full_name: fullName, phone, email, university, specialization });

    setLoading(false);

    if (profileError) {
      Alert.alert('تم إنشاء الحساب، لكن صار خطأ بحفظ بياناتك', profileError.message);
      return;
    }

    // ما نحتاج أي تنقّل يدوي — AuthContext يتابع الجلسة ويوديك تلقائيًا للرئيسية
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.eyebrow}>التسجيل</Text>
      <Text style={styles.title}>ابدأ رحلتك</Text>

      <InputCard label="الاسم الكامل" value={fullName} onChangeText={setFullName} placeholder="مثال: نورة عبدالله السهلي" />
      <InputCard label="رقم الجوال" value={phone} onChangeText={setPhone} placeholder="+9665xxxxxxxx" keyboardType="phone-pad" />
      <InputCard label="البريد الإلكتروني" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
      <InputCard label="الجامعة" value={university} onChangeText={setUniversity} placeholder="اسم جامعتك" />
      <InputCard label="التخصص" value={specialization} onChangeText={setSpecialization} placeholder="تخصصك" />

      <Pressable style={styles.primaryBtn} onPress={handleContinue} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryBtnTxt}>إنشاء الحساب</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, backgroundColor: colors.bg, padding: 22, paddingTop: 50 },
  backRow: { marginBottom: 14 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  eyebrow: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 24, marginBottom: 22 },
  primaryBtn: {
    backgroundColor: colors.gold, paddingVertical: 15, borderRadius: radius.sm,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnTxt: { fontFamily: fonts.bodyBold, color: colors.bg, fontSize: 15 },
});
