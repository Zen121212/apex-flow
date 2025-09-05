import React, { useState, useRef, useEffect } from 'react';
import Button from '../../../components/atoms/Button/Button';
import { useWorkflowOptions, useUploadDocument } from '../hooks/useDocuments';
import { workflowApi } from '../../../services/workflowApi';
import './UploadModal.css';

interface UploadOptions {
  workflowId?: string;
  documentCategory?: string;
  autoDetectWorkflow: boolean;
  workflowSelectionMode: 'manual' | 'auto' | 'hybrid';
}

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
    workflowSelectionMode: 'hybrid',
    autoDetectWorkflow: true,
  });
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // TanStack Query hooks
  const { data: workflowOptions, isLoading: isLoadingOptions } = useWorkflowOptions();
  const uploadMutation = useUploadDocument();

  // Fetch available workflows when modal opens
  useEffect(() => {
    if (isOpen && availableWorkflows.length === 0) {
      const fetchWorkflows = async () => {
        try {
          setLoadingWorkflows(true);
          const workflows = await workflowApi.getWorkflows();
          setAvailableWorkflows(workflows);
        } catch (error) {
          console.error('Failed to fetch workflows:', error);
        } finally {
          setLoadingWorkflows(false);
        }
      };
      fetchWorkflows();
    }
  }, [isOpen, availableWorkflows.length]);

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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Upload each file using the document API
      const uploadPromises = selectedFiles.map(async (file) => {
        const uploadData = {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          content: 'simulated file content', // In real implementation, convert file to base64 or use multipart
          ...uploadOptions,
        };
        
        return uploadMutation.mutateAsync(uploadData);
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Show success results to user
      console.log('Upload results:', results);
      onFilesUploaded(selectedFiles);
      
    } catch (error) {
      console.error('Upload failed:', error);
      // Handle error - could show toast notification
    } finally {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content upload-modal">
        <div className="modal-header">
          <h2>Upload Documents</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div 
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className="upload-icon">📁</div>
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

          {/* Workflow Selection Options */}
          <div className="workflow-options">
            <h4>Workflow Selection</h4>
            
            <div className="workflow-mode">
              <label htmlFor="workflow-mode">Processing Mode:</label>
              <select 
                id="workflow-mode"
                value={uploadOptions.workflowSelectionMode}
                onChange={(e) => setUploadOptions(prev => ({ 
                  ...prev, 
                  workflowSelectionMode: e.target.value as 'manual' | 'auto' | 'hybrid' 
                }))}
                disabled={isUploading}
              >
                <option value="hybrid">Hybrid (Smart + Manual)</option>
                <option value="auto">Automatic Detection</option>
                <option value="manual">Manual Selection</option>
              </select>
              <small className="mode-description">
                {uploadOptions.workflowSelectionMode === 'hybrid' && 'AI analyzes documents, but you can override the selection'}
                {uploadOptions.workflowSelectionMode === 'auto' && 'AI automatically selects the best workflow based on document content'}
                {uploadOptions.workflowSelectionMode === 'manual' && 'You choose the exact workflow or category'}
              </small>
            </div>

            {uploadOptions.workflowSelectionMode !== 'auto' && (
              <>
                <div className="workflow-selection">
                  <label htmlFor="workflow-category">Document Category (optional):</label>
                  <select 
                    id="workflow-category"
                    value={uploadOptions.documentCategory || ''}
                    onChange={(e) => setUploadOptions(prev => ({ 
                      ...prev, 
                      documentCategory: e.target.value || undefined,
                      workflowId: undefined // Clear workflow ID when category changes
                    }))}
                    disabled={isUploading || isLoadingOptions}
                  >
                    <option value="">Auto-detect category</option>
                    {workflowOptions?.categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} - {category.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="workflow-selection">
                  <label htmlFor="workflow-id">Choose Specific Workflow:</label>
                  <select 
                    id="workflow-id"
                    value={uploadOptions.workflowId || ''}
                    onChange={(e) => setUploadOptions(prev => ({ 
                      ...prev, 
                      workflowId: e.target.value || undefined,
                      documentCategory: undefined // Clear category when specific workflow is selected
                    }))}
                    disabled={isUploading || loadingWorkflows}
                  >
                    <option value="">Auto-select workflow</option>
                    {availableWorkflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        🔧 {workflow.name} ({workflow.steps.length} steps)
                      </option>
                    ))}
                  </select>
                  {loadingWorkflows && <small>Loading workflows...</small>}
                  {!loadingWorkflows && availableWorkflows.length === 0 && <small>No workflows available</small>}
                  {!loadingWorkflows && availableWorkflows.length > 0 && (
                    <small>{availableWorkflows.length} workflow{availableWorkflows.length !== 1 ? 's' : ''} available</small>
                  )}
                </div>
                
                {/* Show workflow details when one is selected */}
                {uploadOptions.workflowId && (
                  <div className="selected-workflow-info">
                    {(() => {
                      const selectedWorkflow = availableWorkflows.find(w => w.id === uploadOptions.workflowId);
                      if (!selectedWorkflow) return null;
                      
                      return (
                        <div className="workflow-details">
                          <h5>📋 Workflow: {selectedWorkflow.name}</h5>
                          <p><strong>Steps ({selectedWorkflow.steps.length}):</strong></p>
                          <ol className="workflow-steps">
                            {selectedWorkflow.steps.map((step: any, index: number) => (
                              <li key={index}>
                                <span className="step-name">{step.name}</span>
                                <span className="step-type">({step.type})</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      );
                    })()} 
                  </div>
                )}
              </>
            )}

            {uploadOptions.workflowSelectionMode === 'hybrid' && (
              <div className="auto-detect-option">
                <label>
                  <input
                    type="checkbox"
                    checked={uploadOptions.autoDetectWorkflow}
                    onChange={(e) => setUploadOptions(prev => ({ 
                      ...prev, 
                      autoDetectWorkflow: e.target.checked 
                    }))}
                    disabled={isUploading}
                  />
                  Enable AI validation (recommended)
                </label>
                <small>AI will verify your manual selection and suggest alternatives if needed</small>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button 
              onClick={onClose} 
              variant="secondary"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              variant="primary"
              disabled={selectedFiles.length === 0 || isUploading}
              loading={isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
