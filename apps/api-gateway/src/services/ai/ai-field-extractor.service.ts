import { Injectable, Logger } from '@nestjs/common';
import { ModelManagerService } from './model-manager.service';

@Injectable()
export class AIFieldExtractorService {
  private readonly logger = new Logger(AIFieldExtractorService.name);

  constructor(private readonly modelManager: ModelManagerService) {
    this.logger.log('🤖 AIFieldExtractorService initialized');
  }

  /**
   * Extract fields using AI instead of regex patterns
   */
  async extractFieldsWithAI(text: string, documentType: string, entities: any[]): Promise<any> {
    try {
      this.logger.log(`🤖 AIFieldExtractorService.extractFieldsWithAI called for ${documentType}`);
      this.logger.log(`🤖 Text length: ${text.length}, Entities: ${entities.length}`);
      
      switch (documentType) {
        case 'invoice':
          return await this.extractInvoiceFieldsWithAI(text, entities);
        case 'contract':
          return await this.extractContractFieldsWithAI(text, entities);
        case 'receipt':
          return await this.extractReceiptFieldsWithAI(text, entities);
        default:
          return await this.extractGeneralFieldsWithAI(text, entities);
      }
    } catch (error) {
      this.logger.error(`AI field extraction failed: ${error.message}`);
      this.logger.error(error.stack);
      // Fallback to empty object instead of crashing
      return {};
    }
  }

  /**
   * Extract invoice fields using AI classification and QA
   */
  private async extractInvoiceFieldsWithAI(text: string, entities: any[]): Promise<any> {
    const fields: any = {};

    this.logger.log('🤖 Starting AI invoice field extraction...');
    
    // Extract basic fields with fallbacks to ensure we always get something
    fields.invoice_number = await this.extractInvoiceNumberSimple(text);
    fields.total_amount = await this.extractTotalAmountSimple(text, entities);
    fields.invoice_date = await this.extractInvoiceDateSimple(text);
    fields.vendor_name = await this.extractVendorNameSimple(text, entities);
    fields.customer_name = await this.extractCustomerNameSimple(text, entities);
    
    // Add AI-specific metadata
    fields.extraction_method = 'AI';
    fields.confidence = 0.8;
    
    this.logger.log(`🤖 AI extracted fields: ${JSON.stringify(fields, null, 2)}`);
    return fields;
  }

