import React, { useState } from "react";
import Button from "../../../components/atoms/Button/Button";
import AIAnalysisErrorBoundary from "../../../components/ErrorBoundary/AIAnalysisErrorBoundary";
import "./AIAnalysis.css";

import { UploadModalData, KeyData } from '../types/AIAnalysisTypes';

interface AIAnalysisModalProps {
  isOpen: boolean;
  data: UploadModalData | null;
  onConfirm: (editedData: UploadModalData) => void;
  onCancel: () => void;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  data,
  onConfirm,
  onCancel,
}) => {
  const [editedData, setEditedData] = useState<UploadModalData | null>(data);
  // Removed unused activeTab state
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  React.useEffect(() => {
    if (data) {
      // Custom deep copy that preserves File objects
      const deepCopyWithFiles = {
        ...data,
        files: data.files.map((file) => ({
          ...file,
          originalFile: file.originalFile, // Preserve the original File object
        })),
      };
      setEditedData(deepCopyWithFiles);
    }
  }, [data]);

  if (!isOpen || !data || !editedData) return null;

  const handleFieldChange = (fileIndex: number, field: string, value: string | number | boolean) => {
    const newData = { ...editedData };
    newData.files[fileIndex] = { ...newData.files[fileIndex], [field]: value };
    setEditedData(newData);
  };

  const handleKeyDataChange = (fileIndex: number, key: string, value: string | number | boolean | null | undefined) => {
    const newData = { ...editedData };
    newData.files[fileIndex].keyData = {
      ...newData.files[fileIndex].keyData,
      [key]: value,
    };
    setEditedData(newData);
  };

  // Function to check if the selected workflow requires Slack approval
  const isSlackApprovalWorkflow = () => {
    const workflow = editedData?.selectedWorkflow || data?.selectedWorkflow;
    if (!workflow) return false;

    // Check if workflow was specifically configured for Slack approval during workflow creation
    return (
      workflow.workflowType === "approval" &&
      workflow.approvalMethod === "slack"
    );
  };

  const handleConfirm = async () => {
    if (isSlackApprovalWorkflow()) {
      // Handle Slack approval workflow
      console.log(
        "Detected Slack approval workflow - creating approval request",
      );
      await handleSlackApprovalFlow();
    } else {
      // Handle normal workflow
      onConfirm(editedData);
    }
  };

  const handleSlackApprovalFlow = async () => {
    try {
      const currentFile = editedData.files[selectedFileIndex];
      const workflow = editedData?.selectedWorkflow || data?.selectedWorkflow;

      console.log("Preparing approval request for:", {
        fileName: currentFile.fileName,
        workflowName: workflow?.name,
        documentType: currentFile.documentType,
      });

      // Upload the document first
      const uploadPromises = editedData.files.map(
        async (analysisResult, index: number) => {
          const originalFile =
            analysisResult.originalFile || editedData.originalFiles[index];

          if (!originalFile) {
            throw new Error(
              `Missing original file data for ${analysisResult.fileName || "unknown file"}`,
            );
          }

          // Convert file to base64 for upload
          const fileContent = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              const base64Content = base64.split(",")[1] || base64;
              resolve(base64Content);
            };
            reader.onerror = reject;
            reader.readAsDataURL(originalFile);
          });

          const uploadData = {
            originalName: originalFile.name || analysisResult.fileName,
            mimeType: originalFile.type,
            size: originalFile.size,
            content: fileContent,
            workflowId: analysisResult.workflowId,
            aiAnalysis: {
              documentType: analysisResult.documentType,
              keyData: analysisResult.keyData,
              confidence: analysisResult.confidence,
              extractedText: analysisResult.extractedText,
              metadata: analysisResult.metadata,
              workflowName: analysisResult.workflowName,
            },
            // Mark as requiring approval
            requiresApproval: true,
            approvalMethod: "slack",
          };

          // Upload document using the test-upload endpoint
          const response = await fetch(
            "http://localhost:3000/documents/test-upload",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(uploadData),
            },
          );

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          return response.json();
        },
      );

      const uploadResults = await Promise.all(uploadPromises);
      console.log("Documents uploaded, now creating approval requests...");

      // Create approval requests for each uploaded document
      for (const result of uploadResults) {
        if (result.documentId) {
          const currentFile =
            editedData.files.find(
              (f) =>
                f.fileName === result.originalName ||
                f.originalFile?.name === result.originalName,
            ) || editedData.files[0];

          const approvalData = {
            documentId: result.documentId,
            workflowId: currentFile.workflowId || workflow?.id || workflow?._id,
            stepName: "Document Review",
            approvalType: "document_processing",
            requesterId: "user-system", // TODO: Get actual user ID
            title: `${currentFile.documentType || "Document"} Review Required`,
            description: `Please review the AI-extracted data from "${currentFile.fileName}" before saving to database.`,
            metadata: {
              documentName: currentFile.fileName,
              documentType: currentFile.documentType,
              workflowName: currentFile.workflowName || workflow?.name,
              extractedData: currentFile.keyData,
              confidence: currentFile.confidence,
              slackChannel:
                workflow?.integrations?.approval?.channel || "#approvals",
            },
            expiresInHours: 24,
          };

          console.log("Creating approval request:", approvalData.title);

          // Create the approval request
          const approvalResponse = await fetch(
            "http://localhost:3000/approvals",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(approvalData),
            },
          );

          if (!approvalResponse.ok) {
            console.error(
              "Failed to create approval request:",
              await approvalResponse.text(),
            );
          } else {
            const approval = await approvalResponse.json();
            console.log("Approval request created:", approval.approval?.id);
          }
        }
      }

      // Show success message and close modal
      alert(
        "Success! Documents uploaded and sent for Slack approval. Check your Slack channel for approval requests.",
      );
      onConfirm(editedData); // This will close the modal and trigger parent cleanup
    } catch (error) {
      console.error("Slack approval flow failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process documents for approval: ${errorMessage}`);
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const currentFile = editedData.files[selectedFileIndex];

  // Helper functions for dynamic field rendering
  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2"); // Handle camelCase
  };

  const getInputType = (key: string, value: unknown): string => {
    if (typeof value === "number") return "number";
    if (key.toLowerCase().includes("date")) return "date";
    if (key.toLowerCase().includes("email")) return "email";
    if (key.toLowerCase().includes("phone")) return "tel";
    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("price") ||
      key.toLowerCase().includes("total")
    )
      return "number";
    return "text";
  };

  const formatDateForInput = (value: unknown, key: string): string => {
    if (!value) return "";

    // If it's already a date field, try to format it
    if (key.toLowerCase().includes("date")) {
      const dateStr = String(value);

      // Handle "Mar 06 2012" format
      if (
        dateStr.match(
          /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{4}$/i,
        )
      ) {
        try {
          const date = new Date(dateStr);
          if (date instanceof Date && !isNaN(date.getTime())) {
            return date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD
          }
        } catch {
          console.warn("Date parsing failed:", dateStr);
        }
      }

      // Handle existing ISO dates or other formats
      try {
        const date = new Date(dateStr);
        if (date instanceof Date && !isNaN(date.getTime())) {
          return date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD
        }
      } catch {
        // If all date parsing fails, return the original value
      }
    }

    return String(value);
  };

  const handleArrayItemChange = (
    fileIndex: number,
    path: string[],
    itemIndex: number,
    value: string | number | boolean,
  ) => {
    const newData = { ...editedData };
    let target = newData.files[fileIndex].keyData;

    // Navigate to the array
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]]) target[path[i]] = {};
      target = target[path[i]];
    }

    // Update the array item
    const arrayKey = path[path.length - 1];
    if (!Array.isArray(target[arrayKey])) {
      target[arrayKey] = [];
    }
    target[arrayKey][itemIndex] = value;

    setEditedData(newData);
  };

  // Helper function to handle nested key-value pairs for complex data like invoices
  const handleNestedKeyDataChange = (
    fileIndex: number,
    path: string[],
    value: string | number | boolean | null | undefined,
  ) => {
    const newData = { ...editedData };
    let target = newData.files[fileIndex].keyData;

    // Navigate to the nested property
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]]) target[path[i]] = {};
      target = target[path[i]];
    }

    target[path[path.length - 1]] = value;
    setEditedData(newData);
  };

  // Function to render complex invoice data or simple key-value pairs
  const renderKeyData = (keyData: KeyData, fileIndex: number) => {
    // List of metadata fields to skip in the main data rendering
    const metadataFields = new Set([
      "metadata",
      "extractedFields",
      "extractionConfidence",
      "documentType",
      "language",
      "fieldsFound",
      "totalFields",
      "aiFieldCount",
      "patternFieldCount",
      "extractionMethod",
      "extractionSummary",
    ]);

    // Dynamically render nested structures based on what was actually extracted
    const renderDynamicStructure = (obj: Record<string, unknown>, basePath: string[] = []) => {
      const elements: React.ReactElement[] = [];

      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...basePath, key];
        const fieldKey = currentPath.join(".");

        if (value === null || value === undefined) {
          return; // Skip null/undefined values
        }

        // Skip metadata fields if we're at the root level
        if (basePath.length === 0 && metadataFields.has(key)) {
          return;
        }

        // Handle arrays (like line items)
        if (Array.isArray(value)) {
          if (value.length > 0) {
            elements.push(
              <div key={fieldKey} className="ai-array-section">
                <h5>
                  {formatFieldLabel(key)} ({value.length} items)
                </h5>
                {value.map((item: unknown, index: number) => (
                  <div key={`${fieldKey}.${index}`} className="ai-array-item">
                    <h6>
                      {formatFieldLabel(key)} {index + 1}
                    </h6>
                    <div className="ai-array-item-fields">
                      {typeof item === "object" ? (
                        renderDynamicStructure(item, [
                          ...currentPath,
                          index.toString(),
                        ])
                      ) : (
                        <input
                          type="text"
                          value={String(item || "")}
                          onChange={(e) =>
                            handleArrayItemChange(
                              fileIndex,
                              currentPath,
                              index,
                              e.target.value,
                            )
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>,
            );
          }
        }
        // Handle nested objects
        else if (typeof value === "object") {
          const nestedElements = renderDynamicStructure(value, currentPath);
          if (nestedElements.length > 0) {
            // Determine field type for themed styling
            const getFieldType = (fieldKey: string) => {
              if (
                fieldKey.includes("financial") ||
                fieldKey.includes("money") ||
                fieldKey.includes("price")
              )
                return "financial";
              if (fieldKey.includes("date") || fieldKey.includes("time"))
                return "date";
              if (
                fieldKey.includes("vendor") ||
                fieldKey.includes("supplier") ||
                fieldKey.includes("company")
              )
                return "vendor";
              if (
                fieldKey.includes("customer") ||
                fieldKey.includes("client") ||
                fieldKey.includes("buyer")
              )
                return "customer";
              if (
                fieldKey.includes("payment") ||
                fieldKey.includes("terms") ||
                fieldKey.includes("billing")
              )
                return "payment";
              return "default";
            };

            elements.push(
              <div
                key={fieldKey}
                className="ai-nested-section"
                data-field-type={getFieldType(key)}
              >
                <h5>{formatFieldLabel(key)}</h5>
                <div className="ai-nested-fields">{nestedElements}</div>
              </div>,
            );
          }
        }
        // Handle primitive values
        else {
          const inputType = getInputType(key, value);
          const displayValue =
            inputType === "date"
              ? formatDateForInput(value, key)
              : String(value || "");
          elements.push(
            <div key={fieldKey} className="ai-key-value-pair">
              <label>{formatFieldLabel(key)}:</label>
              <input
                type={inputType}
                step={inputType === "number" ? "0.01" : undefined}
                value={displayValue}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    currentPath,
                    inputType === "number"
                      ? parseFloat(e.target.value) || 0
                      : e.target.value,
                  )
                }
                placeholder={`Enter ${formatFieldLabel(key).toLowerCase()}`}
              />
            </div>,
          );
        }
      });

      return elements;
    };

    // Check if we have any valid data to render
    if (!keyData || Object.keys(keyData).length === 0) {
      return (
        <div className="ai-no-data">
          <p>No structured data was extracted from this document.</p>
          <p>
            The AI analysis may need improvement or the document format might
            not be supported.
          </p>
        </div>
      );
    }

    // If there's an error in extraction, show it
    if (keyData.error) {
      return (
        <div className="ai-error-data">
          <p>
            <strong>Extraction Error:</strong> {keyData.error}
          </p>
          <p>
            You can still process the document, but manual review may be needed.
          </p>
        </div>
      );
    }

    // Render the dynamic structure
    const dynamicElements = renderDynamicStructure(keyData);

    if (dynamicElements.length === 0) {
      // Fallback to simple key-value pairs if dynamic rendering fails
      return Object.entries(keyData).map(([key, value]) => {
        const inputType = getInputType(key, value);
        const displayValue =
          typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : inputType === "date"
              ? formatDateForInput(value, key)
              : String(value || "");
        return (
          <div key={key} className="ai-key-value-pair">
            <label>{formatFieldLabel(key)}:</label>
            {typeof value === "object" ? (
              <textarea
                value={displayValue}
                onChange={(e) => {
                  try {
                    const parsedValue = JSON.parse(e.target.value);
                    handleKeyDataChange(fileIndex, key, parsedValue);
                  } catch {
                    handleKeyDataChange(fileIndex, key, e.target.value);
                  }
                }}
                rows={3}
                className="ai-json-textarea"
              />
            ) : (
              <input
                type={inputType}
                step={inputType === "number" ? "0.01" : undefined}
                value={displayValue}
                onChange={(e) =>
                  handleKeyDataChange(fileIndex, key, e.target.value)
                }
              />
            )}
          </div>
        );
      });
    }

    return (
      <div className="ai-dynamic-data">
        {renderInvoiceLayout(keyData, fileIndex)}
      </div>
    );
  };

  // Invoice-style layout renderer
  const renderInvoiceLayout = (keyData: KeyData, fileIndex: number) => {
    const financial = keyData.financial_info || {};
    const vendor = keyData.vendor_info || {};
    const customer = keyData.customer_info || {};
    const dateInfo = keyData.date_info || {};
    const lineItems = keyData.line_items || [];
    const payment = keyData.payment_info || {};
    const invoiceNumber = keyData.invoice_number || "";

    return (
      <>
        {/* Invoice Header */}
        <div className="ai-invoice-header">
          <h1 className="ai-invoice-title">Invoice</h1>
          <div className="ai-invoice-number-section">
            <div className="ai-detail-label">Invoice Number</div>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) =>
                handleNestedKeyDataChange(
                  fileIndex,
                  ["invoice_number"],
                  e.target.value,
                )
              }
              placeholder="Enter invoice number"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "0.5rem",
                marginTop: "0.25rem",
                fontWeight: "600",
                fontSize: "1.25rem",
              }}
            />
          </div>
        </div>

        {/* Company and Billing Information */}
        <div className="ai-invoice-parties">
          <div className="ai-party-section">
            <h3 className="ai-party-title">From (Vendor)</h3>
            <div className="ai-key-value-pair">
              <label>Company Name:</label>
              <input
                type="text"
                value={vendor.name || ""}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["vendor_info", "name"],
                    e.target.value,
                  )
                }
                placeholder="Enter vendor name"
              />
            </div>
          </div>

          <div className="ai-party-section">
            <h3 className="ai-party-title">Bill To (Customer)</h3>
            <div className="ai-key-value-pair">
              <label>Customer Name:</label>
              <input
                type="text"
                value={customer.name || ""}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["customer_info", "name"],
                    e.target.value,
                  )
                }
                placeholder="Enter customer name"
              />
            </div>
            <div className="ai-key-value-pair">
              <label>Billing Address:</label>
              <input
                type="text"
                value={customer.billing_address || ""}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["customer_info", "billing_address"],
                    e.target.value,
                  )
                }
                placeholder="Enter billing address"
              />
            </div>
            <div className="ai-key-value-pair">
              <label>Shipping Address:</label>
              <input
                type="text"
                value={customer.shipping_address || ""}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["customer_info", "shipping_address"],
                    e.target.value,
                  )
                }
                placeholder="Enter shipping address"
              />
            </div>
          </div>
        </div>

        {/* Invoice Details Bar */}
        <div className="ai-invoice-details-bar">
          <div className="ai-detail-item">
            <div className="ai-detail-label">Invoice Date</div>
            <input
              type="date"
              value={formatDateForInput(dateInfo.invoice_date, "invoice_date")}
              onChange={(e) =>
                handleNestedKeyDataChange(
                  fileIndex,
                  ["date_info", "invoice_date"],
                  e.target.value,
                )
              }
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "0.5rem",
                marginTop: "0.25rem",
              }}
            />
          </div>
          <div className="ai-detail-item">
            <div className="ai-detail-label">Currency</div>
            <input
              type="text"
              value={financial.currency || "$"}
              onChange={(e) =>
                handleNestedKeyDataChange(
                  fileIndex,
                  ["financial_info", "currency"],
                  e.target.value,
                )
              }
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "0.5rem",
                marginTop: "0.25rem",
                textAlign: "center",
              }}
            />
          </div>
        </div>

        {/* Line Items Table */}
        <table className="ai-invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length > 0 ? (
              lineItems.map((item: Record<string, unknown>, index: number) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={item.description || ""}
                      onChange={(e) =>
                        handleArrayItemChange(
                          fileIndex,
                          ["line_items"],
                          index,
                          { ...item, description: e.target.value },
                        )
                      }
                      placeholder="Item description"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleArrayItemChange(
                          fileIndex,
                          ["line_items"],
                          index,
                          {
                            ...item,
                            quantity: parseFloat(e.target.value) || 0,
                          },
                        )
                      }
                      placeholder="Qty"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) =>
                        handleArrayItemChange(
                          fileIndex,
                          ["line_items"],
                          index,
                          {
                            ...item,
                            unit_price: parseFloat(e.target.value) || 0,
                          },
                        )
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.total_price || ""}
                      onChange={(e) =>
                        handleArrayItemChange(
                          fileIndex,
                          ["line_items"],
                          index,
                          {
                            ...item,
                            total_price: parseFloat(e.target.value) || 0,
                          },
                        )
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", color: "#6b7280" }}
                >
                  No line items found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Financial Totals */}
        <div className="ai-invoice-totals">
          <div className="ai-totals-section">
            <div className="ai-total-row">
              <span className="ai-total-label">Total Amount:</span>
              <div className="ai-total-value">
                <input
                  type="number"
                  value={financial.total || ""}
                  onChange={(e) =>
                    handleNestedKeyDataChange(
                      fileIndex,
                      ["financial_info", "total"],
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms and Order Info */}
        <div className="ai-invoice-footer">
          <div className="ai-footer-section">
            <h4 className="ai-footer-title">Payment Terms</h4>
            <div className="ai-key-value-pair">
              <label>Terms:</label>
              <input
                type="text"
                value={payment.terms || ""}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["payment_info", "terms"],
                    e.target.value,
                  )
                }
                placeholder="e.g., Net 30, Due on receipt, COD"
              />
            </div>
            <div className="ai-key-value-pair">
              <label>Due Date:</label>
              <input
                type="date"
                value={formatDateForInput(payment.due_date, "due_date")}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["payment_info", "due_date"],
                    e.target.value,
                  )
                }
                placeholder="Payment due date"
              />
            </div>
          </div>

          <div className="ai-footer-section">
            <h4 className="ai-footer-title">Order Information</h4>
            <div className="ai-key-value-pair">
              <label>Order ID:</label>
              <input
                type="text"
                value={payment.order_id || payment.terms || ""} // Fallback to old terms field
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["payment_info", "order_id"],
                    e.target.value,
                  )
                }
                placeholder="Order/Transaction ID"
                style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
              />
            </div>
            <div className="ai-key-value-pair">
              <label>Notes:</label>
              <textarea
                value={keyData.notes || "Thanks for your business!"}
                onChange={(e) =>
                  handleNestedKeyDataChange(
                    fileIndex,
                    ["notes"],
                    e.target.value,
                  )
                }
                placeholder="Additional notes or instructions"
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  // Removed unused getNestedValue function

  // renderExtractionMetadata function removed - not used

  const renderAnalysisContent = () => (
    <div className="ai-analysis-content">
      {editedData.files.length > 1 && (
        <div className="ai-file-selector">
          <label htmlFor="file-selector">Select File:</label>
          <select
            id="file-selector"
            value={selectedFileIndex}
            onChange={(e) => setSelectedFileIndex(parseInt(e.target.value))}
          >
            {editedData.files.map((file, index) => (
              <option key={index} value={index}>
                {file.fileName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Professional Header with Key Metrics */}
      <div className="ai-analysis-header">
        <div className="ai-metric">
          <div className="ai-metric-label">Accuracy</div>
          <div className="ai-metric-value">
            {formatConfidence(currentFile.confidence)}
          </div>
        </div>
        <div className="ai-metric">
          <div className="ai-metric-label">Document Type</div>
          <div className="ai-metric-value">
            <select
              value={currentFile.documentType || "unknown"}
              onChange={(e) =>
                handleFieldChange(
                  selectedFileIndex,
                  "documentType",
                  e.target.value,
                )
              }
              className="ai-metric-select"
            >
              <option value="unknown">Unknown</option>
              <option value="invoice">Invoice</option>
              <option value="contract">Contract</option>
              <option value="receipt">Receipt</option>
              <option value="legal">Legal Document</option>
              <option value="form">Form</option>
              <option value="document">General Document</option>
            </select>
          </div>
        </div>
        <div className="ai-metric">
          <div className="ai-metric-label">File Name</div>
          <div className="ai-metric-value ai-metric-filename">
            {currentFile.fileName}
          </div>
        </div>
      </div>

      {/* Key Data Section */}
      {currentFile.keyData && Object.keys(currentFile.keyData).length > 0 && (
        <div className="ai-key-data-section">
          <h3>Key Data Extracted</h3>
          <div className="ai-key-data">
            {renderKeyData(currentFile.keyData, selectedFileIndex)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AIAnalysisErrorBoundary onRetry={() => window.location.reload()}>
      <div className="ai-modal-backdrop">
        <div className="ai-modal">
          <div className="ai-modal-header">
            <div className="ai-title-section">
              <h2>AI Analysis Results</h2>
              <p>Review and edit the extracted information</p>
            </div>
            <button className="ai-close-btn" onClick={onCancel}>
              ×
            </button>
          </div>

          <div className="ai-modal-body">{renderAnalysisContent()}</div>

          <div className="ai-modal-footer">
            <div className="ai-footer-info">
              <span className="ai-file-count">
                {editedData.files.length} file
                {editedData.files.length !== 1 ? "s" : ""} analyzed
              </span>
            </div>
            <div className="ai-footer-actions">
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                {isSlackApprovalWorkflow()
                  ? "Send for Slack Approval"
                  : "Continue with Upload"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AIAnalysisErrorBoundary>
  );
};

export default AIAnalysisModal;
