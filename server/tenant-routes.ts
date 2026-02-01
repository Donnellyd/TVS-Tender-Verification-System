import { Router, Request, Response } from "express";
import { tenantStorage } from "./tenant-storage";
import { complianceRulesStorage, getCountryComplianceConfig } from "./compliance-storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { insertTenantSchema, insertSubscriptionSchema, SUBSCRIPTION_TIERS, insertComplianceRuleSetSchema, insertComplianceRuleDefinitionSchema, insertCountryComplianceInfoSchema } from "@shared/schema";
import { analyzeDocument, detectDocumentType, checkFraudIndicators, generateComplianceReport } from "./ai-document-processor";
import { storage } from "./storage";
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
  try {
    const countries = await storage.getCountryComplianceInfo();
    if (countries.length === 0) {
      const fallbackCountries = [
        { countryCode: "ZA", countryName: "South Africa", region: "Africa", status: "active" },
        { countryCode: "KE", countryName: "Kenya", region: "Africa", status: "active" },
        { countryCode: "NG", countryName: "Nigeria", region: "Africa", status: "active" },
        { countryCode: "GH", countryName: "Ghana", region: "Africa", status: "active" },
        { countryCode: "AE", countryName: "United Arab Emirates", region: "Middle East", status: "active" },
        { countryCode: "UK", countryName: "United Kingdom", region: "Europe", status: "active" },
        { countryCode: "US", countryName: "United States", region: "Americas", status: "active" },
        { countryCode: "GLOBAL", countryName: "Global (All Countries)", region: "Global", status: "active" },
      ];
      return res.json(fallbackCountries);
    }
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch countries" });
  }
});

tenantRouter.get("/compliance/countries/:code", async (req, res) => {
  try {
    const country = await storage.getCountryComplianceInfoByCode(req.params.code);
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }
    res.json(country);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch country info" });
  }
});

tenantRouter.get("/compliance/countries/:code/config", async (req, res) => {
  const config = getCountryComplianceConfig(req.params.code);
  res.json(config);
});

tenantRouter.post("/compliance/countries/seed", async (req, res) => {
  try {
    const countryData = getCountrySeedData();
    const results = [];
    for (const country of countryData) {
      const result = await storage.upsertCountryComplianceInfo(country);
      results.push(result);
    }
    res.json({ message: "Country compliance data seeded successfully", count: results.length });
  } catch (error) {
    console.error("Failed to seed country data:", error);
    res.status(500).json({ message: "Failed to seed country data" });
  }
});

