import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// SA-specific enums for validation
export const vendorStatusEnum = z.enum(["pending", "approved", "suspended", "debarred"]);
export const tenderStatusEnum = z.enum([
  "draft",
  "published", 
  "closing_soon",
  "closed",
  "under_evaluation",
  "clarification_requested",
  "shortlisted",
  "standstill_period",
  "awarded",
  "unsuccessful",
  "cancelled",
  "open",
  "under_review"
]);

export const notificationChannelEnum = z.enum(["email", "whatsapp"]);
export const notificationTriggerEnum = z.enum([
  "tender_published",
  "tender_closing_soon",
  "tender_closed",
  "under_evaluation",
  "clarification_requested",
  "shortlisted",
  "standstill_period",
  "awarded",
  "unsuccessful",
  "tender_cancelled",
  "submission_received",
  "document_verified",
  "document_rejected"
]);
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
  whatsappPhone: text("whatsapp_phone"),
  whatsappOptIn: boolean("whatsapp_opt_in").default(false),
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

// New enums for submission workflow
export const submissionStatusEnum = z.enum(["draft", "submitted", "auto_checking", "manual_review", "passed", "failed", "awarded", "rejected"]);
export const requirementTypeEnum = z.enum(["CSD Registration", "Tax Clearance", "BBBEE Certificate", "Company Registration", "COIDA Certificate", "Public Liability Insurance", "Municipal Rates Clearance", "Audited Financials", "Declaration of Interest", "Bid Defaulters Check", "Professional Registration", "Safety Certification", "Other"]);
export const scoringSystemEnum = z.enum(["80/20", "90/10"]);
export const letterTypeEnum = z.enum([
  "award",
  "rejection", 
  "regret",
  "disqualification",
  "not_shortlisted",
  "shortlisted",
  "request_clarification",
  "request_information",
  "addendum",
  "extension",
  "non_compliant",
  "standstill_notice",
  "standstill_expiry",
  "debrief_invitation",
  "debrief_response",
  "tender_cancelled",
  "correction_notice",
  "re_tender"
]);

// Tender Requirements table - AI-extracted from tender PDFs
export const tenderRequirements = pgTable("tender_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").notNull().references(() => tenders.id),
  requirementType: text("requirement_type").notNull(),
  description: text("description").notNull(),
  isMandatory: boolean("is_mandatory").default(true),
  maxAgeDays: integer("max_age_days"),
  minValue: integer("min_value"),
  validityPeriod: text("validity_period"),
  sourceDocument: text("source_document"),
  pageReference: text("page_reference"),
  aiExtracted: boolean("ai_extracted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tenderRequirementsRelations = relations(tenderRequirements, ({ one }) => ({
  tender: one(tenders, {
    fields: [tenderRequirements.tenderId],
    references: [tenders.id],
  }),
}));

export const insertTenderRequirementSchema = createInsertSchema(tenderRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  requirementType: requirementTypeEnum,
  description: z.string().min(3, "Description is required"),
});

export type InsertTenderRequirement = z.infer<typeof insertTenderRequirementSchema>;
export type TenderRequirement = typeof tenderRequirements.$inferSelect;

// Tender Scoring Criteria table - AI-extracted scoring grid from tender PDFs
export const scoringCriteriaCategories = z.enum(["Technical", "Price", "BBBEE", "Experience", "Functionality", "Quality", "Local Content", "Other"]);

export const tenderScoringCriteria = pgTable("tender_scoring_criteria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").notNull().references(() => tenders.id),
  criteriaName: text("criteria_name").notNull(),
  criteriaCategory: text("criteria_category").notNull(),
  description: text("description"),
  maxScore: integer("max_score").notNull(),
  weight: integer("weight").default(1),
  sortOrder: integer("sort_order").default(0),
  aiExtracted: boolean("ai_extracted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_scoring_criteria_tender").on(table.tenderId),
]);

export const tenderScoringCriteriaRelations = relations(tenderScoringCriteria, ({ one }) => ({
  tender: one(tenders, {
    fields: [tenderScoringCriteria.tenderId],
    references: [tenders.id],
  }),
}));

export const insertTenderScoringCriteriaSchema = createInsertSchema(tenderScoringCriteria).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  criteriaName: z.string().min(1, "Criteria name is required"),
  criteriaCategory: scoringCriteriaCategories,
  maxScore: z.number().min(1, "Max score must be at least 1"),
});

export type InsertTenderScoringCriteria = z.infer<typeof insertTenderScoringCriteriaSchema>;
export type TenderScoringCriteria = typeof tenderScoringCriteria.$inferSelect;

