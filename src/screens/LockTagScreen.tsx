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
import { brand, colors, layout, radius, spacing, type } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LockTag'>;
type Route = RouteProp<RootStackParamList, 'LockTag'>;

/**
 * Блокировка — отдельный, намеренно медленный шаг (план, разделы 4 и 5):
 * она необратима на обеих платформах, тогда как данные профиля на сервере
 * меняются всегда. Переключатель не даёт заблокировать метку случайным
 * касанием. Предупреждение окрашено в Clay — брендбук отводит этот цвет
 * предупреждениям и ограничивает его 5% макета.
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
        'Метка не заблокирована',
        nfcError.code === 'TAG_LOCKED'
          ? 'Эта метка уже заблокирована.'
          : 'Поднесите браслет ещё раз и держите телефон до завершения.'
      );
    } finally {
      setLocking(false);
    }
  }

  if (!bracelet) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Text style={type.overline}>Необратимое действие</Text>
      <Text style={type.h1}>Заблокировать метку</Text>

      <View style={styles.warningBox}>
        <Text style={[type.body, styles.warningText]}>
          После блокировки записать эту метку заново нельзя — никогда, в том числе в поддержке.
        </Text>
      </View>

      <Text style={type.bodyMuted}>
        Данные профиля блокировка не затрагивает: они меняются на сайте в любое время. Закрывается
        только сама ссылка на физической метке.
      </Text>

      <View style={styles.confirmRow}>
        <Switch
          value={confirmed}
          onValueChange={setConfirmed}
          trackColor={{ false: colors.surfaceRaised, true: colors.warning }}
          thumbColor={brand.paper}
          ios_backgroundColor={colors.surfaceRaised}
        />
        <Text style={[type.body, styles.confirmText]}>Я понимаю, что это необратимо</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Заблокировать метку"
          variant="warning"
          disabled={!confirmed}
          loading={locking}
          onPress={onLockPress}
        />
        <PrimaryButton
          title="Не сейчас"
          variant="secondary"
          onPress={() => navigation.navigate('MyBracelets')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.screenPadding,
    justifyContent: 'center',
    gap: spacing.md,
  },
  warningBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  warningText: { color: colors.warning },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  confirmText: { flexShrink: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
