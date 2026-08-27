import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { Bracelet, ROLE_LABELS } from '@/types/bracelet';
import { getBracelets, removeBracelet } from '@/storage/braceletsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radius, spacing } from '@/theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MyBracelets'>;

export function MyBraceletsScreen() {
  const navigation = useNavigation<Nav>();
  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    getBracelets()
      .then(setBracelets)
      .finally(() => setLoaded(true));
  }, []);

  useFocusEffect(reload);

  function onCreatePress() {
    navigation.navigate('ProfileWebView', { mode: 'create' });
  }

  function onBraceletPress(bracelet: Bracelet) {
    const options: Array<{ text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }> = [];

    if (bracelet.status === 'draft') {
      options.push({ text: 'Записать метку', onPress: () => navigation.navigate('WriteTag', { braceletId: bracelet.id }) });
    } else {
      options.push({ text: 'Перезаписать метку', onPress: () => navigation.navigate('WriteTag', { braceletId: bracelet.id }) });
    }

    if (bracelet.status === 'written') {
      options.push({ text: 'Заблокировать метку', onPress: () => navigation.navigate('LockTag', { braceletId: bracelet.id }) });
    }

    options.push({
      text: 'Изменить данные',
      onPress: () =>
        navigation.navigate('ProfileWebView', {
          mode: 'edit',
          braceletId: bracelet.id,
          editUrl: bracelet.editUrl,
        }),
    });

    options.push({
      text: 'Удалить из списка на телефоне',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Удалить браслет из списка?',
          'Профиль на сервере не удаляется, страница по ссылке продолжит работать. Из этого списка на телефоне запись пропадёт.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: () => removeBracelet(bracelet.id).then(reload) },
          ]
        );
      },
    });

    options.push({ text: 'Отмена', style: 'cancel' });

    Alert.alert(bracelet.name || 'Браслет', bracelet.code, options);
  }

  if (loaded && bracelets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Пока нет браслетов</Text>
        <Text style={styles.emptySubtitle}>
          Настройте профиль и запишите первую метку — это займёт пару минут.
        </Text>
        <View style={styles.emptyButton}>
          <PrimaryButton title="Настроить первый браслет" onPress={onCreatePress} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bracelets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onBraceletPress(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name || 'Без имени'}</Text>
              <StatusBadge status={item.status} />
            </View>
            {item.role && <Text style={styles.cardRole}>{ROLE_LABELS[item.role]}</Text>}
            <Text style={styles.cardCode}>Код метки: {item.code}</Text>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton title="Настроить ещё браслет" onPress={onCreatePress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  cardRole: { color: colors.textMuted, fontSize: 14 },
  cardCode: { color: colors.textFaint, fontSize: 13 },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  emptyContainer: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: spacing.md },
  emptyButton: { alignSelf: 'stretch' },
});
