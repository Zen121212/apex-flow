import React, { useMemo, useState } from 'react';
import { useDocumentsList, useWorkflowOptions } from '../hooks/useDocuments';
import type { DocumentListFilters, DocumentItem } from '../../../types/documents';
import styles from './UploadDocuments.module.css';

const defaultPageSize = 10;

const UploadDocuments: React.FC = () => {
  const { data: workflowOptions } = useWorkflowOptions();

  const [filters, setFilters] = useState<DocumentListFilters>({
    page: 1,
    pageSize: defaultPageSize,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const { data, isLoading, isError, refetch, isFetching } = useDocumentsList(filters);

  // Normalize response to avoid runtime errors when items is undefined
  const items: DocumentItem[] = (data && Array.isArray((data as any).items)) ? (data as any).items : [];
  const total = typeof (data as any)?.total === 'number' ? (data as any).total : items.length;
  const pageSize = typeof (data as any)?.pageSize === 'number' ? (data as any).pageSize : (filters.pageSize || defaultPageSize);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const onChange = <K extends keyof DocumentListFilters>(key: K, value: DocumentListFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value as number : 1 }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Documents</h1>
          <p>Browse and filter your uploaded documents</p>
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
          value={filters.category || ''}
          onChange={(e) => onChange('category', e.target.value || undefined)}
        >
          <option value="">All categories</option>
          {workflowOptions?.categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.workflowId || ''}
          onChange={(e) => onChange('workflowId', e.target.value || undefined)}
        >
          <option value="">All workflows</option>
          {workflowOptions?.workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.status || ''}
          onChange={(e) => onChange('status', (e.target.value || undefined) as any)}
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
            onChange={(e) => onChange('sortBy', e.target.value as any)}
          >
            <option value="createdAt">Newest</option>
            <option value="updatedAt">Recently updated</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
          <select
            className={styles.select}
            value={filters.sortDir || 'desc'}
            onChange={(e) => onChange('sortDir', e.target.value as any)}
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
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>Workflow</th>
                  <th className={styles.th}>Uploaded</th>
                  <th className={styles.th}>Updated</th>
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
                      {doc.category ? (
                        <span className={styles.category}>{doc.category}</span>
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {doc.workflowId ? (
                        <span className={styles.workflow}>{doc.workflowId}</span>
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.dateTime}>
                        {new Date(doc.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {doc.updatedAt && doc.updatedAt !== doc.createdAt ? (
                        <span className={styles.dateTime}>
                          {new Date(doc.updatedAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
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
    </div>
  );
};

export default UploadDocuments;
