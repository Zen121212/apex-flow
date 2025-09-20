import { Injectable, Logger } from "@nestjs/common";
import { WorkflowSelectorService } from "../workflows/services/selection/workflow-selector.service";
import { DocumentAnalyzerService } from "../documents/services/core/document-analyzer.service";

@Injectable()
export class DebugAnalysisService {
  private readonly logger = new Logger(DebugAnalysisService.name);

  constructor(
    private readonly workflowSelector: WorkflowSelectorService,
    private readonly documentAnalyzer: DocumentAnalyzerService,
  ) {}

  // ---------- Categorization ----------
  async analyzeDocumentCategorization(params: {
    filename: string;
    mimeType: string;
    size: number;
  }) {
    const { filename, mimeType, size } = params;

    const filenameRules = [
      {
        rule: 'Contains "invoice"',
        pattern: /invoice/i,
        category: "invoice",
        score: 0.9,
      },
      {
        rule: 'Contains "inv-" prefix',
        pattern: /^inv-/i,
        category: "invoice",
        score: 0.85,
      },
      {
        rule: 'Contains "bill"',
        pattern: /bill/i,
        category: "invoice",
        score: 0.8,
      },
      {
        rule: 'Contains "contract"',
        pattern: /contract/i,
        category: "contract",
        score: 0.9,
      },
      {
        rule: 'Contains "agreement"',
        pattern: /agreement/i,
        category: "contract",
        score: 0.85,
      },
      {
        rule: 'Contains "nda"',
        pattern: /nda/i,
        category: "legal",
        score: 0.9,
      },
      {
        rule: 'Contains "receipt"',
        pattern: /receipt/i,
        category: "receipt",
        score: 0.8,
      },
      {
        rule: 'Contains "rcp-" prefix',
        pattern: /^rcp-/i,
        category: "receipt",
        score: 0.75,
      },
      {
        rule: 'Contains "legal"',
        pattern: /legal/i,
        category: "legal",
        score: 0.8,
      },
      {
        rule: 'Contains "financial"',
        pattern: /financial/i,
        category: "financial",
        score: 0.7,
      },
      {
        rule: 'Contains "statement"',
        pattern: /statement/i,
        category: "financial",
        score: 0.65,
      },
      {
        rule: 'Contains "report"',
        pattern: /report/i,
        category: "financial",
        score: 0.6,
      },
      {
        rule: 'Contains "form"',
        pattern: /form/i,
        category: "form",
        score: 0.7,
      },
      {
        rule: 'Contains "application"',
        pattern: /application/i,
        category: "form",
        score: 0.65,
      },
      {
        rule: "Contains date pattern",
        pattern: /\d{4}[-_]\d{2}[-_]\d{2}/,
        category: "financial",
        score: 0.5,
      },
      {
        rule: "Contains numbers (amounts)",
        pattern: /\$\d+|\d+\.\d{2}/,
        category: "financial",
        score: 0.4,
      },
    ];

    const analysisRules = filenameRules.map((r) => ({
      rule: r.rule,
      matched: r.pattern.test(filename),
      score: r.score,
      category: r.category,
    }));

    const mimeTypeAnalysis = this.analyzeMimeType(mimeType);
    const sizeAnalysis = this.analyzeFileSize(size);

    const matched = analysisRules.filter((r) => r.matched);
    const best = matched.reduce((b, c) => (c.score > b.score ? c : b), {
      score: 0,
      category: "other" as string,
    });

    let finalCategory = best.category || "other";
    let finalConfidence = best.score || 0.3;

    if (
      mimeTypeAnalysis.confidence > 0.6 &&
      mimeTypeAnalysis.category !== finalCategory
    ) {
      finalCategory = mimeTypeAnalysis.category;
      finalConfidence = Math.max(finalConfidence, mimeTypeAnalysis.confidence);
    }
    if (
      sizeAnalysis.confidence > 0.5 &&
      sizeAnalysis.category === "legal" &&
      finalCategory === "other"
    ) {
      finalCategory = "legal";
      finalConfidence = 0.6;
    }

    return {
      filename,
      detectedCategory: finalCategory,
      confidence: finalConfidence,
      analysisRules,
      mimeTypeAnalysis,
      sizeAnalysis,
    };
  }

