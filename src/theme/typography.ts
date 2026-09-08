import { TextStyle } from 'react-native';
import { colors } from './tokens';

/**
 * Типографика по разделу 06 брендбука: Jost для заголовков и цифр,
 * Inter для основного текста. Трекинг в брендбуке задан в тысячных em
 * (нотация Adobe) — здесь он пересчитан в пиксели для каждого кегля.
 */
export const fontFamily = {
  displayRegular: 'Jost_400Regular',
  displayMedium: 'Jost_500Medium',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

/** Кегли адаптированы под телефон: брендбук даёт вилку под печать и веб. */
export const type = {
  /** H1 · Jost Medium · интерлиньяж 1.05 · трекинг −20 */
  h1: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.64,
    color: colors.text,
  } as TextStyle,

  /** H2 · Jost Medium · интерлиньяж 1.15 · трекинг −10 */
  h2: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.24,
    color: colors.text,
  } as TextStyle,

  /** Надзаголовок · Jost Regular CAPS · трекинг +280 */
  overline: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 3.36,
    textTransform: 'uppercase',
    color: colors.textMuted,
  } as TextStyle,

  /** Основной текст · Inter Regular · интерлиньяж 1.6 */
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.text,
  } as TextStyle,

  bodyMuted: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
  } as TextStyle,

  /** Подпись, сноска · Inter Regular · трекинг +10 */
  caption: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.13,
    color: colors.textFaint,
  } as TextStyle,

  /** Цифры и данные · Jost Medium, табличные */
  data: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  } as TextStyle,

  button: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
  } as TextStyle,
} as const;
