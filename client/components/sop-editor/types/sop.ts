/**
 * SOP Type Definitions
 * Based on output from https://api.celeste7.ai/webhook/sop-creation
 */

export interface SOPData {
  sop_id: string;
  title: string;
  content_md: string;
  yacht_id: string;
  user_id: string;
  timestamp?: string;
  version?: number;
}

export interface SOPMetadata {
  lastSaved: string;
  lastSynced: string | null;
  isDirty: boolean;
  isOffline: boolean;
}

export interface SOPEditorState {
  sop: SOPData | null;
  metadata: SOPMetadata;
  isLoading: boolean;
  error: string | null;
}

export interface CloudSyncResponse {
  success: boolean;
  sop_id?: string;
  message?: string;
  error?: string;
}
