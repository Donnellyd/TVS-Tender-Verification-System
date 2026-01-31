import { Router } from "express";
import { storage } from "./storage";
import { tenantStorage } from "./tenant-storage";
import { complianceRulesStorage } from "./compliance-storage";
import { analyzeDocument, detectDocumentType, generateComplianceReport } from "./ai-document-processor";
import { z } from "zod";
import crypto from "crypto";

export const apiV1Router = Router();

interface ApiKeyInfo {
  tenantId: string;
  keyId: string;
  permissions: string[];
  rateLimit: number;
}

const apiKeyCache = new Map<string, { info: ApiKeyInfo; expiresAt: number }>();

async function validateApiKey(apiKey: string): Promise<ApiKeyInfo | null> {
  if (!apiKey || !apiKey.startsWith("gtvs_")) {
    return null;
  }

  const cached = apiKeyCache.get(apiKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.info;
  }

  const keyInfo = await tenantStorage.validateApiKey(apiKey);
  if (!keyInfo) {
    return null;
  }

  apiKeyCache.set(apiKey, {
    info: keyInfo,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return keyInfo;
}

const apiKeyAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const xApiKey = req.headers["x-api-key"];
  
  let apiKey = "";
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    apiKey = authHeader.substring(7);
  } else if (xApiKey) {
    apiKey = Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
  }
  
  if (!apiKey) {
    return res.status(401).json({
      error: "unauthorized",
      message: "API key required. Use Authorization: Bearer <key> or X-API-Key header.",
    });
  }
  
  const keyInfo = await validateApiKey(apiKey);
  if (!keyInfo) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Invalid or expired API key",
    });
  }
  
  req.apiKeyInfo = keyInfo;
  next();
};

apiV1Router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

apiV1Router.get("/docs", (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "GLOBAL-TVS API",
      version: "1.0.0",
      description: "Global Tender Verification System API",
    },
    servers: [
      { url: "/api/v1", description: "API v1" },
    ],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: { "200": { description: "API is healthy" } },
        },
      },
      "/bids": {
        post: {
          summary: "Submit a bid for evaluation",
          security: [{ bearerAuth: [] }],
        },
        get: {
          summary: "List bids",
          security: [{ bearerAuth: [] }],
        },
      },
      "/bids/{id}": {
        get: {
          summary: "Get bid details and evaluation results",
          security: [{ bearerAuth: [] }],
        },
      },
      "/documents/verify": {
        post: {
          summary: "Verify a document",
          security: [{ bearerAuth: [] }],
        },
      },
      "/compliance/rules": {
        get: {
          summary: "List compliance rules for a country",
          security: [{ bearerAuth: [] }],
        },
      },
    },
  });
});

