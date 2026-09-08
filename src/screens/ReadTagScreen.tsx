import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TagDiagnostics } from '@/types/tag';
import * as nfc from '@/nfc/nfcManager';
import { NfcError } from '@/nfc/errors';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, layout, radius, spacing, type } from '@/theme';

/**
 * Диагностика любой метки (план, раздел 4): показывает, что на ней записано,
 * независимо от того, есть ли такой браслет в списке на этом телефоне.
 * Задача — снять часть обращений в поддержку: клиент сам видит, пустая
 * метка, чужая или заблокированная.
 */
export function ReadTagScreen() {
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<TagDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onReadPress() {
    setReading(true);
    setError(null);
    setResult(null);
    try {
      const diagnostics = await nfc.readTagDiagnostics();
      setResult(diagnostics);
    } catch (e) {
      const nfcError = e as NfcError;
      if (nfcError.code !== 'CANCELLED') {
        setError('Метка не прочиталась. Поднесите её ближе к антенне и попробуйте ещё раз.');
      }
    } finally {
      setReading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={type.overline}>Диагностика</Text>
      <Text style={type.h1}>Что записано на метке</Text>
      <Text style={type.bodyMuted}>
        Поднесите любую метку к телефону — покажем ссылку, тип чипа и свободное место.
      </Text>

      <View style={styles.action}>
        <PrimaryButton title="Прочитать" onPress={onReadPress} loading={reading} />
      </View>

      {error && <Text style={[type.body, styles.error]}>{error}</Text>}

      {result && (
        <View style={styles.resultBox}>
          <Row label="Ссылка" value={result.url ?? 'не найдена'} />
          <Row label="Тип метки" value={result.tagType ?? '—'} />
          <Row label="Технологии" value={result.techTypes.join(', ') || '—'} />
          <Row label="Ёмкость" value={result.maxSize != null ? `${result.maxSize} байт` : '—'} />
          <Row label="Свободно" value={result.freeSize != null ? `${result.freeSize} байт` : '—'} />
          <Row label="Заблокирована" value={result.isLocked ? 'да' : 'нет'} />
          <Row label="Идентификатор" value={result.rawId ?? '—'} />
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={type.overline}>{label}</Text>
      <Text style={type.data}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: layout.screenPadding,
    gap: spacing.md,
  },
  action: { marginTop: spacing.sm },
  error: { color: colors.warning },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: { gap: spacing.xs },
});