  // ---------- Workflow selection ----------
  async analyzeWorkflowSelection(req: {
    filename: string;
    mimeType: string;
    size: number;
    workflowSelectionMode?: "manual" | "auto" | "hybrid";
    workflowId?: string;
    documentCategory?: string;
  }) {
    const {
      filename,
      mimeType,
      size,
      workflowSelectionMode,
      workflowId,
      documentCategory,
    } = req;

    const categorization = await this.analyzeDocumentCategorization({
      filename,
      mimeType,
      size,
    });

    const mockDocument = { originalName: filename, mimeType, size } as any;
    const selectionOptions = {
      workflowId,
      documentCategory,
      autoDetectWorkflow: true,
      workflowSelectionMode: workflowSelectionMode || "hybrid",
    };

    const selection = await this.workflowSelector.selectWorkflow(
      mockDocument,
      selectionOptions,
    );

    const availableWorkflows = [
      {
        id: "invoice-processing-workflow",
        name: "Invoice Processing",
        suitability: this.suitability(
          categorization.detectedCategory,
          "invoice",
        ),
        reason: "Advanced OCR and field extraction for invoices",
      },
      {
        id: "contract-analysis-workflow",
        name: "Contract Analysis",
        suitability: this.suitability(
          categorization.detectedCategory,
          "contract",
        ),
        reason: "Legal term extraction and compliance checking",
      },
      {
        id: "receipt-processing-workflow",
        name: "Receipt Processing",
        suitability: this.suitability(
          categorization.detectedCategory,
          "receipt",
        ),
        reason: "Expense tracking and merchant identification",
      },
      {
        id: "legal-document-workflow",
        name: "Legal Document Proc.",
        suitability: this.suitability(categorization.detectedCategory, "legal"),
        reason: "Confidentiality and legal compliance checks",
      },
      {
        id: "financial-analysis-workflow",
        name: "Financial Analysis",
        suitability: this.suitability(
          categorization.detectedCategory,
          "financial",
        ),
        reason: "Financial data extraction and reporting",
      },
      {
        id: "form-processing-workflow",
        name: "Form Processing",
        suitability: this.suitability(categorization.detectedCategory, "form"),
        reason: "Form field extraction and validation",
      },
      {
        id: "demo-workflow-1",
        name: "General Processing",
        suitability: 0.5,
        reason: "Basic document processing (default)",
      },
    ].sort((a, b) => b.suitability - a.suitability);

    const decisionTree = this.buildDecisionTree(
      categorization,
      selectionOptions,
      selection,
    );

    return {
      selectedWorkflow: selection.workflowId,
      method: selection.method,
      confidence: selection.confidence,
      reason: selection.reason,
      alternatives: selection.alternativeWorkflows || [],
      availableWorkflows,
      decisionTree,
    };
  }

  // ---------- Invoice extraction ----------
  async extractInvoiceData(filename: string, extractedText: string) {
    const start = Date.now();
    const { invoiceData, extractionBreakdown } =
      await this.extractRealInvoiceDataWithBreakdown(filename, extractedText);
    const processingTime = Date.now() - start;

    return {
      invoiceData,
      processingTime,
      extractionMethod: "AI extraction via DocumentAnalyzerService",
      extractionDetails: extractionBreakdown,
    };
  }

  // ---------- Private helpers (kept out of controller) ----------
  private analyzeMimeType(mimeType: string) {
    const table: Record<string, { category: string; confidence: number }> = {
      "application/pdf": { category: "legal", confidence: 0.6 },
      "application/msword": { category: "form", confidence: 0.7 },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        { category: "form", confidence: 0.7 },
      "text/plain": { category: "other", confidence: 0.3 },
      "image/jpeg": { category: "receipt", confidence: 0.5 },
      "image/png": { category: "receipt", confidence: 0.5 },
    };
    const pick = table[mimeType] || { category: "other", confidence: 0.2 };
    return { type: mimeType, ...pick };
  }

