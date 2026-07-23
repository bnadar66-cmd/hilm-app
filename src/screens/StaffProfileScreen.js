import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';
import { useAuth } from '../lib/AuthContext';

const ROLE_LABELS = { admin: 'أدمن', teacher: 'معلم' };

export default function StaffProfileScreen() {
  const { staffProfile, signOut } = useAuth();

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{staffProfile?.full_name?.charAt(0) ?? '؟'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{staffProfile?.full_name ?? '...'}</Text>
          <Text style={styles.sub}>{staffProfile?.email}</Text>
        </View>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagTxt}>{ROLE_LABELS[staffProfile?.role] ?? staffProfile?.role}</Text>
        </View>
      </View>

      <View style={styles.rowsCard}>
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
  head: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 26 },
  avatar: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(242,183,5,0.15)',
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontFamily: fonts.display, color: colors.gold, fontSize: 24 },
  name: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16, textAlign: 'right', marginBottom: 4 },
  sub: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5, textAlign: 'right' },
  roleTag: { borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  roleTagTxt: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 11.5 },

  rowsCard: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.card,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  rowTxt: { fontFamily: fonts.body, color: colors.ink, fontSize: 14 },
  chev: { color: colors.muted, fontSize: 16 },
  dangerTxt: { color: '#F0928C' },
});
