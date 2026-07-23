import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import InputCard from '../theme/InputCard';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone) {
      Alert.alert('تحقق من البيانات', 'أدخل رقم جوالك.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);

    if (error) {
      Alert.alert('تعذّر إرسال الرمز', error.message);
      return;
    }
    navigation.navigate('Otp', { phone, pendingProfile: null });
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <Text style={styles.eyebrow}>تسجيل الدخول</Text>
      <Text style={styles.title}>أهلًا فيك من جديد</Text>

      <InputCard label="رقم الجوال" value={phone} onChangeText={setPhone} placeholder="+9665xxxxxxxx" keyboardType="phone-pad" />

      <Pressable style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryBtnTxt}>إرسال رمز الدخول</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 22, paddingTop: 50 },
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
