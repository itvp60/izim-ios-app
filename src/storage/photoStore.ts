import * as FileSystem from 'expo-file-system';

/**
 * Фото браслета живёт только на устройстве: файл в песочнице приложения,
 * а в записи браслета хранится путь к нему. На публичную страницу /t/КОД
 * фото не уходит — это решение из IZIM-ID-plan.md (раздел 6): страницу
 * может открыть кто угодно, поэтому лицо ребёнка там не показываем.
 *
 * Сам файл не кладём в SecureStore: там лимит около 2 КБ на значение,
 * фотография туда не поместится.
 */
const PHOTO_DIR = `${FileSystem.documentDirectory}bracelet-photos/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

async function listPhotosFor(braceletId: string): Promise<string[]> {
  await ensureDir();
  const names = await FileSystem.readDirectoryAsync(PHOTO_DIR);
  return names.filter((name) => name.startsWith(`${braceletId}-`)).map((name) => PHOTO_DIR + name);
}

/**
 * Копирует выбранное фото в песочницу и возвращает постоянный путь.
 * Имя файла содержит отметку времени: Image кеширует картинки по URI, и
 * при перезаписи по тому же пути на экране осталось бы старое фото.
 */
export async function savePhoto(braceletId: string, sourceUri: string): Promise<string> {
  await ensureDir();
  const previous = await listPhotosFor(braceletId);
  const target = `${PHOTO_DIR}${braceletId}-${Date.now()}.jpg`;

  await FileSystem.copyAsync({ from: sourceUri, to: target });

  for (const file of previous) {
    await FileSystem.deleteAsync(file, { idempotent: true });
  }

  return target;
}

export async function deletePhoto(braceletId: string): Promise<void> {
  for (const file of await listPhotosFor(braceletId)) {
    await FileSystem.deleteAsync(file, { idempotent: true });
  }
}

/** Проверяет, что файл всё ещё на месте: его мог удалить сам iOS/Android. */
export async function photoExists(uri: string | undefined): Promise<boolean> {
  if (!uri) return false;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
}
