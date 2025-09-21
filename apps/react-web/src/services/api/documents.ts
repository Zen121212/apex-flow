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
  DocumentItem,
} from '../../types/documents';

// Backend document interface (what API returns)
interface BackendDocument {
  id: string;
  filename: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  uploadedAt: string;
  uploadedBy: string;
  workflowExecution?: {
    workflowId: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    steps?: any[];
  };
}

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
    return this.request<WorkflowOptionsResponse>('/api/workflows/config/options');
  }

  async uploadDocument(data: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    // Using simple-upload endpoint with authentication enabled
    return this.request<DocumentUploadResponse>('/api/documents/simple-upload', {
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

    return this.request<DocumentUploadResponse>('/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData, let browser set it
    });
  }

  async getDocumentAnalysis(documentId: string): Promise<any> {
    return this.request<any>(`/api/documents/${documentId}/analysis`);
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await fetch(`http://localhost:3000/api/documents/${documentId}/file`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    
    return response.blob();
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
    const response = await this.request<{ documents: BackendDocument[] }>(`/api/documents${query}`);

    // Transform backend response to match our frontend types
    const items = response.documents.map((doc: BackendDocument): DocumentItem => ({
      id: doc.id,
      originalName: doc.originalName, // Use the originalName field from backend
      mimeType: doc.mimeType,
      size: doc.size,
      category: null, // Not in current response
      workflowId: doc.workflowExecution?.workflowId || null, // Extract from workflowExecution
      status: 'completed' as const, // Assume uploaded docs are completed for now
      createdAt: doc.uploadedAt,
      updatedAt: doc.uploadedAt,
    }));

    // Apply client-side filtering since backend doesn't support all filters yet
    let filteredItems = items;
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredItems = filteredItems.filter((item: DocumentItem) => 
        item.originalName.toLowerCase().includes(query)
      );
    }
    if (filters.workflowId) {
      filteredItems = filteredItems.filter((item: DocumentItem) => item.workflowId === filters.workflowId);
    }
    if (filters.status && filters.status !== 'completed') {
      filteredItems = filteredItems.filter((item: DocumentItem) => item.status === filters.status);
    }
    if (filters.from) {
      const fromDate = new Date(filters.from);
      filteredItems = filteredItems.filter((item: DocumentItem) => new Date(item.createdAt) >= fromDate);
    }
    if (filters.to) {
      const toDate = new Date(filters.to);
      filteredItems = filteredItems.filter((item: DocumentItem) => new Date(item.createdAt) <= toDate);
    }

    // Apply client-side sorting
    if (filters.sortBy) {
      filteredItems.sort((a: DocumentItem, b: DocumentItem) => {
        let aVal: unknown = a[filters.sortBy as keyof DocumentItem];
        let bVal: unknown = b[filters.sortBy as keyof DocumentItem];
        
        if (filters.sortBy === 'name') {
          aVal = a.originalName;
          bVal = b.originalName;
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal);
          return filters.sortDir === 'desc' ? -comparison : comparison;
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return filters.sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        }
        
        // Fallback string comparison
        const aStr = String(aVal);
        const bStr = String(bVal);
        const comparison = aStr.localeCompare(bStr);
        return filters.sortDir === 'desc' ? -comparison : comparison;
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
