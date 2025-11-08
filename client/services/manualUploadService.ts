/**
 * Manual Upload Service
 * Handles API calls to the n8n Manual Upload webhook
 */

// ============ TYPE DEFINITIONS ============

export interface ManualUploadRequest {
  file_content: string; // Text content extracted from file
  file_name: string;
  yacht_id: string;
  user_id: string;
  equipment?: string;
}

export interface ManualUploadResponse {
  success: boolean;
  message: string;
  file_name: string;
  yacht_id: string;
  chunks_processed: number;
  timestamp: string;
  error?: string;
}

// ============ MANUAL UPLOAD SERVICE CLASS ============

class ManualUploadService {
  private webhookUrl: string;

  constructor() {
    // Manual upload webhook endpoint - use environment variable or default to production
    this.webhookUrl = import.meta.env.VITE_WEBHOOK_BASE_URL
      ? `${import.meta.env.VITE_WEBHOOK_BASE_URL}/manual-upload`
      : 'https://api.celeste7.ai/webhook/manual-upload';
  }

  /**
   * Extract text from PDF file
   */
  async extractTextFromPdf(file: File): Promise<string> {
    // For now, return a placeholder. In production, you'd use:
    // - pdf.js library for browser-based extraction
    // - OR send to backend for extraction
    console.warn('PDF text extraction not yet implemented. Using filename as placeholder.');
    return `[PDF Content from ${file.name}]\nThis is placeholder text. Implement PDF.js or backend extraction.`;
  }

  /**
   * Extract text from various file types
   */
  async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Plain text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text();
    }

    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.extractTextFromPdf(file);
    }

    // For other types, try to read as text
    try {
      return await file.text();
    } catch (error) {
      throw new Error(`Unsupported file type: ${fileType || fileName}`);
    }
  }

  /**
   * Upload manual document for embedding
   */
  async uploadManual(request: ManualUploadRequest): Promise<ManualUploadResponse> {
    console.log('📤 Manual upload request:', {
      file_name: request.file_name,
      yacht_id: request.yacht_id,
      content_length: request.file_content.length
    });

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Manual upload failed:', response.status, errorText);
        throw new Error(`Manual upload failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Manual uploaded successfully:', {
        file_name: data.file_name,
        chunks_processed: data.chunks_processed
      });

      return data;
    } catch (error) {
      console.error('❌ Manual upload error:', error);
      throw error;
    }
  }

  /**
   * Upload file with automatic text extraction
   */
  async uploadFile(
    file: File,
    yacht_id: string,
    user_id: string,
    equipment?: string
  ): Promise<ManualUploadResponse> {
    console.log('📄 Processing file:', file.name, file.size, 'bytes');

    // Extract text from file
    const fileContent = await this.extractTextFromFile(file);

    // Upload to n8n webhook
    return await this.uploadManual({
      file_content: fileContent,
      file_name: file.name,
      yacht_id: yacht_id,
      user_id: user_id,
      equipment: equipment
    });
  }
}

// Export singleton instance
export const manualUploadService = new ManualUploadService();
export default manualUploadService;
