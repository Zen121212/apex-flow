import type {
  WorkflowOption,
  CategoryOption,
  WorkflowOptionsResponse,
  DocumentUploadRequest,
  WorkflowSelectionResult,
  ExecutionResult,
  DocumentUploadResponse,
  DocumentListFilters,
  DocumentListResponse,
} from '../../types/documents';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class DocumentAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies in requests
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getWorkflowOptions(): Promise<WorkflowOptionsResponse> {
    return this.request<WorkflowOptionsResponse>('/workflows/config/options');
  }

  async uploadDocument(data: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    // Using simple-upload endpoint (authentication temporarily disabled for testing)
    return this.request<DocumentUploadResponse>('/documents/simple-upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // For future real file uploads when multipart is enabled
  async uploadFile(file: File, options?: {
    workflowId?: string;
    documentCategory?: string;
    autoDetectWorkflow?: boolean;
    workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
  }): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.workflowId) formData.append('workflowId', options.workflowId);
    if (options?.documentCategory) formData.append('documentCategory', options.documentCategory);
    if (options?.autoDetectWorkflow !== undefined) formData.append('autoDetectWorkflow', options.autoDetectWorkflow.toString());
    if (options?.workflowSelectionMode) formData.append('workflowSelectionMode', options.workflowSelectionMode);

    return this.request<DocumentUploadResponse>('/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData, let browser set it
    });
  }

  async getDocuments(filters: DocumentListFilters = {}): Promise<DocumentListResponse> {
    // Based on the actual controller: GET /documents returns { documents: [...] }
    const params = new URLSearchParams();
    // The controller currently only accepts userId, but we'll pass other params for future use
    if (filters.query) params.set('query', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.workflowId) params.set('workflowId', filters.workflowId);
    if (filters.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params.set('sortDir', filters.sortDir);
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize));
    
    // The controller now returns all documents for debugging, so we don't need userId filtering

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<{ documents: any[] }>(`/documents${query}`);

    // Transform backend response to match our frontend types
    const items = response.documents.map((doc: any) => ({
      id: doc.id,
      originalName: doc.filename, // Backend uses 'filename', frontend expects 'originalName'
      mimeType: doc.mimeType,
      size: doc.size,
      category: null, // Not in current response
      workflowId: null, // Not in current response
      status: 'completed' as const, // Assume uploaded docs are completed for now
      createdAt: doc.uploadedAt,
      updatedAt: doc.uploadedAt,
    }));

    // Apply client-side filtering since backend doesn't support all filters yet
    let filteredItems = items;
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredItems = filteredItems.filter((item: any) => 
        item.originalName.toLowerCase().includes(query)
      );
    }
    if (filters.status && filters.status !== 'completed') {
      filteredItems = filteredItems.filter((item: any) => item.status === filters.status);
    }
    if (filters.from) {
      const fromDate = new Date(filters.from);
      filteredItems = filteredItems.filter((item: any) => new Date(item.createdAt) >= fromDate);
    }
    if (filters.to) {
      const toDate = new Date(filters.to);
      filteredItems = filteredItems.filter((item: any) => new Date(item.createdAt) <= toDate);
    }

    // Apply client-side sorting
    if (filters.sortBy) {
      filteredItems.sort((a: any, b: any) => {
        let aVal = a[filters.sortBy!];
        let bVal = b[filters.sortBy!];
        
        if (filters.sortBy === 'name') {
          aVal = a.originalName;
          bVal = b.originalName;
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal);
          return filters.sortDir === 'desc' ? -comparison : comparison;
        }
        
        if (aVal < bVal) return filters.sortDir === 'desc' ? 1 : -1;
        if (aVal > bVal) return filters.sortDir === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply client-side pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const total = filteredItems.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
    };
  }
}

export const documentAPI = new DocumentAPI();

// Explicit type re-exports to ensure they're available
export type {
  WorkflowOption,
  CategoryOption,
  WorkflowOptionsResponse,
  DocumentUploadRequest,
  WorkflowSelectionResult,
  ExecutionResult,
  DocumentUploadResponse,
  DocumentListFilters,
  DocumentListResponse,
};
