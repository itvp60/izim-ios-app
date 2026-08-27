import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BraceletStatus } from '@/types/bracelet';
import { colors, radius, spacing } from '@/theme/colors';

const CONFIG: Record<BraceletStatus, { label: string; color: string }> = {
  draft: { label: 'Метка не записана', color: colors.warning },
  written: { label: 'Записана', color: colors.primary },
  locked: { label: 'Заблокирована', color: colors.success },
};

export function StatusBadge({ status }: { status: BraceletStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
});
