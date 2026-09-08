import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BraceletStatus } from '@/types/bracelet';
import { colors, radius, spacing, type } from '@/theme';

/**
 * Статусы окрашены вторичными цветами палитры, а не Signal: синий на экране
 * должен оставаться один — там, где действие (правило одного акцента,
 * раздел 05). Точка-индикатор — та же «точка старта» из знака.
 */
const CONFIG: Record<BraceletStatus, { label: string; color: string }> = {
  draft: { label: 'Метка не записана', color: colors.warning },
  written: { label: 'Записана', color: colors.secondary },
  locked: { label: 'Заблокирована', color: colors.textMuted },
};

export function StatusBadge({ status }: { status: BraceletStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[type.caption, styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    gap: spacing.xs + 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { letterSpacing: 0.13 },
});
