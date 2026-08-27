import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { Bracelet } from '@/types/bracelet';
import { getBracelet, updateBraceletStatus } from '@/storage/braceletsStore';
import { enqueueSync } from '@/storage/claimQueue';
import * as nfc from '@/nfc/nfcManager';
import { NfcError } from '@/nfc/errors';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radius, spacing } from '@/theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LockTag'>;
type Route = RouteProp<RootStackParamList, 'LockTag'>;

/**
 * Locking is a separate, deliberately slower step (plan section 4/5): it is
 * irreversible on both platforms, while profile data on the server can
 * always change afterward. The confirmation switch exists so a tap can't
 * lock a tag by accident.
 */
export function LockTagScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [bracelet, setBracelet] = useState<Bracelet | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [locking, setLocking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getBracelet(route.params.braceletId).then((b) => setBracelet(b ?? null));
    }, [route.params.braceletId])
  );

  async function onLockPress() {
    if (!bracelet) return;
    setLocking(true);
    try {
      await nfc.lockTag();
      const updated = await updateBraceletStatus(bracelet.id, 'locked');
      if (updated) setBracelet(updated);
      await enqueueSync('mark_locked', bracelet.code);
      navigation.navigate('MyBracelets');
    } catch (error) {
      const nfcError = error as NfcError;
      if (nfcError.code === 'CANCELLED') return;
      Alert.alert(
        'Не удалось заблокировать',
        nfcError.code === 'TAG_LOCKED'
          ? 'Метка уже заблокирована.'
          : 'Поднесите метку ещё раз и держите телефон рядом до завершения.'
      );
    } finally {
      setLocking(false);
    }
  }

  if (!bracelet) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Заблокировать метку</Text>
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          После блокировки записать метку заново будет невозможно — никогда, даже в поддержке.
        </Text>
      </View>
      <Text style={styles.body}>
        Данные профиля при этом не блокируются — их можно менять на сайте в любое время. Блокируется
        только ссылка, записанная на физическую метку.
      </Text>

      <View style={styles.confirmRow}>
        <Switch value={confirmed} onValueChange={setConfirmed} />
        <Text style={styles.confirmText}>Я понимаю, что это необратимо</Text>
      </View>

      <View style={styles.buttonGroup}>
        <PrimaryButton
          title="Заблокировать метку"
          variant="danger"
          disabled={!confirmed}
          loading={locking}
          onPress={onLockPress}
        />
        <PrimaryButton title="Не сейчас" variant="secondary" onPress={() => navigation.navigate('MyBracelets')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  warningBox: {
    backgroundColor: '#3A1A1A',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: { color: '#FCA5A5', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  confirmText: { color: colors.text, fontSize: 14, flexShrink: 1 },
  buttonGroup: { gap: spacing.sm, marginTop: spacing.md },
});
