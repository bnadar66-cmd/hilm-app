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

const STATUS_STYLE = {
  'نشط': { color: '#4ADE80' },
  'مكتمل': { color: colors.gold },
  'موقوف': { color: '#F0928C' },
};

export default function MyCourseDetailScreen({ route, navigation }) {
  const { pathId } = route.params;
  const { profile } = useAuth();

  const [path, setPath] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [totalLectures, setTotalLectures] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const [{ data: pathData }, { data: enrollData }, { count: lectureCount }] = await Promise.all([
      supabase.from('paths').select('*').eq('id', pathId).single(),
      supabase.from('enrollments').select('id, progress_percent, status').eq('student_id', profile.id).eq('path_id', pathId).maybeSingle(),
      supabase.from('lectures').select('id', { count: 'exact', head: true }).eq('path_id', pathId),
    ]);

    setPath(pathData || null);
    setEnrollment(enrollData || null);
    setTotalLectures(lectureCount || 0);

    if (enrollData?.id) {
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('enrollment_id', enrollData.id)
        .order('due_date', { ascending: true });
      setPayments(paymentsData || []);
    } else {
      setPayments([]);
    }
    setLoading(false);
  }, [pathId, profile?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!path) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backTxt}>‹ رجوع</Text>
        </Pressable>
        <Text style={styles.emptyTxt}>ما قدرنا نلقى هذي الدورة.</Text>
      </View>
    );
  }

  const paymentsPaid = payments.filter((p) => p.paid_at).length;
  const paymentsRemaining = payments.length - paymentsPaid;
  const nextPayment = payments.find((p) => !p.paid_at);
  const statusStyle = STATUS_STYLE[enrollment?.status] ?? { color: colors.muted };
  const teacherName = path.provider;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backTxt}>‹ رجوع</Text>
      </Pressable>

      <View style={styles.banner}>
        <Ionicons name="school-outline" size={44} color={colors.gold} />
      </View>

      <Text style={styles.title}>{path.title}</Text>
      <Text style={styles.teacher}>{teacherName}</Text>

      {!!enrollment?.status && (
        <View style={[styles.statusTag, { borderColor: statusStyle.color }]}>
          <Text style={[styles.statusTagTxt, { color: statusStyle.color }]}>{enrollment.status}</Text>
        </View>
      )}

      {!!(path.full_description || path.summary) && (
        <Text style={styles.description}>{path.full_description || path.summary}</Text>
      )}

      {!!enrollment && (
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${enrollment.progress_percent}%` }]} />
            </View>
            <Text style={styles.progressPct}>{enrollment.progress_percent}%</Text>
          </View>
          <Text style={styles.progressLbl}>نسبة الإنجاز</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>تفاصيل الدورة</Text>
      <View style={styles.infoCard}>
        <InfoRow label="عدد المحاضرات" value={String(totalLectures)} />
        <InfoRow label="تاريخ البداية" value={formatDate(path.start_date)} />
        <InfoRow label="تاريخ النهاية" value={formatDate(path.end_date)} last />
      </View>

      <Text style={styles.sectionTitle}>الدفعات</Text>
      {payments.length === 0 ? (
        <Text style={styles.emptyTxt}>ما فيه دفعات مسجّلة لهذي الدورة.</Text>
      ) : (
        <View style={styles.infoCard}>
          <InfoRow label="دفعات مدفوعة" value={`${paymentsPaid} من ${payments.length}`} />
          <InfoRow label="دفعات متبقية" value={String(paymentsRemaining)} />
          <InfoRow label="موعد الدفعة القادمة" value={nextPayment ? formatDate(nextPayment.due_date) : 'لا يوجد'} last />
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[infoStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={infoStyles.value}>{value}</Text>
      <Text style={infoStyles.label}>{label}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  label: { fontFamily: fonts.body, color: colors.muted, fontSize: 13 },
  value: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13.5 },
});

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 50 },
  center: { alignItems: 'center', justifyContent: 'center' },
  backRow: { marginBottom: 16 },
  backTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },

  banner: {
    width: '100%', aspectRatio: 16 / 8, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(242,183,5,0.10)', borderWidth: 1, borderColor: colors.line, marginBottom: 16,
  },

  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 21, textAlign: 'right', marginBottom: 4 },
  teacher: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, textAlign: 'right', marginBottom: 10 },

  statusTag: {
    alignSelf: 'flex-end', borderWidth: 1, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  statusTagTxt: { fontFamily: fonts.bodyBold, fontSize: 11.5 },

  description: { fontFamily: fonts.body, color: colors.muted, fontSize: 13.5, textAlign: 'right', lineHeight: 22, marginBottom: 20 },

  progressCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    padding: 14, marginBottom: 24,
  },
  progressRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 6 },
  progressPct: { color: colors.muted, fontFamily: fonts.body, fontSize: 11.5 },
  progressLbl: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12.5, textAlign: 'right' },

  sectionTitle: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 1, textAlign: 'right', marginBottom: 10 },
  infoCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16, marginBottom: 22,
  },

  emptyTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 20, lineHeight: 22 },
});
