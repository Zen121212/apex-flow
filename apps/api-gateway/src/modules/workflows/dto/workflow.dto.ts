// Workflow DTOs for API requests/responses

export class CreateWorkflowDto {
  name: string;
  description?: string;
  steps: any[];
  status?: string;
  trigger?: any;
  metadata?: any;
  createdBy?: string;
  isTemplate?: boolean;
  templateOf?: string;
}

export class UpdateWorkflowDto {
  name?: string;
  description?: string;
  steps?: any[];
  status?: string;
  trigger?: any;
  metadata?: any;
  isTemplate?: boolean;
  templateOf?: string;
}

export class WorkflowFiltersDto {
  status?: string;
  createdBy?: string;
  category?: string;
  isTemplate?: boolean;
  search?: string;
}
