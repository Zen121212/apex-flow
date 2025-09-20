import { Logger } from '@nestjs/common';

interface ExtractedField {
  value: string;
  confidence: number;
  method: 'pattern' | 'ai';
  position?: 'header' | 'body' | 'footer';
}

export class TextAnalyzer {
  private readonly logger = new Logger(TextAnalyzer.name);
  
  private readonly patterns = {
    invoice: {
      invoice_number: [
        /(?:invoice|inv)[\s#:]*([A-Z0-9-]+)/i,
        /(?:bill|doc)[\s#:]*([A-Z0-9-]+)/i,
        /#\s*([A-Z0-9-]{3,})/
      ],
      dates: {
        invoice_date: [
          /(?:invoice|bill)\s*date\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /(?:date|issued)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /(\d{4}-\d{2}-\d{2})/
        ],
        due_date: [
          /(?:due|payment)\s*date\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /(?:due|payable)\s*by\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
        ]
      },
      amounts: {
        total: [
          /(?:total|amount|balance|sum)\s*(?:due)?[\s:]*\$?([\d,]+\.?\d*)/i,
          /\$\s*([\d,]+\.?\d*)\s*(?:total|due)$/i
        ],
        subtotal: [
          /(?:subtotal|sub-total)[\s:]*\$?([\d,]+\.?\d*)/i,
          /(?:net|pre-tax)\s*amount[\s:]*\$?([\d,]+\.?\d*)/i
        ],
        tax: [
          /(?:tax|vat|sales\s*tax)[\s:]*\$?([\d,]+\.?\d*)/i,
          /(?:\d+%?\s*tax)[\s:]*\$?([\d,]+\.?\d*)/i
        ]
      },
      contacts: {
        email: /[\w\.-]+@[\w\.-]+\.\w{2,}/g,
        phone: /(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g,
        address: /\d+\s+[\w\s,]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)[\w\s,]*\d{5}/gi
      },
      line_items: [
        // Standard format: description qty price total
        /(.*?)\s+(\d+)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)/g,
        // Alternative: qty description price total
        /(\d+)\s+(.*?)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)/g
      ]
    },
    contract: {
      parties: [
        /(?:between|party|client)[\s:]+([^\n\r.]+)/gi,
        /(?:vendor|supplier|contractor)[\s:]+([^\n\r.]+)/gi
      ],
      dates: {
        effective_date: [
          /(?:effective|start)\s*date[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /(?:commences|begins)\s*on[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
        ],
        termination_date: [
          /(?:termination|end)\s*date[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /(?:expires|concludes)\s*on[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
        ]
      },
      value: [
        /(?:contract|agreement)\s*value[\s:]*\$?([\d,]+\.?\d*)/i,
        /(?:total|sum)\s*amount[\s:]*\$?([\d,]+\.?\d*)/i
      ],
      terms: [
        /(?:payment\s*terms?)[\s:]*([^\n:]{3,30})/i,
        /(?:^|\n)\s*terms?[\s:]*([^\n:]{3,30})/i
      ]
    }
  };

  public analyzeText(text: string, documentType: string): any {
    this.logger.log(`Analyzing text as ${documentType} document`);
    
    switch (documentType.toLowerCase()) {
      case 'invoice':
        return this.analyzeInvoice(text);
      case 'contract':
        return this.analyzeContract(text);
      default:
        return this.analyzeGenericDocument(text);
    }
  }

  private analyzeInvoice(text: string): any {
    const fields: any = {};
    
    // Extract invoice number
    const invoiceNumber = this.findFirstMatch(text, this.patterns.invoice.invoice_number);
    if (invoiceNumber) {
      fields.invoice_number = invoiceNumber;
    }

    // Extract dates
    fields.date_info = {};
    for (const [dateType, patterns] of Object.entries(this.patterns.invoice.dates)) {
      const dateMatch = this.findFirstMatch(text, patterns);
      if (dateMatch) {
        fields.date_info[dateType] = this.standardizeDate(dateMatch);
      }
    }

    // Extract amounts
    fields.financial_info = {};
    for (const [amountType, patterns] of Object.entries(this.patterns.invoice.amounts)) {
      const amountMatch = this.findFirstMatch(text, patterns);
      if (amountMatch) {
        fields.financial_info[amountType] = this.parseAmount(amountMatch);
      }
    }

    // Extract contact information
    fields.vendor_info = {};
    fields.customer_info = {};
    
    const emails = text.match(this.patterns.invoice.contacts.email) || [];
    const phones = text.match(this.patterns.invoice.contacts.phone) || [];
    const addresses = text.match(this.patterns.invoice.contacts.address) || [];

    // First occurrences usually belong to vendor
    if (emails.length > 0) fields.vendor_info.email = emails[0];
    if (phones.length > 0) fields.vendor_info.phone = phones[0];
    if (addresses.length > 0) fields.vendor_info.address = addresses[0];

    // Second occurrences usually belong to customer
    if (emails.length > 1) fields.customer_info.email = emails[1];
    if (phones.length > 1) fields.customer_info.phone = phones[1];
    if (addresses.length > 1) fields.customer_info.address = addresses[1];

    // Extract line items
    const lineItems: any[] = [];
    for (const pattern of this.patterns.invoice.line_items) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Check if it's description-first or quantity-first format
        const isDescriptionFirst = isNaN(Number(match[1]));
        const item = {
          description: isDescriptionFirst ? match[1].trim() : match[2].trim(),
          quantity: parseInt(isDescriptionFirst ? match[2] : match[1]),
          unit_price: parseFloat(match[3].replace(/[^\d.]/g, '')),
          total: parseFloat(match[4].replace(/[^\d.]/g, ''))
        };
        if (this.isValidLineItem(item)) {
          lineItems.push(item);
        }
      }
    }
    
    if (lineItems.length > 0) {
      fields.line_items = lineItems;
    }

    return fields;
  }

  private analyzeContract(text: string): any {
    const fields: any = {
      contract_info: {}
    };
    
    // Extract parties
    const parties: string[] = [];
    for (const pattern of this.patterns.contract.parties) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        parties.push(match[1].trim());
      }
    }
    if (parties.length > 0) {
      fields.contract_info.parties = parties;
    }

    // Extract dates
    for (const [dateType, patterns] of Object.entries(this.patterns.contract.dates)) {
      const dateMatch = this.findFirstMatch(text, patterns);
      if (dateMatch) {
        fields.contract_info[dateType] = this.standardizeDate(dateMatch);
      }
    }

    // Extract contract value
    const valueMatch = this.findFirstMatch(text, this.patterns.contract.value);
    if (valueMatch) {
      fields.contract_info.value = this.parseAmount(valueMatch);
    }

    // Extract terms
    const termsMatch = this.findFirstMatch(text, this.patterns.contract.terms);
    if (termsMatch) {
      fields.contract_info.terms = termsMatch.trim();
    }

    return fields;
  }

