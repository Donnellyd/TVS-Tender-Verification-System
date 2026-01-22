import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// SA-specific enums for validation
export const vendorStatusEnum = z.enum(["pending", "approved", "suspended", "debarred"]);
export const tenderStatusEnum = z.enum(["open", "closed", "under_review", "awarded", "cancelled"]);
export const tenderTypeEnum = z.enum(["RFQ", "RFP", "RFT", "EOI"]);
export const tenderCategoryEnum = z.enum(["Goods", "Services", "Works", "Consulting", "IT", "Construction", "Transport"]);
export const priorityEnum = z.enum(["low", "medium", "high", "critical"]);
export const bbbeeeLevelEnum = z.enum(["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Non-Compliant"]);
export const documentTypeEnum = z.enum(["VAT Certificate", "Tax Clearance", "BBBEE Certificate", "Company Registration", "Health & Safety Certificate", "Professional Indemnity", "Bank Confirmation", "Other"]);
export const verificationStatusEnum = z.enum(["pending", "verified", "rejected", "expired"]);
export const complianceResultEnum = z.enum(["passed", "failed", "pending", "flagged"]);
export const debarmentStatusEnum = z.enum(["clear", "flagged", "debarred"]);
export const municipalityStatusEnum = z.enum(["active", "suspended"]);

// SA-specific validation patterns
export const saRegistrationNumberRegex = /^\d{4}\/\d{6}\/\d{2}$/;
export const saVatNumberRegex = /^\d{10}$/;
export const csdIdRegex = /^[A-Z]{4}\d{10}$/;

// Municipalities table
export const municipalities = pgTable("municipalities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  province: text("province").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMunicipalitySchema = createInsertSchema(municipalities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMunicipality = z.infer<typeof insertMunicipalitySchema>;
export type Municipality = typeof municipalities.$inferSelect;

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  tradingName: text("trading_name"),
  registrationNumber: text("registration_number").notNull(),
  vatNumber: text("vat_number"),
  csdId: text("csd_id"),
  bbbeeLevel: text("bbbee_level"),
  bbbeeCertificateExpiry: timestamp("bbbee_certificate_expiry"),
  taxClearanceExpiry: timestamp("tax_clearance_expiry"),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  physicalAddress: text("physical_address"),
  postalAddress: text("postal_address"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankBranchCode: text("bank_branch_code"),
  status: text("status").notNull().default("pending"),
  debarmentStatus: text("debarment_status").default("clear"),
  municipalityId: varchar("municipality_id").references(() => municipalities.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [vendors.municipalityId],
    references: [municipalities.id],
  }),
  documents: many(documents),
  tenders: many(tenders),
  complianceChecks: many(complianceChecks),
}));

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  status: vendorStatusEnum.optional(),
  bbbeeLevel: bbbeeeLevelEnum.optional(),
  debarmentStatus: debarmentStatusEnum.optional(),
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Tenders table
export const tenders = pgTable("tenders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderNumber: text("tender_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  tenderType: text("tender_type").notNull(),
  category: text("category").notNull(),
  estimatedValue: integer("estimated_value"),
  closingDate: timestamp("closing_date").notNull(),
  openingDate: timestamp("opening_date"),
  awardDate: timestamp("award_date"),
  status: text("status").notNull().default("open"),
  priority: text("priority").default("medium"),
  municipalityId: varchar("municipality_id").references(() => municipalities.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  issuer: text("issuer"),
  requirements: text("requirements"),
  localContentRequirement: integer("local_content_requirement"),
  bbbeeRequirement: text("bbbee_requirement"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tender_status").on(table.status),
  index("idx_tender_municipality").on(table.municipalityId),
]);

export const tendersRelations = relations(tenders, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [tenders.municipalityId],
    references: [municipalities.id],
  }),
  vendor: one(vendors, {
    fields: [tenders.vendorId],
    references: [vendors.id],
  }),
  documents: many(documents),
  complianceChecks: many(complianceChecks),
}));

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenderNumber: z.string().min(1, "Tender number is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  tenderType: tenderTypeEnum,
  category: tenderCategoryEnum,
  status: tenderStatusEnum.optional(),
  priority: priorityEnum.optional(),
});

export type InsertTender = z.infer<typeof insertTenderSchema>;
export type Tender = typeof tenders.$inferSelect;

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  documentType: text("document_type").notNull(),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  version: integer("version").default(1),
  hash: text("hash"),
  expiryDate: timestamp("expiry_date"),
  verificationStatus: text("verification_status").default("pending"),
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  tenderId: varchar("tender_id").references(() => tenders.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  vendor: one(vendors, {
    fields: [documents.vendorId],
    references: [vendors.id],
  }),
  tender: one(tenders, {
    fields: [documents.tenderId],
    references: [tenders.id],
  }),
}));

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Document name is required"),
  documentType: documentTypeEnum,
  verificationStatus: verificationStatusEnum.optional(),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Compliance Rules table
export const complianceRules = pgTable("compliance_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  checkType: text("check_type").notNull(),
  threshold: integer("threshold"),
  weight: integer("weight").default(1),
  isActive: boolean("is_active").default(true),
  municipalityId: varchar("municipality_id").references(() => municipalities.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertComplianceRuleSchema = createInsertSchema(complianceRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComplianceRule = z.infer<typeof insertComplianceRuleSchema>;
export type ComplianceRule = typeof complianceRules.$inferSelect;

// Compliance Checks table
export const complianceChecks = pgTable("compliance_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  tenderId: varchar("tender_id").references(() => tenders.id),
  ruleId: varchar("rule_id").references(() => complianceRules.id),
  checkType: text("check_type").notNull(),
  result: text("result").notNull(),
  score: integer("score"),
  notes: text("notes"),
  details: jsonb("details"),
  performedBy: varchar("performed_by"),
  performedAt: timestamp("performed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  vendor: one(vendors, {
    fields: [complianceChecks.vendorId],
    references: [vendors.id],
  }),
  tender: one(tenders, {
    fields: [complianceChecks.tenderId],
    references: [tenders.id],
  }),
  rule: one(complianceRules, {
    fields: [complianceChecks.ruleId],
    references: [complianceRules.id],
  }),
}));

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({
  id: true,
  createdAt: true,
});

export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;
export type ComplianceCheck = typeof complianceChecks.$inferSelect;

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_user").on(table.userId),
  index("idx_audit_entity").on(table.entityType, table.entityId),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Dashboard stats type
export type DashboardStats = {
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  totalTenders: number;
  openTenders: number;
  closedTenders: number;
  compliancePassRate: number;
  pendingReviews: number;
  documentsToVerify: number;
  recentActivity: AuditLog[];
};

// Analytics types
export type TendersByStatus = {
  status: string;
  count: number;
};

export type TendersByMunicipality = {
  municipality: string;
  count: number;
};

export type ComplianceByCategory = {
  category: string;
  passed: number;
  failed: number;
  passRate: number;
};

export type VendorsByStatus = {
  status: string;
  count: number;
};

export type MonthlyTrends = {
  month: string;
  tenders: number;
  vendors: number;
  complianceChecks: number;
};
