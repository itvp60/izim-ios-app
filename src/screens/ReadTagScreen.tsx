import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TagDiagnostics } from '@/types/tag';
import * as nfc from '@/nfc/nfcManager';
import { NfcError } from '@/nfc/errors';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radius, spacing } from '@/theme/colors';

/**
 * Standalone diagnostics screen (plan section 4 "Прочитать метку"): reads
 * any tag and shows what's actually on it, independent of any bracelet
 * record on this device. Meant to cut support requests in half by letting
 * a customer see for themselves whether a tag is empty, foreign, or locked.
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
        setError('Не удалось прочитать метку. Поднесите телефон ближе и попробуйте ещё раз.');
      }
    } finally {
      setReading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Прочитать метку</Text>
      <Text style={styles.body}>
        Поднесите любую метку к телефону, чтобы посмотреть, что на ней записано.
      </Text>

      <PrimaryButton title="Прочитать" onPress={onReadPress} loading={reading} />

      {error && <Text style={styles.error}>{error}</Text>}

      {result && (
        <View style={styles.resultBox}>
          <Row label="Ссылка" value={result.url ?? '— не найдена —'} />
          <Row label="Тип метки" value={result.tagType ?? '—'} />
          <Row label="Технологии" value={result.techTypes.join(', ') || '—'} />
          <Row label="Ёмкость" value={result.maxSize != null ? `${result.maxSize} байт` : '—'} />
          <Row label="Свободно" value={result.freeSize != null ? `${result.freeSize} байт` : '—'} />
          <Row label="Заблокирована" value={result.isLocked ? 'Да' : 'Нет'} />
          <Row label="Идентификатор" value={result.rawId ?? '—'} />
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 14 },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { gap: 2 },
  rowLabel: { color: colors.textFaint, fontSize: 12, textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: 15 },
});
