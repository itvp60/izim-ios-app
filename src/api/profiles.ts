import { apiRequest } from './client';

/**
 * `GET /api/profiles/mine` (plan section 6) rebuilds the local bracelet list
 * from the server when it's otherwise lost (reinstall, new device) using the
 * device's saved edit tokens. Since those tokens are secrets, they're sent as
 * a header rather than a query string — confirm this against the actual
 * backend contract once it exists.
 */
export interface RemoteProfileSummary {
  code: string;
  profileUrl: string;
  role?: string;
  name?: string;
}

interface MineResponse {
  profiles: RemoteProfileSummary[];
}

export async function getMyProfiles(editTokens: string[]): Promise<RemoteProfileSummary[]> {
  if (editTokens.length === 0) return [];
  const response = await apiRequest<MineResponse>('/api/profiles/mine', {
    method: 'GET',
    headers: { 'X-Edit-Tokens': editTokens.join(',') },
  });
  return response.profiles;
}
