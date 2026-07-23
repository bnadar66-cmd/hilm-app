import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import InputCard from '../theme/InputCard';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function SetStaffPasswordScreen({ onDone }) {
  const { staffProfile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (password.length < 6) {
      Alert.alert('كلمة مرور قصيرة', 'كلمة المرور لازم تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('كلمتا المرور غير متطابقتين', 'تأكد من إدخال نفس كلمة المرور بالحقلين.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('تعذّر حفظ كلمة المرور', error.message);
      return;
    }
    onDone();
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>أهلًا فيك بفريق حلم</Text>
      <Text style={styles.title}>{staffProfile?.full_name ? `أهلًا ${staffProfile.full_name}` : 'عيّن كلمة مرورك'}</Text>
      <Text style={styles.sub}>عشان تكمل دخولك، عيّن كلمة مرور لحسابك.</Text>

      <InputCard label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="6 أحرف على الأقل" secureTextEntry />
      <InputCard label="تأكيد كلمة المرور" value={confirm} onChangeText={setConfirm} placeholder="أعد كتابة كلمة المرور" secureTextEntry />

      <Pressable style={styles.primaryBtn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryBtnTxt}>حفظ والمتابعة</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 22, paddingTop: 80 },
  eyebrow: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 2, marginBottom: 8, textAlign: 'right' },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 24, marginBottom: 8, textAlign: 'right' },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, marginBottom: 24, textAlign: 'right', lineHeight: 20 },
  primaryBtn: {
    backgroundColor: colors.gold, paddingVertical: 15, borderRadius: radius.sm,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnTxt: { fontFamily: fonts.bodyBold, color: colors.bg, fontSize: 15 },
});
