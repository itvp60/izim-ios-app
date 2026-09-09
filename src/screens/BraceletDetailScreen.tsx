import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { Bracelet, ROLE_LABELS } from '@/types/bracelet';
import {
  clearBraceletPhoto,
  getBracelet,
  removeBracelet,
  setBraceletPhoto,
} from '@/storage/braceletsStore';
import { PhotoPermissionError, PhotoSource, pickPhoto } from '@/media/pickPhoto';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusBadge } from '@/components/StatusBadge';
import { BraceletAvatar } from '@/components/BraceletAvatar';
import { colors, layout, radius, spacing, type } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BraceletDetail'>;
type Route = RouteProp<RootStackParamList, 'BraceletDetail'>;

/**
 * Карточка одного браслета. Раньше эти действия жили в Alert со списком
 * кнопок — на Android он показывает максимум три, и часть пунктов туда
 * просто не попадала. Отдельный экран заодно даёт место под фото.
 */
export function BraceletDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [bracelet, setBracelet] = useState<Bracelet | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    getBracelet(route.params.braceletId).then((b) => setBracelet(b ?? null));
  }, [route.params.braceletId]);

  useFocusEffect(reload);

  async function applyPhoto(source: PhotoSource) {
    if (!bracelet) return;
    setBusy(true);
    try {
      const uri = await pickPhoto(source);
      if (!uri) return;
      const updated = await setBraceletPhoto(bracelet.id, uri);
      if (updated) setBracelet(updated);
    } catch (error) {
      if (error instanceof PhotoPermissionError) {
        Alert.alert(
          error.source === 'camera' ? 'Камера недоступна' : 'Галерея недоступна',
          error.source === 'camera'
            ? 'Доступ к камере закрыт. Откройте настройки телефона и разрешите его для IZIM ID.'
            : 'Доступ к фотографиям закрыт. Откройте настройки телефона и разрешите его для IZIM ID.'
        );
        return;
      }
      Alert.alert('Фото не сохранилось', 'Файл не удалось прочитать. Выберите другое фото.');
    } finally {
      setBusy(false);
    }
  }

  function onPhotoPress() {
    // Ровно три кнопки: столько показывает Alert на Android.
    Alert.alert('Фото браслета', 'Оно останется на телефоне и не попадёт на страницу профиля.', [
      { text: 'Снять на камеру', onPress: () => applyPhoto('camera') },
      { text: 'Выбрать из галереи', onPress: () => applyPhoto('library') },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }

  async function onRemovePhotoPress() {
    if (!bracelet) return;
    const updated = await clearBraceletPhoto(bracelet.id);
    if (updated) setBracelet(updated);
  }

  function onDeletePress() {
    if (!bracelet) return;
    Alert.alert(
      'Удалить браслет из списка?',
      'Профиль на сервере останется, страница по ссылке продолжит работать. С телефона пропадёт запись и фото.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await removeBracelet(bracelet.id);
            navigation.navigate('MyBracelets');
          },
        },
      ]
    );
  }

  if (!bracelet) return <View style={styles.container} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.identity}>
        <Pressable onPress={onPhotoPress} disabled={busy} accessibilityRole="button">
          <BraceletAvatar photoUri={bracelet.photoUri} name={bracelet.name} size={96} />
        </Pressable>

        <Text style={[type.h1, styles.name]}>{bracelet.name || 'Без имени'}</Text>
        {bracelet.role && <Text style={type.bodyMuted}>{ROLE_LABELS[bracelet.role]}</Text>}
        <StatusBadge status={bracelet.status} />
      </View>

      <View style={styles.photoActions}>
        <Pressable onPress={onPhotoPress} disabled={busy} hitSlop={8} accessibilityRole="button">
          <Text style={styles.link}>{bracelet.photoUri ? 'Заменить фото' : 'Добавить фото'}</Text>
        </Pressable>
        {bracelet.photoUri && (
          <Pressable onPress={onRemovePhotoPress} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.link, styles.linkMuted]}>Удалить фото</Text>
          </Pressable>
        )}
      </View>
      <Text style={[type.caption, styles.photoNote]}>
        Фото хранится только на этом телефоне. Тот, кто приложит браслет, увидит страницу профиля
        без фотографии.
      </Text>

      <View style={styles.dataBlock}>
        <Text style={type.overline}>Код метки</Text>
        <Text style={type.data}>{bracelet.code}</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title={bracelet.status === 'draft' ? 'Записать метку' : 'Перезаписать метку'}
          onPress={() => navigation.navigate('WriteTag', { braceletId: bracelet.id })}
        />
        {bracelet.status === 'written' && (
          <PrimaryButton
            title="Заблокировать метку"
            variant="secondary"
            onPress={() => navigation.navigate('LockTag', { braceletId: bracelet.id })}
          />
        )}
        <PrimaryButton
          title="Изменить данные профиля"
          variant="secondary"
          onPress={() =>
            navigation.navigate('ProfileWebView', {
              mode: 'edit',
              braceletId: bracelet.id,
              editUrl: bracelet.editUrl,
            })
          }
        />
        <Pressable onPress={onDeletePress} hitSlop={8} accessibilityRole="button" style={styles.delete}>
          <Text style={[styles.link, styles.linkDanger]}>Удалить браслет из списка</Text>
        </Pressable>
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
  identity: { alignItems: 'center', gap: spacing.sm },
  name: { textAlign: 'center' },
  photoActions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  photoNote: { textAlign: 'center' },
  link: {
    ...type.button,
    color: colors.text,
  },
  linkMuted: { color: colors.textMuted },
  linkDanger: { color: colors.warning },
  dataBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  delete: { alignItems: 'center', paddingVertical: spacing.md },
});
