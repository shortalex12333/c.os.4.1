/**
 * SOP Creation Service
 * Handles API calls to the n8n SOP Creation webhook
 */

// ============ TYPE DEFINITIONS ============

export interface SopGenerationRequest {
  query: string;
  use_docs: boolean;
  yacht_id?: string; // Optional yacht identifier
  user: {
    id: string;
    email: string;
    role?: string;
    yacht_id?: string; // Can be nested in user
  };
  jwt: string;
}

export interface SopGenerationResponse {
  sop_id: string;
  title: string;
  content_md: string;
  sources?: string[];
  error?: string;
}

export interface SopSaveRequest {
  sop_id: string;
  action: 'save';
  target: 'nas' | 'cloud';
  content_md: string;
  title?: string;
  user: {
    id: string;
    email: string;
  };
  jwt: string;
}

export interface SopSaveResponse {
  success: boolean;
  message?: string;
  file_path?: string;
  error?: string;
}

export interface SopPdfRequest {
  sop_id: string;
  content_md: string;
  title: string;
  user: {
    id: string;
    email: string;
  };
  jwt: string;
}

// ============ SOP SERVICE CLASS ============

class SopService {
  private webhookUrl: string;

  constructor() {
    // SOP Creation webhook endpoint - Cloud API
    this.webhookUrl = 'https://api.celeste7.ai/webhook/sop-creation';
  }

  /**
   * Generate SOP from prompt
   */
  async generateSop(request: SopGenerationRequest): Promise<SopGenerationResponse> {
    console.log('📤 SOP Generation request:', {
      query: request.query,
      use_docs: request.use_docs,
      user: request.user.email,
      endpoint: this.webhookUrl
    });

    try {
      // Create FormData for multipart/form-data request (n8n expects this format)
      const formData = new FormData();
      formData.append('query', request.query);
      formData.append('use_docs', String(request.use_docs));
      formData.append('user', JSON.stringify(request.user));

      // Note: Authorization will be handled by n8n or reverse proxy
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header - browser will set it automatically with boundary
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SOP generation failed:', response.status, errorText);
        throw new Error(`SOP generation failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ SOP generated successfully:', {
        sop_id: data.sop_id,
        title: data.title,
        sources_count: data.sources?.length || 0
      });

      return data;
    } catch (error) {
      console.error('❌ SOP generation error:', error);
      throw error;
    }
  }

  /**
   * Save SOP to NAS or Cloud
   */
  async saveSop(request: SopSaveRequest): Promise<SopSaveResponse> {
    console.log('📤 SOP Save request:', {
      sop_id: request.sop_id,
      target: request.target,
      user: request.user.email
    });

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.jwt}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SOP save failed:', response.status, errorText);
        throw new Error(`SOP save failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ SOP saved successfully:', {
        target: request.target,
        file_path: data.file_path
      });

      return data;
    } catch (error) {
      console.error('❌ SOP save error:', error);
      throw error;
    }
  }

  /**
   * Generate and download PDF
   */
  async generatePdf(request: SopPdfRequest): Promise<Blob> {
    console.log('📤 SOP PDF generation request:', {
      sop_id: request.sop_id,
      title: request.title
    });

    try {
      const response = await fetch(`${this.webhookUrl}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.jwt}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PDF generation failed:', response.status, errorText);
        throw new Error(`PDF generation failed: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      console.log('✅ PDF generated successfully');

      return blob;
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Download PDF blob as file
   */
  downloadPdf(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const sopService = new SopService();
export default sopService;
