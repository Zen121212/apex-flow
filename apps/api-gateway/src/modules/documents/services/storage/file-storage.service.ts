import { Injectable, Logger, Inject } from '@nestjs/common';
import { GridFSBucket, GridFSBucketReadStream, ObjectId } from 'mongodb';
import { Readable } from 'stream';

export interface FileUploadResult {
  fileId: string;
  filename: string;
}

export interface FileDownloadResult {
  stream: GridFSBucketReadStream;
  metadata: {
    filename: string;
    contentType: string;
    length: number;
    uploadDate: Date;
  };
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  constructor(
    @Inject('GRID_FS_BUCKET')
    private readonly gridFSBucket: GridFSBucket,
  ) {}

  /**
   * Upload file buffer to GridFS
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
    metadata: Record<string, any> = {}
  ): Promise<FileUploadResult> {
    try {
      // Create readable stream from buffer
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);

      // Create upload stream to GridFS
      const uploadStream = this.gridFSBucket.openUploadStream(filename, {
        contentType,
        metadata: {
          ...metadata,
          uploadedAt: new Date(),
        },
      });

      // Upload file
      await new Promise<void>((resolve, reject) => {
        readableStream
          .pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      this.logger.log(`File uploaded to GridFS: ${filename} (${uploadStream.id})`);

      return {
        fileId: uploadStream.id.toString(),
        filename,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to GridFS: ${filename}`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Download file from GridFS
   */
  async downloadFile(fileId: string): Promise<FileDownloadResult> {
    try {
      const objectId = new ObjectId(fileId);
      
      // Get file info
      const fileInfo = await this.gridFSBucket.find({ _id: objectId }).next();
      if (!fileInfo) {
        throw new Error(`File not found: ${fileId}`);
      }

      // Create download stream
      const downloadStream = this.gridFSBucket.openDownloadStream(objectId);

      return {
        stream: downloadStream,
        metadata: {
          filename: fileInfo.filename,
          contentType: fileInfo.contentType || 'application/octet-stream',
          length: fileInfo.length,
          uploadDate: fileInfo.uploadDate,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to download file from GridFS: ${fileId}`, error);
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  /**
   * Delete file from GridFS
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const objectId = new ObjectId(fileId);
      await this.gridFSBucket.delete(objectId);
      
      this.logger.log(`File deleted from GridFS: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from GridFS: ${fileId}`, error);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Check if file exists in GridFS
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      const objectId = new ObjectId(fileId);
      const fileInfo = await this.gridFSBucket.find({ _id: objectId }).next();
      return fileInfo !== null;
    } catch (error) {
      this.logger.error(`Failed to check file existence: ${fileId}`, error);
      return false;
    }
  }

  /**
   * Get file info without downloading
   */
  async getFileInfo(fileId: string): Promise<any> {
    try {
      const objectId = new ObjectId(fileId);
      const fileInfo = await this.gridFSBucket.find({ _id: objectId }).next();
      
      if (!fileInfo) {
        throw new Error(`File not found: ${fileId}`);
      }

      return {
        id: fileInfo._id.toString(),
        filename: fileInfo.filename,
        contentType: fileInfo.contentType,
        length: fileInfo.length,
        uploadDate: fileInfo.uploadDate,
        metadata: fileInfo.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get file info: ${fileId}`, error);
      throw error;
    }
  }
}
