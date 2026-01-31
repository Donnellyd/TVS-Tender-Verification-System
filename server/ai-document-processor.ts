import OpenAI from "openai";

const getOpenAIClient = () => {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

export interface DocumentExtractionResult {
  documentType: string;
  confidence: number;
  extractedData: Record<string, any>;
  validationResults: ValidationResult[];
  fraudIndicators: FraudIndicator[];
  language: string;
  metadata: DocumentMetadata;
}

export interface ValidationResult {
  field: string;
  status: "valid" | "invalid" | "warning" | "missing";
  message: string;
  value?: string;
}

export interface FraudIndicator {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  confidence: number;
}

export interface DocumentMetadata {
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  referenceNumber?: string;
  holderName?: string;
  registrationNumber?: string;
}

const DOCUMENT_TYPE_PROMPTS: Record<string, string> = {
  tax_clearance: `Analyze this tax clearance certificate and extract:
    - Taxpayer name and registration number
    - Tax reference number
    - Issue date and expiry date
    - Issuing authority
    - Tax compliance status
    - Any conditions or restrictions`,
  
  company_registration: `Analyze this company registration document and extract:
    - Company name and registration number
    - Date of incorporation
    - Company type/status
    - Registered address
    - Directors names
    - Share capital information`,
  
  bbbee_certificate: `Analyze this B-BBEE certificate and extract:
    - Company name and registration number
    - B-BBEE level (1-8 or Non-Compliant)
    - Verification agency name
    - Certificate number
    - Issue date and expiry date
    - Black ownership percentage
    - Management control percentage`,
  
  csd_registration: `Analyze this Central Supplier Database (CSD) registration and extract:
    - Supplier name and number
    - MAAA number
    - Registration date
    - Tax compliance status
    - Verification status
    - Service categories`,
  
  bank_confirmation: `Analyze this bank confirmation letter and extract:
    - Account holder name
    - Bank name and branch
    - Account number (last 4 digits only)
    - Account type
    - Date of letter
    - Account status`,
  
  professional_registration: `Analyze this professional registration/license and extract:
    - Professional name
    - Registration/License number
    - Professional body name
    - Registration date and expiry
    - Specialization/Category
    - Status`,
  
  insurance_certificate: `Analyze this insurance certificate and extract:
    - Policyholder name
    - Insurance company
    - Policy number
    - Coverage type and amount
    - Start date and expiry date
    - Covered activities`,
  
  general: `Analyze this document and extract all relevant information including:
    - Document type
    - Key parties mentioned
    - Important dates
    - Reference numbers
    - Any obligations or conditions`,
};

export async function analyzeDocument(
  documentContent: string,
  documentType: string = "general",
  language: string = "en"
): Promise<DocumentExtractionResult> {
  const openai = getOpenAIClient();
  if (!openai) {
    return {
      documentType: documentType,
      confidence: 0,
      extractedData: {},
      validationResults: [{
        field: "analysis",
        status: "invalid",
        message: "AI service not configured - OpenAI API key required",
      }],
      fraudIndicators: [],
      language: language,
      metadata: {},
    };
  }

  const prompt = DOCUMENT_TYPE_PROMPTS[documentType] || DOCUMENT_TYPE_PROMPTS.general;
  
  const languageInstruction = language !== "en" 
    ? `The document may be in ${language}. Translate all extracted information to English.`
    : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert document analyzer for tender and procurement verification. 
          ${languageInstruction}
          
          Analyze documents thoroughly and return structured JSON data.
          Always include confidence scores (0-1) for extracted fields.
          Flag any potential fraud indicators or document anomalies.
          
          Return your analysis in this exact JSON format:
          {
            "documentType": "identified document type",
            "confidence": 0.95,
            "extractedData": { "field": "value" },
            "validationResults": [
              { "field": "fieldName", "status": "valid|invalid|warning|missing", "message": "details", "value": "extracted value" }
            ],
            "fraudIndicators": [
              { "type": "indicator type", "severity": "low|medium|high|critical", "description": "details", "confidence": 0.8 }
            ],
            "language": "detected language code",
            "metadata": {
              "issuer": "issuing authority",
              "issueDate": "YYYY-MM-DD",
              "expiryDate": "YYYY-MM-DD",
              "referenceNumber": "ref number",
              "holderName": "entity name",
              "registrationNumber": "reg number"
            }
          }`
        },
        {
          role: "user",
          content: `${prompt}\n\nDocument content:\n${documentContent}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      documentType: result.documentType || documentType,
      confidence: result.confidence || 0.5,
      extractedData: result.extractedData || {},
      validationResults: result.validationResults || [],
      fraudIndicators: result.fraudIndicators || [],
      language: result.language || language,
      metadata: result.metadata || {},
    };
  } catch (error) {
    console.error("AI document analysis error:", error);
    return {
      documentType: documentType,
      confidence: 0,
      extractedData: {},
      validationResults: [{
        field: "analysis",
        status: "invalid",
        message: "Failed to analyze document",
      }],
      fraudIndicators: [],
      language: language,
      metadata: {},
    };
  }
}