// Bid Submissions table - vendor submissions per tender
export const bidSubmissions = pgTable("bid_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").notNull().references(() => tenders.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  submissionDate: timestamp("submission_date"),
  status: text("status").notNull().default("draft"),
  bidAmount: integer("bid_amount"),
  technicalScore: integer("technical_score"),
  bbbeePoints: integer("bbbee_points"),
  priceScore: integer("price_score"),
  totalScore: integer("total_score"),
  scoringSystem: text("scoring_system"),
  complianceResult: text("compliance_result").default("pending"),
  complianceNotes: text("compliance_notes"),
  autoCheckCompletedAt: timestamp("auto_check_completed_at"),
  manualReviewCompletedAt: timestamp("manual_review_completed_at"),
  reviewedBy: varchar("reviewed_by"),
  awardedAt: timestamp("awarded_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReasons: jsonb("rejection_reasons"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_submission_tender").on(table.tenderId),
  index("idx_submission_vendor").on(table.vendorId),
  index("idx_submission_status").on(table.status),
]);

export const bidSubmissionsRelations = relations(bidSubmissions, ({ one, many }) => ({
  tender: one(tenders, {
    fields: [bidSubmissions.tenderId],
    references: [tenders.id],
  }),
  vendor: one(vendors, {
    fields: [bidSubmissions.vendorId],
    references: [vendors.id],
  }),
  submissionDocuments: many(submissionDocuments),
  evaluationScores: many(evaluationScores),
}));

export const insertBidSubmissionSchema = createInsertSchema(bidSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: submissionStatusEnum.optional(),
  complianceResult: complianceResultEnum.optional(),
  scoringSystem: scoringSystemEnum.optional(),
});

export type InsertBidSubmission = z.infer<typeof insertBidSubmissionSchema>;
export type BidSubmission = typeof bidSubmissions.$inferSelect;

