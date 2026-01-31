import { Router, Request, Response } from "express";
import { tenantStorage } from "./tenant-storage";
import { complianceRulesStorage, getCountryComplianceConfig } from "./compliance-storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { insertTenantSchema, insertSubscriptionSchema, SUBSCRIPTION_TIERS, insertComplianceRuleSetSchema, insertComplianceRuleDefinitionSchema } from "@shared/schema";
import { analyzeDocument, detectDocumentType, checkFraudIndicators, generateComplianceReport } from "./ai-document-processor";
import crypto from "crypto";

export const tenantRouter = Router();

function getParamString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param || "";
}

tenantRouter.get("/user/tenants", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.json([]);
    }
    const userTenants = await tenantStorage.getUserTenants(userId);
    res.json(userTenants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user tenants" });
  }
});

tenantRouter.get("/tenants", isAuthenticated, async (req, res) => {
  try {
    const tenants = await tenantStorage.getTenants();
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tenants" });
  }
});

tenantRouter.get("/tenants/:id", isAuthenticated, async (req, res) => {
  try {
    const tenant = await tenantStorage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tenant" });
  }
});

tenantRouter.post("/tenants", isAuthenticated, async (req, res) => {
  try {
    const parsed = insertTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid tenant data", errors: parsed.error.errors });
    }
    
    const existingTenant = await tenantStorage.getTenantBySlug(parsed.data.slug);
    if (existingTenant) {
      return res.status(409).json({ message: "Tenant with this slug already exists" });
    }
    
    const tenant = await tenantStorage.createTenant(parsed.data);
    
    await tenantStorage.createSubscription({
      tenantId: tenant.id,
      tier: "starter",
      status: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await tenantStorage.createUsageRecord({
      tenantId: tenant.id,
      periodStart: now,
      periodEnd,
    });
    
    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ message: "Failed to create tenant" });
  }
});

tenantRouter.patch("/tenants/:id", isAuthenticated, async (req, res) => {
  try {
    const tenant = await tenantStorage.updateTenant(req.params.id, req.body);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: "Failed to update tenant" });
  }
});

