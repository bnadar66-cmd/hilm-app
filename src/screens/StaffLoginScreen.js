import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import InputCard from '../theme/InputCard';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';

export default function StaffLoginScreen({ navigation }) {
  const [mode, setMode] = useState('login'); // login | bootstrap

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [bootstrapName, setBootstrapName] = useState('');
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [bootstrapPassword, setBootstrapPassword] = useState('');
  const [bootstrapping, setBootstrapping] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('تحقق من البيانات', 'أدخل الإيميل وكلمة المرور.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      Alert.alert('تعذّر تسجيل الدخول', error.message);
      return;
    }
    // ما نحتاج أي تنقّل يدوي — AuthContext يتابع الجلسة ويوديك تلقائيًا للوحة الموظفين
  }

  async function handleBootstrap() {
    if (!bootstrapName.trim() || !bootstrapEmail.trim() || !bootstrapPassword) {
      Alert.alert('تحقق من البيانات', 'الرجاء تعبئة كل الحقول.');
      return;
    }
    if (bootstrapPassword.length < 6) {
      Alert.alert('كلمة مرور قصيرة', 'كلمة المرور لازم تكون 6 أحرف على الأقل.');
      return;
    }

    setBootstrapping(true);
    const { data, error } = await supabase.functions.invoke('manage-staff', {
      body: {
        mode: 'bootstrap_admin',
        email: bootstrapEmail.trim(),
        password: bootstrapPassword,
        full_name: bootstrapName.trim(),
      },
    });

    if (error || data?.error) {
      setBootstrapping(false);
      Alert.alert('تعذّر إنشاء الحساب', data?.error || error.message);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: bootstrapEmail.trim(),
      password: bootstrapPassword,
    });
    setBootstrapping(false);

    if (signInError) {
      Alert.alert('تم إنشاء الحساب', 'سجّل دخولك الآن بنفس البيانات.');
      setMode('login');
      setEmail(bootstrapEmail.trim());
    }
    // نجاح تسجيل الدخول: AuthContext يتابع الجلسة تلقائيًا
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.eyebrow}>الموظفين</Text>
      <Text style={styles.title}>{mode === 'login' ? 'دخول الموظفين' : 'إنشاء أول حساب أدمن'}</Text>

      {mode === 'login' ? (
        <>
          <InputCard label="الإيميل" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
          <InputCard label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          <Pressable style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryBtnTxt}>تسجيل الدخول</Text>}
          </Pressable>

          <Pressable onPress={() => setMode('bootstrap')} style={{ marginTop: 18 }}>
            <Text style={styles.switchTxt}>أول مرة تسوي حساب أدمن؟</Text>
          </Pressable>
        </>
      ) : (
        <>
          <InputCard label="الاسم الكامل" value={bootstrapName} onChangeText={setBootstrapName} placeholder="اسمك" />
          <InputCard label="الإيميل" value={bootstrapEmail} onChangeText={setBootstrapEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
          <InputCard label="كلمة المرور" value={bootstrapPassword} onChangeText={setBootstrapPassword} placeholder="6 أحرف على الأقل" secureTextEntry />

          <Pressable style={styles.primaryBtn} onPress={handleBootstrap} disabled={bootstrapping}>
            {bootstrapping ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryBtnTxt}>إنشاء الحساب</Text>}
          </Pressable>

          <Pressable onPress={() => setMode('login')} style={{ marginTop: 18 }}>
            <Text style={styles.switchTxt}>عندك حساب؟ سجّل دخولك</Text>
          </Pressable>
        </>
      )}
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
  switchTxt: { color: colors.gold, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
});