  private analyzeFileSize(sizeBytes: number) {
    const sizeMB = sizeBytes / (1024 * 1024);
    let category = "other",
      confidence = 0.3;
    if (sizeMB > 5) {
      category = "legal";
      confidence = 0.7;
    } else if (sizeMB > 1) {
      category = "financial";
      confidence = 0.5;
    } else if (sizeMB < 0.5) {
      category = "receipt";
      confidence = 0.4;
    }
    return {
      sizeBytes,
      sizeMB: Math.round(sizeMB * 100) / 100,
      category,
      confidence,
    };
  }

  private suitability(detected: string, workflow: string): number {
    if (detected === workflow) return 0.95;
    const cross: Record<string, Record<string, number>> = {
      invoice: { financial: 0.7, form: 0.6 },
      contract: { legal: 0.8, financial: 0.5 },
      receipt: { financial: 0.8, invoice: 0.6 },
      legal: { contract: 0.8 },
      financial: { invoice: 0.7, receipt: 0.6 },
      form: { invoice: 0.5, legal: 0.4 },
    };
    return cross[detected]?.[workflow] ?? 0.3;
  }

  private buildDecisionTree(categorization: any, options: any, result: any) {
    return [
      {
        step: "Manual Workflow ID Check",
        condition: `options.workflowId = "${options.workflowId || "none"}"`,
        result: !!options.workflowId,
        impact: options.workflowId
          ? "Direct workflow selection"
          : "Continue to next step",
      },
      {
        step: "Manual Category Check",
        condition: `options.documentCategory = "${options.documentCategory || "none"}"`,
        result: !!options.documentCategory,
        impact: options.documentCategory
          ? "Category-based workflow mapping"
          : "Continue to AI detection",
      },
      {
        step: "AI Category Detection",
        condition: `Detected: ${categorization.detectedCategory} (${Math.round(categorization.confidence * 100)}%)`,
        result: categorization.confidence > 0.5,
        impact:
          categorization.confidence > 0.5
            ? "High confidence detection"
            : "Low confidence, use default",
      },
      {
        step: "Workflow Selection Mode",
        condition: `Mode: ${options.workflowSelectionMode || "hybrid"}`,
        result: true,
        impact: `Applied ${result.method} logic`,
      },
      {
        step: "Final Decision",
        condition: `Selected: ${result.workflowId}`,
        result: true,
        impact: `Confidence: ${Math.round(result.confidence * 100)}%`,
      },
    ];
  }

