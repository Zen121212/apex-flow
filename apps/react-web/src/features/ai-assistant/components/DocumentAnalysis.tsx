import React, { useState } from 'react';
import { Icon } from '../../../components/atoms/Icon/Icon';
import Button from '../../../components/atoms/Button/Button';
import type { DocumentAnalysis as Analysis, DocumentReference } from '../types/index';
import styles from './DocumentAnalysis.module.css';

interface DocumentAnalysisProps {
  availableDocuments: DocumentReference[];
  activeAnalyses: Analysis[];
  onStartAnalysis: (documentIds: string[], analysisType: Analysis['analysisType']) => void;
  onViewAnalysis: (analysisId: string) => void;
}

const DocumentAnalysis: React.FC<DocumentAnalysisProps> = ({
  availableDocuments,
  activeAnalyses,
  onStartAnalysis,
  onViewAnalysis
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [analysisType, setAnalysisType] = useState<Analysis['analysisType']>('comparison');

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleStartAnalysis = () => {
    if (selectedDocuments.length >= 2) {
      onStartAnalysis(selectedDocuments, analysisType);
      setSelectedDocuments([]);
    }
  };

  const getAnalysisTypeIcon = (type: Analysis['analysisType']) => {
    switch (type) {
      case 'comparison': return 'git-compare';
      case 'summary': return 'file-text';
      case 'extraction': return 'search';
      case 'trend': return 'trend-up';
      default: return 'file-text';
    }
  };

  const getStatusColor = (status: Analysis['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'warning';
    }
  };

  return (
    <div className={styles.documentAnalysis}>
      <div className={styles.analysisHeader}>
        <h3>Cross-Document Analysis</h3>
        <p>Compare and analyze multiple documents to extract insights</p>
      </div>

      {/* New Analysis Form */}
      <div className={styles.newAnalysisForm}>
        <div className={styles.formSection}>
          <h4>Select Analysis Type</h4>
          <div className={styles.analysisTypes}>
            <label className={styles.analysisTypeOption}>
              <input
                type="radio"
                name="analysisType"
                value="comparison"
                checked={analysisType === 'comparison'}
                onChange={(e) => setAnalysisType(e.target.value as Analysis['analysisType'])}
              />
              <div className={styles.optionContent}>
                <Icon name="git-compare" />
                <div>
                  <strong>Comparison</strong>
                  <span>Compare documents side by side</span>
                </div>
              </div>
            </label>
            
            <label className={styles.analysisTypeOption}>
              <input
                type="radio"
                name="analysisType"
                value="summary"
                checked={analysisType === 'summary'}
                onChange={(e) => setAnalysisType(e.target.value as Analysis['analysisType'])}
              />
              <div className={styles.optionContent}>
                <Icon name="file-text" />
                <div>
                  <strong>Summary</strong>
                  <span>Generate combined summary</span>
                </div>
              </div>
            </label>
            
            <label className={styles.analysisTypeOption}>
              <input
                type="radio"
                name="analysisType"
                value="extraction"
                checked={analysisType === 'extraction'}
                onChange={(e) => setAnalysisType(e.target.value as Analysis['analysisType'])}
              />
              <div className={styles.optionContent}>
                <Icon name="search" />
                <div>
                  <strong>Data Extraction</strong>
                  <span>Extract specific data points</span>
                </div>
              </div>
            </label>
            
            <label className={styles.analysisTypeOption}>
              <input
                type="radio"
                name="analysisType"
                value="trend"
                checked={analysisType === 'trend'}
                onChange={(e) => setAnalysisType(e.target.value as Analysis['analysisType'])}
              />
              <div className={styles.optionContent}>
                <Icon name="trend-up" />
                <div>
                  <strong>Trend Analysis</strong>
                  <span>Identify patterns over time</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.documentSelection}>
            <h4>Select Documents ({selectedDocuments.length} selected)</h4>
            <div className={styles.documentList}>
              {availableDocuments.map((doc) => (
                <label key={doc.id} className={styles.documentItem}>
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(doc.id)}
                    onChange={() => handleDocumentSelect(doc.id)}
                  />
                  <div className={styles.documentInfo}>
                    <Icon name="file" />
                    <span className={styles.documentTitle}>{doc.title}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleStartAnalysis}
            disabled={selectedDocuments.length < 2}
            icon={<Icon name="play" />}
          >
            Start Analysis
          </Button>
        </div>
      </div>

      {/* Active Analyses */}
      {activeAnalyses.length > 0 && (
        <div className={styles.activeAnalyses}>
          <h4>Recent Analyses</h4>
          <div className={styles.analysesList}>
            {activeAnalyses.map((analysis) => (
              <div key={analysis.id} className={styles.analysisCard}>
                <div className={styles.analysisHeader}>
                  <div className={styles.analysisInfo}>
                    <div className={styles.analysisTitle}>
                      <Icon name={getAnalysisTypeIcon(analysis.analysisType)} />
                      <span>{analysis.title}</span>
                    </div>
                    <div className={styles.analysisMeta}>
                      <span className={`${styles.status} ${styles[getStatusColor(analysis.status)]}`}>
                        {analysis.status}
                      </span>
                      <span className={styles.documentCount}>
                        {analysis.documentIds.length} documents
                      </span>
                      <span className={styles.createdDate}>
                        {analysis.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onViewAnalysis(analysis.id)}
                    disabled={analysis.status !== 'completed'}
                  >
                    <Icon name="eye" />
                    View Results
                  </Button>
                </div>
                
                {analysis.results && (
                  <div className={styles.analysisPreview}>
                    <p>{analysis.results.summary}</p>
                    {analysis.results.keyFindings.length > 0 && (
                      <div className={styles.keyFindings}>
                        <strong>Key Findings:</strong>
                        <ul>
                          {analysis.results.keyFindings.slice(0, 3).map((finding, index) => (
                            <li key={index}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysis;