const submitBidSchema = z.object({
  tenderId: z.string(),
  vendorId: z.string().optional(),
  vendorName: z.string(),
  bidAmount: z.number().positive(),
  currency: z.string().default("USD"),
  documents: z.array(z.object({
    type: z.string(),
    content: z.string().optional(),
    url: z.string().optional(),
    filename: z.string().optional(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
});

apiV1Router.post("/bids", apiKeyAuth, async (req, res) => {
  try {
    const parsed = submitBidSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "validation_error",
        message: "Invalid bid data",
        details: parsed.error.errors,
      });
    }

    const { tenderId, vendorName, bidAmount, currency, documents, metadata } = parsed.data;
    const tenantId = (req as any).apiKeyInfo.tenantId;

    const bidId = `BID-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    
    const documentResults = [];
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        if (doc.content) {
          const typeDetection = await detectDocumentType(doc.content);
          const analysis = await analyzeDocument(doc.content, typeDetection.type);
          documentResults.push({
            ...analysis,
            documentType: doc.type || typeDetection.type,
          });
        }
      }
    }

    const complianceReport = await generateComplianceReport(documentResults, {
      tenderId,
      vendorId: parsed.data.vendorId || vendorName,
      bidAmount,
    });

    res.status(201).json({
      id: bidId,
      tenderId,
      vendorName,
      bidAmount,
      currency,
      status: "submitted",
      compliance: complianceReport,
      createdAt: new Date().toISOString(),
      documentsProcessed: documentResults.length,
    });
  } catch (error) {
    console.error("Bid submission error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to process bid submission",
    });
  }
});

apiV1Router.get("/bids", apiKeyAuth, async (req, res) => {
  try {
    const tenantId = (req as any).apiKeyInfo.tenantId;
    const { tenderId, status, limit = 50, offset = 0 } = req.query;

    const submissions = await storage.getBidSubmissions();
    
    let filtered = submissions;
    if (tenderId) {
      filtered = filtered.filter((s: any) => s.tenderId === Number(tenderId));
    }
    if (status) {
      filtered = filtered.filter((s: any) => s.status === status);
    }

    const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      data: paginated,
      pagination: {
        total: filtered.length,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < filtered.length,
      },
    });
  } catch (error) {
    console.error("List bids error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch bids",
    });
  }
});

apiV1Router.get("/bids/:id", apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bidId = parseInt(id);
    
    if (isNaN(bidId)) {
      return res.status(400).json({
        error: "validation_error",
        message: "Invalid bid ID",
      });
    }

    const bid = await storage.getBidSubmission(bidId.toString());
    if (!bid) {
      return res.status(404).json({
        error: "not_found",
        message: "Bid not found",
      });
    }

    const documents = await storage.getSubmissionDocuments(bidId.toString());

    res.json({
      ...bid,
      documents,
    });
  } catch (error) {
    console.error("Get bid error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch bid details",
    });
  }
});

const verifyDocumentSchema = z.object({
  content: z.string(),
  type: z.string().optional(),
  language: z.string().optional(),
  checkFraud: z.boolean().default(true),
});

apiV1Router.post("/documents/verify", apiKeyAuth, async (req, res) => {
  try {
    const parsed = verifyDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "validation_error",
        message: "Invalid document data",
        details: parsed.error.errors,
      });
    }

    const { content, type, language } = parsed.data;
    
    const typeDetection = type ? { type, confidence: 1 } : await detectDocumentType(content);
    const analysis = await analyzeDocument(content, typeDetection.type, language || "en");

    res.json({
      ...analysis,
      detectedType: typeDetection.type,
      typeConfidence: typeDetection.confidence,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Document verification error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to verify document",
    });
  }
});

apiV1Router.get("/compliance/rules", apiKeyAuth, async (req, res) => {
  try {
    const { country = "GLOBAL" } = req.query;
    
    const ruleSets = await complianceRulesStorage.getRuleSets(country as string);
    const activeRuleSet = ruleSets.find(rs => rs.isActive && rs.isDefault);

    if (!activeRuleSet) {
      return res.json({
        country,
        rules: [],
        message: "No active rule set found for this country",
      });
    }

    const rules = await complianceRulesStorage.getRuleDefinitions(activeRuleSet.id);

    res.json({
      country,
      ruleSetId: activeRuleSet.id,
      ruleSetName: activeRuleSet.name,
      version: activeRuleSet.version,
      rules: rules.filter(r => r.isActive),
    });
  } catch (error) {
    console.error("Get compliance rules error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch compliance rules",
    });
  }
});

apiV1Router.get("/compliance/countries", apiKeyAuth, async (req, res) => {
  try {
    const countries = await complianceRulesStorage.getSupportedCountries();
    res.json({ countries });
  } catch (error) {
    console.error("Get countries error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch supported countries",
    });
  }
});

const registerWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
});

apiV1Router.post("/webhooks", apiKeyAuth, async (req, res) => {
  try {
    const parsed = registerWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "validation_error",
        message: "Invalid webhook data",
        details: parsed.error.errors,
      });
    }

    const { url, events, secret } = parsed.data;
    const tenantId = (req as any).apiKeyInfo.tenantId;
    const webhookSecret = secret || `whsec_${crypto.randomBytes(32).toString("hex")}`;
    const webhookId = `wh_${crypto.randomBytes(16).toString("hex")}`;

    res.status(201).json({
      id: webhookId,
      url,
      events,
      secret: webhookSecret,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook registration error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to register webhook",
    });
  }
});

apiV1Router.get("/usage", apiKeyAuth, async (req, res) => {
  try {
    const tenantId = (req as any).apiKeyInfo.tenantId;
    const { period = "current" } = req.query;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    res.json({
      period: {
        start: startOfMonth.toISOString(),
        end: now.toISOString(),
      },
      usage: {
        bidsProcessed: 0,
        documentsVerified: 0,
        apiCalls: 0,
        storageUsedMb: 0,
      },
      limits: {
        bidsIncluded: 100,
        documentsIncluded: 1000,
        storageIncludedMb: 10000,
      },
    });
  } catch (error) {
    console.error("Get usage error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch usage data",
    });
  }
});
