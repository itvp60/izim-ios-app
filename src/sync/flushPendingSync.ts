import { flushQueue } from '@/storage/claimQueue';
import { confirmTagLocked, confirmTagWritten } from '@/api/tags';

/** Sends every queued "written"/"locked" confirmation now that we're online. */
export async function flushPendingSync(): Promise<void> {
  await flushQueue(async (action) => {
    try {
      if (action.type === 'mark_written') {
        await confirmTagWritten(action.code);
      } else {
        await confirmTagLocked(action.code);
      }
      return true;
    } catch {
      return false;
    }
  });
}
