import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'warning';
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Signal используется только как заливка кнопки: на тёмном фоне он даёт
 * 2.6:1 и по брендбуку запрещён для текста. Надпись внутри — Paper.
 * Вариант warning окрашен в Clay — брендбук отводит ему предупреждения.
 */
export function PrimaryButton({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'warning' && styles.warning,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.text : colors.onAccent} />
      ) : (
        <Text style={[type.button, styles.label, variant === 'secondary' && styles.labelSecondary]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: { backgroundColor: colors.accent },
  warning: { backgroundColor: colors.warning },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  label: { color: colors.onAccent },
  labelSecondary: { color: colors.text },
});
