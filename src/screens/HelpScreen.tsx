import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as nfc from '@/nfc/nfcManager';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radius, spacing } from '@/theme/colors';

interface Item {
  question: string;
  answer: string;
}

const ITEMS: Item[] = [
  {
    question: 'Где находится антенна NFC?',
    answer:
      Platform.OS === 'ios'
        ? 'На iPhone — у верхнего края задней панели, рядом с камерой. Приложите именно эту часть телефона к браслету.'
        : 'На большинстве Android-телефонов — в центре задней панели. На некоторых моделях — ближе к верхнему краю. Если запись не начинается, медленно подвигайте телефон по браслету.',
  },
  {
    question: 'Метка не читается совсем',
    answer:
      'Снимите чехол, если он металлический или содержит магниты. Держите телефон и метку неподвижно 2–3 секунды. Если не помогает — попробуйте другую метку через экран «Прочитать метку».',
  },
  {
    question: 'Как включить NFC на Android',
    answer: 'Настройки → Подключённые устройства → NFC. Или нажмите кнопку ниже.',
  },
  {
    question: 'Запись прошла, но браслет не открывается по ссылке у других людей',
    answer:
      'Проверьте на экране «Прочитать метку», что записанная ссылка совпадает с ожидаемой. Если ссылка верна, а страница не открывается — это вопрос к сайту id.izim.kz, а не к самой метке.',
  },
  {
    question: 'Заблокировал метку по ошибке',
    answer:
      'Данные профиля можно менять и после блокировки метки — меняются они на сервере, а не на самой метке. Если нужна новая физическая метка — обратитесь в поддержку по гарантии.',
  },
];

export function HelpScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Помощь</Text>
      {ITEMS.map((item) => (
        <View key={item.question} style={styles.item}>
          <Text style={styles.question}>{item.question}</Text>
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      ))}

      {Platform.OS === 'android' && (
        <PrimaryButton title="Открыть настройки NFC" onPress={() => nfc.openNfcSettings()} />
      )}

      <PrimaryButton
        title="Написать в поддержку izim.kz"
        variant="secondary"
        onPress={() => Linking.openURL('https://izim.kz')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  question: { color: colors.text, fontSize: 15, fontWeight: '700' },
  answer: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
