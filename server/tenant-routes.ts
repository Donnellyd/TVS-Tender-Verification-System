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
    // AUSTRALIA
    {
      countryCode: "AU",
      countryName: "Australia",
      region: "Asia-Pacific",
      status: "active",
      description: "Australian procurement follows Commonwealth Procurement Rules (CPRs) with emphasis on value for money and Indigenous procurement targets.",
      complianceFrameworks: [
        { name: "CPRs", description: "Commonwealth Procurement Rules", required: true },
        { name: "IPP", description: "Indigenous Procurement Policy", required: false }
      ],
      documentTypes: [
        { type: "ABN Registration", description: "Australian Business Number Registration", required: true },
        { type: "Tax Certificate", description: "ATO Tax Clearance Certificate", required: true },
        { type: "Insurance", description: "Public Liability Insurance", required: true }
      ],
      scoringMethodologies: [
        { name: "Value for Money", description: "Value for money assessment framework" }
      ],
      governmentIntegrations: [
        { name: "ATO", description: "Australian Taxation Office" },
        { name: "ASIC", description: "Australian Securities and Investments Commission" }
      ],
      languages: ["English"],
      keyFeatures: [
        "CPR compliance checking",
        "Indigenous procurement tracking",
        "ABN verification",
        "Value for money assessment",
        "State/territory procurement support"
      ]
    },
    // EU COUNTRIES
    {
      countryCode: "DE",
      countryName: "Germany",
      region: "Europe",
      status: "active",
      description: "German procurement follows EU Directives with additional national regulations including GWB and VgV for public contracts.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "GWB", description: "Gesetz gegen Wettbewerbsbeschränkungen", required: true },
        { name: "VgV", description: "Vergabeverordnung", required: true }
      ],
      documentTypes: [
        { type: "Handelsregister", description: "Commercial Register Extract", required: true },
        { type: "Tax Certificate", description: "Finanzamt Tax Clearance", required: true },
        { type: "Social Insurance", description: "Social Insurance Compliance Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["German", "English"],
      keyFeatures: [
        "EU Directive compliance",
        "Handelsregister verification",
        "Social insurance validation",
        "Environmental criteria support",
        "SME-friendly evaluation"
      ]
    },
    {
      countryCode: "FR",
      countryName: "France",
      region: "Europe",
      status: "active",
      description: "French procurement follows EU Directives with Code de la Commande Publique governing public contracts.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "CCP", description: "Code de la Commande Publique", required: true }
      ],
      documentTypes: [
        { type: "KBIS", description: "Extrait Kbis - Company Registration", required: true },
        { type: "Tax Certificate", description: "Attestation Fiscale", required: true },
        { type: "Social Certificate", description: "Attestation URSSAF", required: true }
      ],
      scoringMethodologies: [
        { name: "MAPA", description: "Marché à Procédure Adaptée for smaller contracts" },
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: [
        "KBIS company verification",
        "URSSAF social compliance",
        "Environmental clause support",
        "French language document processing",
        "SME preference tracking"
      ]
    },
    {
      countryCode: "NL",
      countryName: "Netherlands",
      region: "Europe",
      status: "active",
      description: "Dutch procurement follows EU Directives with emphasis on sustainability and innovation in public contracts.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "Aanbestedingswet", description: "Dutch Public Procurement Act 2012", required: true }
      ],
      documentTypes: [
        { type: "KvK Extract", description: "Chamber of Commerce Registration", required: true },
        { type: "Tax Certificate", description: "Belastingdienst Tax Clearance", required: true },
        { type: "UEA", description: "Uniform European Aanbestedingsdocument", required: true }
      ],
      scoringMethodologies: [
        { name: "EMVI", description: "Economisch Meest Voordelige Inschrijving" }
      ],
      governmentIntegrations: [],
      languages: ["Dutch", "English"],
      keyFeatures: [
        "KvK registration verification",
        "Sustainability criteria support",
        "EMVI evaluation framework",
        "Social return requirements",
        "Innovation procurement support"
      ]
    },
    {
      countryCode: "IT",
      countryName: "Italy",
      region: "Europe",
      status: "active",
      description: "Italian procurement follows EU Directives with Codice dei Contratti Pubblici governing public contracts.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "D.Lgs. 36/2023", description: "New Italian Public Contracts Code", required: true }
      ],
      documentTypes: [
        { type: "Visura Camerale", description: "Chamber of Commerce Certificate", required: true },
        { type: "DURC", description: "Social Insurance Compliance Certificate", required: true },
        { type: "Tax Certificate", description: "Agenzia delle Entrate Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "OEPV", description: "Offerta Economicamente Più Vantaggiosa" }
      ],
      governmentIntegrations: [],
      languages: ["Italian", "English"],
      keyFeatures: [
        "DURC social compliance verification",
        "Anti-mafia certification support",
        "Visura camerale validation",
        "SOA qualification checking",
        "MePA marketplace integration"
      ]
    },
    {
      countryCode: "ES",
      countryName: "Spain",
      region: "Europe",
      status: "active",
      description: "Spanish procurement follows EU Directives with Ley de Contratos del Sector Público governing public contracts.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "LCSP", description: "Ley 9/2017 de Contratos del Sector Público", required: true }
      ],
      documentTypes: [
        { type: "Registro Mercantil", description: "Commercial Registry Certificate", required: true },
        { type: "Tax Certificate", description: "AEAT Tax Clearance Certificate", required: true },
        { type: "Social Security", description: "TGSS Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["Spanish", "English"],
      keyFeatures: [
        "ROLECE registry verification",
        "Social security compliance",
        "Regional autonomy support",
        "Social clause evaluation",
        "Environmental criteria"
      ]
    },
    {
      countryCode: "BE",
      countryName: "Belgium",
      region: "Europe",
      status: "active",
      description: "Belgian procurement follows EU Directives with federal and regional procurement regulations.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "Belgian Public Procurement Law", description: "Wet inzake Overheidsopdrachten", required: true }
      ],
      documentTypes: [
        { type: "BCE Extract", description: "Banque-Carrefour des Entreprises Extract", required: true },
        { type: "Tax Certificate", description: "SPF Finances Tax Certificate", required: true },
        { type: "ONSS Certificate", description: "Social Security Compliance", required: true }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["French", "Dutch", "German", "English"],
      keyFeatures: [
        "Multi-regional compliance",
        "BCE verification",
        "Social security validation",
        "Multi-language support (FR/NL/DE)",
        "Federal/regional procurement"
      ]
    },
    {
      countryCode: "PT",
      countryName: "Portugal",
      region: "Europe",
      status: "active",
      description: "Portuguese procurement follows EU Directives with Código dos Contratos Públicos governing public contracts.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "CCP", description: "Código dos Contratos Públicos", required: true }
      ],
      documentTypes: [
        { type: "Certidão Permanente", description: "Permanent Company Certificate", required: true },
        { type: "Tax Certificate", description: "AT Tax Clearance Certificate", required: true },
        { type: "Social Security", description: "Segurança Social Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["Portuguese", "English"],
      keyFeatures: [
        "BASE platform compliance",
        "Portuguese document processing",
        "Social security verification",
        "Tax clearance validation",
        "Public contract registry"
      ]
    },
    {
      countryCode: "SE",
      countryName: "Sweden",
      region: "Europe",
      status: "active",
      description: "Swedish procurement follows EU Directives with LOU (Public Procurement Act) emphasizing sustainability.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "LOU", description: "Lagen om offentlig upphandling", required: true }
      ],
      documentTypes: [
        { type: "Bolagsverket", description: "Company Registration Certificate", required: true },
        { type: "Skatteverket", description: "Tax Authority Certificate", required: true },
        { type: "F-skatt", description: "F-tax Registration", required: true }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["Swedish", "English"],
      keyFeatures: [
        "Sustainability focus",
        "F-skatt verification",
        "Collective agreement checking",
        "Environmental criteria support",
        "Innovation procurement"
      ]
    },
    {
      countryCode: "DK",
      countryName: "Denmark",
      region: "Europe",
      status: "active",
      description: "Danish procurement follows EU Directives with emphasis on transparency and digital procurement.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "Udbudsloven", description: "Danish Public Procurement Act", required: true }
      ],
      documentTypes: [
        { type: "CVR Registration", description: "Central Business Register Certificate", required: true },
        { type: "Tax Certificate", description: "SKAT Tax Clearance", required: true },
        { type: "ATP Certificate", description: "Labor Market Pension Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["Danish", "English"],
      keyFeatures: [
        "CVR verification",
        "Digital procurement support",
        "ATP compliance checking",
        "Collective agreement verification",
        "Environmental criteria"
      ]
    },
    {
      countryCode: "PL",
      countryName: "Poland",
      region: "Europe",
      status: "active",
      description: "Polish procurement follows EU Directives with Prawo Zamówień Publicznych governing public contracts.",
      complianceFrameworks: [
        { name: "EU Directives", description: "EU Public Procurement Directives 2014/24/EU", required: true },
        { name: "PZP", description: "Prawo Zamówień Publicznych (Public Procurement Law)", required: true }
      ],
      documentTypes: [
        { type: "KRS Extract", description: "National Court Register Extract", required: true },
        { type: "Tax Certificate", description: "US/ZUS Tax and Social Insurance Certificate", required: true },
        { type: "No Criminal Record", description: "KRK Criminal Record Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "MEAT", description: "Most Economically Advantageous Tender" }
      ],
      governmentIntegrations: [],
      languages: ["Polish", "English"],
      keyFeatures: [
        "KRS registry verification",
        "ZUS social insurance checking",
        "Criminal record validation",
        "BDO waste registry compliance",
        "Digital contract management"
      ]
    },
    // ADDITIONAL AFRICAN COUNTRIES - North Africa
    {
      countryCode: "EG",
      countryName: "Egypt",
      region: "North Africa",
      status: "active",
      description: "Egyptian procurement follows the Government Tenders and Bids Law with emphasis on local content and national development.",
      complianceFrameworks: [
        { name: "Law 182/2018", description: "Government Tenders, Bids and Stores Law", required: true }
      ],
      documentTypes: [
        { type: "Commercial Register", description: "Commercial Registry Certificate", required: true },
        { type: "Tax Card", description: "Tax Registration Card", required: true },
        { type: "Social Insurance", description: "Social Insurance Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation with local preference" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "English"],
      keyFeatures: [
        "Arabic document processing",
        "Local content preferences",
        "Commercial registry verification",
        "Social insurance compliance",
        "Public tender registration"
      ]
    },
    {
      countryCode: "MA",
      countryName: "Morocco",
      region: "North Africa",
      status: "active",
      description: "Moroccan procurement follows the Public Procurement Decree with emphasis on transparency and SME development.",
      complianceFrameworks: [
        { name: "Decree 2-12-349", description: "Public Procurement Decree 2013", required: true }
      ],
      documentTypes: [
        { type: "RC", description: "Registre de Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "Direction Générale des Impôts Certificate", required: true },
        { type: "CNSS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "French", "English"],
      keyFeatures: [
        "French/Arabic document processing",
        "SME preference support",
        "CNSS compliance verification",
        "National preference margins",
        "e-Procurement platform support"
      ]
    },
    {
      countryCode: "DZ",
      countryName: "Algeria",
      region: "North Africa",
      status: "active",
      description: "Algerian procurement follows the Public Procurement Code with emphasis on national production and local content.",
      complianceFrameworks: [
        { name: "Presidential Decree 15-247", description: "Public Procurement Code", required: true }
      ],
      documentTypes: [
        { type: "Commercial Register", description: "Registre de Commerce", required: true },
        { type: "Tax Certificate", description: "Mise à Jour Fiscale", required: true },
        { type: "CNAS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "National Preference", description: "25% preference for national production" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "French", "English"],
      keyFeatures: [
        "National preference (25% margin)",
        "Local content requirements",
        "CNAS compliance verification",
        "French/Arabic processing",
        "Public tender platform"
      ]
    },
    {
      countryCode: "TN",
      countryName: "Tunisia",
      region: "North Africa",
      status: "active",
      description: "Tunisian procurement follows the Public Procurement Code with emphasis on transparency and SME development.",
      complianceFrameworks: [
        { name: "Decree 2014-1039", description: "Public Procurement Code", required: true }
      ],
      documentTypes: [
        { type: "Registre de Commerce", description: "Commercial Registry Certificate", required: true },
        { type: "Tax Certificate", description: "Tax Clearance Certificate", required: true },
        { type: "CNSS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "French", "English"],
      keyFeatures: [
        "French/Arabic document processing",
        "SME development support",
        "CNSS compliance",
        "e-Procurement TUNEPS platform",
        "Transparency requirements"
      ]
    },
    {
      countryCode: "LY",
      countryName: "Libya",
      region: "North Africa",
      status: "active",
      description: "Libyan procurement follows national procurement regulations with emphasis on reconstruction and development.",
      complianceFrameworks: [
        { name: "National Procurement Regulations", description: "Libyan Procurement Framework", required: true }
      ],
      documentTypes: [
        { type: "Commercial License", description: "Business License", required: true },
        { type: "Tax Certificate", description: "Tax Registration", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "English"],
      keyFeatures: [
        "Arabic document processing",
        "Basic compliance framework",
        "Commercial license verification",
        "Reconstruction sector support",
        "International partnership tracking"
      ]
    },
    // East Africa
    {
      countryCode: "ET",
      countryName: "Ethiopia",
      region: "East Africa",
      status: "active",
      description: "Ethiopian procurement follows the Federal Procurement and Property Administration Agency guidelines with margin of preference for local suppliers.",
      complianceFrameworks: [
        { name: "Proclamation 649/2009", description: "Federal Procurement and Property Administration", required: true }
      ],
      documentTypes: [
        { type: "Business License", description: "Trade Registration Certificate", required: true },
        { type: "Tax Clearance", description: "Ethiopian Revenue Certificate", required: true },
        { type: "VAT Registration", description: "VAT Registration Certificate", required: false }
      ],
      scoringMethodologies: [
        { name: "Local Preference", description: "Margin of preference for Ethiopian suppliers" }
      ],
      governmentIntegrations: [],
      languages: ["Amharic", "English"],
      keyFeatures: [
        "Local preference margins",
        "Trade registration verification",
        "Tax clearance validation",
        "Sector-specific requirements",
        "Development project support"
      ]
    },
    {
      countryCode: "TZ",
      countryName: "Tanzania",
      region: "East Africa",
      status: "active",
      description: "Tanzanian procurement follows the Public Procurement Act with PPRA oversight and local content requirements.",
      complianceFrameworks: [
        { name: "PPA 2011", description: "Public Procurement Act 2011", required: true },
        { name: "PPRA", description: "Public Procurement Regulatory Authority Regulations", required: true }
      ],
      documentTypes: [
        { type: "Business License", description: "TRA Business License", required: true },
        { type: "Tax Clearance", description: "TRA Tax Compliance Certificate", required: true },
        { type: "NSSF", description: "Social Security Compliance", required: true }
      ],
      scoringMethodologies: [
        { name: "Local Content", description: "Preference for Tanzanian enterprises" }
      ],
      governmentIntegrations: [],
      languages: ["Swahili", "English"],
      keyFeatures: [
        "PPRA compliance verification",
        "TRA tax clearance validation",
        "Local content tracking",
        "NSSF compliance",
        "Swahili document support"
      ]
    },
    {
      countryCode: "UG",
      countryName: "Uganda",
      region: "East Africa",
      status: "active",
      description: "Ugandan procurement follows the PPDA Act with emphasis on domestic preferences and anti-corruption measures.",
      complianceFrameworks: [
        { name: "PPDA Act 2003", description: "Public Procurement and Disposal of Public Assets Act", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "URSB Registration Certificate", required: true },
        { type: "Tax Clearance", description: "URA Tax Clearance Certificate", required: true },
        { type: "NSSF", description: "National Social Security Fund Compliance", required: true }
      ],
      scoringMethodologies: [
        { name: "Domestic Preference", description: "15% preference for Ugandan suppliers" }
      ],
      governmentIntegrations: [],
      languages: ["English", "Swahili"],
      keyFeatures: [
        "PPDA compliance verification",
        "15% domestic preference",
        "URA tax validation",
        "NSSF compliance checking",
        "Anti-corruption measures"
      ]
    },
    {
      countryCode: "RW",
      countryName: "Rwanda",
      region: "East Africa",
      status: "active",
      description: "Rwandan procurement follows the Law on Public Procurement with emphasis on local content and Made in Rwanda policy.",
      complianceFrameworks: [
        { name: "Law N°62/2018", description: "Law Governing Public Procurement", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "RDB Registration Certificate", required: true },
        { type: "Tax Clearance", description: "RRA Tax Clearance Certificate", required: true },
        { type: "RSSB", description: "Social Security Compliance", required: true }
      ],
      scoringMethodologies: [
        { name: "Made in Rwanda", description: "Preference for local products and services" }
      ],
      governmentIntegrations: [],
      languages: ["English", "French", "Kinyarwanda"],
      keyFeatures: [
        "Made in Rwanda preference",
        "RDB registration verification",
        "e-Procurement platform (UMUCYO)",
        "RSSB compliance",
        "Multi-language support"
      ]
    },
    // West Africa (additional)
    {
      countryCode: "CI",
      countryName: "Ivory Coast",
      region: "West Africa",
      status: "active",
      description: "Ivorian procurement follows the Public Procurement Code with WAEMU directives compliance.",
      complianceFrameworks: [
        { name: "Ordonnance 2019-679", description: "Public Procurement Code", required: true },
        { name: "WAEMU Directives", description: "West African Economic and Monetary Union Directives", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce et du Crédit Mobilier", required: true },
        { type: "Tax Certificate", description: "Direction Générale des Impôts Certificate", required: true },
        { type: "CNPS", description: "Caisse Nationale de Prévoyance Sociale Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "WAEMU-compliant evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: [
        "WAEMU directive compliance",
        "French document processing",
        "CNPS social security verification",
        "RCCM validation",
        "Community preference margins"
      ]
    },
    {
      countryCode: "SN",
      countryName: "Senegal",
      region: "West Africa",
      status: "active",
      description: "Senegalese procurement follows the Public Procurement Code with ARMP oversight and WAEMU compliance.",
      complianceFrameworks: [
        { name: "Decree 2014-1212", description: "Public Procurement Code", required: true },
        { name: "WAEMU Directives", description: "West African Economic and Monetary Union Directives", required: true }
      ],
      documentTypes: [
        { type: "NINEA", description: "National Business Identification Number", required: true },
        { type: "Tax Certificate", description: "Direction Générale des Impôts et Domaines Certificate", required: true },
        { type: "IPRES/CSS", description: "Social Security Certificates", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "ARMP-supervised evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: [
        "ARMP regulatory compliance",
        "NINEA verification",
        "French document processing",
        "WAEMU standards",
        "SME development support"
      ]
    },
    {
      countryCode: "CM",
      countryName: "Cameroon",
      region: "Central Africa",
      status: "active",
      description: "Cameroonian procurement follows the Public Contracts Code with bilingual (French/English) requirements.",
      complianceFrameworks: [
        { name: "Decree 2018/366", description: "Public Contracts Code", required: true }
      ],
      documentTypes: [
        { type: "Trade Register", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "Direction Générale des Impôts Certificate", required: true },
        { type: "CNPS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation with local preference" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: [
        "Bilingual French/English support",
        "CNPS compliance verification",
        "Local content preference",
        "ARMP regulation compliance",
        "Public contract registry"
      ]
    },
    // Southern Africa (additional)
    {
      countryCode: "AO",
      countryName: "Angola",
      region: "Southern Africa",
      status: "active",
      description: "Angolan procurement follows the Public Contracting Law with emphasis on local content and Angolanization.",
      complianceFrameworks: [
        { name: "Law 9/16", description: "Public Contracting Law", required: true },
        { name: "Local Content", description: "Angolanization requirements", required: true }
      ],
      documentTypes: [
        { type: "NIF", description: "Número de Identificação Fiscal", required: true },
        { type: "Commercial License", description: "Alvará Comercial", required: true },
        { type: "INSS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Local Content", description: "Preference for Angolan content and ownership" }
      ],
      governmentIntegrations: [],
      languages: ["Portuguese", "English"],
      keyFeatures: [
        "Portuguese document processing",
        "Angolanization compliance",
        "Oil & gas sector support",
        "Local content tracking",
        "INSS verification"
      ]
    },
    {
      countryCode: "MZ",
      countryName: "Mozambique",
      region: "Southern Africa",
      status: "active",
      description: "Mozambican procurement follows the Regulation on Contracting of Public Works with local content emphasis.",
      complianceFrameworks: [
        { name: "Decree 5/2016", description: "Regulation on Contracting of Public Works, Supply of Goods and Services", required: true }
      ],
      documentTypes: [
        { type: "NUIT", description: "Número Único de Identificação Tributária", required: true },
        { type: "Commercial License", description: "Alvará Comercial", required: true },
        { type: "INSS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Local Preference", description: "Preference for Mozambican companies" }
      ],
      governmentIntegrations: [],
      languages: ["Portuguese", "English"],
      keyFeatures: [
        "Portuguese document processing",
        "Local content requirements",
        "NUIT verification",
        "Energy sector support",
        "INSS compliance"
      ]
    },
    {
      countryCode: "ZW",
      countryName: "Zimbabwe",
      region: "Southern Africa",
      status: "active",
      description: "Zimbabwean procurement follows the Procurement Regulatory Authority of Zimbabwe (PRAZ) regulations.",
      complianceFrameworks: [
        { name: "Public Procurement and Disposal of Public Assets Act", description: "PPDPAA", required: true }
      ],
      documentTypes: [
        { type: "Company Registration", description: "Companies Registry Certificate", required: true },
        { type: "Tax Clearance", description: "ZIMRA Tax Clearance Certificate", required: true },
        { type: "NSSA", description: "National Social Security Authority Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Local Preference", description: "Preference for Zimbabwean suppliers" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: [
        "PRAZ registration verification",
        "ZIMRA tax validation",
        "NSSA compliance checking",
        "Local preference margins",
        "Public tender platform"
      ]
    },
    {
      countryCode: "ZM",
      countryName: "Zambia",
      region: "Southern Africa",
      status: "active",
      description: "Zambian procurement follows the Public Procurement Act with ZPPA oversight and citizen economic empowerment.",
      complianceFrameworks: [
        { name: "Public Procurement Act 2020", description: "Public Procurement Act No. 8 of 2020", required: true }
      ],
      documentTypes: [
        { type: "PACRA Registration", description: "Patents and Companies Registration Certificate", required: true },
        { type: "Tax Clearance", description: "ZRA Tax Clearance Certificate", required: true },
        { type: "NAPSA", description: "National Pension Scheme Authority Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Citizen Preference", description: "Preference for Zambian citizen-owned enterprises" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: [
        "ZPPA compliance verification",
        "Citizen economic empowerment",
        "ZRA tax validation",
        "NAPSA compliance",
        "Mining sector support"
      ]
    },
    {
      countryCode: "BW",
      countryName: "Botswana",
      region: "Southern Africa",
      status: "active",
      description: "Botswana procurement follows the Public Procurement and Asset Disposal Act with citizen preference.",
      complianceFrameworks: [
        { name: "PPADB", description: "Public Procurement and Asset Disposal Board Regulations", required: true }
      ],
      documentTypes: [
        { type: "CIPA Registration", description: "Companies and Intellectual Property Authority Certificate", required: true },
        { type: "Tax Clearance", description: "BURS Tax Clearance Certificate", required: true },
        { type: "PPADB Registration", description: "PPADB Contractor Registration", required: true }
      ],
      scoringMethodologies: [
        { name: "Citizen Preference", description: "Reservation and preference for citizen-owned enterprises" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: [
        "PPADB registration verification",
        "Citizen preference scheme",
        "BURS tax validation",
        "Reservation policy support",
        "Contractor classification"
      ]
    },
    {
      countryCode: "NA",
      countryName: "Namibia",
      region: "Southern Africa",
      status: "active",
      description: "Namibian procurement follows the Public Procurement Act with emphasis on SME development and local empowerment.",
      complianceFrameworks: [
        { name: "Public Procurement Act 2015", description: "Public Procurement Act 15 of 2015", required: true }
      ],
      documentTypes: [
        { type: "BIPA Registration", description: "Business and Intellectual Property Authority Certificate", required: true },
        { type: "Tax Clearance", description: "Inland Revenue Tax Clearance", required: true },
        { type: "Social Security", description: "Social Security Commission Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "SME Preference", description: "Preference for SMEs and previously disadvantaged" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: [
        "BIPA registration verification",
        "SME development support",
        "Tax clearance validation",
        "Empowerment compliance",
        "Central procurement board"
      ]
    },
    // Additional countries to reach 54 African nations
    {
      countryCode: "MW",
      countryName: "Malawi",
      region: "Southern Africa",
      status: "active",
      description: "Malawian procurement follows the Public Procurement and Disposal of Public Assets Act.",
      complianceFrameworks: [
        { name: "PPDA", description: "Public Procurement and Disposal of Public Assets Act", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "Registrar General Certificate", required: true },
        { type: "Tax Clearance", description: "MRA Tax Clearance Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: ["PPDA compliance", "Tax clearance verification", "Local preference margins"]
    },
    {
      countryCode: "MU",
      countryName: "Mauritius",
      region: "East Africa",
      status: "active",
      description: "Mauritian procurement follows the Public Procurement Act with emphasis on transparency and good governance.",
      complianceFrameworks: [
        { name: "Public Procurement Act 2006", description: "Public Procurement Act", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "Registrar of Companies Certificate", required: true },
        { type: "Tax Clearance", description: "MRA Tax Clearance Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["English", "French"],
      keyFeatures: ["PPO compliance", "Tax clearance verification", "SME preference", "Multi-language support"]
    },
    {
      countryCode: "SC",
      countryName: "Seychelles",
      region: "East Africa",
      status: "active",
      description: "Seychelles procurement follows the Public Procurement Act with focus on transparency.",
      complianceFrameworks: [
        { name: "Public Procurement Act", description: "Public Procurement Regulations", required: true }
      ],
      documentTypes: [
        { type: "Business License", description: "Trade License", required: true },
        { type: "Tax Clearance", description: "SRC Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation framework" }
      ],
      governmentIntegrations: [],
      languages: ["English", "French", "Creole"],
      keyFeatures: ["Trade license verification", "Tax compliance", "Local preference"]
    },
    {
      countryCode: "MG",
      countryName: "Madagascar",
      region: "East Africa",
      status: "active",
      description: "Malagasy procurement follows the Public Procurement Code with ARMP oversight.",
      complianceFrameworks: [
        { name: "Code des Marchés Publics", description: "Public Procurement Code", required: true }
      ],
      documentTypes: [
        { type: "NIF", description: "Numéro d'Identification Fiscale", required: true },
        { type: "STAT", description: "Carte Statistique", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "ARMP-supervised evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "Malagasy", "English"],
      keyFeatures: ["ARMP compliance", "French document processing", "NIF verification"]
    },
    {
      countryCode: "DJ",
      countryName: "Djibouti",
      region: "East Africa",
      status: "active",
      description: "Djiboutian procurement follows the Public Procurement Code.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "Trade License", description: "Patente", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "Arabic", "English"],
      keyFeatures: ["Multi-language support", "Trade license verification", "Strategic location procurement"]
    },
    {
      countryCode: "ER",
      countryName: "Eritrea",
      region: "East Africa",
      status: "active",
      description: "Eritrean procurement follows national regulations for government contracting.",
      complianceFrameworks: [
        { name: "National Procurement Regulations", description: "Government Procurement Rules", required: true }
      ],
      documentTypes: [
        { type: "Business License", description: "Trade License", required: true },
        { type: "Tax Certificate", description: "Tax Registration", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Tigrinya", "Arabic", "English"],
      keyFeatures: ["Basic compliance framework", "Trade license verification"]
    },
    {
      countryCode: "SO",
      countryName: "Somalia",
      region: "East Africa",
      status: "active",
      description: "Somali procurement follows developing regulations with international partner support.",
      complianceFrameworks: [
        { name: "Federal Procurement Guidelines", description: "Federal Government Procurement Rules", required: true }
      ],
      documentTypes: [
        { type: "Business License", description: "Trade License", required: true },
        { type: "Tax Certificate", description: "Tax Registration", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Somali", "Arabic", "English"],
      keyFeatures: ["Developing framework support", "International compliance", "Multi-language processing"]
    },
    {
      countryCode: "SS",
      countryName: "South Sudan",
      region: "East Africa",
      status: "active",
      description: "South Sudanese procurement follows the Procurement and Disposal Act.",
      complianceFrameworks: [
        { name: "Procurement and Disposal Act", description: "Public Procurement Regulations", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "Company Registration", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["English", "Arabic"],
      keyFeatures: ["Emerging market support", "Development project compliance", "Basic verification"]
    },
    {
      countryCode: "BI",
      countryName: "Burundi",
      region: "East Africa",
      status: "active",
      description: "Burundian procurement follows the Public Procurement Code with EAC integration.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "Trade Register", description: "Registre de Commerce", required: true },
        { type: "Tax Certificate", description: "OBR Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "Kirundi", "English"],
      keyFeatures: ["EAC compliance", "French document processing", "Local preference"]
    },
    // West Africa (remaining)
    {
      countryCode: "ML",
      countryName: "Mali",
      region: "West Africa",
      status: "active",
      description: "Malian procurement follows the Public Procurement Code with WAEMU compliance.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true },
        { name: "WAEMU Directives", description: "WAEMU Procurement Directives", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DGI Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "WAEMU-compliant evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["WAEMU compliance", "French document processing", "Community preference"]
    },
    {
      countryCode: "BF",
      countryName: "Burkina Faso",
      region: "West Africa",
      status: "active",
      description: "Burkinabe procurement follows the Public Procurement Code with WAEMU compliance.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true },
        { name: "WAEMU Directives", description: "WAEMU Procurement Directives", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DGI Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "WAEMU-compliant evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["WAEMU compliance", "French document processing", "ARCOP oversight"]
    },
    {
      countryCode: "NE",
      countryName: "Niger",
      region: "West Africa",
      status: "active",
      description: "Nigerian procurement follows the Public Procurement Code with WAEMU compliance.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true },
        { name: "WAEMU Directives", description: "WAEMU Procurement Directives", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DGI Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "WAEMU-compliant evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["WAEMU compliance", "French document processing", "ARMP oversight"]
    },
    {
      countryCode: "TG",
      countryName: "Togo",
      region: "West Africa",
      status: "active",
      description: "Togolese procurement follows the Public Procurement Code with WAEMU compliance.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true },
        { name: "WAEMU Directives", description: "WAEMU Procurement Directives", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "OTR Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "WAEMU-compliant evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["WAEMU compliance", "French document processing", "ARMP oversight"]
    },
    {
      countryCode: "BJ",
      countryName: "Benin",
      region: "West Africa",
      status: "active",
      description: "Beninese procurement follows the Public Procurement Code with WAEMU compliance.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true },
        { name: "WAEMU Directives", description: "WAEMU Procurement Directives", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DGI Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "WAEMU-compliant evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["WAEMU compliance", "French document processing", "ARMP oversight"]
    },
    {
      countryCode: "GN",
      countryName: "Guinea",
      region: "West Africa",
      status: "active",
      description: "Guinean procurement follows the Public Procurement Code.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DNI Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["French document processing", "Mining sector support", "Local preference"]
    },
    {
      countryCode: "SL",
      countryName: "Sierra Leone",
      region: "West Africa",
      status: "active",
      description: "Sierra Leonean procurement follows the Public Procurement Act with NPPA oversight.",
      complianceFrameworks: [
        { name: "Public Procurement Act 2016", description: "Public Procurement Act", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "OARG Registration", required: true },
        { type: "Tax Clearance", description: "NRA Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "NPPA-supervised evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: ["NPPA compliance", "NRA tax verification", "Local preference margins"]
    },
    {
      countryCode: "LR",
      countryName: "Liberia",
      region: "West Africa",
      status: "active",
      description: "Liberian procurement follows the Public Procurement and Concessions Act with PPCC oversight.",
      complianceFrameworks: [
        { name: "PPCA 2010", description: "Public Procurement and Concessions Act", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "MoCI Registration", required: true },
        { type: "Tax Clearance", description: "LRA Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "PPCC-supervised evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: ["PPCC compliance", "LRA tax verification", "Local preference"]
    },
    {
      countryCode: "GW",
      countryName: "Guinea-Bissau",
      region: "West Africa",
      status: "active",
      description: "Guinea-Bissau procurement follows WAEMU procurement directives.",
      complianceFrameworks: [
        { name: "WAEMU Directives", description: "WAEMU Procurement Directives", required: true }
      ],
      documentTypes: [
        { type: "Trade License", description: "Commercial License", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "WAEMU-compliant evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Portuguese", "French", "English"],
      keyFeatures: ["Portuguese document processing", "WAEMU compliance", "Community preference"]
    },
    {
      countryCode: "CV",
      countryName: "Cape Verde",
      region: "West Africa",
      status: "active",
      description: "Cape Verdean procurement follows the Public Contracts Code with transparency emphasis.",
      complianceFrameworks: [
        { name: "Public Contracts Code", description: "Código dos Contratos Públicos", required: true }
      ],
      documentTypes: [
        { type: "NIF", description: "Número de Identificação Fiscal", required: true },
        { type: "Tax Certificate", description: "DNRE Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Portuguese", "English"],
      keyFeatures: ["Portuguese document processing", "NIF verification", "Transparency focus"]
    },
    {
      countryCode: "GM",
      countryName: "Gambia",
      region: "West Africa",
      status: "active",
      description: "Gambian procurement follows the Public Procurement Act with GPPA oversight.",
      complianceFrameworks: [
        { name: "Public Procurement Act 2014", description: "Public Procurement Act", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "MoJ Registration", required: true },
        { type: "Tax Clearance", description: "GRA Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "GPPA-supervised evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["English"],
      keyFeatures: ["GPPA compliance", "GRA tax verification", "Local preference"]
    },
    {
      countryCode: "MR",
      countryName: "Mauritania",
      region: "West Africa",
      status: "active",
      description: "Mauritanian procurement follows the Public Procurement Code.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "Trade Register", description: "Registre de Commerce", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "French", "English"],
      keyFeatures: ["Arabic/French document processing", "Mining sector support", "Local preference"]
    },
    // Central Africa
    {
      countryCode: "CD",
      countryName: "Democratic Republic of Congo",
      region: "Central Africa",
      status: "active",
      description: "DRC procurement follows the Public Procurement Law with ARMP oversight.",
      complianceFrameworks: [
        { name: "Law 10/010", description: "Public Procurement Law", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DGI Tax Clearance", required: true },
        { type: "INSS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation with local preference" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["ARMP compliance", "French document processing", "Mining sector support", "Local preference"]
    },
    {
      countryCode: "CG",
      countryName: "Republic of Congo",
      region: "Central Africa",
      status: "active",
      description: "Congolese procurement follows the Public Procurement Code.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DGI Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["French document processing", "Oil sector support", "ARMP compliance"]
    },
    {
      countryCode: "GA",
      countryName: "Gabon",
      region: "Central Africa",
      status: "active",
      description: "Gabonese procurement follows the Public Procurement Code with ANRMP oversight.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "RCCM", description: "Registre du Commerce Certificate", required: true },
        { type: "Tax Certificate", description: "DGI Tax Clearance", required: true },
        { type: "CNSS", description: "Social Security Certificate", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["ANRMP compliance", "French document processing", "Oil sector support"]
    },
    {
      countryCode: "GQ",
      countryName: "Equatorial Guinea",
      region: "Central Africa",
      status: "active",
      description: "Equatoguinean procurement follows national regulations.",
      complianceFrameworks: [
        { name: "National Procurement Regulations", description: "Government Procurement Rules", required: true }
      ],
      documentTypes: [
        { type: "Trade License", description: "Business License", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Spanish", "French", "English"],
      keyFeatures: ["Spanish/French document processing", "Oil sector support", "Local content"]
    },
    {
      countryCode: "CF",
      countryName: "Central African Republic",
      region: "Central Africa",
      status: "active",
      description: "CAR procurement follows the Public Procurement Code.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "Trade Register", description: "Registre de Commerce", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "English"],
      keyFeatures: ["French document processing", "Development project support", "International compliance"]
    },
    {
      countryCode: "TD",
      countryName: "Chad",
      region: "Central Africa",
      status: "active",
      description: "Chadian procurement follows the Public Procurement Code with ARMP oversight.",
      complianceFrameworks: [
        { name: "Public Procurement Code", description: "Code des Marchés Publics", required: true }
      ],
      documentTypes: [
        { type: "Trade Register", description: "Registre de Commerce", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["French", "Arabic", "English"],
      keyFeatures: ["French/Arabic document processing", "Oil sector support", "ARMP compliance"]
    },
    {
      countryCode: "ST",
      countryName: "Sao Tome and Principe",
      region: "Central Africa",
      status: "active",
      description: "Sao Tome procurement follows the Public Procurement Law.",
      complianceFrameworks: [
        { name: "Public Procurement Law", description: "Lei de Contratação Pública", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "Company Registration", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Portuguese", "English"],
      keyFeatures: ["Portuguese document processing", "Small economy support", "Transparency focus"]
    },
    // Island Nations
    {
      countryCode: "KM",
      countryName: "Comoros",
      region: "East Africa",
      status: "active",
      description: "Comorian procurement follows national regulations.",
      complianceFrameworks: [
        { name: "National Procurement Regulations", description: "Government Procurement Rules", required: true }
      ],
      documentTypes: [
        { type: "Trade License", description: "Business License", required: true },
        { type: "Tax Certificate", description: "Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "French", "English"],
      keyFeatures: ["Arabic/French document processing", "Island economy support", "Basic compliance"]
    },
    {
      countryCode: "LS",
      countryName: "Lesotho",
      region: "Southern Africa",
      status: "active",
      description: "Lesotho procurement follows the Public Procurement Regulations with PPAD oversight.",
      complianceFrameworks: [
        { name: "Public Procurement Regulations 2007", description: "Public Procurement Regulations", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "Registrar of Companies Certificate", required: true },
        { type: "Tax Clearance", description: "LRA Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "PPAD-supervised evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["English", "Sesotho"],
      keyFeatures: ["PPAD compliance", "Tax clearance verification", "Local preference"]
    },
    {
      countryCode: "SZ",
      countryName: "Eswatini",
      region: "Southern Africa",
      status: "active",
      description: "Eswatini procurement follows the Public Procurement Act with Swaziland Tender Board oversight.",
      complianceFrameworks: [
        { name: "Public Procurement Act 2011", description: "Public Procurement Act", required: true }
      ],
      documentTypes: [
        { type: "Business Registration", description: "Registrar of Companies Certificate", required: true },
        { type: "Tax Clearance", description: "SRA Tax Clearance", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["English", "Swazi"],
      keyFeatures: ["Tender Board compliance", "Tax clearance verification", "Local preference"]
    },
    {
      countryCode: "SD",
      countryName: "Sudan",
      region: "North Africa",
      status: "active",
      description: "Sudanese procurement follows national procurement regulations.",
      complianceFrameworks: [
        { name: "National Procurement Regulations", description: "Government Procurement Rules", required: true }
      ],
      documentTypes: [
        { type: "Trade License", description: "Business License", required: true },
        { type: "Tax Certificate", description: "Tax Registration", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "English"],
      keyFeatures: ["Arabic document processing", "Development sector support", "Basic compliance"]
    },
    {
      countryCode: "EH",
      countryName: "Western Sahara",
      region: "North Africa",
      status: "active",
      description: "Western Sahara follows regional procurement practices.",
      complianceFrameworks: [
        { name: "Regional Procurement Rules", description: "Regional Procurement Regulations", required: true }
      ],
      documentTypes: [
        { type: "Trade License", description: "Business License", required: true },
        { type: "Tax Certificate", description: "Tax Registration", required: true }
      ],
      scoringMethodologies: [
        { name: "Technical/Financial", description: "Standard evaluation" }
      ],
      governmentIntegrations: [],
      languages: ["Arabic", "Spanish", "English"],
      keyFeatures: ["Arabic/Spanish document processing", "Regional compliance", "Basic verification"]
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
