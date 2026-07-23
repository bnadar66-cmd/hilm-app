import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, radius } from './theme';

// بطاقة إدخال بنمط "التسجيل" — تسمية صغيرة أعلى + قيمة بارزة أسفلها
export default function InputCard({ label, ...inputProps }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="rgba(243,237,230,0.35)"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  label: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5, marginBottom: 6, textAlign: 'right' },
  input: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16, padding: 0, textAlign: 'right' },
});
