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
} from "@shared/schema";
import { z } from "zod";

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
}
