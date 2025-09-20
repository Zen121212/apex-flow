import { Injectable, Logger } from '@nestjs/common';
import { TokenClassificationPipeline } from '@xenova/transformers';

// Configuration constants
const CONFIG = {
  MAX_TEXT_LENGTH: 2000, // Chunk size for processing
} as const;

@Injectable()
export class EntityExtractorService {
  private readonly logger = new Logger(EntityExtractorService.name);

  constructor() {}

  /**
   * Extract entities using local NER model with chunking
   */
  async extractEntities(
    text: string,
    nerPipeline?: TokenClassificationPipeline | null
  ): Promise<any[]> {
    try {
      if (!nerPipeline) {
        this.logger.warn('NER pipeline not available, using pattern-based fallback');
        return this.extractEntitiesWithPatterns(text);
      }

      // Clean text before processing
      const cleanedText = this.cleanTextForModel(text);
      if (!cleanedText || cleanedText.length < 10) {
        this.logger.warn('Text too short or invalid for NER, using pattern-based fallback');
        return this.extractEntitiesWithPatterns(text);
      }

      // Check for NER failure indicators
      const failureRisk = this.assessNERFailureRisk(cleanedText);
      if (failureRisk >= 7) {
        this.logger.warn(`High NER failure risk (${failureRisk}/10), using pattern-based fallback`);
        return this.extractEntitiesWithPatterns(text);
      }

      // Chunk text to prevent OOM
      const chunks = this.chunkText(cleanedText, CONFIG.MAX_TEXT_LENGTH);
      const allEntities: any[] = [];
      let failureCount = 0;
      const maxFailures = Math.ceil(chunks.length * 0.5); // Allow 50% chunk failures

      for (const chunk of chunks) {
        try {
          const result = await nerPipeline(chunk);
          const entities = Array.isArray(result) ? result : [result];
          
          // Validate NER results
          const validEntities = this.validateNERResults(entities);
          if (validEntities.length === 0) {
            failureCount++;
            this.logger.debug('NER chunk returned no valid entities');
            continue;
          }
          
          // Normalize entity structure
          const normalizedEntities = validEntities.map(entity => ({
            ...entity,
            entity_group: entity.entity_group || entity.label, // Handle both formats
            score: entity.score || entity.confidence || 0.8
          }));
          
          allEntities.push(...normalizedEntities);
        } catch (chunkError) {
          failureCount++;
          this.logger.warn('NER chunk processing failed:', chunkError.message);
          
          // If too many chunks fail, stop NER processing
          if (failureCount > maxFailures) {
            this.logger.warn(`Too many NER failures (${failureCount}/${chunks.length}), switching to pattern-based extraction`);
            return this.extractEntitiesWithPatterns(text);
          }
        }
      }

      // If we got some results but many chunks failed, supplement with patterns
      if (failureCount > 0 && allEntities.length < 5) {
        this.logger.log(`NER had ${failureCount} failures, supplementing with pattern-based extraction`);
        const patternEntities = this.extractEntitiesWithPatterns(text);
        return this.mergeEntityResults(allEntities, patternEntities);
      }

      this.logger.log(`✅ NER extraction completed: ${allEntities.length} entities found`);
      return allEntities;
    } catch (error) {
      this.logger.warn('NER extraction failed:', error.message);
      return this.extractEntitiesWithPatterns(text);
    }
  }

