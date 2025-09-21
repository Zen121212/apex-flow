import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../../../../entities/document.entity';
import { WorkflowService } from '../core/workflow.service';
import { HuggingFaceClientService } from '../../../../services/ai/huggingface-client.service';

interface WorkflowMapping {
  category: string;
  workflowName: string; // Changed from workflowId to workflowName
  description: string;
  priority: number;
}

export interface WorkflowSelectionResult {
  workflowId: string | null;
  method: 'manual' | 'auto' | 'hybrid' | 'default';
  confidence: number;
  reason: string;
  alternativeWorkflows?: string[];
}

@Injectable()
export class WorkflowSelectorService {
  private readonly logger = new Logger(WorkflowSelectorService.name);
  
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly huggingFaceClient: HuggingFaceClientService
  ) {}

  // Mapping of document categories to workflow names (will resolve to IDs at runtime)
  private readonly categoryWorkflowMapping: WorkflowMapping[] = [
    {
      category: 'invoice',
      workflowName: 'Invoice Processing Workflow',
      description: 'Advanced AI-first invoice processing with intelligent field extraction and financial analysis',
      priority: 100
    },
    {
      category: 'contract',
      workflowName: 'Contract Analysis Workflow',
      description: 'Contract analysis with legal term extraction and compliance checking',
      priority: 95
    },
    {
      category: 'receipt',
      workflowName: 'Receipt Processing Workflow',
      description: 'Receipt processing for expense tracking and reporting',
      priority: 80
    },
    {
      category: 'legal',
      workflowName: 'Legal Document Workflow',
      description: 'Legal document processing with confidentiality and compliance checks',
      priority: 90
    },
    {
      category: 'financial',
      workflowName: 'Financial Analysis Workflow',
      description: 'Financial document analysis with data extraction and reporting',
      priority: 85
    },
    {
      category: 'form',
      workflowName: 'Form Processing Workflow',
      description: 'Form processing with field extraction and validation',
      priority: 75
    },
    {
      category: 'other',
      workflowName: 'Document Processing Workflow',
      description: 'General document processing workflow',
      priority: 10
    }
  ];

  /**
   * Main workflow selection method - handles all three modes
   */
  async selectWorkflow(
    document: Document,
    options: {
      workflowId?: string;
      documentCategory?: string;
      autoDetectWorkflow?: boolean;
      workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
    }
  ): Promise<WorkflowSelectionResult> {
    
    const mode = options.workflowSelectionMode || 'hybrid';
    this.logger.log(`Selecting workflow for ${document.originalName} using ${mode} mode`);

    switch (mode) {
      case 'manual':
        return this.selectWorkflowManually(document, options);
      
      case 'auto':
        return this.selectWorkflowAutomatically(document);
      
      case 'hybrid':
        return this.selectWorkflowHybrid(document, options);
      
      default:
        return this.selectDefaultWorkflow(document);
    }
  }

  /**
   * Mode 1: Manual Selection - User specifies exactly what they want
   */
  private async selectWorkflowManually(
    document: Document,
    options: { workflowId?: string; documentCategory?: string }
  ): Promise<WorkflowSelectionResult> {
    
    // Option 1a: Direct workflow ID provided
    if (options.workflowId) {
      const isValid = await this.validateWorkflowId(options.workflowId);
      if (isValid) {
        return {
          workflowId: options.workflowId,
          method: 'manual',
          confidence: 1.0,
          reason: `User explicitly specified workflow: ${options.workflowId}`
        };
      } else {
        this.logger.warn(`Invalid workflow ID provided: ${options.workflowId}`);
        return this.selectDefaultWorkflow(document, 'Invalid workflow ID provided');
      }
    }

    // Option 1b: Document category provided
    if (options.documentCategory) {
      const mapping = this.categoryWorkflowMapping.find(m => m.category === options.documentCategory);
      if (mapping) {
        // Resolve workflow name to actual ID
        const workflowId = await this.findWorkflowByName(mapping.workflowName);
        if (workflowId) {
          return {
            workflowId,
            method: 'manual',
            confidence: 0.95,
            reason: `User specified document category: ${options.documentCategory} → ${mapping.workflowName} (ID: ${workflowId})`
          };
        } else {
          this.logger.warn(`Workflow not found for category ${options.documentCategory}: ${mapping.workflowName}`);
          return this.selectDefaultWorkflow(document, `Workflow not found: ${mapping.workflowName}`);
        }
      } else {
        this.logger.warn(`Unknown document category: ${options.documentCategory}`);
        return this.selectDefaultWorkflow(document, 'Unknown document category');
      }
    }

    // No manual selection provided
    return this.selectDefaultWorkflow(document, 'No manual selection provided');
  }

  /**
   * Mode 2: Automatic Selection - AI analyzes the document
   */
  private async selectWorkflowAutomatically(document: Document): Promise<WorkflowSelectionResult> {
    this.logger.log(`Auto-detecting workflow for: ${document.originalName}`);
    
    // Simulate AI analysis based on filename and MIME type
    const detectedCategory = await this.detectDocumentCategory(document);
    
    if (detectedCategory.category !== 'unknown') {
      const mapping = this.categoryWorkflowMapping.find(m => m.category === detectedCategory.category);
      if (mapping) {
        // Resolve workflow name to actual ID
        const workflowId = await this.findWorkflowByName(mapping.workflowName);
        if (workflowId) {
          return {
            workflowId,
            method: 'auto',
            confidence: detectedCategory.confidence,
            reason: `AI detected document type: ${detectedCategory.category} → ${mapping.workflowName} (${Math.round(detectedCategory.confidence * 100)}% confidence)`
          };
        } else {
          this.logger.warn(`Auto-detection found category ${detectedCategory.category} but workflow not found: ${mapping.workflowName}`);
        }
      }
    }

    return this.selectDefaultWorkflow(document, 'AI could not confidently detect document type');
  }

  /**
   * Mode 3: Hybrid Selection - Combines user hints with AI validation
   */
  private async selectWorkflowHybrid(
    document: Document,
    options: { workflowId?: string; documentCategory?: string; autoDetectWorkflow?: boolean }
  ): Promise<WorkflowSelectionResult> {
    
    // First try manual selection if provided
    if (options.workflowId || options.documentCategory) {
      const manualResult = await this.selectWorkflowManually(document, options);
      
      // If auto-detection is enabled, validate the manual choice
      if (options.autoDetectWorkflow !== false) {
        const autoResult = await this.selectWorkflowAutomatically(document);
        
        if (autoResult.workflowId && autoResult.workflowId !== manualResult.workflowId) {
          // Conflict detected - choose based on confidence
          if (autoResult.confidence > 0.8) {
            return {
              workflowId: autoResult.workflowId,
              method: 'hybrid',
              confidence: autoResult.confidence,
              reason: `AI override: Detected ${autoResult.reason} (overriding manual selection)`,
              alternativeWorkflows: [manualResult.workflowId!]
            };
          } else {
            return {
              workflowId: manualResult.workflowId,
              method: 'hybrid',
              confidence: manualResult.confidence,
              reason: `Manual selection confirmed: ${manualResult.reason} (AI confidence too low to override)`,
              alternativeWorkflows: [autoResult.workflowId]
            };
          }
        }
      }
      
      return {
        ...manualResult,
        method: 'hybrid'
      };
    }
    
    // No manual selection, fall back to auto-detection
    const autoResult = await this.selectWorkflowAutomatically(document);
    return {
      ...autoResult,
      method: 'hybrid'
    };
  }

  /**
   * Default workflow selection
   */
  private selectDefaultWorkflow(document: Document, reason?: string): WorkflowSelectionResult {
    return {
      workflowId: 'demo-workflow-1',
      method: 'default',
      confidence: 0.5,
      reason: reason || 'Using default workflow'
    };
  }

  /**
   * Simulate AI document category detection
   */
  private async detectDocumentCategory(document: Document): Promise<{
    category: string;
    confidence: number;
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const filename = document.originalName?.toLowerCase() || '';
    const mimeType = document.mimeType?.toLowerCase() || '';
    
    this.logger.debug(`🔍 Analyzing document: ${filename}`, {
      filename,
      mimeType,
      size: document.size
    });
    
    // Simple rule-based detection (in real implementation, use AI)
    if (filename.includes('invoice') || filename.includes('inv-') || filename.includes('bill')) {
      this.logger.debug(`✅ Invoice pattern detected in filename: ${filename}`);
      return { category: 'invoice', confidence: 0.9 };
    }
    
    if (filename.includes('contract') || filename.includes('agreement') || filename.includes('nda')) {
      this.logger.debug(`✅ Contract pattern detected in filename: ${filename}`);
      return { category: 'contract', confidence: 0.85 };
    }
    
    if (filename.includes('receipt') || filename.includes('rcp-')) {
      this.logger.debug(`✅ Receipt pattern detected in filename: ${filename}`);
      return { category: 'receipt', confidence: 0.8 };
    }
    
    if (filename.includes('legal') || filename.includes('terms')) {
      this.logger.debug(`✅ Legal pattern detected in filename: ${filename}`);
      return { category: 'legal', confidence: 0.75 };
    }
    
    if (filename.includes('financial') || filename.includes('statement') || filename.includes('report')) {
      this.logger.debug(`✅ Financial pattern detected in filename: ${filename}`);
      return { category: 'financial', confidence: 0.7 };
    }
    
    if (filename.includes('form') || filename.includes('application')) {
      this.logger.debug(`✅ Form pattern detected in filename: ${filename}`);
      return { category: 'form', confidence: 0.65 };
    }
    
    // MIME type based detection
    if (mimeType === 'application/pdf' && document.size && document.size > 1000000) {
      this.logger.debug(`📄 Large PDF detected (${document.size} bytes), categorizing as legal`);
      return { category: 'legal', confidence: 0.6 }; // Large PDFs often legal documents
    }
    
    this.logger.debug(`❓ No specific pattern detected, using 'unknown' category`);
    return { category: 'unknown', confidence: 0.3 };
  }

  /**
   * Validate if a workflow ID exists
   */
  private async validateWorkflowId(workflowId: string): Promise<boolean> {
    try {
      // Actually check against the database
      const workflow = await this.workflowService.getWorkflowById(workflowId);
      return !!workflow;
    } catch {
      return false;
    }
  }
  
  /**
   * Find workflow by name (for backward compatibility)
   */
  private async findWorkflowByName(name: string): Promise<string | null> {
    try {
      const workflows = await this.workflowService.getWorkflows({ search: name });
      const exact = workflows.find(w => w.name.toLowerCase() === name.toLowerCase());
      return exact ? exact.id : null;
    } catch {
      return null;
    }
  }

  /**
   * Get available workflows and categories for frontend
   */
  async getAvailableOptions(): Promise<{
    workflows: Array<{ id: string; name: string; description: string }>;
    categories: Array<{ id: string; name: string; workflowId: string; description: string }>;
  }> {
    return {
      workflows: [
        { id: 'demo-workflow-1', name: 'General Processing', description: 'Basic document processing workflow with Visual AI' },
        { id: 'invoice-processing-workflow', name: 'Invoice Processing', description: 'Advanced invoice processing with Visual AI and intelligent field extraction' },
        { id: 'contract-analysis-workflow', name: 'Contract Analysis', description: 'Legal contract analysis and term extraction using Visual AI' },
        { id: 'receipt-processing-workflow', name: 'Receipt Processing', description: 'Receipt processing for expense tracking with Visual AI' },
        { id: 'legal-document-workflow', name: 'Legal Documents', description: 'Legal document processing with compliance checks using Visual AI' },
        { id: 'financial-analysis-workflow', name: 'Financial Analysis', description: 'Financial document analysis and reporting powered by Visual AI' },
        { id: 'form-processing-workflow', name: 'Form Processing', description: 'Form processing with Visual AI field extraction' }
      ],
      categories: this.categoryWorkflowMapping.map(m => ({
        id: m.category,
        name: m.category.charAt(0).toUpperCase() + m.category.slice(1),
        workflowId: m.workflowName, // Use workflowName instead of workflowId
        description: m.description
      }))
    };
  }
}
