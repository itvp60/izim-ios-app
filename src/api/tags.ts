import { apiRequest } from './client';
import { ClaimedTag } from '@/types/tag';

/**
 * These two calls correspond to the backend work listed in plan section 6:
 * `POST /api/tags/claim` and `GET /api/profiles/mine` are not built yet on
 * id.izim.kz. The exact request/response shape below is this app's proposal —
 * confirm field names with the backend team before the endpoints ship.
 */

interface ClaimTagsResponse {
  tags: Array<{ code: string; profileUrl: string; editUrl?: string }>;
}

export async function claimTags(count: number): Promise<ClaimedTag[]> {
  const response = await apiRequest<ClaimTagsResponse>('/api/tags/claim', {
    method: 'POST',
    body: { count },
  });

  const claimedAt = Date.now();
  return response.tags.map((tag) => ({ ...tag, claimedAt }));
}

/**
 * Best-effort confirmation that a claimed code was actually written to a
 * physical tag. Not required for the write itself to succeed — callers queue
 * this via storage/claimQueue and retry when connectivity returns.
 */
export async function confirmTagWritten(code: string): Promise<void> {
  await apiRequest<void>(`/api/tags/claim/${encodeURIComponent(code)}/confirm`, {
    method: 'PATCH',
    body: { status: 'written' },
  });
}

export async function confirmTagLocked(code: string): Promise<void> {
  await apiRequest<void>(`/api/tags/claim/${encodeURIComponent(code)}/confirm`, {
    method: 'PATCH',
    body: { status: 'locked' },
  });
}
