import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as nfc from '@/nfc/nfcManager';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RouteDots } from '@/components/RouteDots';
import { colors, layout, radius, spacing, type } from '@/theme';

interface Item {
  question: string;
  answer: string;
}

const ITEMS: Item[] = [
  {
    question: 'Где находится антенна NFC',
    answer:
      Platform.OS === 'ios'
        ? 'У iPhone — у верхнего края задней панели, рядом с камерой. Прикладывайте к браслету именно эту часть телефона.'
        : 'У большинства Android-телефонов — в центре задней панели, у части моделей ближе к верхнему краю. Если запись не начинается, медленно проведите телефоном по браслету.',
  },
  {
    question: 'Метка не читается совсем',
    answer:
      'Снимите чехол, если он металлический или с магнитами. Держите телефон и браслет неподвижно две-три секунды. Если не помогает, проверьте метку на экране «Прочитать метку».',
  },
  {
    question: 'Как включить NFC на Android',
    answer: 'Настройки → Подключённые устройства → NFC. Или откройте их кнопкой ниже.',
  },
  {
    question: 'Метка записана, но страница не открывается у других',
    answer:
      'Откройте «Прочитать метку» и сверьте ссылку. Если ссылка верная, а страница не открывается — дело в сайте id.izim.kz, а не в метке.',
  },
  {
    question: 'Метка заблокирована по ошибке',
    answer:
      'Данные профиля меняются и после блокировки — они хранятся на сервере, а не на метке. Если нужна новая физическая метка, обратитесь в поддержку по гарантии.',
  },
  {
    question: 'Фото браслета видно посторонним?',
    answer:
      'Нет. Фото хранится только на вашем телефоне и нужно, чтобы различать браслеты в списке. Тот, кто приложит браслет, увидит страницу профиля без фотографии.',
  },
];

export function HelpScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <RouteDots count={9} withStartDot />
      <Text style={type.h1}>Помощь</Text>

      {ITEMS.map((item) => (
        <View key={item.question} style={styles.item}>
          <Text style={[type.body, styles.question]}>{item.question}</Text>
          <Text style={type.bodyMuted}>{item.answer}</Text>
        </View>
      ))}

      <View style={styles.actions}>
        {Platform.OS === 'android' && (
          <PrimaryButton
            title="Открыть настройки NFC"
            variant="secondary"
            onPress={() => nfc.openNfcSettings()}
          />
        )}
        <PrimaryButton
          title="Написать в поддержку"
          variant="secondary"
          onPress={() => Linking.openURL('https://izim.kz')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: layout.screenPadding,
    gap: spacing.md,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  question: { color: colors.text },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
