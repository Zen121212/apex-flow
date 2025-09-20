import React, { useState } from 'react';
import './AIAnalysisResults.css';

interface FileAnalysis {
  fileName: string;
  originalFile: File;
  documentType: string;
  keyData: any;
  confidence: number;
  suggestedWorkflow: any;
  extractedText: string;
  metadata: any;
  workflowId?: string;
  workflowName?: string;
}

interface AIAnalysisResultsProps {
  files: FileAnalysis[];
  isLoading?: boolean;
}

const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({
  files,
  isLoading = false
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="ai-results-container">
        <div className="ai-results-header">
          <h2>🤖 AI Analysis Results</h2>
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Analyzing documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="ai-results-container">
        <div className="ai-results-header">
          <h2>🤖 AI Analysis Results</h2>
          <div className="no-results">
            <p>No analysis results available</p>
          </div>
        </div>
      </div>
    );
  }

  const currentFile = files[selectedFileIndex];

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not available';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderKeyData = (keyData: any) => {
    if (!keyData || Object.keys(keyData).length === 0) {
      return (
        <div className="no-data">
          <p>No structured data was extracted from this document.</p>
        </div>
      );
    }

    const renderDynamicStructure = (obj: any, basePath: string[] = []) => {
      const elements: React.ReactElement[] = [];
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...basePath, key];
        const fieldKey = currentPath.join('.');
        
        if (value === null || value === undefined) {
          return;
        }
        
        // Handle arrays (like line items)
        if (Array.isArray(value)) {
          if (value.length > 0) {
            elements.push(
              <div key={fieldKey} className="array-section">
                <h4>{formatFieldLabel(key)} ({value.length} items)</h4>
                {value.map((item: any, index: number) => (
                  <div key={`${fieldKey}.${index}`} className="array-item">
                    <h5>{formatFieldLabel(key)} {index + 1}</h5>
                    <div className="array-item-fields">
                      {typeof item === 'object' ? 
                        renderDynamicStructure(item, [...currentPath, index.toString()]) :
                        <div className="field-value">{renderValue(item)}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
            );
          }
        }
        // Handle nested objects
        else if (typeof value === 'object') {
          const nestedElements = renderDynamicStructure(value, currentPath);
          if (nestedElements.length > 0) {
            elements.push(
              <div key={fieldKey} className="nested-section">
                <h4>{formatFieldLabel(key)}</h4>
                <div className="nested-fields">
                  {nestedElements}
                </div>
              </div>
            );
          }
        }
        // Handle primitive values
        else {
          elements.push(
            <div key={fieldKey} className="field-item">
              <label>{formatFieldLabel(key)}:</label>
              <div className="field-value">{renderValue(value)}</div>
            </div>
          );
        }
      });
      
      return elements;
    };
    
    const dynamicElements = renderDynamicStructure(keyData);
    
    if (dynamicElements.length === 0) {
      return (
        <div className="fallback-data">
          {Object.entries(keyData).map(([key, value]) => (
            <div key={key} className="field-item">
              <label>{formatFieldLabel(key)}:</label>
              <div className="field-value">{renderValue(value)}</div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="dynamic-data">
        {dynamicElements}
      </div>
    );
  };

  return (
    <div className="ai-results-container">
      {/* Header */}
      <div className="ai-results-header">
        <h2>🤖 AI Analysis Results</h2>
        <div className="analysis-summary">
          <span className="file-count">{files.length} file{files.length !== 1 ? 's' : ''} analyzed</span>
        </div>
      </div>

      {/* File Selector */}
      {files.length > 1 && (
        <div className="file-selector">
          <label>Select File:</label>
          <select 
            value={selectedFileIndex} 
            onChange={(e) => setSelectedFileIndex(parseInt(e.target.value))}
          >
            {files.map((file, index) => (
              <option key={index} value={index}>
                {file.fileName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Analysis Metrics */}
      <div className="analysis-metrics">
        <div className="metric">
          <div className="metric-label">Confidence</div>
          <div className="metric-value confidence">{formatConfidence(currentFile.confidence)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Document Type</div>
          <div className="metric-value">{currentFile.documentType || 'Unknown'}</div>
        </div>
        <div className="metric">
          <div className="metric-label">File Name</div>
          <div className="metric-value filename">{currentFile.fileName}</div>
        </div>
      </div>

      {/* Extracted Data */}
      <div className="extracted-data-section">
        <h3>📋 Extracted Data</h3>
        <div className="extracted-data">
          {renderKeyData(currentFile.keyData)}
        </div>
      </div>


      {/* Metadata */}
      {currentFile.metadata && Object.keys(currentFile.metadata).length > 0 && (
        <div className="metadata-section">
          <h3>📊 Analysis Metadata</h3>
          <div className="metadata">
            {Object.entries(currentFile.metadata).map(([key, value]) => (
              <div key={key} className="field-item">
                <label>{formatFieldLabel(key)}:</label>
                <div className="field-value">{renderValue(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisResults;
