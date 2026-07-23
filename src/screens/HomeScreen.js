import React, { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';
import { LOGO_DATA_URI } from '../theme/logo';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import HomeCarousel from '../components/HomeCarousel';
import SwipePager from '../components/SwipePager';
import ScheduleCalendar from '../components/ScheduleCalendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BODY_PADDING = 22;
const SCHEDULE_PAGE_WIDTH = SCREEN_WIDTH - BODY_PADDING * 2;
const SCHEDULE_PAGE_HEIGHT = 360;

const WEEKDAY_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// ===== محتوى الكاروسيل تسويقي/تحريري — لسا غير مربوط بقاعدة بيانات (بانتظار لوحة إدارة له) =====
const CAROUSEL_SLIDES = [
  {
    id: '1',
    tag: 'دورة جديدة',
    title: 'مسار الإنعاش القلبي الرئوي',
    description: 'دورة عملية شاملة لإتقان أساسيات CPR خطوة بخطوة',
    buttonLabel: 'استكشف الدورة',
    icon: 'medkit-outline',
  },
  {
    id: '2',
    tag: 'عرض محدود',
    title: 'خصم 20% على جميع الدورات',
    description: 'استخدم الفرصة قبل ما تنتهي نهاية الشهر',
    buttonLabel: 'شوف العروض',
    icon: 'pricetag-outline',
  },
  {
    id: '3',
    tag: 'تنبيه',
    title: 'اختبارات منتصف الفصل قريبًا',
    description: 'جهّز جدولك وابدأ المراجعة من الحين',
    buttonLabel: null,
    icon: 'alarm-outline',
  },
];

const QUICK_SERVICES = [
  { key: 'lessons', label: 'الدروس', icon: 'play-circle-outline' },
  { key: 'files', label: 'الملفات', icon: 'document-text-outline' },
  { key: 'flashcards', label: 'Flash Cards', icon: 'layers-outline' },
  { key: 'questions', label: 'الأسئلة', icon: 'help-circle-outline' },
];

const REMINDER_OPTIONS = [
  { key: 'none', label: 'بدون تذكير' },
  { key: '15', label: 'قبل 15 دقيقة' },
  { key: '30', label: 'قبل نصف ساعة' },
  { key: '60', label: 'قبل ساعة' },
];

const REMINDER_LABELS = { '15': '15 د', '30': '30 د', '60': 'ساعة' };

function formatDueLabel(dateStr) {
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

function todayKey() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('exam');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminder, setReminder] = useState('none');

  const loadItems = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('student_id', profile.id)
      .order('due_date', { ascending: true });

    if (!error) setItems(data || []);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  function resetForm() {
    setType('exam');
    setTitle('');
    setSubject('');
    setDueDate('');
    setDueTime('');
    setReminder('none');
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
      reminder_minutes: reminder === 'none' ? null : Number(reminder),
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
  const selectedDayItems = items.filter((i) => i.due_date === selectedDate);

  const today = new Date();
  const greeting = `${WEEKDAY_AR[today.getDay()]}، أهلًا ${profile?.full_name ?? ''} 👋`;

  function renderTaskRow(item) {
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
          <View style={styles.itemBottomRow}>
            {!!item.subject && <Text style={styles.itemSubject}>{item.subject}</Text>}
            {!!item.reminder_minutes && (
              <View style={styles.reminderBadge}>
                <Ionicons name="notifications-outline" size={11} color={colors.gold} />
                <Text style={styles.reminderBadgeTxt}>{REMINDER_LABELS[String(item.reminder_minutes)]}</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable onPress={() => handleDelete(item)}>
          <Text style={styles.deleteTxt}>حذف</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <HomeCarousel slides={CAROUSEL_SLIDES} />

      <View style={styles.body}>
        <View style={styles.topbar}>
          <Image source={{ uri: LOGO_DATA_URI }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.greet}>{greeting}</Text>
        </View>

        {/* ===== جدولي ===== */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>جدولي</Text>
          <Pressable style={styles.addBtn} onPress={() => setFormOpen((v) => !v)}>
            <Text style={styles.addBtnTxt}>{formOpen ? '✕ إغلاق' : '+ إضافة'}</Text>
          </Pressable>
        </View>

        {formOpen && (
          <View style={styles.formCard}>
            <View style={styles.typeRow}>
              <Pressable style={[styles.typePill, type === 'exam' && styles.typePillActive]} onPress={() => setType('exam')}>
                <Text style={[styles.typePillTxt, type === 'exam' && styles.typePillTxtActive]}>اختبار</Text>
              </Pressable>
              <Pressable style={[styles.typePill, type === 'assignment' && styles.typePillActive]} onPress={() => setType('assignment')}>
                <Text style={[styles.typePillTxt, type === 'assignment' && styles.typePillTxtActive]}>واجب</Text>
              </Pressable>
            </View>

            <TextInput style={styles.input} placeholder="العنوان (مثال: اختبار الفارماكولوجي)" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="المادة (اختياري)" placeholderTextColor={colors.muted} value={subject} onChangeText={setSubject} />
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="التاريخ: 2026-08-05" placeholderTextColor={colors.muted} value={dueDate} onChangeText={setDueDate} />
              <TextInput style={[styles.input, { width: 92 }]} placeholder="09:00" placeholderTextColor={colors.muted} value={dueTime} onChangeText={setDueTime} />
            </View>

            <Text style={styles.reminderLabel}>تذكير</Text>
            <View style={styles.reminderRow}>
              {REMINDER_OPTIONS.map((opt) => (
                <Pressable key={opt.key} style={[styles.reminderPill, reminder === opt.key && styles.reminderPillActive]} onPress={() => setReminder(opt.key)}>
                  <Text style={[styles.reminderPillTxt, reminder === opt.key && styles.reminderPillTxtActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.saveBtn} onPress={handleAddItem} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>حفظ بالجدول</Text>}
            </Pressable>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
        ) : (
          <SwipePager
            pageWidth={SCHEDULE_PAGE_WIDTH}
            height={SCHEDULE_PAGE_HEIGHT}
            pages={[
              <View key="calendar">
                <ScheduleCalendar items={items} selectedKey={selectedDate} onSelectDate={setSelectedDate} />
                <Text style={styles.dayDetailsTitle}>تفاصيل اليوم</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {selectedDayItems.length === 0 ? (
                    <Text style={styles.emptyTxt}>ما فيه شي مجدول بهذا اليوم.</Text>
                  ) : (
                    selectedDayItems.map((item) => renderTaskRow(item))
                  )}
                </ScrollView>
              </View>,
              <ScrollView key="list" showsVerticalScrollIndicator={false}>
                {upcoming.length === 0 ? (
                  <Text style={styles.emptyTxt}>ما عندك أي شي مجدول حاليًا. اضغط "+ إضافة" وابدأ.</Text>
                ) : (
                  upcoming.map((item) => renderTaskRow(item))
                )}
              </ScrollView>,
            ]}
          />
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

        {/* ===== الخدمات السريعة ===== */}
        <Text style={[styles.sectionTitle, { marginTop: 30, marginBottom: 14 }]}>الخدمات السريعة</Text>
        <View style={styles.servicesGrid}>
          {QUICK_SERVICES.map((service) => (
            <Pressable
              key={service.key}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('SubjectList', { category: service.key })}
            >
              <View style={styles.serviceIconWrap}>
                <Ionicons name={service.icon} size={26} color={colors.gold} />
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: BODY_PADDING, paddingTop: 20 },

  topbar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  logo: { width: 66, height: 26 },
  greet: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },

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
  reminderLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, textAlign: 'right', marginBottom: 8 },
  reminderRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  reminderPill: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  reminderPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  reminderPillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12 },
  reminderPillTxtActive: { color: colors.bg },
  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  saveBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 6, lineHeight: 22 },

  dayDetailsTitle: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 1, textAlign: 'right', marginTop: 16, marginBottom: 10 },

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
  itemTitle: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 14, textAlign: 'right', marginBottom: 4 },
  itemBottomRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  itemSubject: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, textAlign: 'right' },
  reminderBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  reminderBadgeTxt: { color: colors.gold, fontFamily: fonts.body, fontSize: 11 },
  deleteTxt: { color: '#F0928C', fontFamily: fonts.body, fontSize: 12 },

  doneHeader: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, marginTop: 14, marginBottom: 10, textAlign: 'right' },

  servicesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  serviceCard: {
    width: '47%', aspectRatio: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  serviceIconWrap: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(242,183,5,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  serviceLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13.5 },
});
