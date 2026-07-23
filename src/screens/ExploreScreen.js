import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [paths, setPaths] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);

  const load = useCallback(async () => {
    const { data: pathsData } = await supabase
      .from('paths')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    let enrolled = [];
    if (profile?.id) {
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('path_id')
        .eq('student_id', profile.id);
      enrolled = (enrollData || []).map((e) => e.path_id);
    }

    setPaths(pathsData || []);
    setEnrolledIds(enrolled);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEnroll(path) {
    if (!profile?.id) return;
    setEnrollingId(path.id);
    const { error } = await supabase.from('enrollments').insert({
      student_id: profile.id,
      path_id: path.id,
      progress_percent: 0,
    });
    setEnrollingId(null);

    if (error) {
      Alert.alert('تعذّر التسجيل', error.message);
      return;
    }
    Alert.alert('تم التسجيل ✅', `تم تسجيلك بمسار "${path.title}". تقدر تشوفه بتبويب "دوراتي".`);
    setEnrolledIds((prev) => [...prev, path.id]);
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />
      }
    >
      <Text style={styles.title}>استكشف مسارات جديدة</Text>
      <Text style={styles.sub}>سجّل بأي مسار يناسبك وابدأ رحلتك التعليمية</Text>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 30 }} />
      ) : (
        paths.map((path) => {
          const isEnrolled = enrolledIds.includes(path.id);
          return (
            <Pressable key={path.id} style={styles.card} onPress={() => navigation.navigate('CourseDetail', { pathId: path.id })}>
              <View style={styles.cardImg}>
                <Text style={styles.cardImgTxt}>{path.title?.charAt(0) ?? '؟'}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{path.title}</Text>
                <Text style={styles.cardTeacher}>{path.provider} · {path.university}</Text>

                <View style={styles.tagRow}>
                  {!!path.specialization && <Text style={styles.tag}>{path.specialization}</Text>}
                  {!!path.duration && <Text style={styles.tag}>{path.duration}</Text>}
                  <Text style={[styles.tag, styles.tagPrice]}>{path.price || 'مجانًا'}</Text>
                </View>

                {isEnrolled ? (
                  <View style={styles.enrolledBadge}>
                    <Text style={styles.enrolledBadgeTxt}>✓ مسجّل بالفعل</Text>
                  </View>
                ) : path.status === 'waitlist' ? (
                  <View style={styles.waitBadge}>
                    <Text style={styles.waitBadgeTxt}>قائمة انتظار — لم يُفتح بعد</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.enrollBtn}
                    onPress={() => handleEnroll(path)}
                    disabled={enrollingId === path.id}
                  >
                    {enrollingId === path.id
                      ? <ActivityIndicator color={colors.bg} />
                      : <Text style={styles.enrollBtnTxt}>سجّل الآن</Text>}
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 56 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 20, textAlign: 'right', marginBottom: 4 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5, textAlign: 'right', marginBottom: 20 },
  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    overflow: 'hidden', marginBottom: 16,
  },
  cardImg: {
    width: '100%', aspectRatio: 16 / 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(242,183,5,0.10)', borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  cardImgTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 30 },
  cardBody: { padding: 14 },
  cardTitle: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 15, textAlign: 'right', marginBottom: 4 },
  cardTeacher: { fontFamily: fonts.body, color: colors.muted, fontSize: 12, textAlign: 'right', marginBottom: 10 },
  tagRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { borderWidth: 1, borderColor: colors.line, color: colors.muted, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, fontSize: 11, fontFamily: fonts.body },
  tagPrice: { borderColor: colors.goldDim, color: colors.gold, fontFamily: fonts.bodyBold },
  enrollBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center' },
  enrollBtnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 13.5 },
  enrolledBadge: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  enrolledBadgeTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 13 },
  waitBadge: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  waitBadgeTxt: { color: colors.muted, fontFamily: fonts.body, fontSize: 12.5 },
});
