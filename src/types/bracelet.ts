/**
 * A "bracelet" is the app's local record of one NFC tag lifecycle:
 * profile created on id.izim.kz -> URL written to the physical tag -> optionally locked.
 * The editUrl is a secret editing link and never leaves the device unencrypted
 * (the server only ever stores its hash, per the web app's existing design).
 */
export type BraceletRole = 'child' | 'adult_sos' | 'adult_card';

export type BraceletStatus =
  /** Profile exists on the server, tag not written yet. */
  | 'draft'
  /** URL written to the physical tag and verified by re-reading it. */
  | 'written'
  /** Tag was made read-only. Profile data can still change on the server. */
  | 'locked';

export interface Bracelet {
  id: string;
  code: string;
  profileUrl: string;
  editUrl: string;
  role?: BraceletRole;
  name?: string;
  status: BraceletStatus;
  createdAt: number;
  updatedAt: number;
}

export const ROLE_LABELS: Record<BraceletRole, string> = {
  child: 'Ребёнок',
  adult_sos: 'Взрослый SOS',
  adult_card: 'Взрослый визитка',
};
