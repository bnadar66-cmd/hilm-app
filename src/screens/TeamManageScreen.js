import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { supabase } from '../lib/supabase';

const ROLE_LABELS = { admin: 'أدمن', teacher: 'معلم' };

export default function TeamManageScreen() {
  const [members, setMembers] = useState([]);
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('teacher');
  const [pathId, setPathId] = useState(null);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    const [{ data: membersData }, { data: pathsData }] = await Promise.all([
      supabase.from('admins').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }),
      supabase.from('paths').select('id, title').order('sort_order', { ascending: true }),
    ]);
    setMembers(membersData || []);
    setPaths(pathsData || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function resetForm() {
    setFullName('');
    setEmail('');
    setRole('teacher');
    setPathId(null);
  }

  async function handleInvite() {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('تحقق من البيانات', 'أدخل الاسم والإيميل.');
      return;
    }
    setInviting(true);
    const { data, error } = await supabase.functions.invoke('manage-staff', {
      body: { mode: 'invite_staff', email: email.trim(), full_name: fullName.trim(), role, path_id: pathId },
    });
    setInviting(false);

    if (error || data?.error) {
      Alert.alert('تعذّرت الدعوة', data?.error || error.message);
      return;
    }
    Alert.alert('تم إرسال الدعوة ✅', `وصلت دعوة لـ ${email.trim()} — بينتظر يفتح رابط الإيميل ويعيّن كلمة مرور.`);
    resetForm();
    setFormOpen(false);
    load();
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
    >
      <View style={styles.sectionHead}>
        <Text style={styles.title}>الفريق</Text>
        <Pressable style={styles.addBtn} onPress={() => setFormOpen((v) => !v)}>
          <Text style={styles.addBtnTxt}>{formOpen ? '✕ إغلاق' : '+ دعوة عضو'}</Text>
        </Pressable>
      </View>

      {formOpen && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="الاسم الكامل" placeholderTextColor={colors.muted} value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="الإيميل" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <View style={styles.roleRow}>
            <Pressable style={[styles.rolePill, role === 'teacher' && styles.rolePillActive]} onPress={() => setRole('teacher')}>
              <Text style={[styles.rolePillTxt, role === 'teacher' && styles.rolePillTxtActive]}>معلم</Text>
            </Pressable>
            <Pressable style={[styles.rolePill, role === 'admin' && styles.rolePillActive]} onPress={() => setRole('admin')}>
              <Text style={[styles.rolePillTxt, role === 'admin' && styles.rolePillTxtActive]}>أدمن</Text>
            </Pressable>
          </View>

          {role === 'teacher' && (
            <>
              <Text style={styles.pickerLabel}>إسناد مسار (اختياري)</Text>
              <View style={styles.pathRow}>
                <Pressable style={[styles.pathPill, !pathId && styles.pathPillActive]} onPress={() => setPathId(null)}>
                  <Text style={[styles.pathPillTxt, !pathId && styles.pathPillTxtActive]}>بدون</Text>
                </Pressable>
                {paths.map((p) => (
                  <Pressable key={p.id} style={[styles.pathPill, pathId === p.id && styles.pathPillActive]} onPress={() => setPathId(p.id)}>
                    <Text style={[styles.pathPillTxt, pathId === p.id && styles.pathPillTxtActive]}>{p.title}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Pressable style={styles.saveBtn} onPress={handleInvite} disabled={inviting}>
            {inviting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>إرسال الدعوة</Text>}
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 30 }} />
      ) : (
        members.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.full_name || m.email}</Text>
              <Text style={styles.memberEmail}>{m.email}</Text>
            </View>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagTxt}>{ROLE_LABELS[m.role] ?? m.role}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20 },
  addBtn: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5 },

  formCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 18,
  },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.bg,
    color: colors.ink, fontFamily: fonts.body, fontSize: 14, padding: 11, marginBottom: 10, textAlign: 'right',
  },
  roleRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  rolePill: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 9, alignItems: 'center' },
  rolePillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  rolePillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 13 },
  rolePillTxtActive: { color: colors.bg },

  pickerLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, textAlign: 'right', marginBottom: 8 },
  pathRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pathPill: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  pathPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  pathPillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12 },
  pathPillTxtActive: { color: colors.bg },

  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  saveBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },

  card: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 12,
  },
  memberName: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14, textAlign: 'right', marginBottom: 2 },
  memberEmail: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, textAlign: 'right' },
  roleTag: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  roleTagTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 11 },
});
