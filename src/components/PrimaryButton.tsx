import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'secondary' && styles.secondary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'secondary' && styles.textSecondary,
          ]}
        >
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
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  textSecondary: { color: colors.text },
});