tenantRouter.delete("/tenants/:id", isAuthenticated, async (req, res) => {
  try {
    await tenantStorage.deleteTenant(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tenant" });
  }
});

tenantRouter.get("/tenants/:id/subscription", isAuthenticated, async (req, res) => {
  try {
    const subscription = await tenantStorage.getSubscription(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
});

tenantRouter.patch("/tenants/:id/subscription", isAuthenticated, async (req, res) => {
  try {
    const subscription = await tenantStorage.getSubscription(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    
    const updated = await tenantStorage.updateSubscription(subscription.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update subscription" });
  }
});

tenantRouter.get("/tenants/:id/usage", isAuthenticated, async (req, res) => {
  try {
    const usage = await tenantStorage.getCurrentUsage(req.params.id);
    const subscription = await tenantStorage.getSubscription(req.params.id);
    
    if (!usage || !subscription) {
      return res.status(404).json({ message: "Usage data not found" });
    }
    
    const tier = subscription.tier as keyof typeof SUBSCRIPTION_TIERS;
    const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.starter;
    
    res.json({
      current: usage,
      limits: {
        bidsIncluded: subscription.bidsIncluded,
        documentsIncluded: subscription.documentsIncluded,
        storageIncludedMb: subscription.storageIncludedMb,
      },
      tier: tierConfig,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch usage" });
  }
});

tenantRouter.get("/tenants/:id/invoices", isAuthenticated, async (req, res) => {
  try {
    const invoices = await tenantStorage.getInvoices(req.params.id);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

tenantRouter.get("/tenants/:id/users", isAuthenticated, async (req, res) => {
  try {
    const users = await tenantStorage.getTenantUsers(req.params.id);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

tenantRouter.post("/tenants/:id/users", isAuthenticated, async (req, res) => {
  try {
    const user = await tenantStorage.createTenantUser({
      tenantId: req.params.id,
      ...req.body,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to add user" });
  }
});

tenantRouter.get("/tenants/:id/api-keys", isAuthenticated, async (req, res) => {
  try {
    const keys = await tenantStorage.getApiKeys(req.params.id);
    res.json(keys.map(k => ({
      ...k,
      keyHash: undefined,
    })));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch API keys" });
  }
});

tenantRouter.post("/tenants/:id/api-keys", isAuthenticated, async (req, res) => {
  try {
    const rawKey = `gtvs_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);
    
    const key = await tenantStorage.createApiKey({
      tenantId: req.params.id,
      name: req.body.name,
      keyHash,
      keyPrefix,
      permissions: req.body.permissions || ["read"],
      rateLimit: req.body.rateLimit || 1000,
      createdBy: (req.user as any)?.claims?.sub,
    });
    
    res.status(201).json({
      ...key,
      rawKey,
      keyHash: undefined,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create API key" });
  }
});

tenantRouter.delete("/tenants/:tenantId/api-keys/:keyId", isAuthenticated, async (req, res) => {
  try {
    await tenantStorage.deleteApiKey(req.params.keyId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete API key" });
  }
});

tenantRouter.get("/subscription-tiers", async (req, res) => {
  res.json(SUBSCRIPTION_TIERS);
});

tenantRouter.get("/compliance/countries", async (req, res) => {
  const countries = [
    { code: "ZA", name: "South Africa", currency: "ZAR" },
    { code: "KE", name: "Kenya", currency: "KES" },
    { code: "NG", name: "Nigeria", currency: "NGN" },
    { code: "GH", name: "Ghana", currency: "GHS" },
    { code: "AE", name: "United Arab Emirates", currency: "AED" },
    { code: "UK", name: "United Kingdom", currency: "GBP" },
    { code: "US", name: "United States", currency: "USD" },
    { code: "GLOBAL", name: "Global", currency: "USD" },
  ];
  res.json(countries);
});

tenantRouter.get("/compliance/countries/:code/config", async (req, res) => {
  const config = getCountryComplianceConfig(req.params.code);
  res.json(config);
});

tenantRouter.get("/compliance/rule-sets", isAuthenticated, async (req, res) => {
  try {
    const { tenantId, country } = req.query;
    const ruleSets = await complianceRulesStorage.getRuleSets(
      tenantId as string | undefined,
      country as string | undefined
    );
    res.json(ruleSets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rule sets" });
  }
});

tenantRouter.get("/compliance/rule-sets/:id", isAuthenticated, async (req, res) => {
  try {
    const ruleSet = await complianceRulesStorage.getRuleSet(req.params.id);
    if (!ruleSet) {
      return res.status(404).json({ message: "Rule set not found" });
    }
    res.json(ruleSet);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rule set" });
  }
});

tenantRouter.post("/compliance/rule-sets", isAuthenticated, async (req, res) => {
  try {
    const parsed = insertComplianceRuleSetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid rule set data", errors: parsed.error.errors });
    }
    
    const ruleSet = await complianceRulesStorage.createRuleSet({
      ...parsed.data,
      createdBy: (req.user as any)?.claims?.sub,
    });
    res.status(201).json(ruleSet);
  } catch (error) {
    res.status(500).json({ message: "Failed to create rule set" });
  }
});

tenantRouter.patch("/compliance/rule-sets/:id", isAuthenticated, async (req, res) => {
  try {
    const ruleSet = await complianceRulesStorage.updateRuleSet(req.params.id, req.body);
    if (!ruleSet) {
      return res.status(404).json({ message: "Rule set not found" });
    }
    res.json(ruleSet);
  } catch (error) {
    res.status(500).json({ message: "Failed to update rule set" });
  }
});

tenantRouter.post("/compliance/rule-sets/:id/publish", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const ruleSet = await complianceRulesStorage.publishRuleSet(req.params.id, userId);
    if (!ruleSet) {
      return res.status(404).json({ message: "Rule set not found" });
    }
    res.json(ruleSet);
  } catch (error) {
    res.status(500).json({ message: "Failed to publish rule set" });
  }
});

tenantRouter.delete("/compliance/rule-sets/:id", isAuthenticated, async (req, res) => {
  try {
    await complianceRulesStorage.deleteRuleSet(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete rule set" });
  }
});

tenantRouter.get("/compliance/rule-sets/:id/rules", isAuthenticated, async (req, res) => {
  try {
    const rules = await complianceRulesStorage.getRuleDefinitions(req.params.id);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rules" });
  }
});

tenantRouter.post("/compliance/rule-sets/:id/rules", isAuthenticated, async (req, res) => {
  try {
    const parsed = insertComplianceRuleDefinitionSchema.safeParse({
      ...req.body,
      ruleSetId: req.params.id,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid rule data", errors: parsed.error.errors });
    }
    
    const rule = await complianceRulesStorage.createRuleDefinition(parsed.data);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: "Failed to create rule" });
  }
});

tenantRouter.patch("/compliance/rules/:id", isAuthenticated, async (req, res) => {
  try {
    const rule = await complianceRulesStorage.updateRuleDefinition(req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }
    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: "Failed to update rule" });
  }
});

tenantRouter.delete("/compliance/rules/:id", isAuthenticated, async (req, res) => {
  try {
    await complianceRulesStorage.deleteRuleDefinition(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete rule" });
  }
});

tenantRouter.get("/compliance/rule-sets/:id/versions", isAuthenticated, async (req, res) => {
  try {
    const versions = await complianceRulesStorage.getRuleVersions(req.params.id);
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch versions" });
  }
});

tenantRouter.post("/ai/analyze-document", isAuthenticated, async (req, res) => {
  try {
    const { content, documentType, language } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Document content is required" });
    }
    
    const result = await analyzeDocument(content, documentType || "general", language || "en");
    res.json(result);
  } catch (error) {
    console.error("Document analysis error:", error);
    res.status(500).json({ message: "Failed to analyze document" });
  }
});

tenantRouter.post("/ai/detect-document-type", isAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Document content is required" });
    }
    
    const result = await detectDocumentType(content);
    res.json(result);
  } catch (error) {
    console.error("Document type detection error:", error);
    res.status(500).json({ message: "Failed to detect document type" });
  }
});

tenantRouter.post("/ai/check-fraud", isAuthenticated, async (req, res) => {
  try {
    const { content, metadata } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Document content is required" });
    }
    
    const indicators = await checkFraudIndicators(content, metadata);
    res.json({ indicators });
  } catch (error) {
    console.error("Fraud check error:", error);
    res.status(500).json({ message: "Failed to check for fraud indicators" });
  }
});

tenantRouter.post("/ai/generate-compliance-report", isAuthenticated, async (req, res) => {
  try {
    const { documentResults, bidDetails } = req.body;
    if (!documentResults || !bidDetails) {
      return res.status(400).json({ message: "Document results and bid details are required" });
    }
    
    const report = await generateComplianceReport(documentResults, bidDetails);
    res.json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ message: "Failed to generate compliance report" });
  }
});
