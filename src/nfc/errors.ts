/**
 * Typed errors mapped from raw react-native-nfc-manager exceptions, one per
 * scenario in plan section 8. The underlying library throws plain strings or
 * generic Error objects whose messages differ by platform, so mapNfcError()
 * below matches on message substrings — this is a best-effort heuristic to
 * revisit once real devices/tags are on hand (plan section 10 test matrix).
 */
export type NfcErrorCode =
  | 'NOT_SUPPORTED'
  | 'DISABLED'
  | 'TAG_LOCKED'
  | 'NOT_FORMATTABLE'
  | 'FOREIGN_DATA'
  | 'TOO_EARLY_REMOVED'
  | 'CAPACITY_TOO_SMALL'
  | 'EMPTY_AFTER_WRITE'
  | 'VERIFICATION_MISMATCH'
  | 'LOCK_FAILED'
  | 'CANCELLED'
  | 'UNKNOWN';

export class NfcError extends Error {
  code: NfcErrorCode;
  cause?: unknown;

  constructor(code: NfcErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'NfcError';
    this.code = code;
    this.cause = cause;
  }
}

const MESSAGE_PATTERNS: Array<{ code: NfcErrorCode; pattern: RegExp }> = [
  { code: 'CANCELLED', pattern: /cancel/i },
  { code: 'TAG_LOCKED', pattern: /read.?only|locked|not.?writable/i },
  { code: 'NOT_FORMATTABLE', pattern: /not.?formatt/i },
  { code: 'CAPACITY_TOO_SMALL', pattern: /too.?small|capacity|size exceeded/i },
  { code: 'TOO_EARLY_REMOVED', pattern: /tag.?connection.?lost|tag was lost|io.?exception/i },
];

export function mapNfcError(error: unknown): NfcError {
  if (error instanceof NfcError) return error;

  const message =
    typeof error === 'string' ? error : error instanceof Error ? error.message : String(error);

  for (const { code, pattern } of MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      return new NfcError(code, message, error);
    }
  }

  return new NfcError('UNKNOWN', message, error);
}
