import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../../entities/document.entity';

interface WorkflowMapping {
  category: string;
  workflowId: string;
  description: string;
  priority: number;
}

interface WorkflowSelectionResult {
  workflowId: string | null;
  method: 'manual' | 'auto' | 'hybrid' | 'default';
  confidence: number;
  reason: string;
  alternativeWorkflows?: string[];
}

@Injectable()
export class WorkflowSelectorService {
  private readonly logger = new Logger(WorkflowSelectorService.name);

  // Mapping of document categories to workflows
  private readonly categoryWorkflowMapping: WorkflowMapping[] = [
    {
      category: 'invoice',
      workflowId: 'invoice-processing-workflow',
      description: 'Advanced invoice processing with OCR, field extraction, and accounting integration',
      priority: 100
    },
    {
      category: 'contract',
      workflowId: 'contract-analysis-workflow', 
      description: 'Contract analysis with legal term extraction and compliance checking',
      priority: 95
    },
    {
      category: 'receipt',
      workflowId: 'receipt-processing-workflow',
      description: 'Receipt processing for expense tracking and reporting',
      priority: 80
    },
    {
      category: 'legal',
      workflowId: 'legal-document-workflow',
      description: 'Legal document processing with confidentiality and compliance checks',
      priority: 90
    },
    {
      category: 'financial',
      workflowId: 'financial-analysis-workflow',
      description: 'Financial document analysis with data extraction and reporting',
      priority: 85
    },
    {
      category: 'form',
      workflowId: 'form-processing-workflow',
      description: 'Form processing with field extraction and validation',
      priority: 75
    },
    {
      category: 'other',
      workflowId: 'demo-workflow-1',
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
        return {
          workflowId: mapping.workflowId,
          method: 'manual',
          confidence: 0.95,
          reason: `User specified document category: ${options.documentCategory} → ${mapping.workflowId}`
        };
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
        return {
          workflowId: mapping.workflowId,
          method: 'auto',
          confidence: detectedCategory.confidence,
          reason: `AI detected document type: ${detectedCategory.category} (${Math.round(detectedCategory.confidence * 100)}% confidence)`
        };
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
    
    // Simple rule-based detection (in real implementation, use AI)
    if (filename.includes('invoice') || filename.includes('inv-') || filename.includes('bill')) {
      return { category: 'invoice', confidence: 0.9 };
    }
    
    if (filename.includes('contract') || filename.includes('agreement') || filename.includes('nda')) {
      return { category: 'contract', confidence: 0.85 };
    }
    
    if (filename.includes('receipt') || filename.includes('rcp-')) {
      return { category: 'receipt', confidence: 0.8 };
    }
    
    if (filename.includes('legal') || filename.includes('terms')) {
      return { category: 'legal', confidence: 0.75 };
    }
    
    if (filename.includes('financial') || filename.includes('statement') || filename.includes('report')) {
      return { category: 'financial', confidence: 0.7 };
    }
    
    if (filename.includes('form') || filename.includes('application')) {
      return { category: 'form', confidence: 0.65 };
    }
    
    // MIME type based detection
    if (mimeType === 'application/pdf' && document.size && document.size > 1000000) {
      return { category: 'legal', confidence: 0.6 }; // Large PDFs often legal documents
    }
    
    return { category: 'unknown', confidence: 0.3 };
  }

  /**
   * Validate if a workflow ID exists
   */
  private async validateWorkflowId(workflowId: string): Promise<boolean> {
    // In real implementation, check against workflow service
    const validWorkflows = [
      'demo-workflow-1',
      'invoice-processing-workflow',
      'contract-analysis-workflow',
      'receipt-processing-workflow',
      'legal-document-workflow',
      'financial-analysis-workflow',
      'form-processing-workflow'
    ];
    
    return validWorkflows.includes(workflowId);
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
        { id: 'demo-workflow-1', name: 'General Processing', description: 'Basic document processing workflow' },
        { id: 'invoice-processing-workflow', name: 'Invoice Processing', description: 'Advanced invoice processing with OCR and field extraction' },
        { id: 'contract-analysis-workflow', name: 'Contract Analysis', description: 'Legal contract analysis and term extraction' },
        { id: 'receipt-processing-workflow', name: 'Receipt Processing', description: 'Receipt processing for expense tracking' },
        { id: 'legal-document-workflow', name: 'Legal Documents', description: 'Legal document processing with compliance checks' },
        { id: 'financial-analysis-workflow', name: 'Financial Analysis', description: 'Financial document analysis and reporting' },
        { id: 'form-processing-workflow', name: 'Form Processing', description: 'Form processing with field extraction' }
      ],
      categories: this.categoryWorkflowMapping.map(m => ({
        id: m.category,
        name: m.category.charAt(0).toUpperCase() + m.category.slice(1),
        workflowId: m.workflowId,
        description: m.description
      }))
    };
  }
}
