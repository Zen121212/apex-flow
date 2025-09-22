import React, { useState, useRef } from 'react';
import Button from '../../../components/atoms/Button/Button';
import { useUploadDocument } from '../hooks/useDocuments';
import { useWorkflows } from '../../workflows/hooks/useWorkflows';
import { documentAPI } from '../../../services/api/documents';
import type { WorkflowStep } from '../../../types/workflow';
import AIAnalysisModal from './AIAnalysisModal';
import './UploadModal.css';

interface UploadOptions {
  workflowId?: string;
}

interface WorkflowWithId {
  id?: string;
  _id?: string;
  name: string;
  steps: WorkflowStep[];
}

// FileAnalysis interface removed - not used

// UploadModalData interface removed - not used



interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesUploaded: (files: File[]) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onFilesUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    workflowId: undefined,
  });
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // TanStack Query hooks
  const { data: availableWorkflows = [], isLoading: loadingWorkflows } = useWorkflows();
  const uploadMutation = useUploadDocument();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };





  // Main upload handler - direct upload without Visual AI processing
  const handleUpload = async () => {
    if (!uploadOptions.workflowId) {
      alert('Please select a workflow before uploading documents.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload files directly without Visual AI processing
      const uploadPromises = selectedFiles.map(async (file) => {
        // Convert file to base64 for upload
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data:application/pdf;base64, prefix
            const base64Content = base64.split(',')[1] || base64;
            resolve(base64Content);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const uploadData = {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          content: fileContent,
          workflowId: uploadOptions.workflowId,
        };
        
        console.log('Direct upload without Visual AI processing:', {
          originalName: uploadData.originalName,
          mimeType: uploadData.mimeType,
          size: uploadData.size,
          workflowId: uploadData.workflowId
        });
        
        // Use the JSON upload method
        return uploadMutation.mutateAsync(uploadData);
      });
      
      const results = await Promise.all(uploadPromises);
      
      console.log('Direct upload completed:', results);
      
      // Auto-process documents and show AI analysis results
      setIsUploading(false);
      setIsProcessingAnalysis(true);
      
      try {
        // Wait a moment for documents to be saved
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Process documents for AI analysis
        const processPromises = results.map(async (result) => {
          if (result.documentId) {
            try {
              // Try the direct analysis endpoint
              const response = await fetch(`http://localhost:3000/api/documents/${result.documentId}/analyze-direct`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
        console.log(`AI analysis completed for document: ${result.documentId}`);
                return result.documentId;
              }
            } catch (processError) {
              console.warn(`Analysis failed for document ${result.documentId}:`, processError);
            }
          }
          return null;
        });
        
        const processedIds = (await Promise.all(processPromises)).filter(Boolean);
        
        if (processedIds.length > 0) {
          // Wait a bit more for analysis to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Fetch analysis results for the first processed document
          const firstProcessedId = processedIds[0];
          if (!firstProcessedId || typeof firstProcessedId !== 'string') {
            throw new Error('No valid processed document ID found');
          }
          const analysisResponse = await documentAPI.getDocumentAnalysis(firstProcessedId);
          const analysis = analysisResponse.analysis || {};
          
          // Transform to analysis modal format
          const transformedData = {
            files: results.map((result, index) => ({
              fileName: selectedFiles[index].name,
              originalFile: selectedFiles[index],
              documentType: analysis.documentType || 'Document',
              keyData: {
                invoice_number: analysis.invoice_number,
                vendor_info: analysis.vendor_info || {},
                customer_info: analysis.customer_info || {},
                date_info: analysis.date_info || {},
                financial_info: analysis.financial_info || {},
                payment_info: analysis.payment_info || {},
                line_items: analysis.line_items || [],
                serial_number: analysis.serial_number,
                ...analysis.structuredFields,
                documentType: analysis.documentType,
                confidence: analysis.confidence,
                extractionMethod: analysis.extractionMethod
              },
              confidence: analysis.confidence || 0.8,
              suggestedWorkflow: null,
              extractedText: analysisResponse.extractedText || '',
              metadata: {
                extractionConfidence: analysis.confidence || 0.8,
                extractionMethod: analysis.extractionMethod || 'Auto Analysis',
                documentType: analysis.documentType || 'Document',
                fieldsFound: Object.keys(analysis).length,
                totalFields: Object.keys(analysis).length,
                ...analysis
              },
              workflowId: uploadOptions.workflowId
            })),
            uploadOptions: uploadOptions,
            originalFiles: selectedFiles
          };
          
          setAnalysisData(transformedData);
          setShowAnalysisResults(true);
        } else {
          // No analysis results, just show success and close
          onFilesUploaded(selectedFiles);
          setSelectedFiles([]);
          onClose();
        }
        
      } catch (analysisError) {
        console.error('Post-upload analysis failed:', analysisError);
        // Still call success callback even if analysis fails
        onFilesUploaded(selectedFiles);
        setSelectedFiles([]);
        onClose();
      } finally {
        setIsProcessingAnalysis(false);
      }
      
    } catch (error) {
      console.error('Direct upload failed:', error);
      alert('Failed to upload documents. Please try again.');
      setSelectedFiles([]);
      setIsUploading(false);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAnalysisConfirm = async (editedData: Record<string, unknown>) => {
    console.log('Analysis results confirmed:', editedData);
    setShowAnalysisResults(false);
    setAnalysisData(null);
    onFilesUploaded(selectedFiles);
    setSelectedFiles([]);
    onClose();
  };

  const handleAnalysisCancel = () => {
    setShowAnalysisResults(false);
    setAnalysisData(null);
    onFilesUploaded(selectedFiles);
    setSelectedFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal-content upload-modal">
          <div className="modal-header">
            <h2>Upload Documents</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {/* AI Analysis Processing Indicator */}
            {isProcessingAnalysis && (
              <div className="ai-processing-indicator">
                <div className="processing-animation">
                  <div className="spinner"></div>
                </div>
                <h4>AI Processing AI Analysis...</h4>
                <p>Analyzing uploaded documents and extracting key data</p>
                <div className="processing-details">
                  <div className="processing-steps">
                    <div className="step active">
                      <span className="step-icon">✓</span>
                      <span>Documents uploaded successfully</span>
                    </div>
                    <div className="step active">
                      <span className="step-icon">→</span>
                      <span>Running AI analysis</span>
                    </div>
                    <div className="step">
                      <span className="step-icon">→</span>
                      <span>Preparing results</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isProcessingAnalysis && (
              <div 
                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    <path d="M12,11L16,15H13.5V19H10.5V15H8L12,11Z"/>
                  </svg>
                </div>
                <h3>Drag and drop your files here</h3>
                <p>or click to browse</p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            )}

          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files ({selectedFiles.length})</h4>
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="remove-file-btn"
                      disabled={isUploading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Selection */}
          <div className="workflow-options">
            <h4>Select Workflow</h4>
            
            <div className="workflow-selection">
              <label htmlFor="workflow-id">Choose Workflow (Required):</label>
              <select 
                id="workflow-id"
                value={uploadOptions.workflowId || ''}
                onChange={(e) => setUploadOptions(prev => ({ 
                  ...prev, 
                  workflowId: e.target.value || undefined
                }))}
                disabled={isUploading || loadingWorkflows}
              >
                <option value="">Select a workflow...</option>
                {availableWorkflows.map(workflow => {
                  // Handle both 'id' and '_id' fields for MongoDB compatibility
                  const workflowId = workflow.id || (workflow as WorkflowWithId)._id;
                  return (
                    <option key={workflowId} value={workflowId}>
                      ⚙ {workflow.name} ({workflow.steps.length} steps)
                    </option>
                  );
                })}
              </select>
              {loadingWorkflows && <small>Loading workflows...</small>}
              {!loadingWorkflows && availableWorkflows.length === 0 && <small>No workflows available</small>}
              {!loadingWorkflows && availableWorkflows.length > 0 && (
                <small>{availableWorkflows.length} workflow{availableWorkflows.length !== 1 ? 's' : ''} available</small>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <Button 
              onClick={onClose} 
              variant="secondary"
              disabled={isUploading || isProcessingAnalysis}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              variant="primary"
              disabled={selectedFiles.length === 0 || isUploading || isProcessingAnalysis || !uploadOptions.workflowId}
              loading={isUploading || isProcessingAnalysis}
            >
              {isProcessingAnalysis ? 'Processing Analysis...' : isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results Modal */}
      {showAnalysisResults && analysisData && (
        <AIAnalysisModal
          isOpen={showAnalysisResults}
          data={analysisData}
          onConfirm={handleAnalysisConfirm}
          onCancel={handleAnalysisCancel}
        />
      )}
    </>
  );
};

export default UploadModal;
