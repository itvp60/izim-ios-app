import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bracelet } from '@/types/bracelet';
import { getLostSince, setLostMode } from '@/api/lostMode';
import { ApiError, NetworkError } from '@/api/client';
import { setBraceletLostSince } from '@/storage/braceletsStore';
import { PrimaryButton } from './PrimaryButton';
import { colors, radius, spacing, type } from '@/theme';

/**
 * Режим поиска на карточке браслета.
 *
 * Раньше он жил только на сайте — в кабинете и на странице редактирования.
 * Из приложения туда вела кнопка «Изменить данные профиля», внутри
 * встроенного браузера. Родитель, у которого только что потерялся ребёнок,
 * это место не найдёт, поэтому блок стоит первым под именем, выше записи
 * метки, и в выключенном виде говорит прямым вопросом.
 *
 * Тон — раздел 08 брендбука: сообщаем факт, не пугаем.
 */
export function LostModeCard({
  bracelet,
  onUpdated,
}: {
  bracelet: Bracelet;
  onUpdated: (next: Bracelet) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  const isChild = bracelet.role === 'child';
  const lostSince = bracelet.lostSince ?? null;

  // Сверяемся с сервером при каждом открытии: режим могли переключить в
  // кабинете на сайте, и приложение не должно показывать устаревшее.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getLostSince(bracelet.editUrl)
        .then(async (serverValue) => {
          if (cancelled) return;
          setOffline(false);
          const updated = await setBraceletLostSince(bracelet.id, serverValue);
          if (updated && !cancelled) onUpdated(updated);
        })
        .catch((error) => {
          if (!cancelled && error instanceof NetworkError) setOffline(true);
        });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bracelet.id, bracelet.editUrl])
  );

  async function apply(lost: boolean) {
    setBusy(true);
    try {
      const serverValue = await setLostMode(bracelet.editUrl, lost);
      setOffline(false);
      const updated = await setBraceletLostSince(bracelet.id, serverValue);
      if (updated) onUpdated(updated);
    } catch (error) {
      if (error instanceof NetworkError) {
        Alert.alert(
          'Нет связи',
          'Режим поиска включается на сервере. Проверьте интернет и нажмите ещё раз.'
        );
      } else if (error instanceof ApiError) {
        Alert.alert('Не получилось', error.message);
      } else {
        Alert.alert(
          'Не получилось',
          'У этого браслета нет ссылки редактирования. Откройте профиль в кабинете на id.izim.kz.'
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function onEnablePress() {
    Alert.alert(
      'Включить режим поиска?',
      `На странице браслета сразу появится «${
        isChild ? 'Этого ребёнка ищут' : 'Этого человека ищут'
      }» и просьба позвонить вам.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Включить', onPress: () => apply(true) },
      ]
    );
  }

  function onDisablePress() {
    Alert.alert('Выключить режим поиска?', 'Объявление исчезнет со страницы браслета.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выключить', onPress: () => apply(false) },
    ]);
  }

  if (lostSince) {
    return (
      <View style={[styles.card, styles.cardOn]} accessibilityLiveRegion="polite">
        <View style={styles.overlineRow}>
          <View style={styles.dot} />
          <Text style={[type.overline, styles.onOverline]}>Режим поиска включён</Text>
        </View>
        <Text style={type.h2}>Ищем с {formatSince(lostSince)}</Text>
        <Text style={type.bodyMuted}>
          Кто приложит телефон к браслету, увидит «
          {isChild ? 'Этого ребёнка ищут' : 'Этого человека ищут'}» и просьбу позвонить вам.
          Проверьте, что номер на странице правильный.
        </Text>
        <Pressable
          onPress={() => Linking.openURL(bracelet.profileUrl)}
          hitSlop={8}
          accessibilityRole="link"
        >
          <Text style={styles.link}>Открыть страницу браслета</Text>
        </Pressable>
        {offline && <Text style={type.caption}>Нет связи — показано последнее известное.</Text>}
        <PrimaryButton
          title={isChild ? 'Ребёнок нашёлся — выключить' : 'Нашёлся — выключить'}
          variant="secondary"
          loading={busy}
          onPress={onDisablePress}
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={type.overline}>Режим поиска</Text>
      <Text style={type.h2}>{isChild ? 'Ребёнок потерялся?' : 'Человек потерялся?'}</Text>
      <Text style={type.bodyMuted}>
        Включите режим поиска — и каждый, кто приложит телефон к браслету, увидит просьбу
        позвонить вам.
      </Text>
      {offline && <Text style={type.caption}>Нет связи — включить сейчас не получится.</Text>}
      <PrimaryButton
        title="Включить режим поиска"
        variant="warning"
        loading={busy}
        onPress={onEnablePress}
      />
    </View>
  );
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/** «14:32» сегодня, «12 сентября, 14:32» раньше. Без Intl: Hermes поддерживает его не везде. */
export function formatSince(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return sameDay ? time : `${date.getDate()} ${MONTHS[date.getMonth()]}, ${time}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardOn: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  overlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  onOverline: { color: colors.warning },
  link: { ...type.button, color: colors.text, textDecorationLine: 'underline' },
});
