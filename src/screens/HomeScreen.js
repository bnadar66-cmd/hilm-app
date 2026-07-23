import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Pressable, ScrollView,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { colors, fonts, radius } from '../theme/theme';
import { LOGO_DATA_URI } from '../theme/logo';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const WEEKDAY_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function formatDueLabel(dateStr) {
  // dateStr: 'YYYY-MM-DC'
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((due - today) / 86400000);

  if (diffDays === 0) return { label: 'اليوم', urgent: true };
  if (diffDays === 1) return { label: 'غدًا', urgent: true };
  if (diffDays > 1 && diffDays <= 6) return { label: `بعد ${diffDays} أيام`, urgent: false };
  if (diffDays < 0) return { label: 'فات وقته', urgent: false, past: true };

  return { label: `${due.getDate()} ${MONTH_AR[due.getMonth()]}`, urgent: false };
}

export default function HomeScreen() {
  const { profile, signOut } = useAuth();

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('exam'); // exam | assignment
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState(''); // YYYY-MM-DD
  const [dueTime, setDueTime] = useState(''); // HH:MM اختياري

  const loadItems = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('student_id', profile.id)
      .order('due_date', { ascending: true });

    if (!error) setItems(data || []);
    setLoadingItems(false);
    setRefreshing(false);
  }, [profile?.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function resetForm() {
    setType('exam');
    setTitle('');
    setSubject('');
    setDueDate('');
    setDueTime('');
  }

  async function handleAddItem() {
    if (!title.trim() || !dueDate.trim()) {
      Alert.alert('تحقق من البيانات', 'أدخل العنوان والتاريخ على الأقل (مثال: 2026-08-05).');
      return;
    }
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim());
    if (!dateOk) {
      Alert.alert('صيغة التاريخ غير صحيحة', 'استخدم الصيغة: YYYY-MM-DD مثل 2026-08-05');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('schedule_items').insert({
      student_id: profile.id,
      type,
      title: title.trim(),
      subject: subject.trim() || null,
      due_date: dueDate.trim(),
      due_time: dueTime.trim() || null,
    });
    setSaving(false);

    if (error) {
      Alert.alert('تعذّر الإضافة', error.message);
      return;
    }
    resetForm();
    setFormOpen(false);
    loadItems();
  }

  async function handleToggleDone(item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_done: !i.is_done } : i)));
    await supabase.from('schedule_items').update({ is_done: !item.is_done }).eq('id', item.id);
  }

  function handleDelete(item) {
    Alert.alert('حذف العنصر', `تحذف "${item.title}" من الجدول؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          await supabase.from('schedule_items').delete().eq('id', item.id);
        },
      },
    ]);
  }

  const upcoming = items.filter((i) => !i.is_done);
  const done = items.filter((i) => i.is_done);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadItems(); }} tintColor={colors.gold} />
      }
    >
      <View style={styles.topbar}>
        <Image source={{ uri: LOGO_DATA_URI }} style={styles.logo} resizeMode="contain" />
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>خروج</Text>
        </Pressable>
      </View>

      <Text style={styles.greet}>أهلًا، {profile?.full_name ?? '...'} 👋</Text>
      <Text style={styles.meta}>{profile?.university} · {profile?.specialization}</Text>

      {/* ===== جدول التاريخ ===== */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>جدولك</Text>
        <Pressable style={styles.addBtn} onPress={() => setFormOpen((v) => !v)}>
          <Text style={styles.addBtnTxt}>{formOpen ? '✕ إغلاق' : '+ إضافة'}</Text>
        </Pressable>
      </View>

      {formOpen && (
        <View style={styles.formCard}>
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typePill, type === 'exam' && styles.typePillActive]}
              onPress={() => setType('exam')}
            >
              <Text style={[styles.typePillTxt, type === 'exam' && styles.typePillTxtActive]}>اختبار</Text>
            </Pressable>
            <Pressable
              style={[styles.typePill, type === 'assignment' && styles.typePillActive]}
              onPress={() => setType('assignment')}
            >
              <Text style={[styles.typePillTxt, type === 'assignment' && styles.typePillTxtActive]}>واجب</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="العنوان (مثال: اختبار الفارماكولوجي)"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="المادة (اختياري)"
            placeholderTextColor={colors.muted}
            value={subject}
            onChangeText={setSubject}
          />
          <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="التاريخ: 2026-08-05"
              placeholderTextColor={colors.muted}
              value={dueDate}
              onChangeText={setDueDate}
            />
            <TextInput
              style={[styles.input, { width: 92 }]}
              placeholder="09:00"
              placeholderTextColor={colors.muted}
              value={dueTime}
              onChangeText={setDueTime}
            />
          </View>

          <Pressable style={styles.saveBtn} onPress={handleAddItem} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>حفظ بالجدول</Text>}
          </Pressable>
        </View>
      )}

      {loadingItems ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} />
      ) : upcoming.length === 0 ? (
        <Text style={styles.emptyTxt}>ما عندك أي شي مجدول حاليًا. اضغط "+ إضافة" وابدأ.</Text>
      ) : (
        upcoming.map((item) => {
          const due = formatDueLabel(item.due_date);
          return (
            <View key={item.id} style={styles.itemRow}>
              <Pressable onPress={() => handleToggleDone(item)} style={styles.checkbox} />
              <View style={{ flex: 1 }}>
                <View style={styles.itemTopRow}>
                  <Text style={[styles.typeTag, item.type === 'exam' ? styles.typeTagExam : styles.typeTagAssignment]}>
                    {item.type === 'exam' ? 'اختبار' : 'واجب'}
                  </Text>
                  <Text style={[styles.dueLabel, due.urgent && styles.dueLabelUrgent]}>
                    {due.label}{item.due_time ? ` · ${item.due_time}` : ''}
                  </Text>
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {!!item.subject && <Text style={styles.itemSubject}>{item.subject}</Text>}
              </View>
              <Pressable onPress={() => handleDelete(item)}>
                <Text style={styles.deleteTxt}>حذف</Text>
              </Pressable>
            </View>
          );
        })
      )}

      {done.length > 0 && (
        <>
          <Text style={styles.doneHeader}>تم إنجازه ({done.length})</Text>
          {done.map((item) => (
            <View key={item.id} style={[styles.itemRow, { opacity: 0.5 }]}>
              <Pressable onPress={() => handleToggleDone(item)} style={[styles.checkbox, styles.checkboxDone]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { textDecorationLine: 'line-through' }]}>{item.title}</Text>
              </View>
              <Pressable onPress={() => handleDelete(item)}>
                <Text style={styles.deleteTxt}>حذف</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  topbar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  logo: { width: 76, height: 30 },
  signOut: { color: '#F0928C', fontFamily: fonts.body, fontSize: 13 },

  greet: { fontFamily: fonts.display, color: colors.ink, fontSize: 22, marginBottom: 6, textAlign: 'right' },
  meta: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, marginBottom: 26, textAlign: 'right' },

  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: fonts.display, color: colors.ink, fontSize: 18 },
  addBtn: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5 },

  formCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 18,
  },
  typeRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 10 },
  typePill: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 9, alignItems: 'center' },
  typePillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  typePillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 13 },
  typePillTxtActive: { color: colors.bg },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.bg,
    color: colors.ink, fontFamily: fonts.body, fontSize: 14, padding: 11, marginBottom: 10, textAlign: 'right',
  },
  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  saveBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: 22 },

  itemRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 13, marginBottom: 10,
  },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.line, marginTop: 2 },
  checkboxDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  itemTopRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeTag: { fontSize: 10.5, fontFamily: fonts.mono, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
  typeTagExam: { color: '#F0928C', borderWidth: 1, borderColor: 'rgba(240,146,140,0.4)' },
  typeTagAssignment: { color: colors.gold, borderWidth: 1, borderColor: colors.goldDim },
  dueLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  dueLabelUrgent: { color: colors.gold, fontFamily: fonts.bodyBold },
  itemTitle: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 14, textAlign: 'right', marginBottom: 2 },
  itemSubject: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, textAlign: 'right' },
  deleteTxt: { color: '#F0928C', fontFamily: fonts.body, fontSize: 12 },

  doneHeader: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, marginTop: 10, marginBottom: 10, textAlign: 'right' },
});
