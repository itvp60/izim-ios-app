import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, layout } from '@/theme';

interface Props {
  count?: number;
  /**
   * Подсветить первую точку цветом Signal — «точка старта» из раздела 07.
   * По умолчанию выключено: на экране с синей кнопкой это был бы второй
   * акцент, а брендбук разрешает только один.
   */
  withStartDot?: boolean;
  style?: ViewStyle;
}

/**
 * Маршрут-пунктир — главный графический элемент бренда после логотипа
 * (раздел 07): точки 4 px с шагом 13 px, линия идёт слева направо и снизу
 * вверх. Здесь работает как разделитель между смысловыми блоками экрана.
 */
export function RouteDots({ count = 7, withStartDot = false, style }: Props) {
  return (
    <View style={[styles.row, style]} accessibilityElementsHidden importantForAccessibility="no">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { marginBottom: index * 2 },
            index === 0 && withStartDot ? styles.startDot : styles.trailDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: layout.routeDotGap - layout.routeDotSize,
    height: 20,
  },
  dot: {
    width: layout.routeDotSize,
    height: layout.routeDotSize,
    borderRadius: layout.routeDotSize / 2,
  },
  startDot: { backgroundColor: colors.accentGraphic },
  trailDot: { backgroundColor: colors.textFaint },
});
