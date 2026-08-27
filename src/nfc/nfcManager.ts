import { Platform } from 'react-native';
import NfcManager, { Ndef, NfcTech, TagEvent } from 'react-native-nfc-manager';
import { TagDiagnostics } from '@/types/tag';
import { NfcError, mapNfcError } from './errors';

let started = false;

export async function init(): Promise<void> {
  if (started) return;
  await NfcManager.start();
  started = true;
}

export async function isSupported(): Promise<boolean> {
  return NfcManager.isSupported();
}

/** iOS has no "NFC off" state to report — Core NFC is always on when supported. */
export async function isEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return NfcManager.isEnabled();
}

export async function openNfcSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await NfcManager.goToNfcSetting();
  }
}

async function safeCancel(): Promise<void> {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // no active session — nothing to cancel
  }
}

function decodeUrl(tag: TagEvent | null): string | null {
  const record = tag?.ndefMessage?.[0];
  if (!record) return null;
  try {
    return Ndef.uri.decodePayload(Uint8Array.from(record.payload));
  } catch {
    return null;
  }
}

function isTagWritable(tag: TagEvent | null): boolean | null {
  // react-native-nfc-manager surfaces NDEF write permission as `isWritable` on
  // Android; iOS does not expose it pre-write, so we only know for sure after
  // attempting a write and getting a TAG_LOCKED-mapped error back.
  const anyTag = tag as unknown as { isWritable?: boolean } | null;
  return anyTag?.isWritable ?? null;
}

export interface WriteOptions {
  /** Set true to proceed even though the tag already carries a different URL. */
  allowOverwrite?: boolean;
  alertMessage?: string;
}

export interface WriteConflict {
  existingUrl: string;
}

/**
 * Writes `url` as a single NDEF URI record, then re-reads the tag and
 * compares the payload before returning — the mandatory verification step
 * from plan section 4/5, since a write can silently no-op if the tag is
 * pulled away too early.
 */
export async function writeUrlToTag(
  url: string,
  options: WriteOptions = {}
): Promise<{ url: string }> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: options.alertMessage ?? 'Поднесите верхнюю часть телефона к браслету',
    });

    const currentTag = await NfcManager.getTag();
    const existingUrl = decodeUrl(currentTag);

    if (isTagWritable(currentTag) === false) {
      throw new NfcError('TAG_LOCKED', 'Tag is read-only');
    }

    if (existingUrl && existingUrl !== url && !options.allowOverwrite) {
      const conflict: WriteConflict = { existingUrl };
      throw Object.assign(new NfcError('FOREIGN_DATA', 'Tag already has a different URL'), {
        conflict,
      });
    }

    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
    if (!bytes) {
      throw new NfcError('UNKNOWN', 'Failed to encode NDEF message');
    }

    const maxSize = currentTag?.maxSize;
    if (typeof maxSize === 'number' && maxSize > 0 && bytes.length > maxSize) {
      throw new NfcError('CAPACITY_TOO_SMALL', `Message ${bytes.length}B exceeds tag ${maxSize}B`);
    }

    await NfcManager.ndefHandler.writeNdefMessage(bytes);

    // Mandatory re-read + compare (plan section 4, step 4 "Проверка").
    const verifiedTag = await NfcManager.getTag();
    const writtenUrl = decodeUrl(verifiedTag);

    if (!writtenUrl) {
      throw new NfcError('EMPTY_AFTER_WRITE', 'Tag read back empty after write');
    }
    if (writtenUrl !== url) {
      throw new NfcError('VERIFICATION_MISMATCH', `Expected ${url}, read ${writtenUrl}`);
    }

    return { url: writtenUrl };
  } catch (error) {
    throw mapNfcError(error);
  } finally {
    await safeCancel();
  }
}

/** Diagnostic read used by the standalone "Прочитать метку" screen. */
export async function readTagDiagnostics(): Promise<TagDiagnostics> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'Поднесите телефон к метке',
    });

    const tag = await NfcManager.getTag();
    const url = decodeUrl(tag);
    const writable = isTagWritable(tag);

    return {
      url,
      techTypes: tag?.techTypes ?? [],
      tagType: tag?.type ?? null,
      maxSize: typeof tag?.maxSize === 'number' ? tag.maxSize : null,
      freeSize:
        typeof tag?.maxSize === 'number' && tag.ndefMessage
          ? tag.maxSize - (Ndef.encodeMessage(tag.ndefMessage)?.length ?? 0)
          : null,
      isWritable: writable,
      isLocked: writable === false,
      rawId: tag?.id ?? null,
    };
  } catch (error) {
    throw mapNfcError(error);
  } finally {
    await safeCancel();
  }
}

/**
 * Makes the tag permanently read-only. Irreversible on both platforms
 * (plan section 5) — callers must get explicit user confirmation first.
 */
export async function lockTag(): Promise<void> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'Поднесите телефон к браслету для блокировки',
    });
    await NfcManager.ndefHandler.makeReadOnly();
  } catch (error) {
    throw mapNfcError(error);
  } finally {
    await safeCancel();
  }
}

export async function cancelSession(): Promise<void> {
  await safeCancel();
}
