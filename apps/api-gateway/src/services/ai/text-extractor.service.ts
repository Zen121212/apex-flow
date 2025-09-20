import { Injectable, Logger } from '@nestjs/common';
import { ImageToTextPipeline } from '@xenova/transformers';
import pdfParse from 'pdf-parse';

// Configuration constants
const CONFIG = {
  MAX_OCR_LENGTH: 500, // Max length for OCR generation
  OCR_TIMEOUT: 30000, // 30 seconds timeout for OCR
  MAX_PDF_PAGES_OCR: parseInt(process.env.OCR_MAX_PAGES || '3'),
  OCR_SCALE: parseInt(process.env.OCR_SCALE || '2'),
  MIN_TEXT_LENGTH: 20, // Minimum text length to consider valid
  PRINTABLE_RATIO_THRESHOLD: 0.3, // Minimum printable character ratio
} as const;

@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  constructor() {}

  /**
   * Extract text from file with structured results
   */
  async extract(
    fileContent: string,
    fileName: string,
    mimeType: string,
    ocrPipeline?: ImageToTextPipeline | null
  ): Promise<{ text: string; source: 'pdf-parse' | 'ocr' | 'fallback'; stats: any }> {
    try {
      let result: { text: string; source: 'pdf-parse' | 'ocr' | 'fallback'; stats: any };
      
      if (mimeType === 'application/pdf') {
        result = await this.extractFromPDF(fileContent, fileName, ocrPipeline);
      } else if (mimeType.startsWith('image/')) {
        result = await this.extractFromImage(fileContent, ocrPipeline);
      } else if (mimeType === 'text/plain') {
        const text = Buffer.from(fileContent, 'base64').toString('utf-8');
        result = {
          text,
          source: 'fallback',
          stats: { length: text.length, printableRatio: this.printableRatio(text) }
        };
      } else {
        this.logger.warn(`Unsupported MIME type: ${mimeType}, attempting text extraction`);
        const text = Buffer.from(fileContent, 'base64').toString('utf-8');
        result = {
          text,
          source: 'fallback',
          stats: { length: text.length, printableRatio: this.printableRatio(text) }
        };
      }
      
      this.logger.log(`✅ Text extraction completed: ${result.source}, ${result.text.length} chars`);
      return result;
    } catch (error) {
      this.logger.warn(`Text extraction failed for ${fileName}:`, error.message);
      return {
        text: `Text extraction failed for ${fileName}: ${error.message}`,
        source: 'fallback',
        stats: { error: error.message, length: 0 }
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async extractTextFromFile(
    fileContent: string,
    fileName: string,
    mimeType: string,
    ocrPipeline?: ImageToTextPipeline | null
  ): Promise<string> {
    const result = await this.extract(fileContent, fileName, mimeType, ocrPipeline);
    return result.text;
  }

  /**
   * Extract text from PDF with structured results
   */
  private async extractFromPDF(
    fileContent: string,
    fileName: string,
    ocrPipeline?: ImageToTextPipeline | null
  ): Promise<{ text: string; source: 'pdf-parse' | 'ocr' | 'fallback'; stats: any }> {
    try {
      const buffer = Buffer.from(fileContent, 'base64');
      this.logger.log(`📄 Processing PDF: ${fileName}, size: ${buffer.length} bytes`);
      
      // Check for PDF corruption indicators
      const corruptionLevel = this.detectPDFCorruption(buffer);
      this.logger.log(`📄 PDF corruption level: ${corruptionLevel}/10 for ${fileName}`);
      
      // Try pdf-parse with corruption-aware options
      const options = this.getPDFParseOptions(corruptionLevel);
      this.logger.log(`🔧 Using PDF parse options: ${JSON.stringify(options)}`);
      
      const data = await pdfParse(buffer, options);
      this.logger.log(`📋 PDF parse result: ${data.text ? data.text.length : 0} characters extracted`);
      
      if (data.text && data.text.trim().length > 0) {
        // Clean and validate the extracted text
        const cleanedText = this.cleanExtractedText(data.text);
        this.logger.log(`🧹 Cleaned text: ${cleanedText.length} characters`);
        
        // More lenient validation - accept shorter text too
        if (cleanedText.length > 10 && this.isLikelyJunk(cleanedText) === false) {
          const printableRatio = this.printableRatio(cleanedText);
          this.logger.log(`✅ PDF text extracted successfully: ${cleanedText.length} characters`);
          this.logger.log(`📝 First 200 chars: ${cleanedText.substring(0, 200)}`);
          return {
            text: cleanedText,
            source: 'pdf-parse',
            stats: { 
              length: cleanedText.length, 
              printableRatio,
              corruptionLevel,
              confidence: this.calculateConfidence(cleanedText)
            }
          };
        } else {
          this.logger.warn(`⚠️ Extracted text failed validation: length=${cleanedText.length}, isJunk=${this.isLikelyJunk(cleanedText)}`);
        }
      } else {
        this.logger.warn('⚠️ No text extracted from PDF or empty result');
      }
      
      // If no text found or corruption is high, try OCR
      if (corruptionLevel >= 5 || !data.text || data.text.trim().length === 0) {
        this.logger.log('⚠️ High corruption or no text found, attempting OCR on scanned pages...');
        return await this.extractFromScannedPDF(buffer, fileName, ocrPipeline);
      }
      
      // Try alternative extraction methods for moderate corruption
      this.logger.log('🔄 Trying alternative extraction methods...');
      return await this.extractWithAlternativeMethods(buffer, fileName, ocrPipeline);
      
    } catch (error) {
      this.logger.error(`❌ PDF text extraction failed for ${fileName}:`, error.message);
      this.logger.error('Stack trace:', error.stack);
      
      // Try multiple fallback strategies
      return await this.tryMultipleFallbacks(fileContent, fileName, error.message);
    }
  }

  /**
   * Extract text from scanned PDF using simple fallback (no pdfjs-dist dependency)
   */
  private async extractFromScannedPDF(
    buffer: Buffer,
    fileName: string,
    ocrPipeline?: ImageToTextPipeline | null
  ): Promise<{ text: string; source: 'pdf-parse' | 'ocr' | 'fallback'; stats: any }> {
    try {
      this.logger.log('🔄 Attempting scanned PDF fallback processing...');
      
      // Simple fallback: return a message indicating OCR is not available in Docker
      const fallbackText = `Scanned PDF detected: ${fileName}. OCR processing is not available in the current environment. Please use a text-based PDF or contact support for OCR processing.`;
      
      this.logger.warn('⚠️ OCR processing not available for scanned PDFs in Docker environment');
      return {
        text: fallbackText,
        source: 'fallback',
        stats: {
          method: 'fallback',
          reason: 'OCR not available in Docker environment',
          fileName: fileName
        }
      };
      
    } catch (error) {
      this.logger.error(`❌ Scanned PDF fallback processing failed: ${error.message}`);
      return {
        text: `Scanned PDF processing failed: ${error.message}`,
        source: 'fallback',
        stats: { error: error.message }
      };
    }
  }

  /**
   * Detect PDF corruption level (0-10 scale)
   */
  private detectPDFCorruption(buffer: Buffer): number {
    let corruptionScore = 0;
    
    try {
      const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
      
      // Check for common corruption indicators
      if (content.includes('%%EOF') === false) corruptionScore += 2;
      if (content.includes('%%PDF') === false) corruptionScore += 3;
      if (content.includes('xref') === false) corruptionScore += 1;
      if (content.includes('trailer') === false) corruptionScore += 1;
      
      // Check for binary content in text areas
      const binaryRatio = (content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length / content.length;
      if (binaryRatio > 0.1) corruptionScore += Math.min(3, Math.floor(binaryRatio * 10));
      
      // Check for repeated patterns (indicates corruption)
      const repeatedPatterns = (content.match(/(.)\1{20,}/g) || []).length;
      corruptionScore += Math.min(2, repeatedPatterns);
      
      // Check for missing or malformed objects
      const objectCount = (content.match(/^\d+\s+\d+\s+obj/gm) || []).length;
      const endObjCount = (content.match(/^endobj/gm) || []).length;
      if (objectCount !== endObjCount) corruptionScore += 2;
      
    } catch (error) {
      corruptionScore = 10; // Maximum corruption if we can't even read it
    }
    
    return Math.min(10, corruptionScore);
  }

  /**
   * Get PDF parsing options based on corruption level
   */
  private getPDFParseOptions(corruptionLevel: number): any {
    const baseOptions = {
      max: 0,
      version: 'v1.10.100',
      normalizeWhitespace: true,
      disableCombineTextItems: false
    };

    if (corruptionLevel >= 7) {
      // High corruption - use most permissive options
      return {
        ...baseOptions,
        max: 0,
        version: 'v1.10.100',
        normalizeWhitespace: true,
        disableCombineTextItems: true,
        // Add more permissive options for corrupted PDFs
        ignoreErrors: true,
        maxPages: 3
      };
    } else if (corruptionLevel >= 4) {
      // Moderate corruption
      return {
        ...baseOptions,
        disableCombineTextItems: true,
        maxPages: 5
      };
    }
    
    return baseOptions;
  }

  /**
   * Try alternative extraction methods for moderately corrupted PDFs
   */
  private async extractWithAlternativeMethods(
    buffer: Buffer,
    fileName: string,
    ocrPipeline?: ImageToTextPipeline | null
  ): Promise<{ text: string; source: 'pdf-parse' | 'ocr' | 'fallback'; stats: any }> {
    try {
      // Try with different PDF parsing strategies
      const strategies = [
        { max: 0, version: 'v1.10.100', normalizeWhitespace: false },
        { max: 0, version: 'v1.10.100', disableCombineTextItems: true },
        { max: 0, version: 'v1.10.100', ignoreErrors: true }
      ];

      for (const strategy of strategies) {
        try {
          const data = await pdfParse(buffer, strategy);
          if (data.text && data.text.trim().length > 0) {
            const cleanedText = this.cleanExtractedText(data.text);
            if (cleanedText.length > CONFIG.MIN_TEXT_LENGTH && !this.isLikelyJunk(cleanedText)) {
              const printableRatio = this.printableRatio(cleanedText);
              this.logger.log(`✅ Alternative PDF extraction successful: ${cleanedText.length} characters`);
              return {
                text: cleanedText,
                source: 'pdf-parse',
                stats: {
                  length: cleanedText.length,
                  printableRatio,
                  confidence: this.calculateConfidence(cleanedText),
                  method: 'alternative'
                }
              };
            }
          }
        } catch (strategyError) {
          this.logger.debug(`Strategy failed: ${strategyError.message}`);
        }
      }

      // If all strategies fail, try OCR
      return await this.extractFromScannedPDF(buffer, fileName, ocrPipeline);
      
    } catch (error) {
      this.logger.warn('Alternative extraction methods failed:', error.message);
      return {
        text: `Alternative PDF extraction failed: ${error.message}`,
        source: 'fallback',
        stats: { error: error.message }
      };
    }
  }

  /**
   * Extract text from image using OCR
   */
  private async extractFromImage(
    fileContent: string,
    ocrPipeline?: ImageToTextPipeline | null
  ): Promise<{ text: string; source: 'pdf-parse' | 'ocr' | 'fallback'; stats: any }> {
    try {
      if (!ocrPipeline) {
        this.logger.warn('OCR pipeline not available, using fallback');
        return {
          text: 'OCR not available',
          source: 'fallback',
          stats: { error: 'OCR pipeline not available' }
        };
      }

      const imageBuffer = Buffer.from(fileContent, 'base64');
      const ocrResult = await ocrPipeline(imageBuffer as any);
      const text = Array.isArray(ocrResult) ? 
        (ocrResult[0] as any)?.generated_text : 
        (ocrResult as any)?.generated_text;
      
      if (text && text.trim().length > 0) {
        const cleanedText = this.cleanExtractedText(text);
        const printableRatio = this.printableRatio(cleanedText);
        
        this.logger.log(`✅ Image OCR completed: ${cleanedText.length} characters`);
        return {
          text: cleanedText,
          source: 'ocr',
          stats: {
            length: cleanedText.length,
            printableRatio,
            confidence: this.calculateConfidence(cleanedText)
          }
        };
      } else {
        return {
          text: 'OCR processing completed but no text extracted',
          source: 'fallback',
          stats: { error: 'No text extracted from image' }
        };
      }
    } catch (error) {
      this.logger.warn('Image OCR failed:', error.message);
      return {
        text: `Image OCR failed: ${error.message}`,
        source: 'fallback',
        stats: { error: error.message }
      };
    }
  }

  /**
   * Try multiple fallback strategies when primary extraction fails
   */
  private async tryMultipleFallbacks(
    fileContent: string,
    fileName: string,
    originalError: string
  ): Promise<{ text: string; source: 'pdf-parse' | 'ocr' | 'fallback'; stats: any }> {
    this.logger.log(`🔄 Attempting fallback extraction methods for ${fileName}`);
    
    const fallbacks = [
      () => this.tryBinaryTextExtraction(fileContent),
      () => this.tryHexTextExtraction(fileContent),
      () => this.tryPartialTextExtraction(fileContent)
    ];

    for (let i = 0; i < fallbacks.length; i++) {
      try {
        this.logger.log(`🔄 Trying fallback method ${i + 1}/${fallbacks.length}`);
        const result = await fallbacks[i]();
        
        if (result && result.length > 20 && !this.isLikelyJunk(result)) {
          // Additional check: ensure result is not base64 content
          if (!this.looksLikeBase64(result)) {
            const printableRatio = this.printableRatio(result);
            this.logger.log(`✅ Fallback extraction successful with method ${i + 1}`);
            this.logger.log(`📝 Fallback result preview: ${result.substring(0, 100)}`);
            return {
              text: result,
              source: 'fallback',
              stats: {
                length: result.length,
                printableRatio,
                confidence: this.calculateConfidence(result),
                method: `fallback-${i + 1}`
              }
            };
          } else {
            this.logger.warn(`⚠️ Fallback method ${i + 1} returned base64-like content, skipping`);
          }
        } else {
          this.logger.debug(`⚠️ Fallback method ${i + 1} returned insufficient or junk text`);
        }
      } catch (fallbackError) {
        this.logger.debug(`❌ Fallback method ${i + 1} failed: ${fallbackError.message}`);
      }
    }

    // Final fallback: return a helpful error message instead of base64
    const errorMessage = `PDF text extraction failed for ${fileName}: ${originalError}. The document may be corrupted, password-protected, or contain only images.`;
    this.logger.warn(`❌ All fallback methods exhausted for ${fileName}`);
    
    return {
      text: errorMessage,
      source: 'fallback',
      stats: { 
        error: originalError, 
        exhausted: true,
        fallbacksAttempted: fallbacks.length
      }
    };
  }

  /**
   * Try extracting text from binary content
   */
  private async tryBinaryTextExtraction(fileContent: string): Promise<string> {
    const buffer = Buffer.from(fileContent, 'base64');
    const text = buffer.toString('utf-8');
    
    // Extract only printable ASCII characters
    const printableText = text.replace(/[^\x20-\x7E]/g, ' ');
    const cleanedText = this.cleanExtractedText(printableText);
    
    return cleanedText;
  }

  /**
   * Try extracting text from hex representation
   */
  private async tryHexTextExtraction(fileContent: string): Promise<string> {
    const buffer = Buffer.from(fileContent, 'base64');
    const hex = buffer.toString('hex');
    
    // Look for text patterns in hex
    const textMatches = hex.match(/[0-9a-f]{2}/g) || [];
    const text = textMatches
      .map(hex => String.fromCharCode(parseInt(hex, 16)))
      .filter(char => /[a-zA-Z0-9\s]/.test(char))
      .join('');
    
    return this.cleanExtractedText(text);
  }

  /**
   * Try partial text extraction from corrupted content
   */
  private async tryPartialTextExtraction(fileContent: string): Promise<string> {
    const buffer = Buffer.from(fileContent, 'base64');
    const content = buffer.toString('utf-8');
    
    // Extract text between common PDF text markers
    const textMarkers = [
      /BT\s+(.*?)\s+ET/g,
      /\(([^)]+)\)/g,
      /\[([^\]]+)\]/g
    ];
    
    let extractedText = '';
    for (const marker of textMarkers) {
      const matches = content.match(marker);
      if (matches) {
        extractedText += matches.join(' ');
      }
    }
    
    return this.cleanExtractedText(extractedText);
  }

  /**
   * Check if text is likely junk/corrupted
   */
  private isLikelyJunk(text: string): boolean {
    if (!text || text.length < CONFIG.MIN_TEXT_LENGTH) return true;
    
    const printableRatio = this.printableRatio(text);
    if (printableRatio < CONFIG.PRINTABLE_RATIO_THRESHOLD) return true;
    
    // Check for excessive repeated patterns
    const repeatedPatterns = (text.match(/(.)\1{10,}/g) || []).length;
    if (repeatedPatterns > 2) return true;
    
    // Check for binary-looking patterns
    const binaryPatterns = (text.match(/\b\d{5,}n\b/g) || []).length;
    if (binaryPatterns > 5) return true;
    
    return false;
  }

  /**
   * Calculate printable character ratio
   */
  private printableRatio(text: string): number {
    if (!text) return 0;
    const printableChars = (text.match(/[\x20-\x7E]/g) || []).length;
    return printableChars / text.length;
  }

  /**
   * Check if text looks like base64 content
   */
  private looksLikeBase64(text: string): boolean {
    // Base64 characteristics:
    // - Only contains A-Z, a-z, 0-9, +, /, = characters
    // - Length is multiple of 4 (when padded)
    // - Very low ratio of spaces and common words
    
    if (!text || text.length < 50) return false;
    
    // Check if it's mostly base64 characters
    const base64Chars = /^[A-Za-z0-9+/=\s]+$/;
    if (!base64Chars.test(text)) return false;
    
    // Check for very low space ratio (base64 has few spaces)
    const spaceRatio = (text.match(/\s/g) || []).length / text.length;
    if (spaceRatio > 0.1) return false; // Normal text has more spaces
    
    // Check for lack of common English words
    const commonWords = ['the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that'];
    const hasCommonWords = commonWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
    
    // If it looks like base64 AND has no common words, it's likely base64
    return !hasCommonWords;
  }

  /**
   * Calculate confidence score for extracted text
   */
  private calculateConfidence(text: string): number {
    if (!text || text.length < CONFIG.MIN_TEXT_LENGTH) return 0;
    
    let confidence = 0.5; // Base confidence
    
    // Printable ratio bonus
    const printableRatio = this.printableRatio(text);
    confidence += printableRatio * 0.3;
    
    // Length bonus (up to 0.2)
    const lengthBonus = Math.min(0.2, text.length / 1000);
    confidence += lengthBonus;
    
    // Penalty for repeated patterns
    const repeatedPatterns = (text.match(/(.)\1{5,}/g) || []).length;
    confidence -= repeatedPatterns * 0.1;
    
    // Penalty for binary patterns
    const binaryPatterns = (text.match(/\b\d{5,}n\b/g) || []).length;
    confidence -= binaryPatterns * 0.05;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Clean extracted text to remove artifacts and invalid characters
   */
  private cleanExtractedText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove repeated characters (like the 50109n pattern we saw)
      .replace(/(.)\1{10,}/g, '$1')
      // Remove binary-looking patterns
      .replace(/\b\d{5,}n\b/g, '')
      // Remove excessive punctuation
      .replace(/[.]{3,}/g, '...')
      // Trim whitespace
      .trim();
  }

  /**
   * Validate if text is readable and contains meaningful content
   */
  private isValidText(text: string): boolean {
    if (!text || text.length < 10) return false;
    
    // Check for meaningful word patterns
    const wordCount = text.split(/\s+/).filter(word => 
      word.length > 2 && /[a-zA-Z]/.test(word)
    ).length;
    
    // Must have at least 3 meaningful words
    if (wordCount < 3) return false;
    
    // Check for reasonable character distribution
    const alphaRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
    const digitRatio = (text.match(/[0-9]/g) || []).length / text.length;
    
    // Should have reasonable mix of letters and numbers
    return alphaRatio > 0.3 && digitRatio < 0.7;
  }

  /**
   * Extract text from image using local OCR
   */
  private async extractTextFromImage(
    fileContent: string,
    ocrPipeline?: ImageToTextPipeline | null
  ): Promise<string> {
    try {
      if (!ocrPipeline) {
        this.logger.warn('OCR pipeline not available, using fallback');
        return 'OCR not available';
      }

      const imageBuffer = Buffer.from(fileContent, 'base64');
      
      // Set timeout for OCR operation
      const ocrPromise = ocrPipeline(imageBuffer as any);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR timeout')), CONFIG.OCR_TIMEOUT)
      );
      
      const result = await Promise.race([ocrPromise, timeoutPromise]);
      const text = Array.isArray(result) ? (result[0] as any)?.generated_text : (result as any)?.generated_text;
      
      return text || 'No text found in image';
    } catch (error) {
      this.logger.warn('Image OCR failed:', error.message);
      return `Image OCR failed: ${error.message}`;
    }
  }

  /**
   * Truncate text to reasonable length
   */
  truncateText(text: string, maxLength: number = 1000): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Chunk text for processing
   */
  chunkText(text: string, maxChunkSize: number): string[] {
    if (text.length <= maxChunkSize) return [text];
    
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // Try to break at word boundary
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }
      
      chunks.push(text.substring(start, end));
      start = end + 1;
    }
    
    return chunks;
  }
}
