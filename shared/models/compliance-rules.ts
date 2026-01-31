import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenants } from "./tenant";

export const ruleTypeEnum = z.enum([
  "document_required",
  "document_validity",
  "scoring_criteria",
  "preferential_points",
  "blacklist_check",
  "threshold_check",
  "date_validation",
  "value_comparison",
  "custom"
]);

export const ruleOperatorEnum = z.enum([
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "greater_or_equal",
  "less_or_equal",
  "contains",
  "not_contains",
  "in_list",
  "not_in_list",
  "is_valid",
  "is_expired",
  "exists",
  "not_exists"
]);

export const ruleSeverityEnum = z.enum(["info", "warning", "error", "critical"]);

export const countryModuleEnum = z.enum([
  "ZA",
  "KE",
  "NG",
  "GH",
  "RW",
  "AE",
  "SA",
  "UK",
  "EU",
  "US",
  "GLOBAL"
]);

export const complianceRuleSets = pgTable("compliance_rule_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  country: text("country").notNull().default("GLOBAL"),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  parentRuleSetId: varchar("parent_rule_set_id"),
  createdBy: varchar("created_by"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rule_set_tenant").on(table.tenantId),
  index("idx_rule_set_country").on(table.country),
]);

export const insertComplianceRuleSetSchema = createInsertSchema(complianceRuleSets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Rule set name is required"),
  country: countryModuleEnum.optional(),
});

export type InsertComplianceRuleSet = z.infer<typeof insertComplianceRuleSetSchema>;
export type ComplianceRuleSet = typeof complianceRuleSets.$inferSelect;

export const complianceRuleDefinitions = pgTable("compliance_rule_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleSetId: varchar("rule_set_id").notNull().references(() => complianceRuleSets.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  ruleType: text("rule_type").notNull(),
  operator: text("operator"),
  field: text("field"),
  value: text("value"),
  threshold: integer("threshold"),
  weight: integer("weight").default(1),
  maxScore: integer("max_score"),
  severity: text("severity").default("error"),
  isMandatory: boolean("is_mandatory").default(true),
  errorMessage: text("error_message"),
  successMessage: text("success_message"),
  conditions: jsonb("conditions").default({}),
  metadata: jsonb("metadata").default({}),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rule_def_set").on(table.ruleSetId),
  index("idx_rule_def_code").on(table.code),
  index("idx_rule_def_category").on(table.category),
]);

export const complianceRuleDefinitionsRelations = relations(complianceRuleDefinitions, ({ one }) => ({
  ruleSet: one(complianceRuleSets, {
    fields: [complianceRuleDefinitions.ruleSetId],
    references: [complianceRuleSets.id],
  }),
}));

export const insertComplianceRuleDefinitionSchema = createInsertSchema(complianceRuleDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string().min(1, "Rule code is required"),
  name: z.string().min(2, "Rule name is required"),
  ruleType: ruleTypeEnum,
  operator: ruleOperatorEnum.optional(),
  severity: ruleSeverityEnum.optional(),
});

export type InsertComplianceRuleDefinition = z.infer<typeof insertComplianceRuleDefinitionSchema>;
export type ComplianceRuleDefinition = typeof complianceRuleDefinitions.$inferSelect;

export const ruleVersionHistory = pgTable("rule_version_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleSetId: varchar("rule_set_id").notNull().references(() => complianceRuleSets.id),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changedBy: varchar("changed_by"),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rule_version_set").on(table.ruleSetId),
]);

export const insertRuleVersionHistorySchema = createInsertSchema(ruleVersionHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertRuleVersionHistory = z.infer<typeof insertRuleVersionHistorySchema>;
export type RuleVersionHistory = typeof ruleVersionHistory.$inferSelect;

export const ruleExecutionLogs = pgTable("rule_execution_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  ruleSetId: varchar("rule_set_id").references(() => complianceRuleSets.id),
  ruleDefinitionId: varchar("rule_definition_id").references(() => complianceRuleDefinitions.id),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  result: text("result").notNull(),
  score: integer("score"),
  details: jsonb("details").default({}),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rule_exec_tenant").on(table.tenantId),
  index("idx_rule_exec_entity").on(table.entityType, table.entityId),
  index("idx_rule_exec_result").on(table.result),
]);

