import { apiRequest } from './client';

/**
 * Режим поиска: на публичной странице браслета появляется «Этого ребёнка
 * ищут» и просьба позвонить родным.
 *
 * Сайт уже умеет это через PATCH /api/profiles/settings — приложению нужен
 * только секретный токен профиля, а он лежит в хвосте editUrl (/e/<token>).
 *
 * Отдельного GET у сайта нет. Вместо него шлём тот же PATCH без полей:
 * updateOwnerSettings на пустой патч ничего не пишет и возвращает текущее
 * состояние — это задуманное поведение сервера, а не случайность.
 */

interface SettingsResponse {
  lostSince: string | null;
}

export function editTokenFromUrl(editUrl: string): string | null {
  const match = editUrl.match(/\/e\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function requireToken(editUrl: string): string {
  const token = editTokenFromUrl(editUrl);
  if (!token) throw new Error('NO_EDIT_TOKEN');
  return token;
}

/** Текущее состояние: ISO-время включения или null, если режим выключен. */
export async function getLostSince(editUrl: string): Promise<string | null> {
  const response = await apiRequest<SettingsResponse>('/api/profiles/settings', {
    method: 'PATCH',
    body: { token: requireToken(editUrl) },
  });
  return response.lostSince;
}

export async function setLostMode(editUrl: string, lost: boolean): Promise<string | null> {
  const response = await apiRequest<SettingsResponse>('/api/profiles/settings', {
    method: 'PATCH',
    body: { token: requireToken(editUrl), lost },
  });
  return response.lostSince;
}
