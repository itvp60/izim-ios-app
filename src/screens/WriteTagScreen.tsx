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
import { colors, spacing } from '@/theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'WriteTag'>;
type Route = RouteProp<RootStackParamList, 'WriteTag'>;

type Stage = 'checking' | 'unsupported' | 'disabled' | 'idle' | 'writing' | 'success';

const ANTENNA_HINT =
  Platform.OS === 'ios'
    ? 'На iPhone антенна NFC находится у верхнего края задней панели.'
    : 'На большинстве Android-телефонов антенна NFC находится в центре задней панели.';

function errorMessage(error: NfcError): string {
  switch (error.code) {
    case 'TAG_LOCKED':
      return 'Эта метка защищена от перезаписи. Возьмите новую метку или обратитесь в поддержку.';
    case 'NOT_FORMATTABLE':
      return 'Метка не отформатирована и не может быть подготовлена автоматически на этом устройстве. Попробуйте другую метку.';
    case 'CAPACITY_TOO_SMALL':
      return 'Метка не поддерживается. Нужны метки NTAG213 и совместимые.';
    case 'TOO_EARLY_REMOVED':
    case 'EMPTY_AFTER_WRITE':
    case 'VERIFICATION_MISMATCH':
      return 'Запись не завершена. Поднесите ещё раз и держите телефон у метки до сообщения об успехе.';
    case 'CANCELLED':
      return '';
    default:
      return 'Не удалось записать метку. Попробуйте ещё раз.';
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
      if (message) Alert.alert('Не получилось', message);
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
        <Text style={styles.title}>У этого телефона нет NFC</Text>
        <Text style={styles.body}>
          Записать метку с этого устройства нельзя. Браслет с уже записанной меткой можно заказать
          на izim.kz.
        </Text>
        <PrimaryButton title="Открыть izim.kz" onPress={() => Linking.openURL('https://izim.kz')} />
      </View>
    );
  }

  if (stage === 'disabled') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>NFC выключен</Text>
        <Text style={styles.body}>Включите NFC в настройках телефона, чтобы записать метку.</Text>
        <PrimaryButton title="Включить NFC" onPress={onEnableNfcPress} />
      </View>
    );
  }

  if (stage === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Метка записана</Text>
        <Text style={styles.body}>
          Ссылка проверена повторным чтением метки — всё совпадает. Профиль можно менять в любое
          время, метка при этом останется прежней.
        </Text>
        <View style={styles.buttonGroup}>
          <PrimaryButton
            title="Заблокировать метку сейчас"
            onPress={() => navigation.replace('LockTag', { braceletId: bracelet.id })}
          />
          <PrimaryButton
            title="Позже"
            variant="secondary"
            onPress={() => navigation.navigate('MyBracelets')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Поднесите браслет к телефону</Text>
      <Text style={styles.body}>{ANTENNA_HINT}</Text>
      {Platform.OS === 'ios' && (
        <Text style={styles.bodyMuted}>
          После нажатия появится системное окно сканирования — держите метку у телефона до
          сообщения об успехе.
        </Text>
      )}
      <View style={styles.buttonGroup}>
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
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  body: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  bodyMuted: { color: colors.textFaint, fontSize: 13, textAlign: 'center' },
  buttonGroup: { gap: spacing.sm, marginTop: spacing.md },
});