function getCountrySeedData() {
  return [
    {
      countryCode: "ZA",
      countryName: "South Africa",
      region: "Africa",
      status: "active",
      description: "South Africa's procurement framework emphasizes transformation through B-BBEE (Broad-Based Black Economic Empowerment) requirements and the Central Supplier Database (CSD) verification system.",
      complianceFrameworks: [
        { name: "B-BBEE", description: "Broad-Based Black Economic Empowerment", required: true },
        { name: "CSD", description: "Central Supplier Database Registration", required: true },
        { name: "PFMA", description: "Public Finance Management Act", required: true },
        { name: "PPPFA", description: "Preferential Procurement Policy Framework Act", required: true }
      ],
      documentTypes: [
        { type: "Tax Clearance", description: "SARS Tax Clearance Certificate", required: true },
        { type: "B-BBEE Certificate", description: "Broad-Based Black Economic Empowerment Certificate", required: true },
        { type: "CSD Registration", description: "Central Supplier Database Registration", required: true },
        { type: "Company Registration", description: "CIPC Company Registration", required: true },
        { type: "VAT Certificate", description: "Value Added Tax Registration", required: false }
      ],
      scoringMethodologies: [
        { name: "80/20", description: "80 points for price, 20 points for B-BBEE status (for bids under R50 million)" },
        { name: "90/10", description: "90 points for price, 10 points for B-BBEE status (for bids over R50 million)" }
      ],
      governmentIntegrations: [
        { name: "SARS", description: "South African Revenue Service - Tax verification" },
        { name: "CSD", description: "Central Supplier Database - Supplier verification" },
        { name: "CIPC", description: "Companies and Intellectual Property Commission" }
      ],
      languages: ["English"],
      keyFeatures: [
        "B-BBEE Level verification (Levels 1-8)",
        "Automatic CSD validation",
        "Tax clearance certificate verification",
        "80/20 and 90/10 preferential scoring",
        "Enterprise development credits"
      ]
    },
    {
      countryCode: "KE",
      countryName: "Kenya",
      region: "Africa",
      status: "active",
      description: "Kenya's procurement system emphasizes Access to Government Procurement Opportunities (AGPO) for youth, women, and persons with disabilities, regulated by the Public Procurement Regulatory Authority (PPRA).",
      complianceFrameworks: [
        { name: "AGPO", description: "Access to Government Procurement Opportunities", required: true },
        { name: "PPRA", description: "Public Procurement Regulatory Authority Regulations", required: true },
        { name: "PPADA 2015", description: "Public Procurement and Asset Disposal Act 2015", required: true }
      ],
      documentTypes: [
        { type: "Tax Compliance", description: "KRA Tax Compliance Certificate", required: true },
        { type: "AGPO Certificate", description: "Youth/Women/PWD Registration Certificate", required: false },
        { type: "Company Registration", description: "Registrar of Companies Certificate", required: true },
        { type: "CR12", description: "Company Directors and Shareholders Form", required: true },
        { type: "PIN Certificate", description: "Personal Identification Number Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "30% Preference", description: "30% of government procurement reserved for AGPO groups" },
        { name: "Technical/Financial", description: "Standard technical and financial evaluation" }
      ],
      governmentIntegrations: [
        { name: "KRA", description: "Kenya Revenue Authority - Tax compliance" },
        { name: "IFMIS", description: "Integrated Financial Management Information System" }
      ],
      languages: ["English", "Swahili"],
      keyFeatures: [
        "AGPO preference for youth, women, PWD",
        "30% reservation for special groups",
        "KRA tax compliance verification",
        "IFMIS integration support",
        "Multi-language document processing"
      ]
    },
    {
      countryCode: "NG",
      countryName: "Nigeria",
      region: "Africa",
      status: "active",
      description: "Nigeria's procurement system is governed by the Bureau of Public Procurement (BPP) and emphasizes local content requirements, especially in the oil and gas sector.",
      complianceFrameworks: [
        { name: "PPA 2007", description: "Public Procurement Act 2007", required: true },
        { name: "BPP", description: "Bureau of Public Procurement Guidelines", required: true },
        { name: "Nigerian Content Act", description: "Local Content Development Act", required: true }
      ],
      documentTypes: [
        { type: "Tax Clearance", description: "FIRS Tax Clearance Certificate", required: true },
        { type: "CAC Registration", description: "Corporate Affairs Commission Registration", required: true },
        { type: "ITF Compliance", description: "Industrial Training Fund Certificate", required: true },
        { type: "NSITF Compliance", description: "Nigeria Social Insurance Trust Fund", required: true },
        { type: "PENCOM Compliance", description: "Pension Commission Compliance Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Local Content", description: "Points for local content and Nigerian ownership" },
        { name: "Technical Capacity", description: "Evaluation of technical capability and experience" }
      ],
      governmentIntegrations: [
        { name: "FIRS", description: "Federal Inland Revenue Service - Tax verification" },
        { name: "CAC", description: "Corporate Affairs Commission - Company registration" },
        { name: "NCDMB", description: "Nigerian Content Development and Monitoring Board" }
      ],
      languages: ["English"],
      keyFeatures: [
        "Local Content Act compliance scoring",
        "Nigerian ownership preferences",
        "Multiple regulatory compliance verification",
        "Oil & gas sector specialized requirements",
        "BPP registration support"
      ]
    },
    {
      countryCode: "GH",
      countryName: "Ghana",
      region: "Africa",
      status: "active",
      description: "Ghana's procurement system is regulated by the Public Procurement Authority (PPA) with emphasis on local participation and transparency.",
      complianceFrameworks: [
        { name: "PPA Act 2003", description: "Public Procurement Act 663 as amended", required: true },
        { name: "Local Content", description: "Ghana Local Content and Local Participation Regulations", required: true }
      ],
      documentTypes: [
        { type: "Tax Clearance", description: "GRA Tax Clearance Certificate", required: true },
        { type: "Business Registration", description: "Registrar General's Department Certificate", required: true },
        { type: "SSNIT Clearance", description: "Social Security Contribution Certificate", required: true },
        { type: "VAT Registration", description: "Value Added Tax Registration", required: false }
      ],
      scoringMethodologies: [
        { name: "Local Participation", description: "Preference margins for Ghanaian-owned entities" },
        { name: "Technical/Financial", description: "Standard technical and financial scoring" }
      ],
      governmentIntegrations: [
        { name: "GRA", description: "Ghana Revenue Authority - Tax verification" },
        { name: "RGD", description: "Registrar General's Department - Business registration" }
      ],
      languages: ["English"],
      keyFeatures: [
        "PPA compliance verification",
        "Local participation preferences",
        "SSNIT clearance validation",
        "Margin of preference for local suppliers",
        "Transparent evaluation frameworks"
      ]
    },
    {
      countryCode: "AE",
      countryName: "United Arab Emirates",
      region: "Middle East",
      status: "active",
      description: "UAE procurement emphasizes In-Country Value (ICV) requirements to promote local economic development and emiratization.",
      complianceFrameworks: [
        { name: "ICV", description: "In-Country Value Program", required: true },
        { name: "Emiratization", description: "National workforce development requirements", required: false }
      ],
      documentTypes: [
        { type: "Trade License", description: "Department of Economic Development License", required: true },
        { type: "ICV Certificate", description: "In-Country Value Certificate", required: true },
        { type: "VAT Registration", description: "FTA VAT Registration", required: true },
        { type: "Chamber of Commerce", description: "Chamber Membership Certificate", required: false }
      ],
      scoringMethodologies: [
        { name: "ICV Scoring", description: "In-Country Value percentage scoring" },
        { name: "Technical/Commercial", description: "Standard evaluation with ICV weight" }
      ],
      governmentIntegrations: [
        { name: "FTA", description: "Federal Tax Authority" },
        { name: "DED", description: "Department of Economic Development" }
      ],
      languages: ["English", "Arabic"],
      keyFeatures: [
        "ICV certificate verification",
        "Emiratization compliance checking",
        "Arabic document processing",
        "Free zone company support",
        "ADNOC/government entity compliance"
      ]
    },
    {
      countryCode: "UK",
      countryName: "United Kingdom",
      region: "Europe",
      status: "active",
      description: "UK procurement is governed by the Public Contracts Regulations 2015 with emphasis on value for money and fair competition.",
      complianceFrameworks: [
        { name: "PCR 2015", description: "Public Contracts Regulations 2015", required: true },
        { name: "Social Value", description: "Public Services (Social Value) Act 2012", required: false }
      ],
      documentTypes: [
        { type: "Companies House", description: "Companies House Registration", required: true },
        { type: "Tax Certificates", description: "HMRC Tax Documentation", required: true },
        { type: "Insurance", description: "Public Liability and Professional Indemnity Insurance", required: true },
        { type: "Accounts", description: "Audited Financial Statements", required: false }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" },
        { name: "Social Value", description: "Social value weighting in evaluation" }
      ],
      governmentIntegrations: [
        { name: "Companies House", description: "Company registration verification" },
        { name: "HMRC", description: "Tax status verification" }
      ],
      languages: ["English"],
      keyFeatures: [
        "PCR 2015 compliance checking",
        "Social value assessment",
        "SME-friendly evaluation",
        "Modern slavery statement verification",
        "Environmental standards checking"
      ]
    },
    {
      countryCode: "US",
      countryName: "United States",
      region: "Americas",
      status: "active",
      description: "US federal procurement is governed by the Federal Acquisition Regulation (FAR) with preferences for small businesses and veteran-owned enterprises.",
      complianceFrameworks: [
        { name: "FAR", description: "Federal Acquisition Regulation", required: true },
        { name: "DFAR", description: "Defense Federal Acquisition Regulation Supplement", required: false },
        { name: "SBA Programs", description: "Small Business Administration Set-Aside Programs", required: false }
      ],
      documentTypes: [
        { type: "SAM Registration", description: "System for Award Management Registration", required: true },
        { type: "DUNS Number", description: "Dun & Bradstreet Universal Numbering System", required: true },
        { type: "Tax ID", description: "Employer Identification Number", required: true },
        { type: "SBA Certification", description: "Small Business Certification", required: false }
      ],
      scoringMethodologies: [
        { name: "Best Value", description: "Best value continuum evaluation" },
        { name: "Set-Asides", description: "Small business and veteran-owned set-asides" }
      ],
      governmentIntegrations: [
        { name: "SAM", description: "System for Award Management" },
        { name: "SBA", description: "Small Business Administration certifications" }
      ],
      languages: ["English"],
      keyFeatures: [
        "SAM registration verification",
        "Small business set-aside tracking",
        "SDVOSB/8(a) certification checking",
        "FAR/DFAR compliance validation",
        "Past performance evaluation"
      ]
    },
    {
      countryCode: "GLOBAL",
      countryName: "Global (All Countries)",
      region: "Global",
      status: "active",
      description: "Global compliance framework that provides a baseline for any country not specifically configured. Covers universal document verification and standard procurement best practices.",
      complianceFrameworks: [
        { name: "Universal", description: "Standard international procurement practices", required: true }
      ],
      documentTypes: [
        { type: "Company Registration", description: "Official company registration document", required: true },
        { type: "Tax Certificate", description: "Tax compliance or clearance certificate", required: true },
        { type: "Financial Statements", description: "Audited financial statements", required: false },
        { type: "Insurance", description: "Liability and professional insurance", required: false }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard technical and financial evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["English", "French", "Portuguese", "Arabic"],
      keyFeatures: [
        "Universal document verification",
        "AI-powered document analysis",
        "Multi-language processing (EN/FR/PT/AR)",
        "Customizable compliance rules",
        "Works for any country worldwide"
      ]
    }
  ];
}

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
