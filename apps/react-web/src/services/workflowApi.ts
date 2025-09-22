// Workflow API service for ApexFlow

// Define types directly in the API service to avoid import issues
export interface WorkflowStep {
  name: string;
  type: "extract_text" | "analyze_content" | "send_notification" | "store_data";
  config: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecution {
  workflowId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: string;
  completedAt?: string;
  steps: Array<{
    stepName: string;
    status: "RUNNING" | "COMPLETED" | "FAILED";
    completedAt?: string;
    result?: unknown;
    error?: string;
  }>;
}

export interface WorkflowOptions {
  availableWorkflows: WorkflowDefinition[];
  selectionModes: string[];
  categories: string[];
}

class WorkflowApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable if available, otherwise default
    this.baseUrl =
      (import.meta.env?.VITE_API_BASE_URL as string) || "http://localhost:3000";
    console.log("🔗 WorkflowAPI initialized with baseUrl:", this.baseUrl);
    console.log("🔧 Environment variables:", {
      VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL,
      NODE_ENV: import.meta.env?.NODE_ENV,
    });
  }

  /**
   * Get all available workflows
   */
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    console.log("📥 Fetching workflows from:", `${this.baseUrl}/workflows`);
    try {
      const response = await fetch(`${this.baseUrl}/api/workflows`);
      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Workflows data received:", data);
      console.log("📋 Number of workflows:", data.workflows?.length || 0);

      return data.workflows || [];
    } catch (error) {
      console.error("Error fetching workflows:", error);
      throw error;
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/workflows/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }
      const data = await response.json();
      return data.workflow || null;
    } catch (error) {
      console.error("Error fetching workflow:", error);
      throw error;
    }
  }

  /**
   * Get workflow configuration options
   */
  async getWorkflowOptions(token?: string): Promise<WorkflowOptions> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.baseUrl}/api/workflows/config/options`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch workflow options: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching workflow options:", error);
      throw error;
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(
    workflow: Omit<WorkflowDefinition, "id">,
  ): Promise<WorkflowDefinition> {
    try {
      const response = await fetch(`${this.baseUrl}/api/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`);
      }

      const data = await response.json();
      return data.workflow || data;
    } catch (error) {
      console.error("Error creating workflow:", error);
      throw error;
    }
  }

  /**
   * Update an existing workflow (placeholder - would need backend implementation)
   */
  async updateWorkflow(
    id: string,
    updates: Partial<WorkflowDefinition>,
  ): Promise<WorkflowDefinition> {
    try {
      const response = await fetch(`${this.baseUrl}/api/workflows/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`);
      }

      const data = await response.json();
      return data.workflow;
    } catch (error) {
      console.error("Error updating workflow:", error);
      throw error;
    }
  }

  /**
   * Delete a workflow (placeholder - would need backend implementation)
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting workflow:", error);
      throw error;
    }
  }

  /**
   * Execute a workflow for a document
   */
  async executeWorkflow(
    workflowId: string,
    options: {
      documentId: string;
      aiData?: Record<string, unknown>;
    },
  ): Promise<WorkflowExecution> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/workflows/${workflowId}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: options.documentId,
            aiData: options.aiData,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to execute workflow: ${response.statusText}`);
      }

      const data = await response.json();
      return data.execution;
    } catch (error) {
      console.error("Error executing workflow:", error);
      throw error;
    }
  }

  /**
   * Get workflow execution status for a document
   */
  async getWorkflowExecution(
    documentId: string,
  ): Promise<WorkflowExecution | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/documents/${documentId}`,
      );
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.workflowExecution || null;
    } catch (error) {
      console.error("Error fetching workflow execution:", error);
      return null;
    }
  }

  /**
   * Test workflow connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.error("Error testing workflow API connection:", error);
      return false;
    }
  }
}

export const workflowApi = new WorkflowApiService();
export default workflowApi;