export async function detectDocumentType(
  documentContent: string
): Promise<{ type: string; confidence: number }> {
  const openai = getOpenAIClient();
  if (!openai) {
    return { type: "other", confidence: 0 };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a document classification expert for procurement and tender documents.
          
          Classify the document into one of these types:
          - tax_clearance: Tax compliance certificates
          - company_registration: Company incorporation documents
          - bbbee_certificate: B-BBEE/BEE certificates
          - csd_registration: Central Supplier Database registration
          - bank_confirmation: Bank letters and account confirmations
          - professional_registration: Professional licenses and registrations
          - insurance_certificate: Insurance policies and certificates
          - tender_document: Tender specifications and requirements
          - bid_submission: Bid/proposal submissions
          - contract: Contracts and agreements
          - invoice: Invoices and payment documents
          - other: Unclassified documents
          
          Return JSON: { "type": "document_type", "confidence": 0.95 }`
        },
        {
          role: "user",
          content: `Classify this document:\n\n${documentContent.substring(0, 3000)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      type: result.type || "other",
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("Document type detection error:", error);
    return { type: "other", confidence: 0 };
  }
}

export async function checkFraudIndicators(
  documentContent: string,
  documentMetadata?: DocumentMetadata
): Promise<FraudIndicator[]> {
  const openai = getOpenAIClient();
  if (!openai) {
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a fraud detection expert for procurement documents.
          
          Analyze documents for these fraud indicators:
          - Inconsistent dates (expired documents, future dates)
          - Mismatched names or registration numbers
          - Unusual formatting or template issues
          - Missing required fields or stamps
          - Suspicious contact information
          - Signs of document alteration
          - Unusually round numbers in financial documents
          - Inconsistencies between document content and metadata
          
          Return JSON array of fraud indicators:
          [
            {
              "type": "indicator type",
              "severity": "low|medium|high|critical",
              "description": "detailed description",
              "confidence": 0.8
            }
          ]
          
          Return empty array if no indicators found.`
        },
        {
          role: "user",
          content: `Analyze this document for fraud indicators:
          
          ${documentMetadata ? `Known metadata: ${JSON.stringify(documentMetadata)}` : ""}
          
          Document content:
          ${documentContent}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.indicators || result.fraudIndicators || [];
  } catch (error) {
    console.error("Fraud detection error:", error);
    return [];
  }
}

export async function validateAgainstComplianceRules(
  extractedData: Record<string, any>,
  rules: Array<{
    field: string;
    operator: string;
    value?: string;
    threshold?: number;
  }>
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  for (const rule of rules) {
    const fieldValue = extractedData[rule.field];
    let status: ValidationResult["status"] = "valid";
    let message = "";
    
    switch (rule.operator) {
      case "exists":
        if (!fieldValue) {
          status = "missing";
          message = `Required field '${rule.field}' is missing`;
        } else {
          message = `Field '${rule.field}' is present`;
        }
        break;
        
      case "not_expired":
        if (fieldValue) {
          const expiryDate = new Date(fieldValue);
          if (expiryDate < new Date()) {
            status = "invalid";
            message = `Field '${rule.field}' has expired (${fieldValue})`;
          } else {
            message = `Field '${rule.field}' is valid until ${fieldValue}`;
          }
        } else {
          status = "missing";
          message = `Expiry date field '${rule.field}' is missing`;
        }
        break;
        
      case "equals":
        if (fieldValue !== rule.value) {
          status = "invalid";
          message = `Field '${rule.field}' should be '${rule.value}', got '${fieldValue}'`;
        } else {
          message = `Field '${rule.field}' matches expected value`;
        }
        break;
        
      case "greater_than":
        const numValue = parseFloat(fieldValue);
        if (isNaN(numValue) || numValue <= (rule.threshold || 0)) {
          status = "invalid";
          message = `Field '${rule.field}' should be greater than ${rule.threshold}`;
        } else {
          message = `Field '${rule.field}' meets threshold requirement`;
        }
        break;
        
      case "less_than":
        const numVal = parseFloat(fieldValue);
        if (isNaN(numVal) || numVal >= (rule.threshold || 0)) {
          status = "invalid";
          message = `Field '${rule.field}' should be less than ${rule.threshold}`;
        } else {
          message = `Field '${rule.field}' meets threshold requirement`;
        }
        break;
        
      case "matches_pattern":
        if (rule.value && fieldValue) {
          const regex = new RegExp(rule.value);
          if (!regex.test(fieldValue)) {
            status = "invalid";
            message = `Field '${rule.field}' does not match expected format`;
          } else {
            message = `Field '${rule.field}' format is valid`;
          }
        }
        break;
        
      default:
        status = "warning";
        message = `Unknown operator '${rule.operator}' for field '${rule.field}'`;
    }
    
    results.push({
      field: rule.field,
      status,
      message,
      value: fieldValue?.toString(),
    });
  }
  
  return results;
}

export async function generateComplianceReport(
  documentResults: DocumentExtractionResult[],
  bidDetails: { tenderId: string; vendorId: string; bidAmount?: number }
): Promise<{
  overallScore: number;
  status: "compliant" | "non_compliant" | "partial" | "pending_review";
  summary: string;
  recommendations: string[];
  detailedResults: Array<{
    documentType: string;
    status: string;
    issues: string[];
    score: number;
  }>;
}> {
  const detailedResults = documentResults.map(result => {
    const issues = [
      ...result.validationResults.filter(v => v.status !== "valid").map(v => v.message),
      ...result.fraudIndicators.map(f => `${f.severity.toUpperCase()}: ${f.description}`),
    ];
    
    const validCount = result.validationResults.filter(v => v.status === "valid").length;
    const totalCount = result.validationResults.length || 1;
    const fraudPenalty = result.fraudIndicators.reduce((acc, f) => {
      const penalties = { low: 5, medium: 15, high: 30, critical: 50 };
      return acc + penalties[f.severity];
    }, 0);
    
    const score = Math.max(0, Math.min(100, (validCount / totalCount) * 100 - fraudPenalty));
    
    return {
      documentType: result.documentType,
      status: issues.length === 0 ? "passed" : issues.some(i => i.includes("critical")) ? "failed" : "warning",
      issues,
      score,
    };
  });
  
  const overallScore = detailedResults.length > 0
    ? detailedResults.reduce((acc, r) => acc + r.score, 0) / detailedResults.length
    : 0;
  
  const hasCriticalIssues = detailedResults.some(r => r.status === "failed");
  const hasWarnings = detailedResults.some(r => r.status === "warning");
  
  let status: "compliant" | "non_compliant" | "partial" | "pending_review";
  if (hasCriticalIssues) {
    status = "non_compliant";
  } else if (hasWarnings) {
    status = "partial";
  } else if (overallScore >= 80) {
    status = "compliant";
  } else {
    status = "pending_review";
  }
  
  const allIssues = detailedResults.flatMap(r => r.issues);
  const recommendations: string[] = [];
  
  if (allIssues.some(i => i.toLowerCase().includes("expired"))) {
    recommendations.push("Update expired documents before resubmission");
  }
  if (allIssues.some(i => i.toLowerCase().includes("missing"))) {
    recommendations.push("Submit all required documents to complete the application");
  }
  if (allIssues.some(i => i.toLowerCase().includes("fraud") || i.includes("CRITICAL"))) {
    recommendations.push("Documents flagged for manual review - contact support if legitimate");
  }
  
  return {
    overallScore: Math.round(overallScore),
    status,
    summary: `Bid evaluation completed with ${overallScore.toFixed(0)}% compliance score. ${detailedResults.filter(r => r.status === "passed").length}/${detailedResults.length} documents passed verification.`,
    recommendations,
    detailedResults,
  };
}