  private async extractRealInvoiceDataWithBreakdown(
    filename: string,
    extractedText: string,
  ) {
    try {
      const analysis = await this.documentAnalyzer.analyzeInvoice({
        filename,
        content: extractedText,
        mimeType: "application/pdf",
      });

      const invoiceData = {
        invoiceNumber: analysis.invoiceNumber,
        serialNumber: analysis.serialNumber,
        vendorInfo: {
          name: analysis.vendor?.name,
          address: analysis.vendor?.address,
          taxId: analysis.vendor?.taxId,
          phone: analysis.vendor?.phone,
          email: analysis.vendor?.email,
        },
        customerInfo: {
          name: analysis.customer?.name,
          address: analysis.customer?.address,
          taxId: analysis.customer?.taxId,
        },
        dateInfo: {
          invoiceDate: analysis.dates?.invoiceDate,
          dueDate: analysis.dates?.dueDate,
          serviceDate: analysis.dates?.serviceDate,
        },
        financialInfo: {
          subtotal: analysis.amounts?.subtotal,
          taxAmount: analysis.amounts?.tax,
          shippingAmount: null,
          discountAmount: null,
          totalAmount: analysis.amounts?.total,
          currency: analysis.amounts?.currency,
        },
        lineItems: (analysis.lineItems || []).map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          productCode: i.productCode,
        })),
        paymentInfo: {
          terms: analysis.paymentTerms,
          method: analysis.paymentMethod,
          bankDetails: analysis.bankDetails,
        },
        metadata: {
          extractionConfidence: analysis.confidence ?? 0.85,
          documentType: "invoice",
          language: analysis.language || "en",
          fieldsFound: this.countFoundFields(analysis),
          totalFields: 25,
        },
      };

      // Build breakdown from analyzer (mark as AI)
      const fieldBreakdown: Array<{
        fieldName: string;
        value: string | number;
        method: string;
        confidence: number;
        position: string;
        icon: string;
      }> = [];
      const push = (name: string, v: any, c = analysis.confidence ?? 0.85) => {
        if (v === undefined || v === null || v === "") return;
        fieldBreakdown.push({
          fieldName: name,
          value: v,
          method: "🤖 AI Model",
          confidence: c,
          position: "N/A",
          icon: "🤖",
        });
      };
      push("invoiceNumber", analysis.invoiceNumber);
      push("serialNumber", analysis.serialNumber);
      push("vendor.name", analysis.vendor?.name);
      push("vendor.address", analysis.vendor?.address);
      push("vendor.taxId", analysis.vendor?.taxId);
      push("vendor.phone", analysis.vendor?.phone);
      push("vendor.email", analysis.vendor?.email);
      push("customer.name", analysis.customer?.name);
      push("customer.address", analysis.customer?.address);
      push("customer.taxId", analysis.customer?.taxId);
      push("dates.invoiceDate", analysis.dates?.invoiceDate);
      push("dates.dueDate", analysis.dates?.dueDate);
      push("dates.serviceDate", analysis.dates?.serviceDate);
      push("amounts.subtotal", analysis.amounts?.subtotal);
      push("amounts.tax", analysis.amounts?.tax);
      push("amounts.total", analysis.amounts?.total);
      push("amounts.currency", analysis.amounts?.currency);
      (analysis.lineItems || []).slice(0, 5).forEach((li, i) => {
        push(`lineItems[${i}].description`, li.description);
        push(`lineItems[${i}].quantity`, li.quantity);
        push(`lineItems[${i}].unitPrice`, li.unitPrice);
        push(`lineItems[${i}].totalPrice`, li.totalPrice);
        push(`lineItems[${i}].productCode`, li.productCode);
      });
      push("payment.terms", analysis.paymentTerms);
      push("payment.method", analysis.paymentMethod);
      push("payment.bankDetails", analysis.bankDetails);

      const totalFields = fieldBreakdown.length;
      return {
        invoiceData,
        extractionBreakdown: {
          totalFields,
          aiExtracted: totalFields,
          regexExtracted: 0,
          aiPercentage: totalFields
            ? Math.round((totalFields / totalFields) * 100)
            : 0,
          regexPercentage: 0,
          fieldBreakdown,
        },
      };
    } catch (err) {
      this.logger.error(
        "invoice extraction failed; falling back to regex",
        err as any,
      );
      const basic = await this.extractRealInvoiceData(filename, extractedText);
      return {
        invoiceData: basic,
        extractionBreakdown: {
          totalFields: 8,
          aiExtracted: 0,
          regexExtracted: 8,
          aiPercentage: 0,
          regexPercentage: 100,
          fieldBreakdown: [
            {
              fieldName: "Fallback Mode",
              value: "AI unavailable - basic regex",
              method: "🔍 Regex Pattern (Fallback)",
              confidence: 0.6,
              position: "System",
              icon: "⚠️",
            },
          ],
        },
      };
    }
  }

  private async extractRealInvoiceData(
    filename: string,
    extractedText: string,
  ) {
    try {
      const a = await this.documentAnalyzer.analyzeInvoice({
        filename,
        content: extractedText,
        mimeType: "application/pdf",
      });
      return {
        invoiceNumber: a.invoiceNumber,
        serialNumber: a.serialNumber,
        vendorInfo: {
          name: a.vendor?.name,
          address: a.vendor?.address,
          taxId: a.vendor?.taxId,
          phone: a.vendor?.phone,
          email: a.vendor?.email,
        },
        customerInfo: {
          name: a.customer?.name,
          address: a.customer?.address,
          taxId: a.customer?.taxId,
        },
        dateInfo: {
          invoiceDate: a.dates?.invoiceDate,
          dueDate: a.dates?.dueDate,
          serviceDate: a.dates?.serviceDate,
        },
        financialInfo: {
          subtotal: a.amounts?.subtotal,
          taxAmount: a.amounts?.tax,
          shippingAmount: null,
          discountAmount: null,
          totalAmount: a.amounts?.total,
          currency: a.amounts?.currency,
        },
        lineItems: (a.lineItems || []).map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          productCode: it.productCode,
        })),
        paymentInfo: {
          terms: a.paymentTerms,
          method: a.paymentMethod,
          bankDetails: a.bankDetails,
        },
        metadata: {
          extractionConfidence: a.confidence || 0.85,
          documentType: "invoice",
          language: a.language || "en",
          fieldsFound: this.countFoundFields(a),
          totalFields: 25,
        },
      };
    } catch {
      return this.fallbackInvoiceExtraction(filename, extractedText);
    }
  }

  private countFoundFields(a: any) {
    let c = 0;
    if (a.invoiceNumber) c++;
    if (a.serialNumber) c++;
    if (a.vendor?.name) c++;
    if (a.vendor?.address) c++;
    if (a.vendor?.taxId) c++;
    if (a.vendor?.phone) c++;
    if (a.vendor?.email) c++;
    if (a.customer?.name) c++;
    if (a.customer?.address) c++;
    if (a.customer?.taxId) c++;
    if (a.dates?.invoiceDate) c++;
    if (a.dates?.dueDate) c++;
    if (a.dates?.serviceDate) c++;
    if (a.amounts?.subtotal) c++;
    if (a.amounts?.tax) c++;
    if (a.amounts?.total) c++;
    if (a.amounts?.currency) c++;
    if (a.lineItems?.length) c += Math.min(a.lineItems.length, 5);
    if (a.paymentTerms) c++;
    if (a.paymentMethod) c++;
    if (a.bankDetails) c++;
    return c;
  }

  private fallbackInvoiceExtraction(_filename: string, text: string) {
    const extract = (p: RegExp) => text.match(p)?.[1]?.trim() ?? null;
    const extractAmount = (p: RegExp) => {
      const m = text.match(p);
      if (!m) return null;
      const n = parseFloat(m[1].replace(/,/g, ""));
      return isNaN(n) ? null : n;
    };
    return {
      invoiceNumber: extract(/invoice[\s#:]*([\w\d-]+)/i),
      serialNumber: extract(/serial[\s#:]*([\w\d-]+)/i),
      vendorInfo: {
        name: extract(/from[:\s]+([^\n]+)/i),
        address: null,
        taxId: extract(/tax[\s]*id[:\s]*([\w\d-]+)/i),
        phone: extract(/phone[:\s]*([\d\s\-\(\)\+]+)/i),
        email: extract(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/),
      },
      customerInfo: {
        name: extract(/bill[\s]+to[:\s]+([^\n]+)/i),
        address: null,
        taxId: null,
      },
      dateInfo: {
        invoiceDate: extract(/date[:\s]*([\d\/\-\.]+)/i),
        dueDate: extract(/due[\s]*date[:\s]*([\d\/\-\.]+)/i),
        serviceDate: null,
      },
      financialInfo: {
        subtotal: extractAmount(/subtotal[:\s]*\$?([\d,]+\.\d{2})/i),
        taxAmount: extractAmount(/tax[:\s]*\$?([\d,]+\.\d{2})/i),
        totalAmount: extractAmount(/total[:\s]*\$?([\d,]+\.\d{2})/i),
        currency: "USD",
      },
      lineItems: [],
      paymentInfo: {
        terms: extract(/payment[\s]*terms[:\s]*([^\n]+)/i),
        method: null,
        bankDetails: null,
      },
      metadata: {
        extractionConfidence: 0.6,
        documentType: "invoice",
        language: "en",
        fieldsFound: 8,
        totalFields: 25,
      },
    };
  }
}
