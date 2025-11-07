/**
 * localStorage Manager for Autosave
 * Handles offline persistence and automatic saving
 */

import type { SOPData, SOPMetadata } from '../types/sop';

const STORAGE_PREFIX = 'celesteos_sop_';
const METADATA_SUFFIX = '_metadata';

export class SOPStorage {
  /**
   * Save SOP to localStorage
   */
  static save(sop: SOPData): void {
    try {
      const key = `${STORAGE_PREFIX}${sop.sop_id}`;
      localStorage.setItem(key, JSON.stringify(sop));

      // Update metadata
      const metadata: SOPMetadata = {
        lastSaved: new Date().toISOString(),
        lastSynced: this.getMetadata(sop.sop_id)?.lastSynced || null,
        isDirty: true,
        isOffline: !navigator.onLine,
      };
      localStorage.setItem(`${key}${METADATA_SUFFIX}`, JSON.stringify(metadata));

      console.log(`✅ SOP saved to localStorage: ${sop.sop_id}`);
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
      throw new Error('Failed to save SOP locally');
    }
  }

  /**
   * Load SOP from localStorage
   */
  static load(sopId: string): SOPData | null {
    try {
      const key = `${STORAGE_PREFIX}${sopId}`;
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as SOPData;
    } catch (error) {
      console.error('❌ localStorage load failed:', error);
      return null;
    }
  }

  /**
   * Get SOP metadata
   */
  static getMetadata(sopId: string): SOPMetadata | null {
    try {
      const key = `${STORAGE_PREFIX}${sopId}${METADATA_SUFFIX}`;
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as SOPMetadata;
    } catch (error) {
      console.error('❌ Metadata load failed:', error);
      return null;
    }
  }

  /**
   * Update metadata after successful cloud sync
   */
  static markSynced(sopId: string): void {
    const metadata = this.getMetadata(sopId);
    if (metadata) {
      metadata.lastSynced = new Date().toISOString();
      metadata.isDirty = false;

      const key = `${STORAGE_PREFIX}${sopId}${METADATA_SUFFIX}`;
      localStorage.setItem(key, JSON.stringify(metadata));
    }
  }

  /**
   * List all saved SOPs
   */
  static listAll(): string[] {
    const sopIds: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX) && !key.endsWith(METADATA_SUFFIX)) {
        const sopId = key.replace(STORAGE_PREFIX, '');
        sopIds.push(sopId);
      }
    }

    return sopIds;
  }

  /**
   * Delete SOP from localStorage
   */
  static delete(sopId: string): void {
    const key = `${STORAGE_PREFIX}${sopId}`;
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}${METADATA_SUFFIX}`);
  }

  /**
   * Clear all SOPs (use with caution!)
   */
  static clearAll(): void {
    const sopIds = this.listAll();
    sopIds.forEach((id) => this.delete(id));
  }
}
