import { Component, EventEmitter, Input, Output, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UploadFile {
  file: File;
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

interface WorkflowOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./upload-modal.component.css'],
  template: `
    <div class="modal-overlay" [class.visible]="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Upload Documents</h2>
          <button class="close-btn" (click)="onClose()">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Upload Area -->
          <div class="upload-section" *ngIf="uploadFiles().length === 0">
            <div 
              class="upload-zone"
              [class.drag-over]="isDragOver()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              (click)="openFileDialog()"
            >
              <div class="upload-icon">📁</div>
              <h3>Drag and drop files here</h3>
              <p>or click to browse files</p>
              <div class="supported-formats">
                <span class="format">PDF</span>
                <span class="format">DOC</span>
                <span class="format">DOCX</span>
                <span class="format">TXT</span>
                <span class="format">JPG</span>
                <span class="format">PNG</span>
              </div>
            </div>
            <input 
              #fileInput
              type="file" 
              multiple 
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              (change)="onFileSelected($event)"
              style="display: none;"
            />
          </div>

          <!-- File List -->
          <div class="files-section" *ngIf="uploadFiles().length > 0">
            <div class="files-header">
              <h3>Selected Files ({{ uploadFiles().length }})</h3>
              <button class="btn btn-secondary btn-sm" (click)="clearFiles()">Clear All</button>
            </div>
            
            <div class="files-list">
              <div class="file-item" *ngFor="let file of uploadFiles(); trackBy: trackByFileId">
                <div class="file-icon">
                  <span [ngSwitch]="file.type">
                    <span *ngSwitchCase="'pdf'">📄</span>
                    <span *ngSwitchCase="'doc'">📝</span>
                    <span *ngSwitchCase="'docx'">📝</span>
                    <span *ngSwitchCase="'txt'">📄</span>
                    <span *ngSwitchCase="'jpg'">🖼️</span>
                    <span *ngSwitchCase="'jpeg'">🖼️</span>
                    <span *ngSwitchCase="'png'">🖼️</span>
                    <span *ngSwitchDefault>📎</span>
                  </span>
                </div>
                
                <div class="file-info">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-size">{{ file.size }}</div>
                  <div class="progress-bar" *ngIf="file.status === 'uploading'">
                    <div class="progress-fill" [style.width.%]="file.progress"></div>
                  </div>
                </div>
                
                <div class="file-status">
                  <span class="status-icon" [ngSwitch]="file.status">
                    <span *ngSwitchCase="'pending'" class="pending">⏳</span>
                    <span *ngSwitchCase="'uploading'" class="uploading">⚡</span>
                    <span *ngSwitchCase="'completed'" class="completed">✅</span>
                    <span *ngSwitchCase="'error'" class="error">❌</span>
                  </span>
                </div>
                
                <button 
                  class="remove-btn" 
                  (click)="removeFile(file.id)"
                  *ngIf="file.status !== 'uploading'"
                >
                  ×
                </button>
              </div>
            </div>
            
            <button class="btn btn-link add-more" (click)="openFileDialog()">
              + Add more files
            </button>
          </div>

          <!-- Workflow Selection -->
          <div class="workflow-section" *ngIf="uploadFiles().length > 0">
            <h3>Apply Workflow (Optional)</h3>
            <p class="section-description">Choose a workflow to automatically process your documents</p>
            
            <div class="workflow-options">
              <div 
                class="workflow-option" 
                *ngFor="let workflow of workflowOptions()"
                [class.selected]="selectedWorkflow() === workflow.id"
                (click)="selectWorkflow(workflow.id)"
              >
                <div class="workflow-icon">{{ workflow.icon }}</div>
                <div class="workflow-info">
                  <h4>{{ workflow.name }}</h4>
                  <p>{{ workflow.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Options -->
          <div class="options-section" *ngIf="uploadFiles().length > 0">
            <div class="option">
              <input 
                type="checkbox" 
                id="extractText" 
                [(ngModel)]="extractText"
              />
              <label for="extractText">Extract text automatically (OCR)</label>
            </div>
            <div class="option">
              <input 
                type="checkbox" 
                id="enableSearch" 
                [(ngModel)]="enableSearch"
              />
              <label for="enableSearch">Enable semantic search</label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions" *ngIf="uploadFiles().length > 0">
            <button class="btn btn-secondary" (click)="onClose()">Cancel</button>
            <button 
              class="btn btn-primary" 
              (click)="startUpload()"
              [disabled]="isUploading() || allFilesCompleted()"
            >
              {{ isUploading() ? 'Uploading...' : 'Upload Files' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UploadModalComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() filesUploaded = new EventEmitter<UploadFile[]>();

  @ViewChild('fileInput') fileInput!: ElementRef;

  private files = signal<UploadFile[]>([]);
  private dragOver = signal(false);
  private uploading = signal(false);
  private selectedWorkflowId = signal<string | null>(null);

  uploadFiles = this.files.asReadonly();
  isDragOver = this.dragOver.asReadonly();
  isUploading = this.uploading.asReadonly();
  selectedWorkflow = this.selectedWorkflowId.asReadonly();

  extractText = true;
  enableSearch = true;

  workflowOptions = signal<WorkflowOption[]>([
    {
      id: 'ocr',
      name: 'OCR Processing',
      description: 'Extract text from images and scanned documents',
      icon: '🔤'
    },
    {
      id: 'invoice',
      name: 'Invoice Processing',
      description: 'Extract data from invoices automatically',
      icon: '🧾'
    },
    {
      id: 'contract',
      name: 'Contract Analysis',
      description: 'Analyze contracts for key terms and compliance',
      icon: '📋'
    },
    {
      id: 'classification',
      name: 'Document Classification',
      description: 'Automatically categorize documents by type',
      icon: '🏷️'
    }
  ]);

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetModal();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.addFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.addFiles(files);
    }
  }

  private addFiles(files: File[]): void {
    const newFiles = files.map(file => this.createUploadFile(file));
    this.files.update(current => [...current, ...newFiles]);
  }

  private createUploadFile(file: File): UploadFile {
    return {
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: this.formatFileSize(file.size),
      type: this.getFileType(file.name),
      progress: 0,
      status: 'pending'
    };
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return extension;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile(fileId: string): void {
    this.files.update(current => current.filter(f => f.id !== fileId));
  }

  clearFiles(): void {
    this.files.set([]);
  }

  selectWorkflow(workflowId: string): void {
    this.selectedWorkflowId.set(
      this.selectedWorkflowId() === workflowId ? null : workflowId
    );
  }

  trackByFileId(index: number, file: UploadFile): string {
    return file.id;
  }

  allFilesCompleted(): boolean {
    const files = this.uploadFiles();
    return files.length > 0 && files.every(f => f.status === 'completed');
  }

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  async startUpload(): Promise<void> {
    this.uploading.set(true);
    
    const pendingFiles = this.files().filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await this.uploadFile(file);
    }
    
    this.uploading.set(false);
    this.filesUploaded.emit(this.files());
    
    // Close modal after successful upload
    setTimeout(() => {
      this.onClose();
    }, 1000);
  }

  private async uploadFile(uploadFile: UploadFile): Promise<void> {
    // Update file status to uploading
    this.files.update(current => 
      current.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f)
    );

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await this.delay(100);
      this.files.update(current => 
        current.map(f => f.id === uploadFile.id ? { ...f, progress } : f)
      );
    }

    // Mark as completed
    this.files.update(current => 
      current.map(f => f.id === uploadFile.id ? { ...f, status: 'completed' as const, progress: 100 } : f)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private resetModal(): void {
    this.files.set([]);
    this.dragOver.set(false);
    this.uploading.set(false);
    this.selectedWorkflowId.set(null);
    this.extractText = true;
    this.enableSearch = true;
  }
}
