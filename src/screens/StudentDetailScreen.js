import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const MONTH_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_AR[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_STYLE = {
  'منتظم': { color: '#4ADE80' },
  'غير منتظم': { color: '#F0928C' },
};

export default function StudentDetailScreen({ route, navigation }) {
  const { studentId } = route.params;
  const { isAdmin } = useAuth();

  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [availablePaths, setAvailablePaths] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [enrollFormOpen, setEnrollFormOpen] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [schType, setSchType] = useState('exam');
  const [schTitle, setSchTitle] = useState('');
  const [schSubject, setSchSubject] = useState('');
  const [schDate, setSchDate] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const [notifFormOpen, setNotifFormOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  const load = useCallback(async () => {
    const [{ data: studentData }, { data: enrollData }] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('enrollments').select('id, progress_percent, status, path:paths(id, title)').eq('student_id', studentId),
    ]);
    setStudent(studentData || null);
    setEnrollments(enrollData || []);

    if (isAdmin) {
      const enrolledPathIds = (enrollData || []).map((e) => e.path?.id).filter(Boolean);
      const [{ data: pathsData }, { data: scheduleData }, { data: notifData }] = await Promise.all([
        supabase.from('paths').select('id, title'),
        supabase.from('schedule_items').select('*').eq('student_id', studentId).order('due_date', { ascending: true }),
        supabase.from('notifications').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      ]);
      setAvailablePaths((pathsData || []).filter((p) => !enrolledPathIds.includes(p.id)));
      setScheduleItems(scheduleData || []);
      setNotifications(notifData || []);

      const enrollmentIds = (enrollData || []).map((e) => e.id);
      if (enrollmentIds.length) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*, enrollment:enrollments(path:paths(title))')
          .in('enrollment_id', enrollmentIds)
          .order('due_date', { ascending: true });
        setPayments(paymentsData || []);
      } else {
        setPayments([]);
      }
    }
    setLoading(false);
  }, [studentId, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleTogglePaymentStatus() {
    const next = student.payment_status === 'منتظم' ? 'غير منتظم' : 'منتظم';
    setStudent((prev) => ({ ...prev, payment_status: next }));
    await supabase.from('students').update({ payment_status: next }).eq('id', studentId);
  }

  async function handleEnroll() {
    if (!selectedPathId) return;
    setEnrolling(true);
    const { error } = await supabase.from('enrollments').insert({ student_id: studentId, path_id: selectedPathId, progress_percent: 0 });
    setEnrolling(false);
    if (error) {
      Alert.alert('تعذّر التسجيل', error.message);
      return;
    }
    setSelectedPathId(null);
    setEnrollFormOpen(false);
    load();
  }

  async function handleAddSchedule() {
    if (!schTitle.trim() || !schDate.trim()) {
      Alert.alert('تحقق من البيانات', 'أدخل العنوان والتاريخ.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(schDate.trim())) {
      Alert.alert('صيغة التاريخ غير صحيحة', 'استخدم الصيغة: YYYY-MM-DD');
      return;
    }
    setSavingSchedule(true);
    const { error } = await supabase.from('schedule_items').insert({
      student_id: studentId,
      type: schType,
      title: schTitle.trim(),
      subject: schSubject.trim() || null,
      due_date: schDate.trim(),
    });
    setSavingSchedule(false);
    if (error) {
      Alert.alert('تعذّر الإضافة', error.message);
      return;
    }
    setSchTitle('');
    setSchSubject('');
    setSchDate('');
    setScheduleFormOpen(false);
    load();
  }

  function handleDeleteSchedule(item) {
    Alert.alert('حذف العنصر', `تحذف "${item.title}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setScheduleItems((prev) => prev.filter((i) => i.id !== item.id));
          await supabase.from('schedule_items').delete().eq('id', item.id);
        },
      },
    ]);
  }

  async function handleAddPayment() {
    const amountNum = Number(paymentAmount);
    if (!paymentEnrollmentId || !paymentAmount.trim() || Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('تحقق من البيانات', 'اختر المسار وأدخل مبلغ صحيح.');
      return;
    }
    setSavingPayment(true);
    const { error } = await supabase.from('payments').insert({
      enrollment_id: paymentEnrollmentId,
      amount: amountNum,
      due_date: paymentDueDate.trim() || null,
    });
    setSavingPayment(false);
    if (error) {
      Alert.alert('تعذّر الإضافة', error.message);
      return;
    }
    setPaymentAmount('');
    setPaymentDueDate('');
    setPaymentEnrollmentId(null);
    setPaymentFormOpen(false);
    load();
  }

  async function handleMarkPaid(payment) {
    setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, paid_at: new Date().toISOString() } : p)));
    await supabase.from('payments').update({ paid_at: new Date().toISOString() }).eq('id', payment.id);
  }

  async function handleSendNotification() {
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert('تحقق من البيانات', 'أدخل العنوان والنص.');
      return;
    }
    setSendingNotif(true);
    const { error } = await supabase.from('notifications').insert({
      student_id: studentId,
      title: notifTitle.trim(),
      body: notifBody.trim(),
    });
    setSendingNotif(false);
    if (error) {
      Alert.alert('تعذّر الإرسال', error.message);
      return;
    }
    setNotifTitle('');
    setNotifBody('');
    setNotifFormOpen(false);
    load();
  }

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backTxt}>‹ رجوع</Text>
        </Pressable>
        <Text style={styles.emptyTxt}>ما قدرنا نلقى هذا الطالب.</Text>
      </View>
    );
  }

  const statusStyle = STATUS_STYLE[student.payment_status] ?? { color: colors.muted };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{student.full_name?.charAt(0) ?? '؟'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{student.full_name}</Text>
          <Text style={styles.sub}>{student.university} · {student.specialization}</Text>
        </View>
        <Text style={styles.studentNumber}>#{student.student_number}</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="الإيميل" value={student.email ?? '—'} />
        <InfoRow label="الجوال" value={student.phone ?? '—'} last />
      </View>

      {isAdmin && (
        <Pressable style={[styles.statusToggle, { borderColor: statusStyle.color }]} onPress={handleTogglePaymentStatus}>
          <Text style={[styles.statusToggleTxt, { color: statusStyle.color }]}>حالة الدفع: {student.payment_status}</Text>
        </Pressable>
      )}

      {/* ===== الدورات المسجّلة ===== */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>الدورات المسجّلة ({enrollments.length})</Text>
        {isAdmin && (
          <Pressable style={styles.addBtn} onPress={() => setEnrollFormOpen((v) => !v)}>
            <Text style={styles.addBtnTxt}>{enrollFormOpen ? '✕ إغلاق' : '+ تسجيل بمسار'}</Text>
          </Pressable>
        )}
      </View>

      {enrollFormOpen && (
        <View style={styles.formCard}>
          {availablePaths.length === 0 ? (
            <Text style={styles.emptyTxt}>ما فيه مسارات إضافية متاحة.</Text>
          ) : (
            <>
              <View style={styles.pillRow}>
                {availablePaths.map((p) => (
                  <Pressable key={p.id} style={[styles.pill, selectedPathId === p.id && styles.pillActive]} onPress={() => setSelectedPathId(p.id)}>
                    <Text style={[styles.pillTxt, selectedPathId === p.id && styles.pillTxtActive]}>{p.title}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.saveBtn} onPress={handleEnroll} disabled={enrolling}>
                {enrolling ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>تسجيل</Text>}
              </Pressable>
            </>
          )}
        </View>
      )}

      {enrollments.length === 0 ? (
        <Text style={styles.emptyTxt}>ما هو مسجّل بأي مسار.</Text>
      ) : (
        enrollments.map((e) => (
          <View key={e.id} style={styles.rowCard}>
            <Text style={styles.rowCardTitle}>{e.path?.title}</Text>
            <Text style={styles.rowCardMeta}>{e.progress_percent}% · {e.status}</Text>
          </View>
        ))
      )}

      {isAdmin && (
        <>
          {/* ===== الجدول ===== */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>الجدول ({scheduleItems.length})</Text>
            <Pressable style={styles.addBtn} onPress={() => setScheduleFormOpen((v) => !v)}>
              <Text style={styles.addBtnTxt}>{scheduleFormOpen ? '✕ إغلاق' : '+ إضافة'}</Text>
            </Pressable>
          </View>

          {scheduleFormOpen && (
            <View style={styles.formCard}>
              <View style={styles.pillRow}>
                <Pressable style={[styles.pill, schType === 'exam' && styles.pillActive]} onPress={() => setSchType('exam')}>
                  <Text style={[styles.pillTxt, schType === 'exam' && styles.pillTxtActive]}>اختبار</Text>
                </Pressable>
                <Pressable style={[styles.pill, schType === 'assignment' && styles.pillActive]} onPress={() => setSchType('assignment')}>
                  <Text style={[styles.pillTxt, schType === 'assignment' && styles.pillTxtActive]}>واجب</Text>
                </Pressable>
              </View>
              <TextInput style={styles.input} placeholder="العنوان" placeholderTextColor={colors.muted} value={schTitle} onChangeText={setSchTitle} />
              <TextInput style={styles.input} placeholder="المادة (اختياري)" placeholderTextColor={colors.muted} value={schSubject} onChangeText={setSchSubject} />
              <TextInput style={styles.input} placeholder="التاريخ: 2026-08-05" placeholderTextColor={colors.muted} value={schDate} onChangeText={setSchDate} />
              <Pressable style={styles.saveBtn} onPress={handleAddSchedule} disabled={savingSchedule}>
                {savingSchedule ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>حفظ</Text>}
              </Pressable>
            </View>
          )}

          {scheduleItems.length === 0 ? (
            <Text style={styles.emptyTxt}>ما فيه عناصر بالجدول.</Text>
          ) : (
            scheduleItems.map((item) => (
              <View key={item.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowCardTitle}>{item.title}</Text>
                  <Text style={styles.rowCardMeta}>{item.type === 'exam' ? 'اختبار' : 'واجب'} · {formatDate(item.due_date)}</Text>
                </View>
                <Pressable onPress={() => handleDeleteSchedule(item)}>
                  <Text style={styles.deleteTxt}>حذف</Text>
                </Pressable>
              </View>
            ))
          )}

          {/* ===== الدفعات ===== */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>الدفعات ({payments.length})</Text>
            <Pressable style={styles.addBtn} onPress={() => setPaymentFormOpen((v) => !v)}>
              <Text style={styles.addBtnTxt}>{paymentFormOpen ? '✕ إغلاق' : '+ إضافة'}</Text>
            </Pressable>
          </View>

          {paymentFormOpen && (
            <View style={styles.formCard}>
              {enrollments.length === 0 ? (
                <Text style={styles.emptyTxt}>لازم يكون الطالب مسجّل بمسار أول.</Text>
              ) : (
                <>
                  <View style={styles.pillRow}>
                    {enrollments.map((e) => (
                      <Pressable key={e.id} style={[styles.pill, paymentEnrollmentId === e.id && styles.pillActive]} onPress={() => setPaymentEnrollmentId(e.id)}>
                        <Text style={[styles.pillTxt, paymentEnrollmentId === e.id && styles.pillTxtActive]}>{e.path?.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput style={styles.input} placeholder="المبلغ" placeholderTextColor={colors.muted} value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="تاريخ الاستحقاق (اختياري): 2026-08-05" placeholderTextColor={colors.muted} value={paymentDueDate} onChangeText={setPaymentDueDate} />
                  <Pressable style={styles.saveBtn} onPress={handleAddPayment} disabled={savingPayment}>
                    {savingPayment ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>حفظ</Text>}
                  </Pressable>
                </>
              )}
            </View>
          )}

          {payments.length === 0 ? (
            <Text style={styles.emptyTxt}>ما فيه دفعات مسجّلة.</Text>
          ) : (
            payments.map((p) => (
              <View key={p.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowCardTitle}>{p.enrollment?.path?.title} · {Number(p.amount).toLocaleString('ar')} ريال</Text>
                  <Text style={styles.rowCardMeta}>{p.due_date ? formatDate(p.due_date) : 'بدون تاريخ استحقاق'}</Text>
                </View>
                {p.paid_at ? (
                  <Text style={styles.paidTag}>مدفوعة</Text>
                ) : (
                  <Pressable onPress={() => handleMarkPaid(p)}>
                    <Text style={styles.markPaidTxt}>تعليم كمدفوعة</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}

          {/* ===== الإشعارات ===== */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>الإشعارات ({notifications.length})</Text>
            <Pressable style={styles.addBtn} onPress={() => setNotifFormOpen((v) => !v)}>
              <Text style={styles.addBtnTxt}>{notifFormOpen ? '✕ إغلاق' : '+ إرسال إشعار'}</Text>
            </Pressable>
          </View>

          {notifFormOpen && (
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="عنوان الإشعار" placeholderTextColor={colors.muted} value={notifTitle} onChangeText={setNotifTitle} />
              <TextInput style={[styles.input, { minHeight: 70 }]} placeholder="نص الإشعار" placeholderTextColor={colors.muted} value={notifBody} onChangeText={setNotifBody} multiline />
              <Pressable style={styles.saveBtn} onPress={handleSendNotification} disabled={sendingNotif}>
                {sendingNotif ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnTxt}>إرسال</Text>}
              </Pressable>
            </View>
          )}

          {notifications.length === 0 ? (
            <Text style={styles.emptyTxt}>ما فيه إشعارات مُرسلة.</Text>
          ) : (
            notifications.map((n) => (
              <View key={n.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowCardTitle}>{n.title}</Text>
                  <Text style={styles.rowCardMeta}>{n.body}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  center: { alignItems: 'center', justifyContent: 'center' },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },

  head: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(242,183,5,0.15)',
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 20 },
  name: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16, textAlign: 'right', marginBottom: 3 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, textAlign: 'right' },
  studentNumber: { color: colors.muted, fontFamily: fonts.mono, fontSize: 12 },

  infoCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16, marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  infoLabel: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },
  infoValue: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5 },

  statusToggle: { borderWidth: 1, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', marginBottom: 24 },
  statusToggleTxt: { fontFamily: fonts.bodyBold, fontSize: 13.5 },

  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.display, color: colors.ink, fontSize: 16 },
  addBtn: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 11.5 },

  formCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 14,
  },
  pillRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  pillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  pillTxt: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12 },
  pillTxtActive: { color: colors.bg },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.bg,
    color: colors.ink, fontFamily: fonts.body, fontSize: 14, padding: 11, marginBottom: 10, textAlign: 'right',
  },
  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  saveBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },

  rowCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 13, marginBottom: 10,
  },
  rowCardTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5, textAlign: 'right', marginBottom: 2 },
  rowCardMeta: { fontFamily: fonts.body, color: colors.muted, fontSize: 11.5, textAlign: 'right' },
  deleteTxt: { color: '#F0928C', fontFamily: fonts.body, fontSize: 12 },
  paidTag: { color: '#4ADE80', fontFamily: fonts.bodyBold, fontSize: 12 },
  markPaidTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginVertical: 10, lineHeight: 22 },
});