  private analyzeGenericDocument(text: string): any {
    // For generic documents, try to extract common fields
    const fields: any = {};
    
    // Extract dates
    const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g;
    const dates = text.match(datePattern) || [];
    if (dates.length > 0) {
      fields.dates = dates.map(date => this.standardizeDate(date));
    }

    // Extract monetary amounts
    const amountPattern = /\$\s*([\d,]+\.?\d*)/g;
    const amounts = [];
    let match;
    while ((match = amountPattern.exec(text)) !== null) {
      amounts.push(this.parseAmount(match[1]));
    }
    if (amounts.length > 0) {
      fields.amounts = amounts;
    }

    // Extract contact information
    const contacts: any = {};
    
    const emails = text.match(this.patterns.invoice.contacts.email) || [];
    if (emails.length > 0) contacts.emails = emails;
    
    const phones = text.match(this.patterns.invoice.contacts.phone) || [];
    if (phones.length > 0) contacts.phones = phones;
    
    const addresses = text.match(this.patterns.invoice.contacts.address) || [];
    if (addresses.length > 0) contacts.addresses = addresses;

    if (Object.keys(contacts).length > 0) {
      fields.contacts = contacts;
    }

    return fields;
  }

  private findFirstMatch(text: string, patterns: RegExp | RegExp[]): string | null {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    
    for (const pattern of patternArray) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  private standardizeDate(date: string): string {
    try {
      // Handle various date formats
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
      return date; // Return original if parsing fails
    } catch {
      return date;
    }
  }

  private parseAmount(amount: string): number {
    return parseFloat(amount.replace(/[^\d.]/g, ''));
  }

  private isValidLineItem(item: any): boolean {
    return (
      item.description &&
      !isNaN(item.quantity) &&
      !isNaN(item.unit_price) &&
      !isNaN(item.total) &&
      item.quantity > 0 &&
      item.unit_price >= 0 &&
      item.total >= 0
    );
  }
}