export const insertRuleExecutionLogSchema = createInsertSchema(ruleExecutionLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertRuleExecutionLog = z.infer<typeof insertRuleExecutionLogSchema>;
export type RuleExecutionLog = typeof ruleExecutionLogs.$inferSelect;

export const COUNTRY_COMPLIANCE_CONFIGS = {
  ZA: {
    name: "South Africa",
    currency: "ZAR",
    modules: ["BBBEE", "PFMA", "MFMA", "CSD", "SARS"],
    scoringSystems: ["80/20", "90/10"],
    preferentialCategories: [
      { name: "B-BBEE Level 1", points: 20 },
      { name: "B-BBEE Level 2", points: 18 },
      { name: "B-BBEE Level 3", points: 14 },
      { name: "B-BBEE Level 4", points: 12 },
      { name: "EME", points: 20 },
      { name: "QSE", points: 20 },
    ],
    requiredDocuments: [
      "CSD Registration",
      "Tax Clearance",
      "BBBEE Certificate",
      "Company Registration",
      "Municipal Rates Clearance",
    ],
  },
  KE: {
    name: "Kenya",
    currency: "KES",
    modules: ["AGPO", "IFMIS", "PPRA"],
    scoringSystems: ["70/30"],
    preferentialCategories: [
      { name: "Youth", points: 30 },
      { name: "Women", points: 30 },
      { name: "Persons with Disability", points: 4 },
    ],
    requiredDocuments: [
      "Certificate of Incorporation",
      "KRA PIN Certificate",
      "Tax Compliance Certificate",
      "AGPO Certificate",
      "CR12 Form",
    ],
  },
  NG: {
    name: "Nigeria",
    currency: "NGN",
    modules: ["BPP", "LCDA", "PENCOM", "ITF", "NSITF"],
    scoringSystems: ["70/30"],
    preferentialCategories: [
      { name: "Local Content", points: 20 },
      { name: "Indigenous Company", points: 10 },
    ],
    requiredDocuments: [
      "CAC Certificate",
      "TIN Certificate",
      "Tax Clearance Certificate",
      "PENCOM Compliance Certificate",
      "ITF Compliance Certificate",
      "NSITF Compliance Certificate",
      "BPP Registration",
    ],
  },
  GH: {
    name: "Ghana",
    currency: "GHS",
    modules: ["PPA", "GHANEPS"],
    scoringSystems: ["70/30"],
    preferentialCategories: [
      { name: "Local Procurement", points: 15 },
      { name: "Women-owned", points: 10 },
    ],
    requiredDocuments: [
      "Certificate of Incorporation",
      "TIN Certificate",
      "Tax Clearance Certificate",
      "SSNIT Clearance",
      "PPA Registration",
    ],
  },
  AE: {
    name: "United Arab Emirates",
    currency: "AED",
    modules: ["FEDERAL", "DUBAI_DED", "ABU_DHABI"],
    scoringSystems: ["70/30"],
    preferentialCategories: [
      { name: "UAE National", points: 10 },
      { name: "SME", points: 5 },
    ],
    requiredDocuments: [
      "Trade License",
      "VAT Registration Certificate",
      "Chamber of Commerce Membership",
      "Emirates ID (Owner)",
      "Bank Letter",
    ],
  },
  UK: {
    name: "United Kingdom",
    currency: "GBP",
    modules: ["PCR2015", "CCS", "FTS"],
    scoringSystems: ["MEAT"],
    preferentialCategories: [
      { name: "SME", points: 5 },
      { name: "Social Enterprise", points: 5 },
    ],
    requiredDocuments: [
      "Companies House Registration",
      "VAT Certificate",
      "Modern Slavery Statement",
      "Health & Safety Policy",
      "Insurance Certificates",
    ],
  },
  US: {
    name: "United States",
    currency: "USD",
    modules: ["FAR", "SAM", "SBA"],
    scoringSystems: ["LPTA", "BVTO"],
    preferentialCategories: [
      { name: "Small Business", points: 10 },
      { name: "8(a) Business", points: 15 },
      { name: "HUBZone", points: 10 },
      { name: "WOSB", points: 10 },
      { name: "SDVOSB", points: 10 },
    ],
    requiredDocuments: [
      "SAM Registration",
      "DUNS Number",
      "Tax ID (EIN)",
      "Proof of Insurance",
      "SBA Certification (if applicable)",
    ],
  },
  GLOBAL: {
    name: "Global",
    currency: "USD",
    modules: ["BASIC"],
    scoringSystems: ["70/30", "80/20"],
    preferentialCategories: [],
    requiredDocuments: [
      "Company Registration",
      "Tax Certificate",
      "Bank Details",
    ],
  },
} as const;

export type CountryCode = keyof typeof COUNTRY_COMPLIANCE_CONFIGS;
