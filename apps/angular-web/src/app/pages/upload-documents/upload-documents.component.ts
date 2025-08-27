import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProcessingDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedData?: any;
  error?: string;
  uploadedAt: Date;
  processedAt?: Date;
  workflowUsed?: string;
}

@Component({
  selector: 'app-upload-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-documents-container">
      <div class="page-header">
        <h1>📄 Upload Documents</h1>
        <p>Upload documents for automated processing and data extraction</p>
      </div>

      <!-- Upload Area -->
      <div class="upload-section">
        <div 
          class="upload-area" 
          [class.drag-over]="isDragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="openFileDialog()"
        >
          <div class="upload-content">
            <div class="upload-icon">📁</div>
            <h3>Drag and drop files here</h3>
            <p>or <span class="browse-link">browse to choose files</span></p>
            <div class="supported-formats">
              <small>Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG</small>
            </div>
          </div>
        </div>
        
        <input 
          #fileInput 
          type="file" 
          multiple 
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          (change)="onFileSelect($event)"
          style="display: none;"
        />
      </div>

      <!-- Processing Queue -->
      <div class="processing-section" *ngIf="documents().length > 0">
        <div class="section-header">
          <h2>Processing Queue</h2>
          <div class="queue-stats">
            <span class="stat">
              <span class="stat-number">{{ getDocumentsByStatus('processing').length }}</span>
              <span class="stat-label">Processing</span>
            </span>
            <span class="stat">
              <span class="stat-number">{{ getDocumentsByStatus('completed').length }}</span>
              <span class="stat-label">Completed</span>
            </span>
            <span class="stat">
              <span class="stat-number">{{ getDocumentsByStatus('error').length }}</span>
              <span class="stat-label">Errors</span>
            </span>
          </div>
        </div>

        <div class="documents-list">
          <div 
            class="document-item" 
            *ngFor="let doc of documents()" 
            [class]="'status-' + doc.status"
          >
            <div class="document-info">
              <div class="document-icon">{{ getFileIcon(doc.type) }}</div>
              <div class="document-details">
                <h4>{{ doc.name }}</h4>
                <p class="document-meta">
                  {{ formatFileSize(doc.size) }} • 
                  {{ formatDate(doc.uploadedAt) }}
                  <span *ngIf="doc.workflowUsed"> • {{ doc.workflowUsed }}</span>
                </p>
              </div>
            </div>

            <div class="document-status">
              <div class="status-indicator" [ngSwitch]="doc.status">
                <div *ngSwitchCase="'uploading'" class="status-uploading">
                  <div class="spinner"></div>
                  <span>Uploading...</span>
                </div>
                <div *ngSwitchCase="'processing'" class="status-processing">
                  <div class="spinner"></div>
                  <span>Processing...</span>
                </div>
                <div *ngSwitchCase="'completed'" class="status-completed">
                  <div class="check-icon">✓</div>
                  <span>Completed</span>
                </div>
                <div *ngSwitchCase="'error'" class="status-error">
                  <div class="error-icon">⚠</div>
                  <span>Error</span>
                </div>
              </div>

              <div class="progress-bar" *ngIf="doc.status === 'uploading' || doc.status === 'processing'">
                <div class="progress-fill" [style.width.%]="doc.progress"></div>
              </div>
            </div>

            <div class="document-actions">
              <button 
                class="btn btn-small btn-secondary" 
                *ngIf="doc.status === 'completed'"
                (click)="viewResults(doc)"
              >
                View Results
              </button>
              <button 
                class="btn btn-small btn-secondary" 
                *ngIf="doc.status === 'error'"
                (click)="retryProcessing(doc)"
              >
                Retry
              </button>
              <button 
                class="btn btn-small btn-danger" 
                (click)="removeDocument(doc.id)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Modal -->
      <div class="modal-overlay" [class.visible]="selectedDocument()" (click)="closeResults()">
        <div class="modal-content" (click)="$event.stopPropagation()" *ngIf="selectedDocument()">
          <div class="modal-header">
            <h3>Extracted Data - {{ selectedDocument()?.name }}</h3>
            <button class="close-btn" (click)="closeResults()">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="extracted-data" *ngIf="selectedDocument()?.extractedData">
              <div class="data-section">
                <h4>Document Information</h4>
                <div class="data-grid">
                  <div class="data-item" *ngFor="let item of getExtractedDataEntries(selectedDocument()?.extractedData)">
                    <label>{{ formatFieldName(item.key) }}:</label>
                    <span>{{ item.value }}</span>
                  </div>
                </div>
              </div>
              
              <div class="actions-taken" *ngIf="selectedDocument()?.workflowUsed">
                <h4>Actions Taken</h4>
                <div class="action-list">
                  <div class="action-item">
                    <span class="action-icon">💾</span>
                    <span>Data saved to database</span>
                  </div>
                  <div class="action-item">
                    <span class="action-icon">💬</span>
                    <span>Notification sent to Slack</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="exportData(selectedDocument())">
              Export Data
            </button>
            <button class="btn btn-primary" (click)="closeResults()">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="documents().length === 0">
        <div class="empty-icon">📄</div>
        <h3>No documents uploaded yet</h3>
        <p>Upload your first document to get started with automated processing</p>
      </div>
    </div>
  `,
  styles: [`
    .upload-documents-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
      color: #111827;
    }

    .page-header p {
      margin: 0;
      color: #6b7280;
      font-size: 1rem;
    }

    /* Upload Section */
    .upload-section {
      margin-bottom: 3rem;
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #f9fafb;
    }

    .upload-area:hover,
    .upload-area.drag-over {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .upload-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .upload-content h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #374151;
    }

    .upload-content p {
      margin: 0 0 1rem 0;
      color: #6b7280;
    }

    .browse-link {
      color: #667eea;
      font-weight: 500;
    }

    .supported-formats {
      color: #9ca3af;
      font-size: 0.875rem;
    }

    /* Processing Section */
    .processing-section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    .queue-stats {
      display: flex;
      gap: 2rem;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Document List */
    .documents-list {
      display: grid;
      gap: 1rem;
    }

    .document-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .document-item:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .document-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .document-icon {
      font-size: 2rem;
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .document-details h4 {
      margin: 0 0 0.25rem 0;
      font-weight: 500;
      color: #374151;
    }

    .document-meta {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Status Indicators */
    .document-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      min-width: 120px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .status-completed {
      color: #10b981;
    }

    .status-error {
      color: #ef4444;
    }

    .status-processing,
    .status-uploading {
      color: #667eea;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .check-icon,
    .error-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .progress-bar {
      width: 100px;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #667eea;
      transition: width 0.3s ease;
    }

    /* Document Actions */
    .document-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-small {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn-danger:hover {
      background: #fecaca;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #f3f4f6;
    }

    .modal-body {
      padding: 2rem;
    }

    .data-section {
      margin-bottom: 2rem;
    }

    .data-section h4 {
      margin: 0 0 1rem 0;
      font-weight: 500;
      color: #374151;
    }

    .data-grid {
      display: grid;
      gap: 1rem;
    }

    .data-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .data-item label {
      font-weight: 500;
      color: #374151;
    }

    .data-item span {
      color: #6b7280;
    }

    .actions-taken h4 {
      margin: 0 0 1rem 0;
      font-weight: 500;
      color: #374151;
    }

    .action-list {
      display: grid;
      gap: 0.75rem;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f0fdf4;
      border-radius: 6px;
      color: #166534;
    }

    .action-icon {
      font-size: 1.125rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
    }
  `]
})
export class UploadDocumentsComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  private documentsSignal = signal<ProcessingDocument[]>([]);
  private dragOverSignal = signal(false);
  private selectedDocumentSignal = signal<ProcessingDocument | null>(null);
  
  documents = this.documentsSignal.asReadonly();
  isDragOver = this.dragOverSignal.asReadonly();
  selectedDocument = this.selectedDocumentSignal.asReadonly();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOverSignal.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOverSignal.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOverSignal.set(false);
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  private processFiles(files: File[]): void {
    files.forEach(file => {
      const document: ProcessingDocument = {
        id: this.generateId(),
        name: file.name,
        size: file.size,
        type: file.type || this.getTypeFromExtension(file.name),
        status: 'uploading',
        progress: 0,
        uploadedAt: new Date()
      };

      this.documentsSignal.update(docs => [...docs, document]);
      this.simulateProcessing(document.id);
    });
  }

  private simulateProcessing(documentId: string): void {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      this.documentsSignal.update(docs => 
        docs.map(doc => {
          if (doc.id === documentId && doc.status === 'uploading') {
            const newProgress = Math.min(doc.progress + Math.random() * 30, 100);
            
            if (newProgress >= 100) {
              clearInterval(uploadInterval);
              this.startProcessingSimulation(documentId);
              return { ...doc, status: 'processing' as const, progress: 0 };
            }
            
            return { ...doc, progress: newProgress };
          }
          return doc;
        })
      );
    }, 200);
  }

  private startProcessingSimulation(documentId: string): void {
    const processingInterval = setInterval(() => {
      this.documentsSignal.update(docs => 
        docs.map(doc => {
          if (doc.id === documentId && doc.status === 'processing') {
            const newProgress = Math.min(doc.progress + Math.random() * 25, 100);
            
            if (newProgress >= 100) {
              clearInterval(processingInterval);
              // Simulate some documents failing (10% chance)
              const shouldFail = Math.random() < 0.1;
              
              if (shouldFail) {
                return { 
                  ...doc, 
                  status: 'error' as const, 
                  error: 'Failed to process document. Please try again.',
                  progress: 100 
                };
              } else {
                return { 
                  ...doc, 
                  status: 'completed' as const, 
                  progress: 100,
                  processedAt: new Date(),
                  workflowUsed: 'Invoice Processing',
                  extractedData: this.generateMockData(doc.name)
                };
              }
            }
            
            return { ...doc, progress: newProgress };
          }
          return doc;
        })
      );
    }, 300);
  }

  private generateMockData(fileName: string): any {
    if (fileName.toLowerCase().includes('invoice')) {
      return {
        document_type: 'Invoice',
        vendor_name: 'ABC Company Inc.',
        invoice_number: 'INV-2024-001',
        amount: '$5,247.50',
        date: '2024-01-15',
        due_date: '2024-02-15',
        customer: 'XYZ Corp'
      };
    } else {
      return {
        document_type: 'Document',
        title: fileName.replace(/\.[^/.]+$/, ''),
        date_processed: new Date().toISOString().split('T')[0],
        pages: '3',
        language: 'English'
      };
    }
  }

  getDocumentsByStatus(status: string): ProcessingDocument[] {
    return this.documents().filter(doc => doc.status === status);
  }

  getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return '🖼️';
    if (type.includes('text')) return '📃';
    return '📄';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  viewResults(document: ProcessingDocument): void {
    this.selectedDocumentSignal.set(document);
  }

  closeResults(): void {
    this.selectedDocumentSignal.set(null);
  }

  retryProcessing(document: ProcessingDocument): void {
    this.documentsSignal.update(docs =>
      docs.map(doc => {
        if (doc.id === document.id) {
          const updatedDoc = { ...doc, status: 'uploading' as const, progress: 0, error: undefined };
          this.simulateProcessing(doc.id);
          return updatedDoc;
        }
        return doc;
      })
    );
  }

  removeDocument(documentId: string): void {
    this.documentsSignal.update(docs => docs.filter(doc => doc.id !== documentId));
  }

  exportData(doc: ProcessingDocument | null): void {
    if (!doc?.extractedData) return;
    
    const data = JSON.stringify(doc.extractedData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.name}_extracted_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getExtractedDataEntries(data: any): Array<{key: string, value: any}> {
    return Object.entries(data || {}).map(([key, value]) => ({ key, value }));
  }

  formatFieldName(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getTypeFromExtension(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': case 'docx': return 'application/msword';
      case 'txt': return 'text/plain';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      default: return 'application/octet-stream';
    }
  }
}
