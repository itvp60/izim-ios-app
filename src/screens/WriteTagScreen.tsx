import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { Bracelet } from '@/types/bracelet';
import { getBracelet, updateBraceletStatus } from '@/storage/braceletsStore';
import { enqueueSync } from '@/storage/claimQueue';
import * as nfc from '@/nfc/nfcManager';
import { NfcError } from '@/nfc/errors';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RouteDots } from '@/components/RouteDots';
import { colors, layout, spacing, type } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'WriteTag'>;
type Route = RouteProp<RootStackParamList, 'WriteTag'>;

type Stage = 'checking' | 'unsupported' | 'disabled' | 'idle' | 'writing' | 'success';

const ANTENNA_HINT =
  Platform.OS === 'ios'
    ? 'Антенна NFC у iPhone — у верхнего края задней панели.'
    : 'У большинства Android-телефонов антенна NFC — в центре задней панели.';

/** Тексты по разделу 08 брендбука: ошибка не извиняется, а объясняет. */
function errorMessage(error: NfcError): string {
  switch (error.code) {
    case 'TAG_LOCKED':
      return 'Эта метка защищена от перезаписи. Возьмите новую метку или обратитесь в поддержку.';
    case 'NOT_FORMATTABLE':
      return 'Метку не удалось подготовить на этом устройстве. Попробуйте другую метку.';
    case 'CAPACITY_TOO_SMALL':
      return 'Метка не поддерживается. Нужны метки NTAG213 и совместимые.';
    case 'TOO_EARLY_REMOVED':
    case 'EMPTY_AFTER_WRITE':
    case 'VERIFICATION_MISMATCH':
      return 'Запись не завершена. Поднесите браслет ещё раз и держите телефон до сообщения об успехе.';
    case 'CANCELLED':
      return '';
    default:
      return 'Метка не записалась. Поднесите браслет ещё раз.';
  }
}

export function WriteTagScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [bracelet, setBracelet] = useState<Bracelet | null>(null);
  const [stage, setStage] = useState<Stage>('checking');

  const checkAvailability = useCallback(async () => {
    setStage('checking');
    const supported = await nfc.isSupported();
    if (!supported) {
      setStage('unsupported');
      return;
    }
    const enabled = await nfc.isEnabled();
    setStage(enabled ? 'idle' : 'disabled');
  }, []);

  useFocusEffect(
    useCallback(() => {
      getBracelet(route.params.braceletId).then((b) => setBracelet(b ?? null));
      checkAvailability();
      return () => {
        nfc.cancelSession();
      };
    }, [route.params.braceletId, checkAvailability])
  );

  async function performWrite(allowOverwrite = false) {
    if (!bracelet) return;
    setStage('writing');
    try {
      await nfc.writeUrlToTag(bracelet.profileUrl, { allowOverwrite });
      const updated = await updateBraceletStatus(bracelet.id, 'written');
      if (updated) setBracelet(updated);
      await enqueueSync('mark_written', bracelet.code);
      setStage('success');
    } catch (error) {
      const nfcError = error as NfcError & { conflict?: { existingUrl: string } };

      if (nfcError.code === 'CANCELLED') {
        setStage('idle');
        return;
      }

      if (nfcError.code === 'FOREIGN_DATA') {
        Alert.alert('В метке записаны другие данные', 'Перезаписать её ссылкой этого профиля?', [
          { text: 'Отмена', style: 'cancel', onPress: () => setStage('idle') },
          { text: 'Перезаписать', style: 'destructive', onPress: () => performWrite(true) },
        ]);
        return;
      }

      const message = errorMessage(nfcError);
      setStage('idle');
      if (message) Alert.alert('Метка не записана', message);
    }
  }

  async function onEnableNfcPress() {
    await nfc.openNfcSettings();
    checkAvailability();
  }

  if (stage === 'checking' || !bracelet) {
    return <View style={styles.container} />;
  }

  if (stage === 'unsupported') {
    return (
      <View style={styles.container}>
        <Text style={type.overline}>Устройство</Text>
        <Text style={type.h1}>У этого телефона нет NFC</Text>
        <Text style={type.bodyMuted}>
          Записать метку с него не получится. Браслет с уже записанной меткой можно заказать на
          izim.kz.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton title="Открыть izim.kz" onPress={() => Linking.openURL('https://izim.kz')} />
        </View>
      </View>
    );
  }

  if (stage === 'disabled') {
    return (
      <View style={styles.container}>
        <Text style={type.overline}>Устройство</Text>
        <Text style={type.h1}>NFC выключен</Text>
        <Text style={type.bodyMuted}>Включите NFC в настройках телефона, чтобы записать метку.</Text>
        <View style={styles.actions}>
          <PrimaryButton title="Включить NFC" onPress={onEnableNfcPress} />
        </View>
      </View>
    );
  }

  if (stage === 'success') {
    return (
      <View style={styles.container}>
        <RouteDots count={9} withStartDot />
        <Text style={type.h1}>Метка записана</Text>
        <Text style={type.bodyMuted}>
          Ссылка проверена повторным чтением — она совпадает. Данные профиля можно менять когда
          угодно, метка при этом остаётся прежней.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton
            title="Заблокировать метку"
            variant="secondary"
            onPress={() => navigation.replace('LockTag', { braceletId: bracelet.id })}
          />
          <PrimaryButton title="Готово" onPress={() => navigation.navigate('MyBracelets')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RouteDots count={9} />
      <Text style={type.h1}>Поднесите браслет к телефону</Text>
      <Text style={type.bodyMuted}>{ANTENNA_HINT}</Text>
      {Platform.OS === 'ios' && (
        <Text style={type.caption}>
          Появится системное окно сканирования — держите браслет у телефона до сообщения об успехе.
        </Text>
      )}
      <View style={styles.actions}>
        <PrimaryButton
          title={bracelet.status === 'draft' ? 'Записать' : 'Перезаписать'}
          onPress={() => performWrite(false)}
          loading={stage === 'writing'}
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
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
