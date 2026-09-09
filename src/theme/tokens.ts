/**
 * Дизайн-токены IZIM. Источник — IZIM_brandbook.md, разделы 05 (цвет),
 * 06 (типографика), 07 (графический язык).
 *
 * Экран приложения работает в режиме «Paper на Night» (контраст 13.4:1,
 * AAA) — брендбук называет его прямо в таблице сочетаний раздела 05.
 */

/** Палитра брендбука без изменений. Новые цвета сюда не добавляем. */
export const brand = {
  night: '#0E1F3D',
  signal: '#2B5CE6',
  /** Инверсная версия точки: на тёмном фоне Signal светлеет (раздел 03). */
  signalLight: '#4E7BF5',
  paper: '#F4EFE6',
  steppe: '#3E8E7E',
  clay: '#C2703F',
  fog: '#9FB0BF',
} as const;

/**
 * Оттенки Night для подложек. Брендбук задаёт один тёмный цвет, а интерфейсу
 * нужны ещё две ступени глубины — берём их как осветление Night, не вводя
 * новых оттенков в палитру.
 */
const nightRaised = '#16294A';
const nightRaisedMore = '#1E3358';
const nightBorder = '#28406B';

export const colors = {
  background: brand.night,
  surface: nightRaised,
  surfaceRaised: nightRaisedMore,
  border: nightBorder,

  text: brand.paper,
  /** Fog — «второстепенный текст» по брендбуку. */
  textMuted: brand.fog,
  textFaint: '#6E8099',

  /**
   * Signal только как заливка: на Night он даёт 2.6:1 и запрещён для текста
   * («только графика и точка знака»). Для надписей на тёмном берём Paper.
   */
  accent: brand.signal,
  /** Графика (не текст) на тёмном фоне: точки маршрута, иконки. */
  accentGraphic: brand.signalLight,
  onAccent: brand.paper,

  /** Clay — предупреждения. Брендбук ограничивает его 5% макета. */
  warning: brand.clay,
  /** Steppe — вторичный: статусы, иконки, схемы. */
  secondary: brand.steppe,

  disabledSurface: nightRaisedMore,
  disabledText: '#6E8099',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** Поля макета: брендбук требует не менее 8% от короткой стороны (раздел 07). */
export const layout = {
  screenPadding: spacing.lg,
  /** Маршрут-пунктир: точки 4 px с шагом 13 px (раздел 07). */
  routeDotSize: 4,
  routeDotGap: 13,
} as const;
