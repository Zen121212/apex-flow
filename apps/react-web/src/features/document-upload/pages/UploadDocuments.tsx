import React, { useMemo, useState } from 'react';
import { useDocumentsList } from '../hooks/useDocuments';
import { documentAPI } from '../../../services/api/documents';
import type { DocumentListFilters, DocumentItem } from '../../../types/documents';
import AIAnalysisModal from '../components/AIAnalysisModal';
import styles from './UploadDocuments.module.css';

const defaultPageSize = 10;

const UploadDocuments: React.FC = () => {
  const [filters, setFilters] = useState<DocumentListFilters>({
    page: 1,
    pageSize: defaultPageSize,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  // AI Analysis Modal state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useDocumentsList(filters);

  // Normalize response to avoid runtime errors when items is undefined
  const items: DocumentItem[] = (data && 'items' in data && Array.isArray(data.items)) ? data.items : [];
  const total = (data && 'total' in data && typeof data.total === 'number') ? data.total : items.length;
  const pageSize = (data && 'pageSize' in data && typeof data.pageSize === 'number') ? data.pageSize : (filters.pageSize || defaultPageSize);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const onChange = <K extends keyof DocumentListFilters>(key: K, value: DocumentListFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value as number : 1 }));
  };

  // AI Analysis Modal handlers
  const handleViewAnalysis = async (doc: DocumentItem) => {
    setLoadingAnalysis(doc.id);
    try {
      console.log(`🔍 Fetching AI analysis for document: ${doc.originalName} (${doc.id})`);
      const analysisResponse = await documentAPI.getDocumentAnalysis(doc.id);
      console.log('📊 Analysis response:', analysisResponse);
      
      // Transform backend analysis data to match AIAnalysisModal format
      // Use the full analysis object as keyData since it contains the extracted fields
      const analysis = analysisResponse.analysis || {};
      
      const transformedData = {
        files: [{
          fileName: doc.originalName,
          originalFile: null, // Not needed for viewing existing results
          documentType: analysis.documentType || 'Document',
          // Use the entire analysis object as keyData - it contains all extracted fields
          keyData: {
            // Extract the main fields from analysis
            invoice_number: analysis.invoice_number,
            vendor_info: analysis.vendor_info || {},
            customer_info: analysis.customer_info || {},
            date_info: analysis.date_info || {},
            financial_info: analysis.financial_info || {},
            payment_info: analysis.payment_info || {},
            line_items: analysis.line_items || [],
            serial_number: analysis.serial_number,
            // Also include structuredFields if they exist
            ...analysis.structuredFields,
            // Include any other fields from the analysis
            documentType: analysis.documentType,
            confidence: analysis.confidence,
            extractionMethod: analysis.extractionMethod
          },
          confidence: analysis.confidence || 0.8,
          suggestedWorkflow: null,
          extractedText: analysisResponse.extractedText || '',
          metadata: {
            extractionConfidence: analysis.confidence || 0.8,
            extractionMethod: analysis.extractionMethod || 'Saved Analysis',
            documentType: analysis.documentType || 'Document',
            fieldsFound: Object.keys(analysis).length,
            totalFields: Object.keys(analysis).length,
            ...analysis
          }
        }],
        uploadOptions: {},
        originalFiles: []
      };
      
      console.log('🔧 Transformed data for modal:', transformedData);
      console.log('🔧 KeyData structure:', transformedData.files[0].keyData);
      
      setAnalysisData(transformedData);
      setShowAnalysisModal(true);
      
    } catch (error) {
      console.error('Failed to fetch document analysis:', error);
      alert('Failed to load AI analysis results. The document may not have been processed yet.');
    } finally {
      setLoadingAnalysis(null);
    }
  };

  const handleAnalysisModalClose = () => {
    setShowAnalysisModal(false);
    setAnalysisData(null);
  };

  const handleAnalysisModalConfirm = async (editedData: any) => {
    // TODO: Save the edited analysis data back to the backend
    console.log('🔄 Saving edited analysis data:', editedData);
    
    // For now, just close the modal
    // In the future, you could call an API to update the document's analysis data
    handleAnalysisModalClose();
  };

  const handleEditAnalysis = async (doc: DocumentItem) => {
    // Reuse the same logic as viewing analysis
    await handleViewAnalysis(doc);
  };

  const handleDownloadDocument = async (doc: DocumentItem) => {
    try {
      console.log(`📥 Downloading document: ${doc.originalName} (${doc.id})`);
      
      const blob = await documentAPI.downloadDocument(doc.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName || `document_${doc.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Download completed: ${doc.originalName}`);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleProcessDocument = async (doc: DocumentItem) => {
    setLoadingAnalysis(doc.id);
    try {
      console.log(`🔄 Processing document: ${doc.originalName} (${doc.id})`);
      
      // Try the new direct analysis endpoint first
      const response = await fetch(`http://localhost:3000/documents/${doc.id}/analyze-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log(`✅ Direct AI analysis completed for document: ${doc.id}`);
        alert('Document processed successfully! You can now view the AI analysis results.');
        // Refresh the document list to show updated status
        refetch();
      } else {
        // Fallback to regular processing
        const processResponse = await fetch(`http://localhost:3000/documents/${doc.id}/process`, {
          method: 'POST',
        });
        
        if (processResponse.ok) {
          console.log(`✅ Document queued for processing: ${doc.id}`);
          alert('Document queued for processing. Please wait a moment and then view the analysis results.');
        } else {
          throw new Error('Processing failed');
        }
      }
    } catch (error) {
      console.error('Failed to process document:', error);
      alert('Failed to process document. Please try again.');
    } finally {
      setLoadingAnalysis(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Uploads</h1>
          <p>Browse and manage your uploaded files</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => refetch()} disabled={isFetching}>↻ Refresh</button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search by name..."
          value={filters.query || ''}
          onChange={(e) => onChange('query', e.target.value || undefined)}
        />

        <select
          className={styles.select}
          value={filters.status || ''}
          onChange={(e) => onChange('status', (e.target.value || undefined) as DocumentListFilters['status'])}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <div className={styles.datesRow}>
          <label className={styles.dateLabel}>
            From
            <input
              className={styles.date}
              type="date"
              value={filters.from ? filters.from.slice(0,10) : ''}
              onChange={(e) => onChange('from', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            />
          </label>
          <label className={styles.dateLabel}>
            To
            <input
              className={styles.date}
              type="date"
              value={filters.to ? filters.to.slice(0,10) : ''}
              onChange={(e) => onChange('to', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            />
          </label>
        </div>

        <div className={styles.sortRow}>
          <select
            className={styles.select}
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => onChange('sortBy', e.target.value as DocumentListFilters['sortBy'])}
          >
            <option value="createdAt">Newest</option>
            <option value="updatedAt">Recently updated</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
          <select
            className={styles.select}
            value={filters.sortDir || 'desc'}
            onChange={(e) => onChange('sortDir', e.target.value as DocumentListFilters['sortDir'])}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className={styles.listContainer}>
        {isLoading ? (
          <div className={styles.state}>Loading documents…</div>
        ) : isError ? (
          <div className={styles.stateError}>Failed to load documents.</div>
        ) : items.length === 0 ? (
          <div className={styles.state}>No documents found.</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Document</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Size</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Uploaded</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((doc: DocumentItem) => (
                  <tr key={doc.id} className={styles.row}>
                    <td className={styles.td}>
                      <div className={styles.documentCell}>
                        <div className={styles.fileIcon}>📄</div>
                        <span className={styles.fileName} title={doc.originalName}>
                          {doc.originalName}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {doc.mimeType ? (
                        <span className={styles.mimeType}>{doc.mimeType}</span>
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {typeof doc.size === 'number' ? (
                        <span className={styles.fileSize}>{(doc.size/1024).toFixed(1)} KB</span>
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {doc.status ? (
                        <span className={`${styles.status} ${styles['status-' + doc.status]}`}>
                          {doc.status}
                        </span>
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.dateTime}>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleEditAnalysis(doc)}
                          disabled={loadingAnalysis === doc.id}
                          title="Edit extracted data"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleDownloadDocument(doc)}
                          title="Download PDF"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          disabled={(filters.page || 1) <= 1}
          onClick={() => onChange('page', (filters.page || 1) - 1)}
        >
          ‹ Prev
        </button>
        <span className={styles.pageInfo}>
          Page {filters.page || 1} of {totalPages}
        </span>
        <button
          className={styles.pageBtn}
          disabled={(filters.page || 1) >= totalPages}
          onClick={() => onChange('page', (filters.page || 1) + 1)}
        >
          Next ›
        </button>
      </div>

      {/* AI Analysis Modal */}
      {showAnalysisModal && analysisData && (
        <AIAnalysisModal
          isOpen={showAnalysisModal}
          data={analysisData}
          onConfirm={handleAnalysisModalConfirm}
          onCancel={handleAnalysisModalClose}
        />
      )}
    </div>
  );
};

export default UploadDocuments;
