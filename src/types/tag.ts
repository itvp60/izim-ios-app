export interface ClaimedTag {
  code: string;
  profileUrl: string;
  editUrl?: string;
  claimedAt: number;
}

export interface TagDiagnostics {
  url: string | null;
  techTypes: string[];
  tagType: string | null;
  maxSize: number | null;
  freeSize: number | null;
  isWritable: boolean | null;
  isLocked: boolean;
  rawId: string | null;
}

export interface PendingSyncAction {
  id: string;
  type: 'mark_written' | 'mark_locked';
  code: string;
  createdAt: number;
  attempts: number;
}
