import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

export class PhotoPermissionError extends Error {
  source: PhotoSource;
  constructor(source: PhotoSource) {
    super(`PHOTO_PERMISSION_DENIED_${source}`);
    this.name = 'PhotoPermissionError';
    this.source = source;
  }
}

/**
 * Квадратный кроп и сжатие делаем прямо в системном пикере: фото уходит
 * в аватар размером в пару сотен пикселей, полноразмерный снимок с камеры
 * занял бы в песочнице несколько мегабайт впустую.
 */
const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

/** Возвращает URI выбранного фото или null, если пользователь закрыл пикер. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new PhotoPermissionError(source);
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(OPTIONS);

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}
