import { Injectable, Logger } from '@nestjs/common';
import { AIFieldExtractorService } from './ai-field-extractor.service';
import { ModelManagerService } from './model-manager.service';

@Injectable()
export class FieldExtractorService {
  private readonly logger = new Logger(FieldExtractorService.name);
  private aiFieldExtractor: AIFieldExtractorService;

  constructor(private readonly modelManager: ModelManagerService) {
    this.logger.log(`FieldExtractorService initializing...`);
    // Directly instantiate AI field extractor to bypass DI issues
    this.aiFieldExtractor = new AIFieldExtractorService(this.modelManager);
    this.logger.log(`FieldExtractorService initialized with direct AI extractor`);
  }

  /**
   * Extract structured fields from document text
   * Uses AI-powered extraction when available, falls back to regex
   */
  async extractStructuredFields(text: string, documentType: string, entities: any[]): Promise<any> {
    try {
      // Try AI-powered extraction first (now always available)
      this.logger.log(`🤖 AI field extractor available - attempting AI-powered field extraction for ${documentType}`);
      const aiFields = await this.aiFieldExtractor.extractFieldsWithAI(text, documentType, entities);
      
      // Log what AI returned for debugging
      this.logger.log(`🔍 AI returned: ${JSON.stringify(aiFields, null, 2)}`);
      
      // Check if AI extraction produced quality results
      if (aiFields && Object.keys(aiFields).length > 0 && this.hasQualityFields(aiFields, text)) {
        this.logger.log(`🚀 Using AI extraction - found ${Object.keys(aiFields).length} quality AI fields`);
        this.logger.log(`🤖 AI fields: ${JSON.stringify(aiFields, null, 2)}`);
        return aiFields;
      } else {
        this.logger.log(`⚠️ AI extraction produced poor quality results, falling back to enhanced regex`);
        this.logger.log(`🤖 AI fields (rejected): ${JSON.stringify(aiFields, null, 2)}`);
      }

      // Fallback to regex-based extraction
      this.logger.log(`📝 Using regex-based field extraction for ${documentType}`);
      let regexFields;
      switch (documentType) {
        case 'invoice':
          regexFields = await this.extractInvoiceFields(text, entities);
          break;
        case 'contract':
          regexFields = await this.extractContractFields(text, entities);
          break;
        case 'receipt':
          regexFields = await this.extractReceiptFields(text, entities);
          break;
        case 'id_document':
          regexFields = await this.extractIdDocumentFields(text, entities);
          break;
        default:
          regexFields = await this.extractGeneralFields(text, entities);
      }
      this.logger.log(`📝 Regex returned: ${JSON.stringify(regexFields, null, 2)}`);
      return regexFields;
    } catch (error) {
      this.logger.warn('Structured field extraction failed:', error.message);
      return {};
    }
  }

