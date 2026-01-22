import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
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
import * as pdfParse from "pdf-parse";

const upload = multer({ 
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

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Auth-protected API routes (except auth routes themselves)
  app.use(/^\/api(?!\/auth|\/login|\/logout|\/callback)/, isAuthenticated);

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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
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
      const success = await storage.deleteVendor(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "delete_vendor",
        entityType: "vendor",
        entityId: req.params.id,
      });
      res.status(204).send();
    } catch (error) {
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

  app.post("/api/tenders", async (req, res) => {
    try {
      const data = insertTenderSchema.parse(req.body);
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create tender" });
    }
  });

  app.put("/api/tenders/:id", async (req, res) => {
    try {
      const data = insertTenderSchema.partial().parse(req.body);
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
      const success = await storage.deleteTender(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Tender not found" });
      }
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        action: "delete_tender",
        entityType: "tender",
        entityId: req.params.id,
      });
      res.status(204).send();
    } catch (error) {
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
  app.post("/api/tenders/:tenderId/upload-pdf", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      // Parse PDF to extract text
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from PDF. The PDF may be image-based or protected." });
      }

      res.json({ 
        success: true, 
        text: extractedText,
        pages: pdfData.numpages,
        info: pdfData.info
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
        const matchingDoc = documents.find(d => d.documentType === req.requirementType);
        
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

      // Update submission
      await storage.updateBidSubmission(req.params.submissionId, {
        status: overallPassed ? "passed" : "failed",
        complianceResult: overallPassed ? "passed" : "failed",
        complianceNotes: failedReasons.length > 0 ? failedReasons.join("; ") : "All requirements met",
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
}
