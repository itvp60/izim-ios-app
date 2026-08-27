import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { ClaimedTag, PendingSyncAction } from '@/types/tag';

/**
 * Offline support (plan section 6): a small pool of pre-claimed codes is fetched
 * ahead of time so writing a tag never depends on having a signal at that exact
 * moment, and "written"/"locked" confirmations are queued and flushed once the
 * device is back online instead of blocking the in-hand write flow.
 */
const POOL_KEY = 'izim_claim_pool_v1';
const QUEUE_KEY = 'izim_pending_sync_v1';

export const MIN_POOL_SIZE = 1;
export const REFILL_BATCH_SIZE = 5;

async function readPool(): Promise<ClaimedTag[]> {
  const raw = await AsyncStorage.getItem(POOL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ClaimedTag[];
  } catch {
    return [];
  }
}

async function writePool(pool: ClaimedTag[]): Promise<void> {
  await AsyncStorage.setItem(POOL_KEY, JSON.stringify(pool));
}

export async function getPoolSize(): Promise<number> {
  return (await readPool()).length;
}

export async function addToPool(tags: ClaimedTag[]): Promise<void> {
  const pool = await readPool();
  await writePool([...pool, ...tags]);
}

/** Removes and returns one claimed tag from the local pool, if any is available. */
export async function takeFromPool(): Promise<ClaimedTag | undefined> {
  const pool = await readPool();
  const next = pool.shift();
  if (next) await writePool(pool);
  return next;
}

async function readQueue(): Promise<PendingSyncAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingSyncAction[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingSyncAction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueSync(
  type: PendingSyncAction['type'],
  code: string
): Promise<void> {
  const queue = await readQueue();
  queue.push({
    id: Crypto.randomUUID(),
    type,
    code,
    createdAt: Date.now(),
    attempts: 0,
  });
  await writeQueue(queue);
}

export async function getPendingSyncCount(): Promise<number> {
  return (await readQueue()).length;
}

/**
 * Attempts to send every queued action via `send`. Actions that succeed are
 * removed; actions that fail stay queued (with an incremented attempt count)
 * for the next flush.
 */
export async function flushQueue(
  send: (action: PendingSyncAction) => Promise<boolean>
): Promise<{ sent: number; remaining: number }> {
  const queue = await readQueue();
  if (queue.length === 0) return { sent: 0, remaining: 0 };

  const stillPending: PendingSyncAction[] = [];
  let sent = 0;

  for (const action of queue) {
    try {
      const ok = await send(action);
      if (ok) {
        sent += 1;
      } else {
        stillPending.push({ ...action, attempts: action.attempts + 1 });
      }
    } catch {
      stillPending.push({ ...action, attempts: action.attempts + 1 });
    }
  }

  await writeQueue(stillPending);
  return { sent, remaining: stillPending.length };
}