  /**
   * Fallback entity extraction using pattern matching
   */
  private extractEntitiesWithPatterns(text: string): any[] {
    const entities: any[] = [];
    
    // Extract common entity patterns with improved accuracy
    const patterns = [
      // Names (capitalized words with proper spacing)
      { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, label: 'PERSON', confidence: 0.7 },
      // Organizations (Inc, Corp, LLC, etc.)
      { pattern: /\b[A-Z][a-zA-Z\s]+(?:Inc|Corp|LLC|Ltd|Company|Corporation|Group|Enterprises|Solutions|Systems|Technologies|Services)\b/g, label: 'ORG', confidence: 0.8 },
      // Email addresses
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: 'EMAIL', confidence: 0.9 },
      // Phone numbers (various formats)
      { pattern: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, label: 'PHONE', confidence: 0.8 },
      // Dates (multiple formats)
      { pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, label: 'DATE', confidence: 0.7 },
      { pattern: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g, label: 'DATE', confidence: 0.8 },
      // Money amounts (various currencies)
      { pattern: /\$[\d,]+\.?\d*/g, label: 'MONEY', confidence: 0.9 },
      { pattern: /€[\d,]+\.?\d*/g, label: 'MONEY', confidence: 0.9 },
      { pattern: /£[\d,]+\.?\d*/g, label: 'MONEY', confidence: 0.9 },
      { pattern: /¥[\d,]+\.?\d*/g, label: 'MONEY', confidence: 0.9 },
      // Addresses (improved pattern)
      { pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Ct|Court|Place|Pl)\b/g, label: 'ADDRESS', confidence: 0.6 },
      // ZIP codes
      { pattern: /\b\d{5}(?:-\d{4})?\b/g, label: 'ZIP', confidence: 0.8 },
      // Invoice numbers
      { pattern: /\b(?:INV|Invoice|Bill|Receipt)[\s#-]*[A-Z0-9-]+\b/gi, label: 'INVOICE_NUMBER', confidence: 0.8 },
      // Tax IDs
      { pattern: /\b(?:Tax\s+ID|EIN|SSN)[\s#-]*[\d-]+\b/gi, label: 'TAX_ID', confidence: 0.7 },
      // Product codes/SKUs
      { pattern: /\b(?:SKU|Product|Item)[\s#-]*[A-Z0-9-]+\b/gi, label: 'PRODUCT_CODE', confidence: 0.7 },
      // URLs
      { pattern: /https?:\/\/[^\s]+/g, label: 'URL', confidence: 0.9 },
      // Credit card numbers (masked)
      { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: 'CARD_NUMBER', confidence: 0.8 }
    ];

    for (const { pattern, label, confidence } of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const start = text.indexOf(match);
          entities.push({
            entity: match,
            entity_group: label,
            score: confidence,
            start: start,
            end: start + match.length
          });
        });
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueEntities = entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.entity === entity.entity && e.start === entity.start)
    ).sort((a, b) => b.score - a.score);

    this.logger.log(`✅ Pattern-based entity extraction completed: ${uniqueEntities.length} entities found`);
    return uniqueEntities;
  }

  /**
   * Assess NER failure risk based on text characteristics
   */
  private assessNERFailureRisk(text: string): number {
    let riskScore = 0;
    
    // Check for problematic text patterns
    const binaryRatio = (text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length / text.length;
    if (binaryRatio > 0.05) riskScore += 3;
    
    // Check for repeated patterns (indicates corruption)
    const repeatedPatterns = (text.match(/(.)\1{10,}/g) || []).length;
    riskScore += Math.min(3, repeatedPatterns);
    
    // Check for excessive numbers (can cause tokenization issues)
    const numberRatio = (text.match(/\d/g) || []).length / text.length;
    if (numberRatio > 0.3) riskScore += 2;
    
    // Check for very long words (tokenization issues)
    const longWords = (text.match(/\b\w{30,}\b/g) || []).length;
    if (longWords > 5) riskScore += 2;
    
    // Check for mixed encodings
    const encodingIssues = (text.match(/[^\x00-\x7F]/g) || []).length / text.length;
    if (encodingIssues > 0.1) riskScore += 2;
    
    return Math.min(10, riskScore);
  }

  /**
   * Validate NER results for quality and completeness
   */
  private validateNERResults(entities: any[]): any[] {
    return entities.filter(entity => {
      // Check if entity has required fields
      if (!entity.word && !entity.entity) return false;
      
      // Check if entity has valid label/group
      if (!entity.entity_group && !entity.label) return false;
      
      // Check if entity has reasonable confidence
      const confidence = entity.score || entity.confidence || 0;
      if (confidence < 0.1) return false;
      
      // Check if entity text is not too short or too long
      const text = entity.word || entity.entity || '';
      if (text.length < 2 || text.length > 100) return false;
      
      // Check if entity text contains valid characters
      if (!/[a-zA-Z0-9]/.test(text)) return false;
      
      return true;
    });
  }

  /**
   * Check if error is a known NER failure type
   */
  private isNERFailure(error: any): boolean {
    const errorMessage = error.message || '';
    const nerFailurePatterns = [
      'indices element out of data bounds',
      'tensor bounds',
      'tokenization',
      'vocabulary',
      'embedding',
      'attention',
      'transformer'
    ];
    
    return nerFailurePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern)
    );
  }

  /**
   * Merge NER and pattern-based entity results
   */
  private mergeEntityResults(nerEntities: any[], patternEntities: any[]): any[] {
    const merged = [...nerEntities];
    const nerTexts = new Set(nerEntities.map(e => (e.word || e.entity || '').toLowerCase()));
    
    // Add pattern entities that don't overlap with NER entities
    for (const patternEntity of patternEntities) {
      const text = (patternEntity.word || patternEntity.entity || '').toLowerCase();
      if (!nerTexts.has(text)) {
        merged.push({
          ...patternEntity,
          source: 'pattern' // Mark as pattern-based
        });
      }
    }
    
    // Remove duplicates and sort by confidence
    const uniqueEntities = this.removeDuplicateEntities(merged);
    return uniqueEntities.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Remove duplicate entities based on text similarity
   */
  private removeDuplicateEntities(entities: any[]): any[] {
    const unique: any[] = [];
    const seen = new Set<string>();
    
    for (const entity of entities) {
      const text = (entity.word || entity.entity || '').toLowerCase().trim();
      if (text && !seen.has(text)) {
        seen.add(text);
        unique.push(entity);
      }
    }
    
    return unique;
  }

  /**
   * Clean text for model processing to prevent tensor errors
   */
  private cleanTextForModel(text: string): string {
    if (!text) return '';
    
    return text
      // Remove control characters and null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove repeated patterns that cause tensor issues
      .replace(/(.)\1{5,}/g, '$1$1$1')
      // Remove binary-looking patterns
      .replace(/\b\d{5,}n\b/g, '')
      // Remove excessive punctuation
      .replace(/[.]{3,}/g, '...')
      // Ensure reasonable length
      .substring(0, 4000)
      .trim();
  }

  /**
   * Chunk text for processing
   */
  private chunkText(text: string, maxChunkSize: number): string[] {
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
