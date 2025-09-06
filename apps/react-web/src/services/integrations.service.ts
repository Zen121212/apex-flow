import type { Integration, IntegrationType, TestResult } from '../features/integrations/types/index';

// Flexible config type that can handle any integration configuration
type IntegrationConfig = Record<string, unknown>;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class IntegrationsApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.message || 'API request failed');
      }

      // Handle empty responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }
      throw error;
    }
  }

  async getAllIntegrations(): Promise<Integration[]> {
    return this.request<Integration[]>('/integrations');
  }

  async getIntegration(id: string): Promise<Integration> {
    return this.request<Integration>(`/integrations/${id}`);
  }

  async createIntegration(data: {
    type: IntegrationType;
    name: string;
    description?: string;
    config: IntegrationConfig;
  }): Promise<Integration> {
    return this.request<Integration>('/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIntegration(
    id: string,
    data: {
      name?: string;
      description?: string;
        config?: IntegrationConfig;
      enabled?: boolean;
    }
  ): Promise<Integration> {
    return this.request<Integration>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.request<void>(`/integrations/${id}`, {
      method: 'DELETE',
    });
  }

  async testIntegration(id: string): Promise<TestResult> {
    const url = `${API_BASE_URL}/integrations/${id}/test`;
    
    const config: RequestInit = {
      method: 'POST',
      credentials: 'include',
      // Don't set Content-Type header for empty body
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }
      throw error;
    }
  }

  async toggleIntegration(id: string): Promise<Integration> {
    const url = `${API_BASE_URL}/integrations/${id}/toggle`;
    
    const config: RequestInit = {
      method: 'POST',
      credentials: 'include',
      // Don't set Content-Type header for empty body
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }
      throw error;
    }
  }
}

export const integrationsApiService = new IntegrationsApiService();
