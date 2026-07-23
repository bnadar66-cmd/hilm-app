import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const MONTH_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_AR[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRelativeTime(isoStr) {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  return `قبل ${days} أيام`;
}

const STATUS_STYLE = {
  'منتظم': { color: '#4ADE80' },
  'غير منتظم': { color: '#F0928C' },
};

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const [paymentSummary, setPaymentSummary] = useState({ paid: 0, remaining: 0, nextDate: null });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const [{ data: paymentsData }, { data: notificationsData }] = await Promise.all([
      supabase
        .from('payments')
        .select('amount, due_date, paid_at, enrollments!inner(student_id)')
        .eq('enrollments.student_id', profile.id),
      supabase
        .from('notifications')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);

    const rows = paymentsData || [];
    const paid = rows.filter((p) => p.paid_at).reduce((s, p) => s + Number(p.amount), 0);
    const remaining = rows.filter((p) => !p.paid_at).reduce((s, p) => s + Number(p.amount), 0);
    const upcoming = rows.filter((p) => !p.paid_at && p.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date));
    setPaymentSummary({ paid, remaining, nextDate: upcoming[0]?.due_date ?? null });
    setNotifications(notificationsData || []);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const statusStyle = STATUS_STYLE[profile?.payment_status] ?? { color: colors.muted };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{profile?.full_name?.charAt(0) ?? '؟'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name ?? '...'}</Text>
          <Text style={styles.sub}>{profile?.university} · {profile?.specialization}</Text>
        </View>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactRow}>
          <Text style={styles.contactValue}>{profile?.email ?? '—'}</Text>
          <Ionicons name="mail-outline" size={16} color={colors.muted} />
        </View>
        <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.contactValue}>{profile?.phone ?? '—'}</Text>
          <Ionicons name="call-outline" size={16} color={colors.muted} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginBottom: 26 }} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>الدفعات</Text>
          <View style={styles.rowsCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{paymentSummary.paid.toLocaleString('ar')} ريال</Text>
              <Text style={styles.infoLabel}>المبلغ المدفوع</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{paymentSummary.remaining.toLocaleString('ar')} ريال</Text>
              <Text style={styles.infoLabel}>المبلغ المتبقي</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{paymentSummary.nextDate ? formatDate(paymentSummary.nextDate) : 'لا يوجد'}</Text>
              <Text style={styles.infoLabel}>موعد الدفعة القادمة</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.infoValue, { color: statusStyle.color }]}>{profile?.payment_status ?? '—'}</Text>
              <Text style={styles.infoLabel}>حالة الدفع</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>الإشعارات</Text>
          {notifications.length === 0 ? (
            <Text style={styles.emptyTxt}>ما وصلك أي إشعار بعد.</Text>
          ) : (
            <View style={{ marginBottom: 4 }}>
              {notifications.map((n) => (
                <View key={n.id} style={styles.notifCard}>
                  <View style={styles.notifIconWrap}>
                    <Ionicons name="notifications-outline" size={18} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.notifHead}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifTime}>{formatRelativeTime(n.created_at)}</Text>
                    </View>
                    <Text style={styles.notifBody}>{n.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <Text style={styles.sectionTitle}>الإعدادات</Text>
      <View style={styles.rowsCard}>
        <Pressable style={styles.row}>
          <Text style={styles.rowTxt}>تعديل البيانات الشخصية</Text>
          <Text style={styles.chev}>‹</Text>
        </Pressable>
        <Pressable style={styles.row}>
          <Text style={styles.rowTxt}>تغيير كلمة المرور</Text>
          <Text style={styles.chev}>‹</Text>
        </Pressable>
        <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={signOut}>
          <Text style={[styles.rowTxt, styles.dangerTxt]}>تسجيل الخروج</Text>
          <Text style={[styles.chev, styles.dangerTxt]}>‹</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  head: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(242,183,5,0.15)',
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 24 },
  name: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16, textAlign: 'right', marginBottom: 4 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5, textAlign: 'right' },

  contactCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16, marginBottom: 26,
  },
  contactRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10, justifyContent: 'flex-end',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  contactValue: { fontFamily: fonts.body, color: colors.ink, fontSize: 13.5 },

  sectionTitle: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 1, textAlign: 'right', marginBottom: 10 },
  rowsCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16, marginBottom: 26,
  },
  infoRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  infoLabel: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },
  infoValue: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5 },

  notifCard: {
    flexDirection: 'row-reverse', gap: 12,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 13, marginBottom: 10,
  },
  notifIconWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(242,183,5,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  notifTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13, textAlign: 'right' },
  notifTime: { fontFamily: fonts.body, color: colors.muted, fontSize: 10.5 },
  notifBody: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, textAlign: 'right', lineHeight: 18 },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginBottom: 26, lineHeight: 22 },

  row: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  rowTxt: { fontFamily: fonts.body, color: colors.ink, fontSize: 14 },
  chev: { color: colors.muted, fontSize: 16 },
  dangerTxt: { color: '#F0928C' },
});