  /**
   * Check if AI extraction returned significant results
   */
  private hasSignificantFields(fields: any): boolean {
    if (!fields || typeof fields !== 'object') return false;
    
    const fieldCount = Object.keys(fields).length;
    const nonEmptyFields = Object.values(fields).filter(value => 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;

    // Be more aggressive - use AI if we have at least 1 meaningful field
    // This allows us to see AI results more often
    return fieldCount >= 1 && nonEmptyFields >= 1;
  }

  /**
   * Check if AI extraction produced quality results (not just dumping entire text)
   */
  private hasQualityFields(fields: any, originalText: string): boolean {
    if (!fields || typeof fields !== 'object') return false;
    
    // Check for common AI extraction problems
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      if (typeof fieldValue === 'string') {
        // If any field contains more than 50% of the original text, it's probably bad
        if (fieldValue.length > originalText.length * 0.5) {
          this.logger.warn(`🚨 Field '${fieldName}' contains ${fieldValue.length} chars (${Math.round(fieldValue.length/originalText.length*100)}% of original text) - likely AI dump`);
          return false;
        }
        
        // If field contains obvious multi-field data (like shipping + payment info together)
        if (fieldValue.includes('Ship To:') && fieldValue.includes('Order ID') && fieldValue.includes('Total:')) {
          this.logger.warn(`🚨 Field '${fieldName}' contains multiple document sections - likely AI dump`);
          return false;
        }
        
        // If customer_name field is longer than 200 chars, it's probably the whole document
        if (fieldName.includes('customer') && fieldValue.length > 200) {
          this.logger.warn(`🚨 Customer field is ${fieldValue.length} chars - likely AI dump`);
          return false;
        }
        
        // If customer field contains "Ship To:" or "Order ID", it's definitely a dump
        if (fieldName.includes('customer') && (fieldValue.includes('Ship To:') || fieldValue.includes('Order ID'))) {
          this.logger.warn(`🚨 Customer field contains shipping/order info - likely AI dump`);
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Extract invoice-specific fields
   */
  private async extractInvoiceFields(text: string, entities: any[]): Promise<any> {
    const fields: any = {};
    
    // Extract financial information
    fields.financial_info = this.extractFinancialInfo(text);
    
    // Extract date information
    fields.date_info = this.extractDateInfo(text);
    
    // Extract invoice number
    fields.invoice_number = this.extractInvoiceNumber(text);
    
    // Extract serial number
    fields.serial_number = this.extractSerialNumber(text);
    
    // Extract vendor information
    fields.vendor_info = this.extractVendorInfo(text);
    
    // Extract customer information
    fields.customer_info = this.extractCustomerInfo(text);
    
    // Extract line items
    fields.line_items = this.extractLineItems(text);
    
    // Extract payment information
    fields.payment_info = this.extractPaymentInfo(text);
    
    return fields;
  }

  /**
   * Extract contract-specific fields
   */
  private async extractContractFields(text: string, entities: any[]): Promise<any> {
    const fields: any = {};
    
    // Extract parties
    fields.parties = this.extractParties(text);
    
    // Extract dates
    fields.contract_dates = this.extractContractDates(text);
    
    // Extract terms
    fields.terms = this.extractContractTerms(text);
    
    // Extract value
    fields.contract_value = this.extractContractValue(text);
    
    return fields;
  }

  /**
   * Extract receipt-specific fields
   */
  private async extractReceiptFields(text: string, entities: any[]): Promise<any> {
    const fields: any = {};
    
    // Extract merchant information
    fields.merchant_info = this.extractMerchantInfo(text);
    
    // Extract transaction information
    fields.transaction_info = this.extractTransactionInfo(text);
    
    // Extract items
    fields.items = this.extractReceiptItems(text);
    
    return fields;
  }

  /**
   * Extract ID document-specific fields
   */
  private async extractIdDocumentFields(text: string, entities: any[]): Promise<any> {
    const fields: any = {};
    
    // Extract personal information
    fields.personal_info = this.extractPersonalInfo(text);
    
    // Extract document information
    fields.document_info = this.extractDocumentInfo(text);
    
    return fields;
  }

  /**
   * Extract general document fields
   */
  private async extractGeneralFields(text: string, entities: any[]): Promise<any> {
    const fields: any = {};
    
    // Extract basic information
    fields.title = this.extractTitle(text);
    fields.summary = this.extractSummary(text);
    fields.keywords = this.extractKeywords(text);
    
    return fields;
  }

  // Helper methods for field extraction
  private extractFinancialInfo(text: string): any {
    const financialInfo: any = {};
    
    // Enhanced currency detection from working-hf-api.cjs
    if (text.includes('$')) {
      financialInfo.currency = '$';
    } else {
      // Fallback to original patterns
      const currencyPatterns = [
        /(USD|EUR|GBP|JPY|CAD)/i,
        /(\$|€|£|¥)/
      ];
      
      for (const pattern of currencyPatterns) {
        const match = text.match(pattern);
        if (match) {
          financialInfo.currency = match[1] || match[0];
          break;
        }
      }
    }
    
    // Default to $ if no currency found but amounts are present
    if (!financialInfo.currency && /[\d,]+\.?\d*/.test(text)) {
      financialInfo.currency = '$';
    }
    
    // Enhanced total amount patterns from working-hf-api.cjs
    const totalPatterns = [
      /Total:\s*\$?([\d,]+\.?\d*)/i,
      /Balance\s+Due:\s*\$?([\d,]+\.?\d*)/i,
      /Amount:\s*\$?([\d,]+\.?\d*)/i,
      /\$?([\d,]+\.\d{2})\s*(?:Total|$)/i,
      // Original patterns as fallback
      /\$([\d,]+\.\d+)\s+Subtotal:\s+Shipping:\s+Total:/i, // "$10,672.30 Subtotal: Shipping: Total:"
      /Total:\s*.*?\$?([\d,]+\.\d+)/i, // "Total: $10,672.30"
      /Balance\s+Due:\s*\$?([\d,]+\.\d+)/i, // "Balance Due: $10,672.30"
      /(?:Total|Amount)[:\s]*\$?([\d,]+\.\d+)/i, // Generic total
      /\$?([\d,]+\.\d+)\s*Total/i // "$50.10 Total"
    ];
    
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0 && amount < 1000000) {
          financialInfo.total = amount;
          break;
        }
      }
    }
    
    // Extract subtotal
    const subtotalMatch = text.match(/(?:subtotal)[:\s]*\$?([\d,]+\.?\d*)/i);
    if (subtotalMatch) {
      financialInfo.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
    }
    
    // Extract tax amount
    const taxMatch = text.match(/(?:tax|vat)[:\s]*\$?([\d,]+\.?\d*)/i);
    if (taxMatch) {
      financialInfo.tax = parseFloat(taxMatch[1].replace(/,/g, ''));
    }
    
    // Extract discount
    const discountMatch = text.match(/(?:discount)[:\s]*\(?(\d+)%?\)?\s*\$?([\d,]+\.?\d*)/i);
    if (discountMatch) {
      if (discountMatch[2]) {
        financialInfo.discount = parseFloat(discountMatch[2].replace(/,/g, ''));
      } else if (discountMatch[1]) {
        financialInfo.discount_percent = parseInt(discountMatch[1]);
      }
    }
    
    return financialInfo;
  }

  private extractDateInfo(text: string): any {
    const dateInfo: any = {};
    
    // Enhanced date patterns from working-hf-api.cjs
    const datePatterns = [
      /Date:\s*(\w{3}\s+\d{1,2}\s+\d{4})/i,
      /(\w{3}\s+\d{1,2}\s+\d{4})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/,
      // Original patterns as fallback
      /(?:invoice\s+date|date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i, // "Date: 10/23/2012"
      /(?:Date:?\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})/i, // "Oct 23 2012"
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/  // Generic date format
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        dateInfo.invoice_date = match[1];
        break;
      } else if (match && match[2] && match[3]) {
        // Month name format (Oct 23 2012)
        dateInfo.invoice_date = `${match[1]} ${match[2]} ${match[3]}`;
        break;
      }
    }
    
    // Extract due date
    const dueDateMatch = text.match(/(?:due\s+date|payment\s+due)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dueDateMatch) {
      dateInfo.due_date = dueDateMatch[1];
    }
    
    return dateInfo;
  }

