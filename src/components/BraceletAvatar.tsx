import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, type } from '@/theme';

interface Props {
  photoUri?: string;
  name?: string;
  size?: number;
}

function initial(name?: string): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0].toUpperCase() : '—';
}

/**
 * Фото браслета или буквенная заглушка. Фото хранится только на устройстве
 * (storage/photoStore) и нужно родителю, чтобы различать браслеты детей в
 * списке — на публичную страницу оно не попадает.
 */
export function BraceletAvatar({ photoUri, name, size = 52 }: Props) {
  const box = { width: size, height: size, borderRadius: radius.pill };

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={[styles.photo, box]} resizeMode="cover" />;
  }

  return (
    <View style={[styles.placeholder, box]}>
      <Text style={[type.h2, styles.letter, { fontSize: size * 0.4 }]}>{initial(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: colors.secondary },
});