// Submission Documents table - documents submitted for a bid
export const submissionDocuments = pgTable("submission_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => bidSubmissions.id),
  requirementId: varchar("requirement_id").references(() => tenderRequirements.id),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  documentDate: timestamp("document_date"),
  expiryDate: timestamp("expiry_date"),
  verificationStatus: text("verification_status").default("pending"),
  verificationNotes: text("verification_notes"),
  aiVerified: boolean("ai_verified").default(false),
  aiConfidenceScore: integer("ai_confidence_score"),
  meetsRequirement: boolean("meets_requirement"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissionDocumentsRelations = relations(submissionDocuments, ({ one }) => ({
  submission: one(bidSubmissions, {
    fields: [submissionDocuments.submissionId],
    references: [bidSubmissions.id],
  }),
  requirement: one(tenderRequirements, {
    fields: [submissionDocuments.requirementId],
    references: [tenderRequirements.id],
  }),
}));

export const insertSubmissionDocumentSchema = createInsertSchema(submissionDocuments).omit({
  id: true,
  createdAt: true,
}).extend({
  documentName: z.string().min(1, "Document name is required"),
  documentType: requirementTypeEnum,
  verificationStatus: verificationStatusEnum.optional(),
});

export type InsertSubmissionDocument = z.infer<typeof insertSubmissionDocumentSchema>;
export type SubmissionDocument = typeof submissionDocuments.$inferSelect;

// Evaluation Scores table - manual evaluation by reviewers
export const evaluationScores = pgTable("evaluation_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => bidSubmissions.id),
  evaluatorId: varchar("evaluator_id"),
  criteriaName: text("criteria_name").notNull(),
  criteriaCategory: text("criteria_category").notNull(),
  maxScore: integer("max_score").notNull(),
  score: integer("score").notNull(),
  weight: integer("weight").default(1),
  comments: text("comments"),
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const evaluationScoresRelations = relations(evaluationScores, ({ one }) => ({
  submission: one(bidSubmissions, {
    fields: [evaluationScores.submissionId],
    references: [bidSubmissions.id],
  }),
}));

export const insertEvaluationScoreSchema = createInsertSchema(evaluationScores).omit({
  id: true,
  createdAt: true,
}).extend({
  criteriaName: z.string().min(1, "Criteria name is required"),
  criteriaCategory: z.string().min(1, "Category is required"),
  maxScore: z.number().min(1, "Max score must be at least 1"),
  score: z.number().min(0, "Score cannot be negative"),
});

export type InsertEvaluationScore = z.infer<typeof insertEvaluationScoreSchema>;
export type EvaluationScore = typeof evaluationScores.$inferSelect;

// Letter Templates table - for auto-generated award/rejection letters
export const letterTemplates = pgTable("letter_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  letterType: text("letter_type").notNull(),
  subject: text("subject").notNull(),
  bodyTemplate: text("body_template").notNull(),
  municipalityId: varchar("municipality_id").references(() => municipalities.id),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const letterTemplatesRelations = relations(letterTemplates, ({ one }) => ({
  municipality: one(municipalities, {
    fields: [letterTemplates.municipalityId],
    references: [municipalities.id],
  }),
}));

export const insertLetterTemplateSchema = createInsertSchema(letterTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Template name is required"),
  letterType: letterTypeEnum,
  subject: z.string().min(1, "Subject is required"),
  bodyTemplate: z.string().min(10, "Body template must be at least 10 characters"),
});

export type InsertLetterTemplate = z.infer<typeof insertLetterTemplateSchema>;
export type LetterTemplate = typeof letterTemplates.$inferSelect;

// Generated Letters table - actual letters generated for submissions
export const generatedLetters = pgTable("generated_letters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => bidSubmissions.id),
  templateId: varchar("template_id").references(() => letterTemplates.id),
  letterType: text("letter_type").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  recipientEmail: text("recipient_email"),
  sentAt: timestamp("sent_at"),
  generatedBy: varchar("generated_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedLettersRelations = relations(generatedLetters, ({ one }) => ({
  submission: one(bidSubmissions, {
    fields: [generatedLetters.submissionId],
    references: [bidSubmissions.id],
  }),
  template: one(letterTemplates, {
    fields: [generatedLetters.templateId],
    references: [letterTemplates.id],
  }),
}));

export const insertGeneratedLetterSchema = createInsertSchema(generatedLetters).omit({
  id: true,
  createdAt: true,
}).extend({
  letterType: letterTypeEnum,
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(10, "Letter body is required"),
});

export type InsertGeneratedLetter = z.infer<typeof insertGeneratedLetterSchema>;
export type GeneratedLetter = typeof generatedLetters.$inferSelect;

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

// Submission workflow types
export type SubmissionWithDetails = BidSubmission & {
  vendor: Vendor;
  tender: Tender;
  documents: SubmissionDocument[];
  evaluationScores: EvaluationScore[];
};

export type TenderWithRequirements = Tender & {
  requirements: TenderRequirement[];
  submissions: BidSubmission[];
};

export type ComplianceCheckResult = {
  requirementId: string;
  requirementType: string;
  passed: boolean;
  reason: string;
  documentId?: string;
  aiConfidence?: number;
};

export type SubmissionsByStage = {
  stage: string;
  count: number;
};

export type BBBEEPointsCalculation = {
  vendorLevel: string;
  scoringSystem: "80/20" | "90/10";
  points: number;
  maxPoints: number;
};

// WhatsApp Templates table - for WhatsApp notification messages
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true),
  municipalityId: varchar("municipality_id").references(() => municipalities.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const whatsappTemplatesRelations = relations(whatsappTemplates, ({ one }) => ({
  municipality: one(municipalities, {
    fields: [whatsappTemplates.municipalityId],
    references: [municipalities.id],
  }),
}));

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Template name is required"),
  trigger: notificationTriggerEnum,
  body: z.string().min(10, "Message body must be at least 10 characters"),
});

export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;

// Notification Settings table - global settings for notification behavior
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channel: text("channel").notNull(),
  triggerToggles: text("trigger_toggles").notNull().default('{}'),
  channelConfig: text("channel_config").default('{}'),
  isActive: boolean("is_active").default(true),
  municipalityId: varchar("municipality_id").references(() => municipalities.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  channel: notificationChannelEnum,
});

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

// Notification Logs table - track sent notifications for debugging and analytics
export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  tenderId: varchar("tender_id").references(() => tenders.id),
  submissionId: varchar("submission_id").references(() => bidSubmissions.id),
  channel: text("channel").notNull(),
  trigger: text("trigger").notNull(),
  recipientPhone: text("recipient_phone"),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveryStatus: text("delivery_status").default("pending"),
  errorMessage: text("error_message"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  vendor: one(vendors, {
    fields: [notificationLogs.vendorId],
    references: [vendors.id],
  }),
  tender: one(tenders, {
    fields: [notificationLogs.tenderId],
    references: [tenders.id],
  }),
  submission: one(bidSubmissions, {
    fields: [notificationLogs.submissionId],
    references: [bidSubmissions.id],
  }),
}));

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({
  id: true,
  sentAt: true,
  createdAt: true,
}).extend({
  channel: notificationChannelEnum,
  trigger: notificationTriggerEnum,
});

export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type NotificationLog = typeof notificationLogs.$inferSelect;

export type NotificationChannel = z.infer<typeof notificationChannelEnum>;
export type NotificationTrigger = z.infer<typeof notificationTriggerEnum>;