  private extractInvoiceNumber(text: string): string | null {
    // Enhanced patterns from working-hf-api.cjs
    const invoicePatterns = [
      /INVOICE\s*#?\s*(\d+)/i,
      /Invoice\s*:?\s*(\d+)/i,
      /Invoice\s+Number\s*:?\s*(\d+)/i,
      /#\s*(\d+)/,
      // Original patterns as fallback
      /INVOICE\s*#\s*([A-Z0-9\-]+)/i,
      /(?:invoice\s+number|invoice\s+no)[:\s]*([A-Z0-9\-]+)/i,
      /(?:invoice)[:\s]+([A-Z0-9\-]+)/i
    ];
    
    for (const pattern of invoicePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const invoiceNum = match[1].trim();
        if (invoiceNum.length > 0 && invoiceNum.length < 20) {
          return invoiceNum;
        }
      }
    }
    
    return null;
  }

  private extractSerialNumber(text: string): string | null {
    const serialMatch = text.match(/(?:serial\s+number|serial\s+no)[:\s]*([A-Z0-9\-]+)/i);
    return serialMatch ? serialMatch[1] : null;
  }

  private extractVendorInfo(text: string): any {
    const vendorInfo: any = {};
    
    // Enhanced patterns from working-hf-api.cjs
    const fromMatch = text.match(/From:\s*([^\n]+)/i);
    if (fromMatch) {
      vendorInfo.name = fromMatch[1].trim();
    }
    
    // Look for company names in first few lines if no "From:" found
    if (!vendorInfo.name) {
      const lines = text.split('\n').slice(0, 5);
      for (const line of lines) {
        if (line.match(/\b(Inc|Corp|LLC|Ltd|Company|Corporation)\b/i) && line.length < 50) {
          vendorInfo.name = line.trim();
          break;
        }
      }
    }
    
    // Fallback to original pattern: "INVOICE # 36258 SuperStore Bill To:"
    if (!vendorInfo.name) {
      const vendorPattern = /INVOICE\s*#?\s*\d+\s+([A-Za-z\s&]+?)(?:\s+Bill\s+To)/i;
      const match = text.match(vendorPattern);
      
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 50) {
          vendorInfo.name = name;
        }
      }
    }
    
    return vendorInfo;
  }

  private extractCustomerInfo(text: string): any {
    const customerInfo: any = {};
    
    // Enhanced customer name extraction - stop at "Ship To:"
    const customerPattern = /Bill\s+To:\s*([A-Za-z\s]+?)(?:\s+Ship\s+To)/i;
    const nameMatch = text.match(customerPattern);
    
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      if (name.length > 2 && name.length < 50) {
        customerInfo.name = name;
      }
    }
    
    // If no "Bill To:" pattern, try "To:" but be more careful
    if (!customerInfo.name) {
      const toMatch = text.match(/(?:^|\n)To:\s*([A-Za-z\s]+?)(?:\s|$)/i);
      if (toMatch && toMatch[1]) {
        const name = toMatch[1].trim();
        if (name.length > 2 && name.length < 50 && !name.includes('Ship') && !name.includes('Date')) {
          customerInfo.name = name;
        }
      }
    }
    
    // Extract shipping address
    const shipMatch = text.match(/Ship\s+To:\s*([^M]*?)(?:\s+May|\s+Jan|\s+Feb|\s+Mar|\s+Apr|\s+Jun|\s+Jul|\s+Aug|\s+Sep|\s+Oct|\s+Nov|\s+Dec|Date:|$)/i);
    if (shipMatch) {
      customerInfo.shipping_address = shipMatch[1].trim();
    }
    
    // Extract shipping address: "Ship To: 90004, Los Angeles, California, United States"
    const shippingPatterns = [
      /Ship\s+To:\s*([^M]*?)(?:\s+May|\s+Jan|\s+Feb|\s+Mar|\s+Apr|\s+Jun|\s+Jul|\s+Aug|\s+Sep|\s+Oct|\s+Nov|\s+Dec|Date:|$)/i, // Stop at month names or Date
      /Ship\s+To:\s*([0-9, A-Za-z]+?)(?:\s+\w{3}\s+\d{1,2}\s+\d{4}|Date:|$)/i, // "Ship To: address May 12 2012" or Date
      /Ship\s+To:\s*([^A-Z]*?)(?:\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{4}|$)/i // Generic pattern
    ];
    
    for (const pattern of shippingPatterns) {
      const shippingMatch = text.match(pattern);
      if (shippingMatch && shippingMatch[1]) {
        const address = shippingMatch[1].trim();
        if (address.length > 5 && address.length < 200) {
          customerInfo.shipping_address = address;
          break;
        }
      }
    }
    
    return customerInfo;
  }

  private extractLineItems(text: string): any[] {
    const lineItems: any[] = [];
    
    // Multiple patterns for different invoice formats
    const itemPatterns = [
      // Pattern 1: "ItemQuantityRateAmount EcoTones Memo Sheets2$8.00$16.00 Paper, Office Supplies, OFF-PA-4014"
      /ItemQuantityRateAmount\s+([A-Za-z\s,'-]+?)(\d+)\$([\d,]+\.\d+)\$([\d,]+\.\d+)\s+([A-Za-z\s,'-]+,\s*[A-Z0-9-]+)/g,
      // Pattern 2: "Samsung Smart Phone, VoIP5$2,120.80$10,604.00 Phones, Technology, TEC-PH-5841"
      /([A-Za-z\s,'-]+?)(\d+)\$([\d,]+\.\d+)\$([\d,]+\.\d+)\s+([A-Za-z\s,'-]+,\s*[A-Z0-9-]+)/g,
      // Pattern 3: Simple format without category - "EcoTones Memo Sheets2$8.00$16.00"
      /([A-Za-z\s,'-]+?)(\d+)\$([\d,]+\.\d+)\$([\d,]+\.\d+)(?:\s|$)/g
    ];
    
    for (const pattern of itemPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let description = match[1].trim();
        const quantity = parseInt(match[2]);
        const unitPrice = parseFloat(match[3].replace(/,/g, ''));
        const totalPrice = parseFloat(match[4].replace(/,/g, ''));
        const category = match[5] ? match[5].trim() : '';
        
        // Clean up description - remove "ItemQuantityRateAmount" prefix if present
        description = description.replace(/^ItemQuantityRateAmount\s+/i, '');
        
        // Combine description with category if available
        if (category) {
          description = `${description} - ${category}`;
        }
        
        if (description && quantity > 0 && unitPrice > 0) {
          lineItems.push({
            description: description,
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice
          });
        }
      }
      
      // If we found items, break
      if (lineItems.length > 0) break;
    }
    
    return lineItems;
  }

  private extractPaymentInfo(text: string): any {
    const paymentInfo: any = {};
    
    // Enhanced Order ID extraction from working-hf-api.cjs
    const orderIdMatch = text.match(/Order\s+ID\s*:\s*([A-Z0-9\-]+)/i);
    if (orderIdMatch) {
      paymentInfo.order_id = orderIdMatch[1];
    } else {
      // Look for patterns like CA-2012-AH10030140-41041
      const orderPattern = text.match(/([A-Z]{2}-\d{4}-[A-Z]{2}\d+)/);
      if (orderPattern) {
        paymentInfo.order_id = orderPattern[1];
      }
    }
    
    // Fallback to original patterns
    if (!paymentInfo.order_id) {
      const orderIdPatterns = [
        /(?:Reference|Ref)\s*#?\s*:\s*([A-Z0-9\-]+)/i,
        /Transaction\s+ID\s*:\s*([A-Z0-9\-]+)/i
      ];
      
      for (const pattern of orderIdPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          paymentInfo.order_id = match[1].trim();
          break;
        }
      }
    }
    
    // Enhanced payment terms extraction - avoid Order IDs
    const termPatterns = [
      /(?:payment\s+terms)[:\s]*([A-Za-z0-9\s\/]+?)(?:\s+Order\s+ID|\n|$)/i, // "Payment Terms: Net 30"
      /(?:due|payable)[:\s]*([A-Za-z0-9\s]+?)(?:\s+days?|\n|$)/i, // "Due: 30 days"
      /(?:net)[:\s]*(\d+\s*days?)/i, // "Net 30 days"
      /Terms:\s*([A-Za-z0-9\s\/]+?)(?:\s+Order\s+ID|\n|$)/i // "Terms: Net 30" but not "Terms: Order ID:"
    ];
    
    for (const pattern of termPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const terms = match[1].trim();
        // Filter out order IDs, empty terms, and common non-payment phrases
        if (terms.length > 2 && terms.length < 50 && 
            !terms.match(/^[A-Z]{2}-\d{4}-[A-Z]{2}\d+/) && // Not an order ID pattern
            !terms.match(/^Order\s+ID/i) && // Not "Order ID"
            !terms.match(/^\s*$/) && // Not empty
            !terms.match(/^(ID|Thanks|Note)/i)) { // Not common non-payment words
          paymentInfo.terms = terms;
          break;
        }
      }
    }
    
    // If we still got an Order ID in terms, clear it
    if (paymentInfo.terms && paymentInfo.terms.includes('CA-2012-AH')) {
      delete paymentInfo.terms;
    }
    
    // Don't set a default - leave empty if no terms found
    // This allows the frontend to show it as empty rather than fake data
    
    return paymentInfo;
  }

  private extractParties(text: string): string[] {
    const parties: string[] = [];
    
    // Extract party names (simplified)
    const partyMatches = text.match(/(?:party|parties)[:\s]*([^\n]+)/gi);
    if (partyMatches) {
      partyMatches.forEach(match => {
        const party = match.replace(/(?:party|parties)[:\s]*/gi, '').trim();
        if (party) parties.push(party);
      });
    }
    
    return parties;
  }

  private extractContractDates(text: string): any {
    const dates: any = {};
    
    // Extract effective date
    const effectiveMatch = text.match(/(?:effective\s+date|start\s+date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (effectiveMatch) {
      dates.effective_date = effectiveMatch[1];
    }
    
    // Extract expiration date
    const expirationMatch = text.match(/(?:expiration\s+date|end\s+date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (expirationMatch) {
      dates.expiration_date = expirationMatch[1];
    }
    
    return dates;
  }

  private extractContractTerms(text: string): string[] {
    const terms: string[] = [];
    
    // Extract key terms (simplified)
    const termMatches = text.match(/(?:term|clause|section)\s+\d+[:\s]*([^\n]+)/gi);
    if (termMatches) {
      termMatches.forEach(match => {
        const term = match.replace(/(?:term|clause|section)\s+\d+[:\s]*/gi, '').trim();
        if (term) terms.push(term);
      });
    }
    
    return terms;
  }

  private extractContractValue(text: string): string | null {
    const valueMatch = text.match(/(?:contract\s+value|value)[:\s]*\$?([\d,]+\.?\d*)/i);
    return valueMatch ? valueMatch[1] : null;
  }

  private extractMerchantInfo(text: string): any {
    const merchantInfo: any = {};
    
    // Extract merchant name
    const lines = text.split('\n');
    if (lines.length > 0) {
      merchantInfo.name = lines[0].trim();
    }
    
    return merchantInfo;
  }

  private extractTransactionInfo(text: string): any {
    const transactionInfo: any = {};
    
    // Extract transaction date
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      transactionInfo.date = dateMatch[1];
    }
    
    // Extract total amount
    const totalMatch = text.match(/(?:total|amount)[:\s]*\$?([\d,]+\.?\d*)/i);
    if (totalMatch) {
      transactionInfo.total = parseFloat(totalMatch[1].replace(/,/g, ''));
    }
    
    return transactionInfo;
  }

  private extractReceiptItems(text: string): any[] {
    const items: any[] = [];
    
    // Simple item extraction
    const lines = text.split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/([^\d]+)\s+\$?([\d,]+\.?\d*)/);
      if (itemMatch) {
        items.push({
          description: itemMatch[1].trim(),
          price: parseFloat(itemMatch[2].replace(/,/g, ''))
        });
      }
    }
    
    return items;
  }

  private extractPersonalInfo(text: string): any {
    const personalInfo: any = {};
    
    // Extract name
    const nameMatch = text.match(/(?:name)[:\s]*([^\n]+)/i);
    if (nameMatch) {
      personalInfo.name = nameMatch[1].trim();
    }
    
    // Extract date of birth
    const dobMatch = text.match(/(?:date\s+of\s+birth|dob)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dobMatch) {
      personalInfo.date_of_birth = dobMatch[1];
    }
    
    return personalInfo;
  }

  private extractDocumentInfo(text: string): any {
    const documentInfo: any = {};
    
    // Extract document number
    const docMatch = text.match(/(?:document\s+number|id\s+number)[:\s]*([A-Z0-9\-]+)/i);
    if (docMatch) {
      documentInfo.number = docMatch[1];
    }
    
    // Extract issue date
    const issueMatch = text.match(/(?:issue\s+date|issued)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (issueMatch) {
      documentInfo.issue_date = issueMatch[1];
    }
    
    return documentInfo;
  }

  private extractTitle(text: string): string | null {
    const lines = text.split('\n');
    return lines.length > 0 ? lines[0].trim() : null;
  }

  private extractSummary(text: string): string | null {
    const sentences = text.split(/[.!?]+/);
    return sentences.length > 0 ? sentences[0].trim() : null;
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const keywords = words.filter(word => word.length > 3 && !commonWords.has(word));
    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * Count extracted fields
   */
  countExtractedFields(fields: any): number {
    let count = 0;
    for (const [key, value] of Object.entries(fields)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        count += Object.keys(value).length;
      } else if (value && !Array.isArray(value)) {
        count++;
      } else if (Array.isArray(value)) {
        count += value.length;
      }
    }
    return count;
  }
}