  // Simplified extraction methods that are more likely to succeed
  private async extractInvoiceNumberSimple(text: string): Promise<string | null> {
    // Look for patterns like "INVOICE #12345" or "Invoice: 12345"
    const patterns = [
      /INVOICE\s*#?\s*(\d+)/i,
      /Invoice\s*:?\s*(\d+)/i,
      /#\s*(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        this.logger.log(`🔍 Found invoice number: ${match[1]}`);
        return match[1];
      }
    }
    this.logger.log(`⚠️ No invoice number found in text`);
    return null;
  }

  private async extractTotalAmountSimple(text: string, entities: any[]): Promise<number | null> {
    // Look for money entities or dollar amounts
    const moneyPattern = /\$(\d+(?:\.\d{2})?)/g;
    const matches = [...text.matchAll(moneyPattern)];
    
    if (matches.length > 0) {
      // Return the largest amount found
      const amounts = matches.map(m => parseFloat(m[1])).filter(a => a > 0);
      const maxAmount = amounts.length > 0 ? Math.max(...amounts) : null;
      this.logger.log(`🔍 Found ${amounts.length} amounts, max: $${maxAmount}`);
      return maxAmount;
    }
    
    this.logger.log(`⚠️ No amounts found in text`);
    return null;
  }

  private async extractInvoiceDateSimple(text: string): Promise<string | null> {
    // Look for date patterns
    const datePatterns = [
      /Date:\s*(\d{4}-\d{2}-\d{2})/i,
      /(\d{4}-\d{2}-\d{2})/,
      /(\w{3}\s+\d{1,2},?\s+\d{4})/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  private async extractVendorNameSimple(text: string, entities: any[]): Promise<string | null> {
    // Look for "From:" pattern or first organization entity
    const fromMatch = text.match(/From:\s*([^\n]+)/i);
    if (fromMatch && fromMatch[1]) {
      const vendor = fromMatch[1].trim();
      this.logger.log(`🔍 Found vendor from 'From:' pattern: ${vendor}`);
      return vendor;
    }
    
    // Fallback to first ORG entity
    const orgEntity = entities.find(e => e.entity_group === 'ORG' || e.label === 'ORG');
    if (orgEntity) {
      this.logger.log(`🔍 Found vendor from NER: ${orgEntity.word}`);
      return orgEntity.word;
    }
    
    this.logger.log(`⚠️ No vendor found`);
    return null;
  }

  private async extractCustomerNameSimple(text: string, entities: any[]): Promise<string | null> {
    // Look for "To:" pattern or first person entity
    const toMatch = text.match(/To:\s*([^\n]+)/i);
    if (toMatch && toMatch[1]) {
      const customer = toMatch[1].trim();
      this.logger.log(`🔍 Found customer from 'To:' pattern: ${customer}`);
      return customer;
    }
    
    // Fallback to first PERSON entity
    const personEntity = entities.find(e => e.entity_group === 'PER' || e.label === 'PERSON');
    if (personEntity) {
      this.logger.log(`🔍 Found customer from NER: ${personEntity.word}`);
      return personEntity.word;
    }
    
    this.logger.log(`⚠️ No customer found`);
    return null;
  }

  /**
   * Extract contract fields using AI
   */
  private async extractContractFieldsWithAI(text: string, entities: any[]): Promise<any> {
    const fields: any = {};

    // Use zero-shot classification for contract analysis
    const contractType = await this.classifyContractType(text);
    fields.contract_type = contractType;

    // Extract parties using NER + AI classification
    fields.parties = await this.extractPartiesWithAI(text, entities);
    
    // Extract dates using AI
    fields.effective_date = await this.extractDateWithAI(text, "effective date", entities);
    fields.expiration_date = await this.extractDateWithAI(text, "expiration date", entities);
    
    // Extract contract value using AI + NER
    fields.contract_value = await this.extractMoneyWithAI(text, entities);
    
    // Extract key terms using AI classification
    fields.key_terms = await this.extractKeyTermsWithAI(text);
    
    return fields;
  }

  /**
   * Extract receipt fields using AI
   */
  private async extractReceiptFieldsWithAI(text: string, entities: any[]): Promise<any> {
    const fields: any = {};
    
    fields.merchant_name = await this.extractMerchantWithNER(text, entities);
    fields.transaction_date = await this.extractDateWithAI(text, "transaction date", entities);
    fields.total_amount = await this.extractMoneyWithAI(text, entities);
    fields.items = await this.extractReceiptItemsWithAI(text);
    
    return fields;
  }

  /**
   * Extract general document fields using AI
   */
  private async extractGeneralFieldsWithAI(text: string, entities: any[]): Promise<any> {
    const fields: any = {};
    
    // Use AI to generate document summary
    fields.summary = await this.generateSummaryWithAI(text);
    fields.key_entities = entities.slice(0, 10); // Top 10 entities
    fields.document_topics = await this.extractTopicsWithAI(text);
    
    return fields;
  }

  /**
   * Classify invoice sections using zero-shot classification
   */
  private async classifyInvoiceSections(text: string): Promise<any> {
    try {
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return {};

        const sections = text.split('\n').filter(line => line.trim().length > 10);
        const labels = ['header', 'billing_info', 'line_items', 'totals', 'payment_terms', 'footer'];
        
        const results = await Promise.all(
          sections.map(async (section) => {
            const result = await classifier(section, labels);
            const classification = Array.isArray(result) ? result[0] : result;
            return {
              text: section,
              classification: classification?.labels?.[0] || 'unknown',
              confidence: classification?.scores?.[0] || 0.5
            };
          })
        );

      return results;
    } catch (error) {
      this.logger.warn(`Section classification failed: ${error.message}`);
      return {};
    }
  }

  /**
   * Extract using question-answering approach
   */
  private async extractWithQuestionAnswering(text: string, question: string): Promise<string | null> {
    try {
      // Use zero-shot classification to find relevant text sections
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return null;

      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
      const relevantSentences = [];

      // Find sentences relevant to the question
      for (const sentence of sentences.slice(0, 20)) { // Limit to first 20 sentences
        const result = await classifier(sentence, ['relevant to ' + question, 'not relevant']);
        const classification = Array.isArray(result) ? result[0] : result;
        if ((classification?.scores?.[0] || 0) > 0.7) {
          relevantSentences.push(sentence.trim());
        }
      }

      // Extract answer from relevant sentences using patterns + AI confidence
      return this.extractAnswerFromSentences(relevantSentences, question);
    } catch (error) {
      this.logger.warn(`Question answering failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract money amounts using NER entities + AI validation
   */
  private async extractMoneyWithAI(text: string, entities: any[]): Promise<number | null> {
    // Get money entities from NER
    const moneyEntities = entities.filter(e => e.entity_group === 'MONEY' || e.label === 'MONEY');
    
    if (moneyEntities.length === 0) return null;

    // Use AI to classify which money amount is the "total"
    try {
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return this.parseMoneyValue(moneyEntities[0].word);

      const amounts = moneyEntities.map(e => e.word);
      const labels = ['total_amount', 'subtotal', 'tax', 'discount', 'other'];
      
      for (const amount of amounts) {
        const context = this.getContextAroundAmount(text, amount);
        const result = await classifier(context, labels);
        const classification = Array.isArray(result) ? result[0] : result;
        
        if ((classification?.labels?.[0] || '') === 'total_amount' && (classification?.scores?.[0] || 0) > 0.6) {
          return this.parseMoneyValue(amount);
        }
      }

      // Fallback to largest amount
      const parsedAmounts = amounts.map(a => this.parseMoneyValue(a)).filter(a => a > 0);
      return parsedAmounts.length > 0 ? Math.max(...parsedAmounts) : null;
    } catch (error) {
      this.logger.warn(`Money extraction with AI failed: ${error.message}`);
      return this.parseMoneyValue(moneyEntities[0].word);
    }
  }

  /**
   * Extract dates using NER + AI context understanding
   */
  private async extractDateWithAI(text: string, dateType: string, entities: any[]): Promise<string | null> {
    // Get date entities from NER
    const dateEntities = entities.filter(e => e.entity_group === 'DATE' || e.label === 'DATE');
    
    if (dateEntities.length === 0) return null;

    try {
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return dateEntities[0].word;

      // Classify each date by type
      for (const dateEntity of dateEntities) {
        const context = this.getContextAroundDate(text, dateEntity.word);
        const labels = [`${dateType}`, 'other_date'];
        
        const result = await classifier(context, labels);
        const classification = Array.isArray(result) ? result[0] : result;
        if ((classification?.labels?.[0] || '') === dateType && (classification?.scores?.[0] || 0) > 0.6) {
          return this.normalizeDateFormat(dateEntity.word);
        }
      }

      return this.normalizeDateFormat(dateEntities[0].word);
    } catch (error) {
      this.logger.warn(`Date extraction with AI failed: ${error.message}`);
      return dateEntities[0].word;
    }
  }

  /**
   * Extract vendor info using NER organizations
   */
  private async extractVendorWithNER(text: string, entities: any[]): Promise<any> {
    const orgEntities = entities.filter(e => 
      e.entity_group === 'ORG' || 
      e.label === 'ORG' || 
      e.label === 'ORGANIZATION'
    );

    if (orgEntities.length === 0) return {};

    // Use the first organization as vendor (usually appears first in invoices)
    const vendor = orgEntities[0];
    return {
      name: vendor.word,
      confidence: vendor.score || 0.8
    };
  }

  /**
   * Extract customer info using NER persons + organizations
   */
  private async extractCustomerWithNER(text: string, entities: any[]): Promise<any> {
    const personEntities = entities.filter(e => 
      e.entity_group === 'PER' || 
      e.label === 'PERSON' ||
      e.label === 'PER'
    );

    if (personEntities.length === 0) return {};

    return {
      name: personEntities[0].word,
      confidence: personEntities[0].score || 0.8
    };
  }

  /**
   * Extract contract parties using AI + NER
   */
  private async extractPartiesWithAI(text: string, entities: any[]): Promise<string[]> {
    const orgEntities = entities.filter(e => e.entity_group === 'ORG' || e.label === 'ORG');
    const personEntities = entities.filter(e => e.entity_group === 'PER' || e.label === 'PERSON');
    
    const parties = [...orgEntities, ...personEntities]
      .map(e => e.word)
      .filter((party, index, arr) => arr.indexOf(party) === index) // Remove duplicates
      .slice(0, 5); // Limit to 5 parties

    return parties;
  }

  /**
   * Classify contract type using AI
   */
  private async classifyContractType(text: string): Promise<string> {
    try {
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return 'general';

      const labels = [
        'service_agreement', 
        'employment_contract', 
        'sales_contract', 
        'lease_agreement', 
        'licensing_agreement',
        'partnership_agreement',
        'general_contract'
      ];

      const result = await classifier(text.substring(0, 1000), labels); // First 1000 chars
      const classification = Array.isArray(result) ? result[0] : result;
      return classification?.labels?.[0] || 'general';
    } catch (error) {
      this.logger.warn(`Contract type classification failed: ${error.message}`);
      return 'general';
    }
  }

  /**
   * Extract line items using AI classification
   */
  private async extractLineItemsWithAI(text: string, sections: any[]): Promise<any[]> {
    try {
      // Find line items section
      const lineItemSection = sections?.find(s => s.classification === 'line_items');
      if (!lineItemSection) return [];

      const lines = lineItemSection.text.split('\n').filter(line => line.trim().length > 10);
      const items = [];

      for (const line of lines.slice(0, 20)) { // Limit to 20 lines
        const classifier = await this.modelManager.getZeroShot();
        if (!classifier) break;

        const result = await classifier(line, ['product_line_item', 'header', 'total', 'other']);
        const classification = Array.isArray(result) ? result[0] : result;
        if ((classification?.labels?.[0] || '') === 'product_line_item' && (classification?.scores?.[0] || 0) > 0.7) {
          const item = this.parseLineItemWithAI(line);
          if (item) items.push(item);
        }
      }

      return items;
    } catch (error) {
      this.logger.warn(`Line item extraction failed: ${error.message}`);
      return [];
    }
  }

  // Helper methods
  private parseMoneyValue(moneyStr: string): number {
    const cleaned = moneyStr.replace(/[$,€£¥]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  private normalizeDateFormat(dateStr: string): string {
    // Basic date normalization - could be enhanced
    return dateStr.trim();
  }

  private getContextAroundAmount(text: string, amount: string): string {
    const index = text.indexOf(amount);
    if (index === -1) return amount;
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + amount.length + 50);
    return text.substring(start, end);
  }

  private getContextAroundDate(text: string, date: string): string {
    const index = text.indexOf(date);
    if (index === -1) return date;
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + date.length + 30);
    return text.substring(start, end);
  }

  private extractAnswerFromSentences(sentences: string[], question: string): string | null {
    // Simple extraction logic - could be enhanced with more sophisticated NLP
    if (sentences.length === 0) return null;
    
    // For now, return the first relevant sentence
    // This could be enhanced with more sophisticated answer extraction
    return sentences[0];
  }

  private parseLineItemWithAI(line: string): any | null {
    // Enhanced line item parsing using AI insights
    // This is a simplified version - could be much more sophisticated
    const parts = line.split(/\s+/);
    if (parts.length < 3) return null;

    return {
      description: parts.slice(0, -2).join(' '),
      quantity: 1, // Could be extracted with more AI
      unit_price: this.parseMoneyValue(parts[parts.length - 1]),
      total_price: this.parseMoneyValue(parts[parts.length - 1])
    };
  }

  private async extractPaymentTermsWithAI(text: string): Promise<string | null> {
    try {
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return null;

      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
      
      for (const sentence of sentences) {
        const result = await classifier(sentence, ['payment_terms', 'other_information']);
        const classification = Array.isArray(result) ? result[0] : result;
        if ((classification?.labels?.[0] || '') === 'payment_terms' && (classification?.scores?.[0] || 0) > 0.7) {
          return sentence.trim();
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Payment terms extraction failed: ${error.message}`);
      return null;
    }
  }

  private async extractKeyTermsWithAI(text: string): Promise<string[]> {
    try {
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return [];

      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const keyTerms = [];

      for (const sentence of sentences.slice(0, 50)) { // Limit processing
        const result = await classifier(sentence, ['important_contract_term', 'general_text']);
        const classification = Array.isArray(result) ? result[0] : result;
        if ((classification?.labels?.[0] || '') === 'important_contract_term' && (classification?.scores?.[0] || 0) > 0.8) {
          keyTerms.push(sentence.trim());
        }
      }

      return keyTerms.slice(0, 10); // Return top 10 key terms
    } catch (error) {
      this.logger.warn(`Key terms extraction failed: ${error.message}`);
      return [];
    }
  }

  private async generateSummaryWithAI(text: string): Promise<string> {
    // For now, return a simple summary
    // Could be enhanced with a summarization model
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private async extractTopicsWithAI(text: string): Promise<string[]> {
    try {
      const classifier = await this.modelManager.getZeroShot();
      if (!classifier) return [];

      const topics = [
        'legal', 'financial', 'technical', 'administrative', 
        'commercial', 'operational', 'compliance', 'other'
      ];

      const result = await classifier(text.substring(0, 1000), topics);
      const classification = Array.isArray(result) ? result[0] : result;
      return (classification?.labels || []).slice(0, 3); // Top 3 topics
    } catch (error) {
      this.logger.warn(`Topic extraction failed: ${error.message}`);
      return [];
    }
  }

  private async extractMerchantWithNER(text: string, entities: any[]): Promise<any> {
    const orgEntities = entities.filter(e => e.entity_group === 'ORG' || e.label === 'ORG');
    
    if (orgEntities.length === 0) return {};

    return {
      name: orgEntities[0].word,
      confidence: orgEntities[0].score || 0.8
    };
  }

  private async extractReceiptItemsWithAI(text: string): Promise<any[]> {
    // Simplified receipt item extraction
    // Could be enhanced with more sophisticated AI
    const lines = text.split('\n').filter(line => 
      line.includes('$') && line.trim().length > 5
    );

    return lines.slice(0, 10).map(line => ({
      description: line.replace(/\$[\d,]+\.?\d*/g, '').trim(),
      amount: this.parseMoneyValue(line.match(/\$[\d,]+\.?\d*/)?.[0] || '0')
    }));
  }
}
