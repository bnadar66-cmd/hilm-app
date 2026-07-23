import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';

const WEEKDAY_INITIALS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // أحد..سبت
const MONTH_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function toDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function ScheduleCalendar({ items, selectedKey, onSelectDate }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const itemsByDate = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (!map[item.due_date]) map[item.due_date] = [];
      map[item.due_date].push(item);
    });
    return map;
  }, [items]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View style={styles.wrap}>
      <View style={styles.monthHead}>
        <Pressable onPress={() => setViewDate(new Date(year, month - 1, 1))} style={styles.monthNav}>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.monthLbl}>{MONTH_AR[month]} {year}</Text>
        <Pressable onPress={() => setViewDate(new Date(year, month + 1, 1))} style={styles.monthNav}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_INITIALS.map((w, i) => (
          <Text key={i} style={styles.weekLbl}>{w}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((d, di) => {
            if (!d) return <View key={di} style={styles.dayCell} />;
            const key = toDateKey(year, month, d);
            const hasItems = !!itemsByDate[key];
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            return (
              <Pressable key={di} style={styles.dayCell} onPress={() => onSelectDate(key)}>
                <View style={[
                  styles.dayCircle,
                  hasItems && styles.dayCircleHas,
                  isSelected && styles.dayCircleSelected,
                  !isSelected && isToday && styles.dayCircleToday,
                ]}>
                  <Text style={[styles.dayTxt, hasItems && styles.dayTxtActive, isSelected && styles.dayTxtSelected]}>{d}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  monthHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  monthNav: { padding: 4 },
  monthLbl: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14.5 },

  weekRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 4 },
  weekLbl: { width: 32, textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 11 },

  dayCell: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayCircleHas: { backgroundColor: 'rgba(242,183,5,0.18)' },
  dayCircleToday: { borderWidth: 1, borderColor: colors.goldDim },
  dayCircleSelected: { backgroundColor: colors.gold },
  dayTxt: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5 },
  dayTxtActive: { fontFamily: fonts.bodyBold, color: colors.ink },
  dayTxtSelected: { fontFamily: fonts.bodyBold, color: colors.bg },
});
