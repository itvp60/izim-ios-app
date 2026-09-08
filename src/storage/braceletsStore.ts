import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Bracelet } from '@/types/bracelet';
import { deletePhoto, savePhoto } from './photoStore';

/**
 * Bracelets (and their secret editUrl) live only in the device Keychain/Keystore
 * via expo-secure-store. The server never sees editUrl in plain text — only its
 * hash, per the existing web app design. Reinstalling the app loses this list;
 * that is an accepted trade-off called out in the plan (section 6).
 */
const STORAGE_KEY = 'izim_bracelets_v1';

async function readAll(): Promise<Bracelet[]> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Bracelet[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(bracelets: Bracelet[]): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(bracelets));
}

export async function getBracelets(): Promise<Bracelet[]> {
  const all = await readAll();
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getBracelet(id: string): Promise<Bracelet | undefined> {
  const all = await readAll();
  return all.find((b) => b.id === id);
}

export async function upsertBracelet(
  input: Omit<Bracelet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Bracelet> {
  const all = await readAll();
  const now = Date.now();

  const existingIndex = input.id ? all.findIndex((b) => b.id === input.id) : -1;
  if (existingIndex >= 0) {
    const updated: Bracelet = { ...all[existingIndex], ...input, updatedAt: now };
    all[existingIndex] = updated;
    await writeAll(all);
    return updated;
  }

  const created: Bracelet = {
    ...input,
    id: input.id ?? Crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  await writeAll(all);
  return created;
}

export async function updateBraceletStatus(
  id: string,
  status: Bracelet['status']
): Promise<Bracelet | undefined> {
  const all = await readAll();
  const index = all.findIndex((b) => b.id === id);
  if (index < 0) return undefined;
  all[index] = { ...all[index], status, updatedAt: Date.now() };
  await writeAll(all);
  return all[index];
}

export async function removeBracelet(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((b) => b.id !== id));
  // Файл фото лежит вне этого списка, поэтому удаляем его отдельно —
  // иначе он остался бы в песочнице навсегда.
  await deletePhoto(id);
}

/** Копирует выбранное фото в песочницу и запоминает путь в записи браслета. */
export async function setBraceletPhoto(id: string, sourceUri: string): Promise<Bracelet | undefined> {
  const stored = await savePhoto(id, sourceUri);
  const all = await readAll();
  const index = all.findIndex((b) => b.id === id);
  if (index < 0) return undefined;
  all[index] = { ...all[index], photoUri: stored, updatedAt: Date.now() };
  await writeAll(all);
  return all[index];
}

export async function clearBraceletPhoto(id: string): Promise<Bracelet | undefined> {
  await deletePhoto(id);
  const all = await readAll();
  const index = all.findIndex((b) => b.id === id);
  if (index < 0) return undefined;
  const { photoUri: _removed, ...rest } = all[index];
  all[index] = { ...rest, updatedAt: Date.now() };
  await writeAll(all);
  return all[index];
}

export async function findBraceletByCode(code: string): Promise<Bracelet | undefined> {
  const all = await readAll();
  return all.find((b) => b.code === code);
}
