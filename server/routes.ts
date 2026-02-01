import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { tenantRouter } from "./tenant-routes";
import { apiV1Router } from "./api-v1-routes";
import { securityHeaders, createRateLimiter, auditLogger } from "./security-middleware";
import {
  insertMunicipalitySchema,
  insertVendorSchema,
  insertTenderSchema,
  insertDocumentSchema,
  insertComplianceRuleSchema,
  insertComplianceCheckSchema,
  insertTenderRequirementSchema,
  insertBidSubmissionSchema,
  insertSubmissionDocumentSchema,
  insertEvaluationScoreSchema,
  insertLetterTemplateSchema,
  insertGeneratedLetterSchema,
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

// Multer config for PDF parsing (tender documents)
const pdfUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Multer config for document uploads (any file type)
const documentUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for documents
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Apply security headers to all requests
  app.use(securityHeaders);

  // Apply rate limiting to API routes
  const apiRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 100 });
  app.use("/api", apiRateLimiter);

  // Apply audit logging to API routes
  app.use("/api", auditLogger("api_request"));

  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Register tenant and billing routes
  app.use("/api", tenantRouter);

  // Register API v1 routes (uses API key auth, not session auth)
  app.use("/api/v1", apiV1Router);

  // Auth-protected API routes (except auth routes themselves, API v1, and public endpoints)
  app.use(/^\/api(?!\/auth|\/login|\/logout|\/callback|\/subscription-tiers|\/compliance\/countries|\/chatbot|\/v1)/, isAuthenticated);

  // Municipalities
  app.get("/api/municipalities", async (req, res) => {
    try {
      const municipalities = await storage.getMunicipalities();
      res.json(municipalities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch municipalities" });
    }
  });

  app.get("/api/municipalities/:id", async (req, res) => {
    try {
      const municipality = await storage.getMunicipality(req.params.id);
      if (!municipality) {
        return res.status(404).json({ error: "Municipality not found" });
      }
      res.json(municipality);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch municipality" });
    }
  });

  app.post("/api/municipalities", async (req, res) => {
    try {
      const data = insertMunicipalitySchema.parse(req.body);
      const municipality = await storage.createMunicipality(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_municipality",
        entityType: "municipality",
        entityId: municipality.id,
        details: { name: municipality.name },
      });
      res.status(201).json(municipality);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      // PostgreSQL unique constraint violation: code 23505
      if (error.code === "23505" || error.constraint?.includes("code") || 
          (error.message && (error.message.includes("unique") || error.message.includes("duplicate")))) {
        return res.status(400).json({ error: "A municipality with this code already exists" });
      }
      res.status(500).json({ error: "Failed to create municipality" });
    }
  });

  app.put("/api/municipalities/:id", async (req, res) => {
    try {
      const data = insertMunicipalitySchema.partial().parse(req.body);
      const municipality = await storage.updateMunicipality(req.params.id, data);
      if (!municipality) {
        return res.status(404).json({ error: "Municipality not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "update_municipality",
        entityType: "municipality",
        entityId: municipality.id,
        details: { name: municipality.name },
      });
      res.json(municipality);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      // PostgreSQL unique constraint violation: code 23505
      if (error.code === "23505" || error.constraint?.includes("code") || 
          (error.message && (error.message.includes("unique") || error.message.includes("duplicate")))) {
        return res.status(400).json({ error: "A municipality with this code already exists" });
      }
      res.status(500).json({ error: "Failed to update municipality" });
    }
  });

  app.delete("/api/municipalities/:id", async (req, res) => {
    try {
      const success = await storage.deleteMunicipality(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Municipality not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "delete_municipality",
        entityType: "municipality",
        entityId: req.params.id,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete municipality" });
    }
  });

  // Vendors
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const data = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_vendor",
        entityType: "vendor",
        entityId: vendor.id,
        details: { companyName: vendor.companyName },
      });
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  app.put("/api/vendors/:id", async (req, res) => {
    try {
      const data = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(req.params.id, data);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "update_vendor",
        entityType: "vendor",
        entityId: vendor.id,
        details: { companyName: vendor.companyName },
      });
      res.json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    try {
      const vendorId = req.params.id;
      
      // First, delete all related bid submissions and their documents
      const submissions = await storage.getBidSubmissionsByVendor(vendorId);
      for (const submission of submissions) {
        // Delete submission documents first
        const submissionDocs = await storage.getSubmissionDocuments(submission.id);
        for (const doc of submissionDocs) {
          await storage.deleteSubmissionDocument(doc.id);
        }
        // Delete evaluation scores
        await storage.deleteEvaluationScoresBySubmission(submission.id);
        // Delete generated letters
        await storage.deleteGeneratedLettersBySubmission(submission.id);
        // Delete the submission
        await storage.deleteBidSubmission(submission.id);
      }
      
      // Delete documents directly associated with vendor
      await storage.deleteDocumentsByVendor(vendorId);
      
      // Delete compliance checks directly associated with vendor (not via submission)
      await storage.deleteComplianceChecksByVendor(vendorId);
      
      // Now delete the vendor
      const success = await storage.deleteVendor(vendorId);
      if (!success) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "delete_vendor",
        entityType: "vendor",
        entityId: vendorId,
      });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete vendor:", error);
      res.status(500).json({ error: "Failed to delete vendor" });
    }
  });

  // Tenders
  app.get("/api/tenders", async (req, res) => {
    try {
      const tenders = await storage.getTenders();
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenders" });
    }
  });

  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const tender = await storage.getTender(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender" });
    }
  });

  const parseDate = (value: unknown): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
    if (typeof value === "string") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  };

  app.post("/api/tenders", async (req, res) => {
    try {
      const body = { ...req.body };
      body.closingDate = parseDate(body.closingDate);
      body.openingDate = parseDate(body.openingDate);
      body.awardDate = parseDate(body.awardDate);
      
      if (!body.closingDate) {
        return res.status(400).json({ error: "A valid closing date is required" });
      }
      
      const data = insertTenderSchema.parse(body);
      const tender = await storage.createTender(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_tender",
        entityType: "tender",
        entityId: tender.id,
        details: { tenderNumber: tender.tenderNumber, title: tender.title },
      });
      res.status(201).json(tender);
    } catch (error) {
      console.error("Failed to create tender:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create tender" });
    }
  });

  app.put("/api/tenders/:id", async (req, res) => {
    try {
      const body = { ...req.body };
      // Validate and parse dates - reject invalid date strings rather than silently clearing
      if (body.closingDate !== undefined) {
        const parsed = parseDate(body.closingDate);
        if (body.closingDate && !parsed) {
          return res.status(400).json({ error: "Invalid closing date format" });
        }
        body.closingDate = parsed;
      }
      if (body.openingDate !== undefined) {
        const parsed = parseDate(body.openingDate);
        if (body.openingDate && !parsed) {
          return res.status(400).json({ error: "Invalid opening date format" });
        }
        body.openingDate = parsed;
      }
      if (body.awardDate !== undefined) {
        const parsed = parseDate(body.awardDate);
        if (body.awardDate && !parsed) {
          return res.status(400).json({ error: "Invalid award date format" });
        }
        body.awardDate = parsed;
      }
      const data = insertTenderSchema.partial().parse(body);
      const tender = await storage.updateTender(req.params.id, data);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "update_tender",
        entityType: "tender",
        entityId: tender.id,
        details: { tenderNumber: tender.tenderNumber },
      });
      res.json(tender);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update tender" });
    }
  });

  app.delete("/api/tenders/:id", async (req, res) => {
    try {
      const tenderId = req.params.id;
      
      // Delete all related bid submissions and their documents first
      const submissions = await storage.getBidSubmissions(tenderId);
      for (const submission of submissions) {
        // Delete submission documents first
        const submissionDocs = await storage.getSubmissionDocuments(submission.id);
        for (const doc of submissionDocs) {
          await storage.deleteSubmissionDocument(doc.id);
        }
        // Delete evaluation scores
        await storage.deleteEvaluationScoresBySubmission(submission.id);
        // Delete generated letters
        await storage.deleteGeneratedLettersBySubmission(submission.id);
        // Delete the submission
        await storage.deleteBidSubmission(submission.id);
      }
      
      // Delete tender requirements
      const requirements = await storage.getTenderRequirements(tenderId);
      for (const reqItem of requirements) {
        await storage.deleteTenderRequirement(reqItem.id);
      }
      
      // Delete tender scoring criteria
      await storage.deleteTenderScoringCriteriaByTender(tenderId);
      
      // Delete documents directly associated with tender
      await storage.deleteDocumentsByTender(tenderId);
      
      // Delete compliance checks directly associated with tender (not via submission)
      await storage.deleteComplianceChecksByTender(tenderId);
      
      // Now delete the tender
      const success = await storage.deleteTender(tenderId);
      if (!success) {
        return res.status(404).json({ error: "Tender not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "delete_tender",
        entityType: "tender",
        entityId: tenderId,
      });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete tender:", error);
      res.status(500).json({ error: "Failed to delete tender" });
    }
  });

  // Documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_document",
        entityType: "document",
        entityId: document.id,
        details: { name: document.name, type: document.documentType },
      });
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const data = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(req.params.id, data);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "update_document",
        entityType: "document",
        entityId: document.id,
        details: { name: document.name },
      });
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const success = await storage.deleteDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "delete_document",
        entityType: "document",
        entityId: req.params.id,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Compliance Rules
  app.get("/api/compliance-rules", async (req, res) => {
    try {
      const rules = await storage.getComplianceRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance rules" });
    }
  });

  app.post("/api/compliance-rules", async (req, res) => {
    try {
      const data = insertComplianceRuleSchema.parse(req.body);
      const rule = await storage.createComplianceRule(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_compliance_rule",
        entityType: "compliance_rule",
        entityId: rule.id,
        details: { name: rule.name },
      });
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create compliance rule" });
    }
  });

  // Compliance Checks
  app.get("/api/compliance-checks", async (req, res) => {
    try {
      const checks = await storage.getComplianceChecks();
      res.json(checks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance checks" });
    }
  });

  app.post("/api/compliance-checks", async (req, res) => {
    try {
      const data = insertComplianceCheckSchema.parse(req.body);
      const check = await storage.createComplianceCheck({
        ...data,
        performedBy: (req as any).user?.id,
      });
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_compliance_check",
        entityType: "compliance_check",
        entityId: check.id,
        details: { checkType: check.checkType, result: check.result },
      });
      res.status(201).json(check);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create compliance check" });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Dashboard & Analytics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/analytics/tenders-by-status", async (req, res) => {
    try {
      const data = await storage.getTendersByStatus();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/tenders-by-municipality", async (req, res) => {
    try {
      const data = await storage.getTendersByMunicipality();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/compliance-by-category", async (req, res) => {
    try {
      const data = await storage.getComplianceByCategory();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/vendors-by-status", async (req, res) => {
    try {
      const data = await storage.getVendorsByStatus();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/monthly-trends", async (req, res) => {
    try {
      const data = await storage.getMonthlyTrends();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Tender Requirements
  app.get("/api/tenders/:tenderId/requirements", async (req, res) => {
    try {
      const requirements = await storage.getTenderRequirements(req.params.tenderId);
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender requirements" });
    }
  });

  app.post("/api/tenders/:tenderId/requirements", async (req, res) => {
    try {
      const data = insertTenderRequirementSchema.parse({
        ...req.body,
        tenderId: req.params.tenderId,
      });
      const requirement = await storage.createTenderRequirement(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_tender_requirement",
        entityType: "tender_requirement",
        entityId: requirement.id,
        details: { tenderId: req.params.tenderId, type: requirement.requirementType },
      });
      res.status(201).json(requirement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create tender requirement" });
    }
  });

  app.put("/api/tender-requirements/:id", async (req, res) => {
    try {
      const data = insertTenderRequirementSchema.partial().parse(req.body);
      const requirement = await storage.updateTenderRequirement(req.params.id, data);
      if (!requirement) {
        return res.status(404).json({ error: "Tender requirement not found" });
      }
      res.json(requirement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update tender requirement" });
    }
  });

  app.delete("/api/tender-requirements/:id", async (req, res) => {
    try {
      const success = await storage.deleteTenderRequirement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Tender requirement not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tender requirement" });
    }
  });

  // PDF file upload and extraction endpoint
  app.post("/api/tenders/:tenderId/upload-pdf", pdfUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      // Parse PDF to extract text using pdf-parse v2 API
      const parser = new PDFParse({ data: req.file.buffer });
      const result = await parser.getText();
      const extractedText = result.text;

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from PDF. The PDF may be image-based or protected." });
      }

      res.json({ 
        success: true, 
        text: extractedText,
        pages: result.pages?.length || 1,
        info: result.info || {}
      });
    } catch (error) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: "Failed to process PDF file" });
    }
  });

  // AI-powered tender requirement extraction (accepts text content)
  app.post("/api/tenders/:tenderId/extract-requirements", async (req, res) => {
    try {
      const { pdfContent } = req.body;
      if (!pdfContent) {
        return res.status(400).json({ error: "PDF content is required" });
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const prompt = `Analyze this South African municipal tender document and extract ALL compliance requirements that vendors must meet. For each requirement, identify:

1. Requirement Type - One of: CSD Registration, Tax Clearance, BBBEE Certificate, Company Registration, COIDA Certificate, Public Liability Insurance, Municipal Rates Clearance, Audited Financials, Declaration of Interest, Bid Defaulters Check, Professional Registration, Safety Certification, Other
2. Description - Clear description of what the requirement entails
3. Is Mandatory - Whether this is a mandatory requirement (true/false)
4. Max Age Days - If there's a freshness requirement (e.g., CSD not older than 10 days), specify the number of days
5. Min Value - If there's a minimum value requirement (e.g., minimum insurance cover of R500,000), specify the amount in Rands
6. Validity Period - Any validity period mentioned

Look for these common SA tender requirements:
- CSD registration (usually not older than 10 days)
- SARS Tax Clearance Certificate/PIN
- B-BBEE Certificate with specific level requirements
- Company Registration (CK/CM documents, CIPC)
- COIDA Letter of Good Standing
- Public Liability Insurance (minimum cover amounts)
- Municipal Rates Clearance (usually not older than 3 months)
- Audited Financial Statements (usually 3 years)
- Declaration of Interest forms
- Bid Defaulters Register check
- Professional body registrations (ECSA, SACPCMP, etc.)
- Health and Safety certifications

Tender Document Content:
${pdfContent}

Return a JSON array of requirements with this structure:
[
  {
    "requirementType": "CSD Registration",
    "description": "Valid CSD registration report not older than 10 days from closing date",
    "isMandatory": true,
    "maxAgeDays": 10,
    "minValue": null,
    "validityPeriod": null
  }
]`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let requirements;
      try {
        const parsed = JSON.parse(responseText);
        requirements = parsed.requirements || parsed;
      } catch {
        requirements = [];
      }

      // Save extracted requirements to database
      const savedRequirements = [];
      const tenderId = req.params.tenderId;
      for (const extractedReq of requirements) {
        const requirementData = {
          tenderId,
          requirementType: extractedReq.requirementType || "Other",
          description: extractedReq.description || "Extracted requirement",
          isMandatory: extractedReq.isMandatory !== false,
          maxAgeDays: extractedReq.maxAgeDays || null,
          minValue: extractedReq.minValue || null,
          validityPeriod: extractedReq.validityPeriod || null,
          aiExtracted: true,
        };
        
        try {
          const saved = await storage.createTenderRequirement(requirementData as any);
          savedRequirements.push(saved);
        } catch (e) {
          console.error("Failed to save requirement:", e);
        }
      }

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "extract_tender_requirements",
        entityType: "tender",
        entityId: req.params.tenderId,
        details: { extractedCount: savedRequirements.length },
      });

      res.json({ requirements: savedRequirements, raw: requirements });
    } catch (error) {
      console.error("Error extracting requirements:", error);
      res.status(500).json({ error: "Failed to extract requirements" });
    }
  });

  // AI-powered scoring criteria extraction from tender PDF
  app.post("/api/tenders/:tenderId/extract-scoring-criteria", async (req, res) => {
    try {
      const { pdfContent } = req.body;
      if (!pdfContent) {
        return res.status(400).json({ error: "PDF content is required" });
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const prompt = `Analyze this South African municipal tender document and extract ALL evaluation/scoring criteria used to assess bids. For each criterion, identify:

1. Criteria Name - The name of the scoring criterion
2. Criteria Category - One of: Technical, Price, BBBEE, Experience, Functionality, Quality, Local Content, Other
3. Description - What is being evaluated and how
4. Max Score - The maximum points available for this criterion
5. Weight - The weighting factor (if specified, otherwise use 1)

Look for typical SA tender evaluation criteria:
- Technical capability and methodology (usually 60-80 points)
- Price/financial proposal (usually weighted 80/20 or 90/10)
- B-BBEE scoring (based on preferential procurement points)
- Experience and track record (references, similar projects)
- Functionality thresholds
- Skills transfer and local content
- Project approach and understanding
- Team qualifications
- Management and quality assurance

Also look for:
- Evaluation matrices and scoring tables
- Point allocations and weightings
- Minimum qualifying scores
- Preferential procurement points (80/20 or 90/10 system)

Tender Document Content:
${pdfContent}

Return a JSON object with this structure:
{
  "scoringCriteria": [
    {
      "criteriaName": "Technical Proposal",
      "criteriaCategory": "Technical",
      "description": "Assessment of methodology, project approach, and technical solution",
      "maxScore": 80,
      "weight": 1
    },
    {
      "criteriaName": "B-BBEE Points",
      "criteriaCategory": "BBBEE",
      "description": "Preferential procurement points based on B-BBEE level",
      "maxScore": 20,
      "weight": 1
    }
  ],
  "scoringSystem": "80/20",
  "minimumQualifyingScore": 70
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let scoringData;
      try {
        scoringData = JSON.parse(responseText);
      } catch {
        scoringData = { scoringCriteria: [] };
      }

      const scoringCriteria = scoringData.scoringCriteria || [];
      
      // Delete existing AI-extracted scoring criteria for this tender
      const tenderId = req.params.tenderId;
      await storage.deleteTenderScoringCriteriaByTender(tenderId);

      // Save extracted scoring criteria to database
      const savedCriteria = [];
      for (let i = 0; i < scoringCriteria.length; i++) {
        const criterion = scoringCriteria[i];
        const criteriaData = {
          tenderId,
          criteriaName: criterion.criteriaName || "Evaluation Criterion",
          criteriaCategory: criterion.criteriaCategory || "Other",
          description: criterion.description || null,
          maxScore: criterion.maxScore || 10,
          weight: criterion.weight || 1,
          sortOrder: i,
          aiExtracted: true,
        };
        
        try {
          const saved = await storage.createTenderScoringCriteria(criteriaData as any);
          savedCriteria.push(saved);
        } catch (e) {
          console.error("Failed to save scoring criteria:", e);
        }
      }

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "extract_scoring_criteria",
        entityType: "tender",
        entityId: tenderId,
        details: { 
          extractedCount: savedCriteria.length,
          scoringSystem: scoringData.scoringSystem,
          minimumQualifyingScore: scoringData.minimumQualifyingScore,
        },
      });

      res.json({ 
        scoringCriteria: savedCriteria, 
        scoringSystem: scoringData.scoringSystem || null,
        minimumQualifyingScore: scoringData.minimumQualifyingScore || null,
      });
    } catch (error) {
      console.error("Error extracting scoring criteria:", error);
      res.status(500).json({ error: "Failed to extract scoring criteria" });
    }
  });

  // Tender Scoring Criteria CRUD endpoints
  app.get("/api/tenders/:tenderId/scoring-criteria", async (req, res) => {
    try {
      const criteria = await storage.getTenderScoringCriteria(req.params.tenderId);
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scoring criteria" });
    }
  });

  app.post("/api/tenders/:tenderId/scoring-criteria", async (req, res) => {
    try {
      const criteriaData = {
        ...req.body,
        tenderId: req.params.tenderId,
      };
      const criteria = await storage.createTenderScoringCriteria(criteriaData);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_scoring_criteria",
        entityType: "scoring_criteria",
        entityId: criteria.id,
        details: { tenderId: req.params.tenderId },
      });
      res.status(201).json(criteria);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scoring criteria" });
    }
  });

  app.patch("/api/scoring-criteria/:id", async (req, res) => {
    try {
      const criteria = await storage.updateTenderScoringCriteria(req.params.id, req.body);
      if (!criteria) {
        return res.status(404).json({ error: "Scoring criteria not found" });
      }
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scoring criteria" });
    }
  });

  app.delete("/api/scoring-criteria/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTenderScoringCriteria(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Scoring criteria not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scoring criteria" });
    }
  });

  // AI-powered submission scoring against tender criteria
  app.post("/api/submissions/:submissionId/auto-score", async (req, res) => {
    try {
      const { submissionId } = req.params;
      
      // Get submission details
      const submission = await storage.getBidSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // Get scoring criteria for the tender
      const scoringCriteria = await storage.getTenderScoringCriteria(submission.tenderId);
      if (scoringCriteria.length === 0) {
        return res.status(400).json({ error: "No scoring criteria defined for this tender" });
      }

      // Get submission documents
      const submissionDocs = await storage.getSubmissionDocuments(submissionId);
      
      // Get vendor info
      const vendor = await storage.getVendor(submission.vendorId);
      
      // Get tender info
      const tender = await storage.getTender(submission.tenderId);

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const criteriaList = scoringCriteria.map(c => 
        `- ${c.criteriaName} (Category: ${c.criteriaCategory}, Max Score: ${c.maxScore}): ${c.description || 'No description'}`
      ).join('\n');

      const documentsList = submissionDocs.map(d => 
        `- ${d.documentType}: ${d.documentName} (Status: ${d.verificationStatus})`
      ).join('\n') || 'No documents submitted';

      // Official B-BBEE preference points tables
      const bbbeePoints80_20: Record<string, number> = { 
        "Level 1": 20, "Level 2": 18, "Level 3": 14, "Level 4": 12, 
        "Level 5": 8, "Level 6": 6, "Level 7": 4, "Level 8": 2, "Non-Compliant": 0 
      };
      const bbbeePoints90_10: Record<string, number> = { 
        "Level 1": 10, "Level 2": 9, "Level 3": 6, "Level 4": 5, 
        "Level 5": 4, "Level 6": 3, "Level 7": 2, "Level 8": 1, "Non-Compliant": 0 
      };
      
      // Calculate official B-BBEE points based on vendor's level and scoring system
      const vendorBBBEELevel = vendor?.bbbeeLevel || "Non-Compliant";
      const is90_10 = submission.scoringSystem === "90/10";
      const officialBBBEEPoints = is90_10 
        ? (bbbeePoints90_10[vendorBBBEELevel] || 0) 
        : (bbbeePoints80_20[vendorBBBEELevel] || 0);
      const maxBBBEEPoints = is90_10 ? 10 : 20;
      const maxPricePoints = is90_10 ? 90 : 80;

      // Calculate price score using SA preferential procurement formula
      // Ps = maxPoints × (1 - (Pt - Pmin) / Pmin)
      // Get all submissions for this tender to find the lowest bid
      const allSubmissions = await storage.getBidSubmissions(submission.tenderId);
      const bidsWithAmounts = allSubmissions.filter(s => s.bidAmount && s.bidAmount > 0);
      const lowestBid = bidsWithAmounts.length > 0 
        ? Math.min(...bidsWithAmounts.map(s => s.bidAmount!)) 
        : submission.bidAmount || 0;
      
      let priceScore = 0;
      let priceScoreReasoning = "";
      const thisBidAmount = submission.bidAmount || 0;
      
      if (thisBidAmount > 0 && lowestBid > 0) {
        // SA Price formula: Ps = maxPoints × (1 - (Pt - Pmin) / Pmin)
        priceScore = Math.round(maxPricePoints * (1 - (thisBidAmount - lowestBid) / lowestBid));
        priceScore = Math.max(0, Math.min(priceScore, maxPricePoints)); // Clamp to valid range
        priceScoreReasoning = `Price score calculated using SA formula: ${maxPricePoints} × (1 - (R${thisBidAmount.toLocaleString()} - R${lowestBid.toLocaleString()}) / R${lowestBid.toLocaleString()}) = ${priceScore} points. Lowest bid: R${lowestBid.toLocaleString()}.`;
      } else if (thisBidAmount === 0) {
        priceScore = 0;
        priceScoreReasoning = "No bid amount provided - price evaluation not possible.";
      } else {
        priceScore = maxPricePoints; // If only one bidder with valid amount, they get max points
        priceScoreReasoning = `Bid amount: R${thisBidAmount.toLocaleString()}. As the only/lowest bidder, awarded maximum ${maxPricePoints} points.`;
      }

      const prompt = `Evaluate this bid submission against the tender's scoring criteria. Provide tentative scores based on the available information.

TENDER: ${tender?.title || 'Unknown'}
VENDOR: ${vendor?.companyName || 'Unknown'} (B-BBEE Level: ${vendorBBBEELevel})
BID AMOUNT: R${thisBidAmount.toLocaleString()} (Lowest bid in this tender: R${lowestBid.toLocaleString()})
SCORING SYSTEM: ${submission.scoringSystem || '80/20'}

SUBMITTED DOCUMENTS:
${documentsList}

SCORING CRITERIA TO EVALUATE:
${criteriaList}

IMPORTANT SCORING RULES:

1. B-BBEE SCORING:
For any criteria related to B-BBEE Status Level or B-BBEE points, you MUST use the official South African preferential procurement points:
- This vendor is ${vendorBBBEELevel} which equals EXACTLY ${officialBBBEEPoints} points out of ${maxBBBEEPoints} maximum.
- Do NOT use any other scoring for B-BBEE criteria.

2. PRICE SCORING:
For any criteria related to Price or Price Proposal, you MUST use the pre-calculated price score:
- This vendor's bid: R${thisBidAmount.toLocaleString()}
- Calculated price score: EXACTLY ${priceScore} points out of ${maxPricePoints} maximum
- ${priceScoreReasoning}
- Do NOT use any other scoring for Price criteria.

Based on the available information, provide a tentative score for each criterion. Consider:
- Document completeness and verification status
- For B-BBEE criteria: Use EXACTLY ${officialBBBEEPoints} points
- For Price criteria: Use EXACTLY ${priceScore} points
- Compliance with tender requirements

Return a JSON object with scores for each criterion:
{
  "scores": [
    {
      "criteriaName": "Technical Proposal",
      "score": 65,
      "maxScore": 80,
      "reasoning": "Documents submitted but not verified"
    }
  ],
  "totalScore": 85,
  "maxPossibleScore": 100,
  "overallAssessment": "Submission appears compliant pending document verification"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      let scoreData;
      try {
        scoreData = JSON.parse(responseText);
      } catch {
        scoreData = { scores: [], totalScore: 0 };
      }

      // Save evaluation scores and recalculate total
      const savedScores = [];
      let recalculatedTotal = 0;
      
      for (const score of scoreData.scores || []) {
        const matchingCriteria = scoringCriteria.find(c => c.criteriaName === score.criteriaName);
        if (matchingCriteria) {
          try {
            // Check if this is a B-BBEE or Price criteria (by category for deterministic matching)
            const isBBBEECriteria = matchingCriteria.criteriaCategory === "BBBEE";
            // Detect price criteria by category or name (covers "Price", "Price Proposal", "Financial", etc.)
            const priceCategoryLower = (matchingCriteria.criteriaCategory || "").toLowerCase();
            const priceNameLower = (matchingCriteria.criteriaName || "").toLowerCase();
            const isPriceCriteria = priceCategoryLower === "price" || 
              priceCategoryLower === "financial" ||
              priceNameLower.includes("price proposal") ||
              priceNameLower.includes("price points") ||
              (priceNameLower.includes("price") && priceNameLower.includes("evaluation"));
            
            let finalScore = Math.min(score.score || 0, matchingCriteria.maxScore);
            let finalMaxScore = matchingCriteria.maxScore; // Keep tender's maxScore
            let comments = score.reasoning || null;
            
            // For B-BBEE criteria, use official points but scale to tender's maxScore if different
            if (isBBBEECriteria) {
              // If tender maxScore matches official (20 for 80/20, 10 for 90/10), use official points directly
              if (finalMaxScore === maxBBBEEPoints) {
                finalScore = officialBBBEEPoints;
                comments = `Official B-BBEE preference points for ${vendorBBBEELevel}: ${officialBBBEEPoints}/${maxBBBEEPoints} (${submission.scoringSystem || '80/20'} system)`;
              } else {
                // Scale official points to tender's maxScore proportionally
                const scaledPoints = Math.round((officialBBBEEPoints / maxBBBEEPoints) * finalMaxScore);
                finalScore = scaledPoints;
                comments = `B-BBEE points for ${vendorBBBEELevel}: ${scaledPoints}/${finalMaxScore} (scaled from official ${officialBBBEEPoints}/${maxBBBEEPoints})`;
              }
            }
            
            // For Price criteria, use the calculated price score
            if (isPriceCriteria) {
              if (finalMaxScore === maxPricePoints) {
                finalScore = priceScore;
                comments = priceScoreReasoning;
              } else {
                // Scale price score to tender's maxScore proportionally
                const scaledPriceScore = Math.round((priceScore / maxPricePoints) * finalMaxScore);
                finalScore = scaledPriceScore;
                comments = `Price score: ${scaledPriceScore}/${finalMaxScore} (scaled from ${priceScore}/${maxPricePoints}). ${priceScoreReasoning}`;
              }
            }
            
            const evaluationScore = await storage.createEvaluationScore({
              submissionId,
              criteriaName: score.criteriaName,
              criteriaCategory: matchingCriteria.criteriaCategory,
              maxScore: finalMaxScore,
              score: finalScore,
              weight: matchingCriteria.weight || 1,
              comments,
            });
            savedScores.push(evaluationScore);
            recalculatedTotal += finalScore * (matchingCriteria.weight || 1);
          } catch (e) {
            console.error("Failed to save evaluation score:", e);
          }
        }
      }

      // Update submission with recalculated total score, B-BBEE points, and price score
      await storage.updateBidSubmission(submissionId, {
        technicalScore: recalculatedTotal,
        bbbeePoints: officialBBBEEPoints,
        priceScore: priceScore,
      });

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "auto_score_submission",
        entityType: "submission",
        entityId: submissionId,
        details: { 
          totalScore: scoreData.totalScore,
          criteriaScored: savedScores.length,
        },
      });

      res.json({
        scores: savedScores,
        totalScore: recalculatedTotal,
        maxPossibleScore: scoreData.maxPossibleScore,
        overallAssessment: scoreData.overallAssessment,
        bbbeePoints: officialBBBEEPoints,
        priceScore: priceScore,
        bidAmount: thisBidAmount,
        lowestBid: lowestBid,
      });
    } catch (error) {
      console.error("Error auto-scoring submission:", error);
      res.status(500).json({ error: "Failed to auto-score submission" });
    }
  });

  // Bid Submissions
  app.get("/api/submissions", async (req, res) => {
    try {
      const tenderId = req.query.tenderId as string | undefined;
      const submissions = await storage.getBidSubmissions(tenderId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/:id", async (req, res) => {
    try {
      const submission = await storage.getBidSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  // Get submission stats for all submissions (documents missing, compliance %, etc.)
  app.get("/api/submissions-stats", async (req, res) => {
    try {
      const submissions = await storage.getBidSubmissions();
      const stats: Record<string, {
        documentsMissing: number;
        totalDocuments: number;
        compliancePercentage: number;
        daysInStage: number;
      }> = {};

      for (const submission of submissions) {
        // Get requirements for this tender
        const requirements = await storage.getTenderRequirements(submission.tenderId);
        const documents = await storage.getSubmissionDocuments(submission.id);
        
        // Count missing documents
        const uploadedRequirementIds = new Set(documents.map(d => d.requirementId));
        const documentsMissing = requirements.filter(r => !uploadedRequirementIds.has(r.id)).length;
        
        // Calculate compliance percentage
        const passedDocs = documents.filter(d => d.verificationStatus === "verified").length;
        const compliancePercentage = requirements.length > 0 
          ? Math.round((passedDocs / requirements.length) * 100) 
          : 0;
        
        // Calculate days in current stage (use updatedAt for last status change, fall back to submissionDate or createdAt)
        const statusDate = submission.updatedAt || submission.submissionDate || submission.createdAt;
        const daysInStage = statusDate 
          ? Math.floor((Date.now() - new Date(statusDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        stats[submission.id] = {
          documentsMissing,
          totalDocuments: requirements.length,
          compliancePercentage,
          daysInStage,
        };
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching submission stats:", error);
      res.status(500).json({ error: "Failed to fetch submission stats" });
    }
  });

  app.get("/api/vendors/:vendorId/submissions", async (req, res) => {
    try {
      const submissions = await storage.getBidSubmissionsByVendor(req.params.vendorId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor submissions" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const data = insertBidSubmissionSchema.parse(req.body);
      const submission = await storage.createBidSubmission(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_bid_submission",
        entityType: "bid_submission",
        entityId: submission.id,
        details: { tenderId: submission.tenderId, vendorId: submission.vendorId },
      });
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  app.put("/api/submissions/:id", async (req, res) => {
    try {
      const data = insertBidSubmissionSchema.partial().parse(req.body);
      const submission = await storage.updateBidSubmission(req.params.id, data);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "update_bid_submission",
        entityType: "bid_submission",
        entityId: submission.id,
        details: { status: submission.status },
      });
      res.json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  app.delete("/api/submissions/:id", async (req, res) => {
    try {
      const success = await storage.deleteBidSubmission(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Submission not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "delete_bid_submission",
        entityType: "bid_submission",
        entityId: req.params.id,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete submission" });
    }
  });

  app.get("/api/analytics/submissions-by-stage", async (req, res) => {
    try {
      const data = await storage.getSubmissionsByStage();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions by stage" });
    }
  });

  // Submission Documents
  app.get("/api/submissions/:submissionId/documents", async (req, res) => {
    try {
      const documents = await storage.getSubmissionDocuments(req.params.submissionId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submission documents" });
    }
  });

  app.post("/api/submissions/:submissionId/documents", async (req, res) => {
    try {
      const data = insertSubmissionDocumentSchema.parse({
        ...req.body,
        submissionId: req.params.submissionId,
      });
      const document = await storage.createSubmissionDocument(data);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create submission document" });
    }
  });

  // Upload document for a specific requirement - uses Object Storage
  app.post("/api/submissions/:submissionId/requirements/:requirementId/upload", async (req, res) => {
    try {
      const { submissionId, requirementId } = req.params;
      
      // Verify submission exists
      const submission = await storage.getBidSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      // Verify requirement exists
      const requirements = await storage.getTenderRequirements(submission.tenderId);
      const requirement = requirements.find(r => r.id === requirementId);
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found for this tender" });
      }

      // Import object storage service dynamically
      const { ObjectStorageService } = await import("./replit_integrations/object_storage/objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Generate presigned URL for upload
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        submissionId,
        requirementId,
        requirementType: requirement.requirementType,
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Direct server-side document upload (bypasses CORS issues with presigned URLs)
  app.post("/api/submissions/:submissionId/requirements/:requirementId/upload-direct", 
    documentUpload.single('file'), 
    async (req, res) => {
    try {
      const { submissionId, requirementId } = req.params;
      // Handle FormData fields which may come as strings or arrays
      const documentDate = Array.isArray(req.body.documentDate) ? req.body.documentDate[0] : req.body.documentDate;
      const expiryDate = Array.isArray(req.body.expiryDate) ? req.body.expiryDate[0] : req.body.expiryDate;
      
      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }
      
      // Verify submission exists
      const submission = await storage.getBidSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      // Verify requirement exists
      const requirements = await storage.getTenderRequirements(submission.tenderId);
      const requirement = requirements.find(r => r.id === requirementId);
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found for this tender" });
      }

      // Import object storage service
      const { ObjectStorageService, objectStorageClient } = await import("./replit_integrations/object_storage/objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Get private object directory and create unique path
      const privateDir = objectStorageService.getPrivateObjectDir();
      const { randomUUID } = await import("crypto");
      const objectId = randomUUID();
      const fullPath = `${privateDir}/uploads/${objectId}`;
      
      // Parse the path to get bucket and object name
      const parts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
      const bucketName = parts[0];
      const objectName = parts.slice(1).join('/');
      
      // Upload file directly to Object Storage
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });
      
      const objectPath = `/objects/uploads/${objectId}`;
      
      // Check if there's already a document for this requirement, and delete it
      const existingDocs = await storage.getSubmissionDocuments(submissionId);
      const existingDoc = existingDocs.find(d => d.requirementId === requirementId);
      if (existingDoc) {
        await storage.deleteSubmissionDocument(existingDoc.id);
      }

      // Parse and validate dates if provided
      let parsedDocumentDate: Date | undefined;
      let parsedExpiryDate: Date | undefined;
      
      if (documentDate) {
        parsedDocumentDate = new Date(documentDate);
        if (isNaN(parsedDocumentDate.getTime())) {
          parsedDocumentDate = undefined;
        }
      }
      
      if (expiryDate) {
        parsedExpiryDate = new Date(expiryDate);
        if (isNaN(parsedExpiryDate.getTime())) {
          parsedExpiryDate = undefined;
        }
      }

      // Create submission document record
      const document = await storage.createSubmissionDocument({
        submissionId,
        requirementId,
        documentName: req.file.originalname,
        documentType: requirement.requirementType as any,
        filePath: objectPath,
        uploadedAt: new Date(),
        documentDate: parsedDocumentDate || new Date(),
        expiryDate: parsedExpiryDate,
        verificationStatus: "pending",
      });

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "upload_submission_document",
        entityType: "submission_document",
        entityId: document.id,
        details: { 
          submissionId, 
          requirementId, 
          documentName: req.file.originalname,
          fileSize: req.file.size,
        },
      });

      res.status(201).json({ 
        success: true, 
        document,
        message: "Document uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Confirm document upload and save metadata
  app.post("/api/submissions/:submissionId/requirements/:requirementId/confirm-upload", async (req, res) => {
    try {
      const { submissionId, requirementId } = req.params;
      const { objectPath, documentName, documentDate, expiryDate } = req.body;
      
      // Validate required field
      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }
      
      // Verify submission exists
      const submission = await storage.getBidSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      // Verify requirement exists
      const requirements = await storage.getTenderRequirements(submission.tenderId);
      const requirement = requirements.find(r => r.id === requirementId);
      if (!requirement) {
        return res.status(404).json({ error: "Requirement not found" });
      }

      // Parse and validate dates if provided
      let parsedDocumentDate: Date | undefined;
      let parsedExpiryDate: Date | undefined;
      
      if (documentDate) {
        parsedDocumentDate = new Date(documentDate);
        if (isNaN(parsedDocumentDate.getTime())) {
          return res.status(400).json({ error: "Invalid documentDate format" });
        }
      }
      
      if (expiryDate) {
        parsedExpiryDate = new Date(expiryDate);
        if (isNaN(parsedExpiryDate.getTime())) {
          return res.status(400).json({ error: "Invalid expiryDate format" });
        }
      }

      // Check if there's already a document for this requirement, and delete it
      const existingDocs = await storage.getSubmissionDocuments(submissionId);
      const existingDoc = existingDocs.find(d => d.requirementId === requirementId);
      if (existingDoc) {
        await storage.deleteSubmissionDocument(existingDoc.id);
      }

      // Create submission document record using the requirement's type (which matches requirementTypeEnum)
      const document = await storage.createSubmissionDocument({
        submissionId,
        requirementId,
        documentName: documentName || `${requirement.requirementType} Document`,
        documentType: requirement.requirementType as any,
        filePath: objectPath,
        uploadedAt: new Date(),
        documentDate: parsedDocumentDate || new Date(),
        expiryDate: parsedExpiryDate,
        verificationStatus: "pending",
      });

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "upload_submission_document",
        entityType: "submission_document",
        entityId: document.id,
        details: { 
          submissionId,
          requirementId,
          requirementType: requirement.requirementType,
          documentName 
        },
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error confirming upload:", error);
      res.status(500).json({ error: "Failed to confirm document upload" });
    }
  });

  app.put("/api/submission-documents/:id", async (req, res) => {
    try {
      const data = insertSubmissionDocumentSchema.partial().parse(req.body);
      const document = await storage.updateSubmissionDocument(req.params.id, data);
      if (!document) {
        return res.status(404).json({ error: "Submission document not found" });
      }
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update submission document" });
    }
  });

  app.delete("/api/submission-documents/:id", async (req, res) => {
    try {
      const success = await storage.deleteSubmissionDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Submission document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete submission document" });
    }
  });

  // Evaluation Scores
  app.get("/api/submissions/:submissionId/scores", async (req, res) => {
    try {
      const scores = await storage.getEvaluationScores(req.params.submissionId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation scores" });
    }
  });

  app.post("/api/submissions/:submissionId/scores", async (req, res) => {
    try {
      const data = insertEvaluationScoreSchema.parse({
        ...req.body,
        submissionId: req.params.submissionId,
        evaluatorId: (req as any).user?.id,
      });
      const score = await storage.createEvaluationScore(data);
      res.status(201).json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create evaluation score" });
    }
  });

  // Letter Templates
  app.get("/api/letter-templates", async (req, res) => {
    try {
      const municipalityId = req.query.municipalityId as string | undefined;
      const templates = await storage.getLetterTemplates(municipalityId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch letter templates" });
    }
  });

  app.get("/api/letter-templates/:id", async (req, res) => {
    try {
      const template = await storage.getLetterTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Letter template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch letter template" });
    }
  });

  app.post("/api/letter-templates", async (req, res) => {
    try {
      const data = insertLetterTemplateSchema.parse(req.body);
      const template = await storage.createLetterTemplate(data);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "create_letter_template",
        entityType: "letter_template",
        entityId: template.id,
        details: { name: template.name, type: template.letterType },
      });
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create letter template" });
    }
  });

  app.put("/api/letter-templates/:id", async (req, res) => {
    try {
      const data = insertLetterTemplateSchema.partial().parse(req.body);
      const template = await storage.updateLetterTemplate(req.params.id, data);
      if (!template) {
        return res.status(404).json({ error: "Letter template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update letter template" });
    }
  });

  app.delete("/api/letter-templates/:id", async (req, res) => {
    try {
      const success = await storage.deleteLetterTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Letter template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete letter template" });
    }
  });

  // Generated Letters
  app.get("/api/submissions/:submissionId/letters", async (req, res) => {
    try {
      const letters = await storage.getGeneratedLetters(req.params.submissionId);
      res.json(letters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated letters" });
    }
  });

  app.post("/api/submissions/:submissionId/generate-letter", async (req, res) => {
    try {
      const { letterType, templateId } = req.body;
      
      // Get submission details
      const submission = await storage.getBidSubmission(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const vendor = await storage.getVendor(submission.vendorId);
      const tender = await storage.getTender(submission.tenderId);

      if (!vendor || !tender) {
        return res.status(404).json({ error: "Vendor or tender not found" });
      }

      let template = null;
      if (templateId) {
        template = await storage.getLetterTemplate(templateId);
      }

      // Get rejection reasons if applicable
      const rejectionReasons = submission.rejectionReasons as string[] || [];

      // Use AI to generate letter if no template
      let subject = "";
      let body = "";

      if (template) {
        subject = template.subject
          .replace("{{vendorName}}", vendor.companyName)
          .replace("{{tenderNumber}}", tender.tenderNumber)
          .replace("{{tenderTitle}}", tender.title);
        body = template.bodyTemplate
          .replace("{{vendorName}}", vendor.companyName)
          .replace("{{tenderNumber}}", tender.tenderNumber)
          .replace("{{tenderTitle}}", tender.title)
          .replace("{{contactPerson}}", vendor.contactPerson)
          .replace("{{rejectionReasons}}", rejectionReasons.join("\n- "));
      } else {
        // Generate with AI
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });

        const prompt = letterType === "award" 
          ? `Generate a professional award letter for a South African municipal tender:
             - Vendor: ${vendor.companyName}
             - Contact Person: ${vendor.contactPerson}
             - Tender Number: ${tender.tenderNumber}
             - Tender Title: ${tender.title}
             - Bid Amount: R${submission.bidAmount?.toLocaleString() || 'TBD'}
             
             Include congratulations, next steps, and contact information for queries.`
          : `Generate a professional rejection/regret letter for a South African municipal tender:
             - Vendor: ${vendor.companyName}
             - Contact Person: ${vendor.contactPerson}
             - Tender Number: ${tender.tenderNumber}
             - Tender Title: ${tender.title}
             - Rejection Reasons: ${rejectionReasons.join(", ") || "Did not meet minimum requirements"}
             
             Be professional and respectful, thank them for participating, and encourage future bids.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
        });

        const generatedContent = completion.choices[0]?.message?.content || "";
        const lines = generatedContent.split("\n");
        subject = lines[0]?.replace(/^(Subject:|RE:)\s*/i, "") || `${letterType === "award" ? "Award" : "Regret"} - ${tender.tenderNumber}`;
        body = lines.slice(1).join("\n").trim() || generatedContent;
      }

      const letter = await storage.createGeneratedLetter({
        submissionId: req.params.submissionId,
        templateId: templateId || null,
        letterType,
        subject,
        body,
        recipientEmail: vendor.contactEmail,
        generatedBy: (req as any).user?.id,
      });

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "generate_letter",
        entityType: "generated_letter",
        entityId: letter.id,
        details: { letterType, submissionId: req.params.submissionId },
      });

      res.status(201).json(letter);
    } catch (error) {
      console.error("Error generating letter:", error);
      res.status(500).json({ error: "Failed to generate letter" });
    }
  });

  // Compliance Check - automated checking against tender requirements
  app.post("/api/submissions/:submissionId/run-compliance-check", async (req, res) => {
    try {
      const submission = await storage.getBidSubmission(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // Get tender requirements
      const requirements = await storage.getTenderRequirements(submission.tenderId);
      
      // Get submission documents
      const documents = await storage.getSubmissionDocuments(req.params.submissionId);

      const results: Array<{
        requirementId: string;
        requirementType: string;
        passed: boolean;
        reason: string;
        documentId?: string;
      }> = [];

      // Check each requirement against submitted documents
      for (const req of requirements) {
        // First try to match by requirementId (preferred), then fall back to documentType
        const matchingDoc = documents.find(d => d.requirementId === req.id) || 
                           documents.find(d => d.documentType === req.requirementType);
        
        if (!matchingDoc) {
          results.push({
            requirementId: req.id,
            requirementType: req.requirementType,
            passed: false,
            reason: `Missing required document: ${req.requirementType}`,
          });
          continue;
        }

        // Check document age if maxAgeDays is specified
        if (req.maxAgeDays && matchingDoc.documentDate) {
          const docDate = new Date(matchingDoc.documentDate);
          const daysDiff = Math.floor((Date.now() - docDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > req.maxAgeDays) {
            results.push({
              requirementId: req.id,
              requirementType: req.requirementType,
              passed: false,
              reason: `Document is ${daysDiff} days old, maximum allowed is ${req.maxAgeDays} days`,
              documentId: matchingDoc.id,
            });
            continue;
          }
        }

        // Check expiry date
        if (matchingDoc.expiryDate) {
          const expiryDate = new Date(matchingDoc.expiryDate);
          if (expiryDate < new Date()) {
            results.push({
              requirementId: req.id,
              requirementType: req.requirementType,
              passed: false,
              reason: `Document has expired on ${expiryDate.toLocaleDateString()}`,
              documentId: matchingDoc.id,
            });
            continue;
          }
        }

        // Document passed
        results.push({
          requirementId: req.id,
          requirementType: req.requirementType,
          passed: true,
          reason: "Document meets requirements",
          documentId: matchingDoc.id,
        });

        // Update document verification status
        await storage.updateSubmissionDocument(matchingDoc.id, {
          meetsRequirement: true,
          verificationStatus: "verified",
        });
      }

      const passedCount = results.filter(r => r.passed).length;
      const totalMandatory = requirements.filter(r => r.isMandatory).length;
      const passedMandatory = results.filter(r => {
        const req = requirements.find(rq => rq.id === r.requirementId);
        return r.passed && req?.isMandatory;
      }).length;

      const overallPassed = passedMandatory === totalMandatory;
      const failedReasons = results.filter(r => !r.passed).map(r => r.reason);

      // Update submission - if passed, move to manual_review; if failed, set to failed
      // Status progression: draft → submitted → auto_checking → manual_review (if passed) or failed
      // Then manually: manual_review → passed → awarded OR manual_review → failed → rejected
      await storage.updateBidSubmission(req.params.submissionId, {
        status: overallPassed ? "manual_review" : "failed",
        complianceResult: overallPassed ? "passed" : "failed",
        complianceNotes: failedReasons.length > 0 ? failedReasons.join("; ") : "All requirements met - ready for manual review",
        autoCheckCompletedAt: new Date(),
        rejectionReasons: overallPassed ? null : failedReasons,
      });

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "run_compliance_check",
        entityType: "bid_submission",
        entityId: req.params.submissionId,
        details: { 
          passedCount, 
          totalRequirements: requirements.length,
          overallPassed 
        },
      });

      res.json({
        results,
        summary: {
          totalRequirements: requirements.length,
          passedCount,
          failedCount: requirements.length - passedCount,
          mandatoryTotal: totalMandatory,
          mandatoryPassed: passedMandatory,
          overallPassed,
        },
      });
    } catch (error) {
      console.error("Error running compliance check:", error);
      res.status(500).json({ error: "Failed to run compliance check" });
    }
  });

  // B-BBEE Points Calculator
  app.post("/api/calculate-bbbee-points", async (req, res) => {
    try {
      const { vendorId, scoringSystem } = req.body;
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      const bbbeeLevel = vendor.bbbeeLevel || "Non-Compliant";
      
      // B-BBEE points allocation per level for 80/20 and 90/10 systems
      const pointsMap: Record<string, { "80/20": number; "90/10": number }> = {
        "Level 1": { "80/20": 20, "90/10": 10 },
        "Level 2": { "80/20": 18, "90/10": 9 },
        "Level 3": { "80/20": 14, "90/10": 6 },
        "Level 4": { "80/20": 12, "90/10": 5 },
        "Level 5": { "80/20": 8, "90/10": 4 },
        "Level 6": { "80/20": 6, "90/10": 3 },
        "Level 7": { "80/20": 4, "90/10": 2 },
        "Level 8": { "80/20": 2, "90/10": 1 },
        "Non-Compliant": { "80/20": 0, "90/10": 0 },
      };

      const system = scoringSystem === "90/10" ? "90/10" : "80/20";
      const maxPoints = system === "90/10" ? 10 : 20;
      const points = pointsMap[bbbeeLevel]?.[system] || 0;

      res.json({
        vendorLevel: bbbeeLevel,
        scoringSystem: system,
        points,
        maxPoints,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate B-BBEE points" });
    }
  });

  // WhatsApp Templates CRUD
  app.get("/api/whatsapp-templates", async (req, res) => {
    try {
      const municipalityId = req.query.municipalityId as string | undefined;
      const templates = await storage.getWhatsappTemplates(municipalityId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch WhatsApp templates" });
    }
  });

  app.get("/api/whatsapp-templates/:id", async (req, res) => {
    try {
      const template = await storage.getWhatsappTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "WhatsApp template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch WhatsApp template" });
    }
  });

  app.post("/api/whatsapp-templates", async (req, res) => {
    try {
      const template = await storage.createWhatsappTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Failed to create WhatsApp template:", error);
      res.status(500).json({ error: "Failed to create WhatsApp template" });
    }
  });

  app.put("/api/whatsapp-templates/:id", async (req, res) => {
    try {
      const template = await storage.updateWhatsappTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "WhatsApp template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update WhatsApp template" });
    }
  });

  app.delete("/api/whatsapp-templates/:id", async (req, res) => {
    try {
      const success = await storage.deleteWhatsappTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "WhatsApp template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete WhatsApp template" });
    }
  });

  // Notification Settings
  app.get("/api/notification-settings/:channel", async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings(req.params.channel);
      res.json(settings || { channel: req.params.channel, triggerToggles: "{}", isActive: false });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notification-settings/:channel", async (req, res) => {
    try {
      const settings = await storage.upsertNotificationSettings({
        ...req.body,
        channel: req.params.channel,
      });
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Notification Logs
  app.get("/api/notification-logs", async (req, res) => {
    try {
      const vendorId = req.query.vendorId as string | undefined;
      const logs = await storage.getNotificationLogs(vendorId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification logs" });
    }
  });

  // WhatsApp Notification Endpoints
  app.get("/api/notifications/whatsapp/test", async (req, res) => {
    try {
      const { testWhatsAppConnection } = await import("./notifications");
      const result = await testWhatsAppConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to test WhatsApp connection" });
    }
  });

  const sendNotificationSchema = z.object({
    trigger: z.enum([
      "tender_published", "tender_closing_soon", "tender_closed", "under_evaluation",
      "clarification_requested", "shortlisted", "standstill_period", "awarded",
      "unsuccessful", "tender_cancelled", "submission_received", "document_verified", "document_rejected"
    ]),
    vendorId: z.string().min(1),
    context: z.object({}).passthrough().optional(),
  });

  app.post("/api/notifications/whatsapp/send", async (req, res) => {
    try {
      const parsed = sendNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      const { sendWhatsAppNotification } = await import("./notifications");
      const { trigger, vendorId, context } = parsed.data;
      
      const result = await sendWhatsAppNotification(trigger, vendorId, context || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send WhatsApp notification" });
    }
  });

  const sendBulkNotificationSchema = z.object({
    trigger: z.enum([
      "tender_published", "tender_closing_soon", "tender_closed", "under_evaluation",
      "clarification_requested", "shortlisted", "standstill_period", "awarded",
      "unsuccessful", "tender_cancelled", "submission_received", "document_verified", "document_rejected"
    ]),
    vendorIds: z.array(z.string().min(1)).min(1),
    context: z.object({}).passthrough().optional(),
  });

  app.post("/api/notifications/whatsapp/send-bulk", async (req, res) => {
    try {
      const parsed = sendBulkNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      const { sendBulkWhatsAppNotification } = await import("./notifications");
      const { trigger, vendorIds, context } = parsed.data;
      
      const result = await sendBulkWhatsAppNotification(trigger, vendorIds, context || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send bulk WhatsApp notifications" });
    }
  });

  const tenderStatusChangeSchema = z.object({
    tenderId: z.string().min(1),
    newStatus: z.string().min(1),
    vendorIds: z.array(z.string().min(1)).optional(),
  });

  app.post("/api/notifications/tender-status-change", async (req, res) => {
    try {
      const parsed = tenderStatusChangeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      const { notifyTenderStatusChange } = await import("./notifications");
      const { tenderId, newStatus, vendorIds } = parsed.data;
      
      await notifyTenderStatusChange(tenderId, newStatus, vendorIds);
      res.json({ success: true, message: "Notifications queued" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send tender status notifications" });
    }
  });

  // Email notification endpoints (SendGrid)
  app.get("/api/notifications/email/test", async (req, res) => {
    try {
      const { testSendGridConnection } = await import("./email-notifications");
      const result = await testSendGridConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to test SendGrid connection" });
    }
  });

  const sendEmailSchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    htmlContent: z.string().min(1),
    textContent: z.string().optional(),
  });

  app.post("/api/notifications/email/send", async (req, res) => {
    try {
      const parsed = sendEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { sendEmail } = await import("./email-notifications");
      const { to, subject, htmlContent, textContent } = parsed.data;

      const result = await sendEmail(to, subject, htmlContent, textContent);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  const sendTemplatedEmailSchema = z.object({
    templateId: z.string().min(1),
    vendorId: z.string().min(1),
    trigger: z.enum([
      "tender_published", "tender_closing_soon", "tender_closed", "under_evaluation",
      "clarification_requested", "shortlisted", "standstill_period", "awarded",
      "unsuccessful", "tender_cancelled", "submission_received", "document_verified", "document_rejected"
    ]).optional(),
    context: z.object({
      tender: z.object({
        tenderNumber: z.string().optional(),
        title: z.string().optional(),
        closingDate: z.string().optional(),
        estimatedValue: z.number().optional(),
      }).optional(),
      amount: z.number().optional(),
      status: z.string().optional(),
      senderName: z.string().optional(),
      senderPosition: z.string().optional(),
      senderOrganisation: z.string().optional(),
      senderContactDetails: z.string().optional(),
    }).optional(),
  });

  app.post("/api/notifications/email/send-templated", async (req, res) => {
    try {
      const parsed = sendTemplatedEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { sendTemplatedEmail } = await import("./email-notifications");
      const { templateId, vendorId, trigger, context } = parsed.data;

      const result = await sendTemplatedEmail(templateId, vendorId, context || {}, trigger || 'tender_published');
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send templated email" });
    }
  });

  const sendBulkTemplatedEmailSchema = z.object({
    templateId: z.string().min(1),
    vendorIds: z.array(z.string().min(1)).min(1),
    trigger: z.enum([
      "tender_published", "tender_closing_soon", "tender_closed", "under_evaluation",
      "clarification_requested", "shortlisted", "standstill_period", "awarded",
      "unsuccessful", "tender_cancelled", "submission_received", "document_verified", "document_rejected"
    ]).optional(),
    context: z.object({
      tender: z.object({
        tenderNumber: z.string().optional(),
        title: z.string().optional(),
        closingDate: z.string().optional(),
        estimatedValue: z.number().optional(),
      }).optional(),
      amount: z.number().optional(),
      status: z.string().optional(),
      senderName: z.string().optional(),
      senderPosition: z.string().optional(),
      senderOrganisation: z.string().optional(),
      senderContactDetails: z.string().optional(),
    }).optional(),
  });

  app.post("/api/notifications/email/send-bulk-templated", async (req, res) => {
    try {
      const parsed = sendBulkTemplatedEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { sendBulkTemplatedEmail } = await import("./email-notifications");
      const { templateId, vendorIds, context } = parsed.data;

      const result = await sendBulkTemplatedEmail(templateId, vendorIds, context || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send bulk templated emails" });
    }
  });

  // Chatbot API endpoint
  const chatbotMessageSchema = z.object({
    message: z.string().min(1),
    history: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })).optional(),
  });

  app.post("/api/chatbot/message", async (req, res) => {
    try {
      const parsed = chatbotMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { message, history = [] } = parsed.data;

      const openai = new OpenAI();
      
      const systemPrompt = `You are the VeritasAI Assistant, a helpful chatbot for a global bid evaluation and procurement compliance platform. You help users and potential clients understand the platform's features, pricing, and how to get started.

KEY INFORMATION ABOUT VERITASAI:

PLATFORM OVERVIEW:
- VeritasAI is an AI-powered multi-tenant SaaS platform for bid evaluation and procurement compliance
- Serves organizations across Africa (all 54 nations), Middle East (UAE), and expanding globally
- Handles vendor management, tender tracking, AI document processing, and compliance verification

PRICING (Annual):
- Starter: $499/year - 50 bids/month, 500 docs, 5GB storage, email support, $2.00/bid overage
- Professional: $1,499/year - 300 bids/month, 3,000 docs, 25GB storage, API access, $1.00/bid overage
- Enterprise: $3,999/year - 1,500 bids/month, 15,000 docs, 100GB storage, priority support, $0.50/bid overage
- Government: Custom pricing - Contact sales for tailored solutions

SUPPORTED COUNTRIES:
- South Africa: B-BBEE, CSD verification, 80/20 and 90/10 scoring, PFMA/PPPFA compliance
- Kenya: AGPO (Youth, Women, PWD preferences), PPRA compliance
- Nigeria: Local Content Act, BPP compliance
- Ghana: PPA regulations, local participation requirements
- UAE: In-Country Value (ICV) requirements
- UK: Public Contracts Regulations 2015, Social Value Act
- USA: FAR/DFAR, SBA small business preferences
- GLOBAL: Universal framework works for any country

KEY FEATURES:
- AI-powered document verification and fraud detection
- Multi-language support (English, French, Portuguese, Arabic)
- Automatic compliance rule checking
- Tender lifecycle management
- Real-time analytics and reporting
- Complete audit trail
- API integration for programmatic access
- Webhook notifications

GETTING STARTED:
1. Create account via sign-up
2. Choose subscription plan
3. Configure country/compliance rules
4. Add vendors and upload documents
5. Create tenders and receive bids
6. AI verifies documents automatically
7. Score and award tenders

SECURITY:
- AES-256-GCM encryption for sensitive data
- Role-based access control (RBAC)
- Complete audit logging
- POPIA, GDPR compliant

SUPPORT:
- Email support (all plans)
- Chat support (Professional+)
- Priority support with 4-hour response (Enterprise)
- Dedicated account manager (Government)

Be helpful, friendly, and concise. If you don't know something, suggest they contact sales or check the documentation. Always encourage users to explore the platform's features.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

      res.json({ response });
    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // === STRIPE PAYMENT ROUTES ===
  const { stripeService } = await import("./stripeService");
  const { getStripePublishableKey } = await import("./stripeClient");

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  // List products with prices
  app.get("/api/stripe/products", async (req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error listing products:", error);
      res.status(500).json({ error: "Failed to list products" });
    }
  });

  // List prices
  app.get("/api/stripe/prices", async (req, res) => {
    try {
      const prices = await stripeService.listPrices();
      res.json({ data: prices });
    } catch (error) {
      console.error("Error listing prices:", error);
      res.status(500).json({ error: "Failed to list prices" });
    }
  });

  // Create checkout session for subscription
  app.post("/api/stripe/checkout", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const { priceId, tenantId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      // Check if tenant already has a Stripe customer ID
      let customerId: string;
      const tenant = tenantId ? await storage.getTenant(tenantId) : null;
      
      if (tenant?.stripeCustomerId) {
        customerId = tenant.stripeCustomerId;
      } else {
        // Create a new customer
        const customer = await stripeService.createCustomer(
          user.email || `user-${user.id}@veritasai.com`,
          tenantId || 'default',
          { userId: user.id }
        );
        customerId = customer.id;
        
        // Save customer ID to tenant if tenant exists
        if (tenant && tenantId) {
          await storage.updateTenant(tenantId, { stripeCustomerId: customerId });
        }
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/billing?success=true`,
        `${baseUrl}/billing?canceled=true`,
        { tenantId: tenantId || 'default', userId: user.id }
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Create customer portal session for managing subscription
  app.post("/api/stripe/portal", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.body;
      
      const tenant = tenantId ? await storage.getTenant(tenantId) : null;
      
      if (!tenant?.stripeCustomerId) {
        return res.status(400).json({ error: "No subscription found for this organization" });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createCustomerPortalSession(
        tenant.stripeCustomerId,
        `${baseUrl}/billing`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // Get current subscription status
  app.get("/api/stripe/subscription/:tenantId", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const tenant = await storage.getTenant(tenantId);
      
      if (!tenant?.stripeCustomerId) {
        return res.json({ subscription: null });
      }

      const subscriptions = await stripeService.getCustomerSubscriptions(tenant.stripeCustomerId);
      const activeSubscription = subscriptions.find((s: any) => 
        s.status === 'active' || s.status === 'trialing'
      );

      res.json({ subscription: activeSubscription || null });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });
}
