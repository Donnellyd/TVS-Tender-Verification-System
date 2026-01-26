import { db } from "./db";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";
import {
  municipalities,
  vendors,
  tenders,
  documents,
  complianceRules,
  complianceChecks,
  auditLogs,
  notifications,
  tenderRequirements,
  tenderScoringCriteria,
  bidSubmissions,
  submissionDocuments,
  evaluationScores,
  letterTemplates,
  generatedLetters,
  whatsappTemplates,
  notificationLogs,
  notificationSettings,
  type InsertMunicipality,
  type Municipality,
  type InsertVendor,
  type Vendor,
  type InsertTender,
  type Tender,
  type InsertDocument,
  type Document,
  type InsertComplianceRule,
  type ComplianceRule,
  type InsertComplianceCheck,
  type ComplianceCheck,
  type InsertAuditLog,
  type AuditLog,
  type InsertNotification,
  type Notification,
  type DashboardStats,
  type TendersByStatus,
  type TendersByMunicipality,
  type ComplianceByCategory,
  type VendorsByStatus,
  type MonthlyTrends,
  type InsertTenderRequirement,
  type TenderRequirement,
  type InsertTenderScoringCriteria,
  type TenderScoringCriteria,
  type InsertBidSubmission,
  type BidSubmission,
  type InsertSubmissionDocument,
  type SubmissionDocument,
  type InsertEvaluationScore,
  type EvaluationScore,
  type InsertLetterTemplate,
  type LetterTemplate,
  type InsertGeneratedLetter,
  type GeneratedLetter,
  type SubmissionsByStage,
  type InsertWhatsappTemplate,
  type WhatsappTemplate,
  type InsertNotificationLog,
  type NotificationLog,
  type InsertNotificationSettings,
  type NotificationSettings,
  type NotificationChannel,
  type NotificationTrigger,
} from "@shared/schema";

export interface IStorage {
  // Municipalities
  getMunicipalities(): Promise<Municipality[]>;
  getMunicipality(id: string): Promise<Municipality | undefined>;
  createMunicipality(data: InsertMunicipality): Promise<Municipality>;
  updateMunicipality(id: string, data: Partial<InsertMunicipality>): Promise<Municipality | undefined>;
  deleteMunicipality(id: string): Promise<boolean>;

  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(data: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, data: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;

  // Tenders
  getTenders(): Promise<Tender[]>;
  getTender(id: string): Promise<Tender | undefined>;
  createTender(data: InsertTender): Promise<Tender>;
  updateTender(id: string, data: Partial<InsertTender>): Promise<Tender | undefined>;
  deleteTender(id: string): Promise<boolean>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(data: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Compliance Rules
  getComplianceRules(): Promise<ComplianceRule[]>;
  getComplianceRule(id: string): Promise<ComplianceRule | undefined>;
  createComplianceRule(data: InsertComplianceRule): Promise<ComplianceRule>;
  updateComplianceRule(id: string, data: Partial<InsertComplianceRule>): Promise<ComplianceRule | undefined>;
  deleteComplianceRule(id: string): Promise<boolean>;

  // Compliance Checks
  getComplianceChecks(): Promise<ComplianceCheck[]>;
  getComplianceCheck(id: string): Promise<ComplianceCheck | undefined>;
  createComplianceCheck(data: InsertComplianceCheck): Promise<ComplianceCheck>;

  // Audit Logs
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;

  // Notifications
  getNotifications(userId?: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;

  // Analytics
  getDashboardStats(): Promise<DashboardStats>;
  getTendersByStatus(): Promise<TendersByStatus[]>;
  getTendersByMunicipality(): Promise<TendersByMunicipality[]>;
  getComplianceByCategory(): Promise<ComplianceByCategory[]>;
  getVendorsByStatus(): Promise<VendorsByStatus[]>;
  getMonthlyTrends(): Promise<MonthlyTrends[]>;

  // Tender Requirements
  getTenderRequirements(tenderId: string): Promise<TenderRequirement[]>;
  getTenderRequirement(id: string): Promise<TenderRequirement | undefined>;
  createTenderRequirement(data: InsertTenderRequirement): Promise<TenderRequirement>;
  updateTenderRequirement(id: string, data: Partial<InsertTenderRequirement>): Promise<TenderRequirement | undefined>;
  deleteTenderRequirement(id: string): Promise<boolean>;
  createBulkTenderRequirements(data: InsertTenderRequirement[]): Promise<TenderRequirement[]>;

  // Tender Scoring Criteria
  getTenderScoringCriteria(tenderId: string): Promise<TenderScoringCriteria[]>;
  getTenderScoringCriteriaById(id: string): Promise<TenderScoringCriteria | undefined>;
  createTenderScoringCriteria(data: InsertTenderScoringCriteria): Promise<TenderScoringCriteria>;
  updateTenderScoringCriteria(id: string, data: Partial<InsertTenderScoringCriteria>): Promise<TenderScoringCriteria | undefined>;
  deleteTenderScoringCriteria(id: string): Promise<boolean>;
  createBulkTenderScoringCriteria(data: InsertTenderScoringCriteria[]): Promise<TenderScoringCriteria[]>;
  deleteTenderScoringCriteriaByTender(tenderId: string): Promise<boolean>;

  // Bid Submissions
  getBidSubmissions(tenderId?: string): Promise<BidSubmission[]>;
  getBidSubmission(id: string): Promise<BidSubmission | undefined>;
  getBidSubmissionsByVendor(vendorId: string): Promise<BidSubmission[]>;
  createBidSubmission(data: InsertBidSubmission): Promise<BidSubmission>;
  updateBidSubmission(id: string, data: Partial<InsertBidSubmission>): Promise<BidSubmission | undefined>;
  deleteBidSubmission(id: string): Promise<boolean>;
  getSubmissionsByStage(): Promise<SubmissionsByStage[]>;

  // Submission Documents
  getSubmissionDocuments(submissionId: string): Promise<SubmissionDocument[]>;
  getSubmissionDocument(id: string): Promise<SubmissionDocument | undefined>;
  createSubmissionDocument(data: InsertSubmissionDocument): Promise<SubmissionDocument>;
  updateSubmissionDocument(id: string, data: Partial<InsertSubmissionDocument>): Promise<SubmissionDocument | undefined>;
  deleteSubmissionDocument(id: string): Promise<boolean>;

  // Evaluation Scores
  getEvaluationScores(submissionId: string): Promise<EvaluationScore[]>;
  createEvaluationScore(data: InsertEvaluationScore): Promise<EvaluationScore>;
  updateEvaluationScore(id: string, data: Partial<InsertEvaluationScore>): Promise<EvaluationScore | undefined>;
  deleteEvaluationScore(id: string): Promise<boolean>;
  deleteEvaluationScoresBySubmission(submissionId: string): Promise<boolean>;

  // Letter Templates
  getLetterTemplates(municipalityId?: string): Promise<LetterTemplate[]>;
  getLetterTemplate(id: string): Promise<LetterTemplate | undefined>;
  createLetterTemplate(data: InsertLetterTemplate): Promise<LetterTemplate>;
  updateLetterTemplate(id: string, data: Partial<InsertLetterTemplate>): Promise<LetterTemplate | undefined>;
  deleteLetterTemplate(id: string): Promise<boolean>;

  // Generated Letters
  getGeneratedLetters(submissionId: string): Promise<GeneratedLetter[]>;
  createGeneratedLetter(data: InsertGeneratedLetter): Promise<GeneratedLetter>;
  deleteGeneratedLettersBySubmission(submissionId: string): Promise<boolean>;

  // Cascade delete helpers
  deleteComplianceChecksByTender(tenderId: string): Promise<boolean>;
  deleteComplianceChecksByVendor(vendorId: string): Promise<boolean>;
  deleteDocumentsByTender(tenderId: string): Promise<boolean>;
  deleteDocumentsByVendor(vendorId: string): Promise<boolean>;

  // WhatsApp Templates
  getWhatsappTemplates(municipalityId?: string): Promise<WhatsappTemplate[]>;
  getWhatsappTemplate(id: string): Promise<WhatsappTemplate | undefined>;
  getWhatsappTemplateByTrigger(trigger: string): Promise<WhatsappTemplate | undefined>;
  createWhatsappTemplate(data: InsertWhatsappTemplate): Promise<WhatsappTemplate>;
  updateWhatsappTemplate(id: string, data: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate | undefined>;
  deleteWhatsappTemplate(id: string): Promise<boolean>;

  // Notification Settings
  getNotificationSettings(channel: string): Promise<NotificationSettings | undefined>;
  upsertNotificationSettings(data: InsertNotificationSettings): Promise<NotificationSettings>;

  // Notification Logs
  createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog>;
  getNotificationLogs(vendorId?: string): Promise<NotificationLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Municipalities
  async getMunicipalities(): Promise<Municipality[]> {
    return await db.select().from(municipalities).orderBy(desc(municipalities.createdAt));
  }

  async getMunicipality(id: string): Promise<Municipality | undefined> {
    const [result] = await db.select().from(municipalities).where(eq(municipalities.id, id));
    return result;
  }

  async createMunicipality(data: InsertMunicipality): Promise<Municipality> {
    const [result] = await db.insert(municipalities).values(data).returning();
    return result;
  }

  async updateMunicipality(id: string, data: Partial<InsertMunicipality>): Promise<Municipality | undefined> {
    const [result] = await db
      .update(municipalities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(municipalities.id, id))
      .returning();
    return result;
  }

  async deleteMunicipality(id: string): Promise<boolean> {
    const result = await db.delete(municipalities).where(eq(municipalities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [result] = await db.select().from(vendors).where(eq(vendors.id, id));
    return result;
  }

  async createVendor(data: InsertVendor): Promise<Vendor> {
    const [result] = await db.insert(vendors).values(data).returning();
    return result;
  }

  async updateVendor(id: string, data: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [result] = await db
      .update(vendors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return result;
  }

  async deleteVendor(id: string): Promise<boolean> {
    const result = await db.delete(vendors).where(eq(vendors.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tenders
  async getTenders(): Promise<Tender[]> {
    return await db.select().from(tenders).orderBy(desc(tenders.createdAt));
  }

  async getTender(id: string): Promise<Tender | undefined> {
    const [result] = await db.select().from(tenders).where(eq(tenders.id, id));
    return result;
  }

  async createTender(data: InsertTender): Promise<Tender> {
    const [result] = await db.insert(tenders).values(data).returning();
    return result;
  }

  async updateTender(id: string, data: Partial<InsertTender>): Promise<Tender | undefined> {
    const [result] = await db
      .update(tenders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenders.id, id))
      .returning();
    return result;
  }

  async deleteTender(id: string): Promise<boolean> {
    const result = await db.delete(tenders).where(eq(tenders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [result] = await db.select().from(documents).where(eq(documents.id, id));
    return result;
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(data).returning();
    return result;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const [result] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return result;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Compliance Rules
  async getComplianceRules(): Promise<ComplianceRule[]> {
    return await db.select().from(complianceRules).orderBy(desc(complianceRules.createdAt));
  }

  async getComplianceRule(id: string): Promise<ComplianceRule | undefined> {
    const [result] = await db.select().from(complianceRules).where(eq(complianceRules.id, id));
    return result;
  }

  async createComplianceRule(data: InsertComplianceRule): Promise<ComplianceRule> {
    const [result] = await db.insert(complianceRules).values(data).returning();
    return result;
  }

  async updateComplianceRule(id: string, data: Partial<InsertComplianceRule>): Promise<ComplianceRule | undefined> {
    const [result] = await db
      .update(complianceRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(complianceRules.id, id))
      .returning();
    return result;
  }

  async deleteComplianceRule(id: string): Promise<boolean> {
    const result = await db.delete(complianceRules).where(eq(complianceRules.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Compliance Checks
  async getComplianceChecks(): Promise<ComplianceCheck[]> {
    return await db.select().from(complianceChecks).orderBy(desc(complianceChecks.createdAt));
  }

  async getComplianceCheck(id: string): Promise<ComplianceCheck | undefined> {
    const [result] = await db.select().from(complianceChecks).where(eq(complianceChecks.id, id));
    return result;
  }

  async createComplianceCheck(data: InsertComplianceCheck): Promise<ComplianceCheck> {
    const [result] = await db.insert(complianceChecks).values({
      ...data,
      performedAt: new Date(),
    }).returning();
    return result;
  }

  // Audit Logs
  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(data).returning();
    return result;
  }

  // Notifications
  async getNotifications(userId?: string): Promise<Notification[]> {
    if (userId) {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    }
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(data).returning();
    return result;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [result] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return result;
  }

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const [vendorStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${vendors.status} = 'approved')::int`,
        pending: sql<number>`count(*) filter (where ${vendors.status} = 'pending')::int`,
      })
      .from(vendors);

    const [tenderStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${tenders.status} = 'open')::int`,
        closed: sql<number>`count(*) filter (where ${tenders.status} = 'closed')::int`,
      })
      .from(tenders);

    const [complianceStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        passed: sql<number>`count(*) filter (where ${complianceChecks.result} = 'passed')::int`,
      })
      .from(complianceChecks);

    const [documentStats] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${documents.verificationStatus} = 'pending')::int`,
      })
      .from(documents);

    const recentActivity = await this.getAuditLogs(10);

    const passRate = complianceStats.total > 0
      ? Math.round((complianceStats.passed / complianceStats.total) * 100)
      : 0;

    return {
      totalVendors: vendorStats.total,
      activeVendors: vendorStats.active,
      pendingVendors: vendorStats.pending,
      totalTenders: tenderStats.total,
      openTenders: tenderStats.open,
      closedTenders: tenderStats.closed,
      compliancePassRate: passRate,
      pendingReviews: vendorStats.pending,
      documentsToVerify: documentStats.pending,
      recentActivity,
    };
  }

  async getTendersByStatus(): Promise<TendersByStatus[]> {
    const results = await db
      .select({
        status: tenders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tenders)
      .groupBy(tenders.status);

    return results.map((r) => ({
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, " "),
      count: r.count,
    }));
  }

  async getTendersByMunicipality(): Promise<TendersByMunicipality[]> {
    const results = await db
      .select({
        municipalityId: tenders.municipalityId,
        count: sql<number>`count(*)::int`,
      })
      .from(tenders)
      .groupBy(tenders.municipalityId);

    const municipalityList = await this.getMunicipalities();
    const municipalityMap = new Map(municipalityList.map((m) => [m.id, m.name]));

    return results.map((r) => ({
      municipality: r.municipalityId ? municipalityMap.get(r.municipalityId) || "Unknown" : "Unassigned",
      count: r.count,
    }));
  }

  async getComplianceByCategory(): Promise<ComplianceByCategory[]> {
    const results = await db
      .select({
        category: complianceChecks.checkType,
        passed: sql<number>`count(*) filter (where ${complianceChecks.result} = 'passed')::int`,
        failed: sql<number>`count(*) filter (where ${complianceChecks.result} = 'failed')::int`,
      })
      .from(complianceChecks)
      .groupBy(complianceChecks.checkType);

    return results.map((r) => {
      const total = r.passed + r.failed;
      return {
        category: r.category,
        passed: r.passed,
        failed: r.failed,
        passRate: total > 0 ? Math.round((r.passed / total) * 100) : 0,
      };
    });
  }

  async getVendorsByStatus(): Promise<VendorsByStatus[]> {
    const results = await db
      .select({
        status: vendors.status,
        count: sql<number>`count(*)::int`,
      })
      .from(vendors)
      .groupBy(vendors.status);

    return results.map((r) => ({
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
      count: r.count,
    }));
  }

  async getMonthlyTrends(): Promise<MonthlyTrends[]> {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();
      const monthStart = new Date(year, date.getMonth(), 1);
      const monthEnd = new Date(year, date.getMonth() + 1, 0);

      const [tenderCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tenders)
        .where(and(
          sql`${tenders.createdAt} >= ${monthStart}`,
          sql`${tenders.createdAt} <= ${monthEnd}`
        ));

      const [vendorCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(vendors)
        .where(and(
          sql`${vendors.createdAt} >= ${monthStart}`,
          sql`${vendors.createdAt} <= ${monthEnd}`
        ));

      const [checkCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(complianceChecks)
        .where(and(
          sql`${complianceChecks.createdAt} >= ${monthStart}`,
          sql`${complianceChecks.createdAt} <= ${monthEnd}`
        ));

      months.push({
        month: `${monthName} ${year}`,
        tenders: tenderCount.count,
        vendors: vendorCount.count,
        complianceChecks: checkCount.count,
      });
    }

    return months;
  }

  // Tender Requirements
  async getTenderRequirements(tenderId: string): Promise<TenderRequirement[]> {
    return await db.select().from(tenderRequirements).where(eq(tenderRequirements.tenderId, tenderId)).orderBy(tenderRequirements.createdAt);
  }

  async getTenderRequirement(id: string): Promise<TenderRequirement | undefined> {
    const [result] = await db.select().from(tenderRequirements).where(eq(tenderRequirements.id, id));
    return result;
  }

  async createTenderRequirement(data: InsertTenderRequirement): Promise<TenderRequirement> {
    const [result] = await db.insert(tenderRequirements).values(data).returning();
    return result;
  }

  async updateTenderRequirement(id: string, data: Partial<InsertTenderRequirement>): Promise<TenderRequirement | undefined> {
    const [result] = await db
      .update(tenderRequirements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenderRequirements.id, id))
      .returning();
    return result;
  }

  async deleteTenderRequirement(id: string): Promise<boolean> {
    const result = await db.delete(tenderRequirements).where(eq(tenderRequirements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createBulkTenderRequirements(data: InsertTenderRequirement[]): Promise<TenderRequirement[]> {
    if (data.length === 0) return [];
    return await db.insert(tenderRequirements).values(data).returning();
  }

  // Tender Scoring Criteria
  async getTenderScoringCriteria(tenderId: string): Promise<TenderScoringCriteria[]> {
    return await db.select().from(tenderScoringCriteria).where(eq(tenderScoringCriteria.tenderId, tenderId)).orderBy(tenderScoringCriteria.sortOrder);
  }

  async getTenderScoringCriteriaById(id: string): Promise<TenderScoringCriteria | undefined> {
    const [result] = await db.select().from(tenderScoringCriteria).where(eq(tenderScoringCriteria.id, id));
    return result;
  }

  async createTenderScoringCriteria(data: InsertTenderScoringCriteria): Promise<TenderScoringCriteria> {
    const [result] = await db.insert(tenderScoringCriteria).values(data).returning();
    return result;
  }

  async updateTenderScoringCriteria(id: string, data: Partial<InsertTenderScoringCriteria>): Promise<TenderScoringCriteria | undefined> {
    const [result] = await db
      .update(tenderScoringCriteria)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenderScoringCriteria.id, id))
      .returning();
    return result;
  }

  async deleteTenderScoringCriteria(id: string): Promise<boolean> {
    const result = await db.delete(tenderScoringCriteria).where(eq(tenderScoringCriteria.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createBulkTenderScoringCriteria(data: InsertTenderScoringCriteria[]): Promise<TenderScoringCriteria[]> {
    if (data.length === 0) return [];
    return await db.insert(tenderScoringCriteria).values(data).returning();
  }

  async deleteTenderScoringCriteriaByTender(tenderId: string): Promise<boolean> {
    const result = await db.delete(tenderScoringCriteria).where(eq(tenderScoringCriteria.tenderId, tenderId));
    return (result.rowCount ?? 0) >= 0;
  }

  // Bid Submissions
  async getBidSubmissions(tenderId?: string): Promise<BidSubmission[]> {
    if (tenderId) {
      return await db.select().from(bidSubmissions).where(eq(bidSubmissions.tenderId, tenderId)).orderBy(desc(bidSubmissions.createdAt));
    }
    return await db.select().from(bidSubmissions).orderBy(desc(bidSubmissions.createdAt));
  }

  async getBidSubmission(id: string): Promise<BidSubmission | undefined> {
    const [result] = await db.select().from(bidSubmissions).where(eq(bidSubmissions.id, id));
    return result;
  }

  async getBidSubmissionsByVendor(vendorId: string): Promise<BidSubmission[]> {
    return await db.select().from(bidSubmissions).where(eq(bidSubmissions.vendorId, vendorId)).orderBy(desc(bidSubmissions.createdAt));
  }

  async createBidSubmission(data: InsertBidSubmission): Promise<BidSubmission> {
    const [result] = await db.insert(bidSubmissions).values(data).returning();
    return result;
  }

  async updateBidSubmission(id: string, data: Partial<InsertBidSubmission>): Promise<BidSubmission | undefined> {
    const [result] = await db
      .update(bidSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bidSubmissions.id, id))
      .returning();
    return result;
  }

  async deleteBidSubmission(id: string): Promise<boolean> {
    // Delete related documents and scores first
    await db.delete(submissionDocuments).where(eq(submissionDocuments.submissionId, id));
    await db.delete(evaluationScores).where(eq(evaluationScores.submissionId, id));
    await db.delete(generatedLetters).where(eq(generatedLetters.submissionId, id));
    const result = await db.delete(bidSubmissions).where(eq(bidSubmissions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getSubmissionsByStage(): Promise<SubmissionsByStage[]> {
    const results = await db
      .select({
        stage: bidSubmissions.status,
        count: sql<number>`count(*)::int`,
      })
      .from(bidSubmissions)
      .groupBy(bidSubmissions.status);

    return results.map((r) => ({
      stage: r.stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count: r.count,
    }));
  }

  // Submission Documents
  async getSubmissionDocuments(submissionId: string): Promise<SubmissionDocument[]> {
    return await db.select().from(submissionDocuments).where(eq(submissionDocuments.submissionId, submissionId)).orderBy(submissionDocuments.createdAt);
  }

  async getSubmissionDocument(id: string): Promise<SubmissionDocument | undefined> {
    const [result] = await db.select().from(submissionDocuments).where(eq(submissionDocuments.id, id));
    return result;
  }

  async createSubmissionDocument(data: InsertSubmissionDocument): Promise<SubmissionDocument> {
    const [result] = await db.insert(submissionDocuments).values(data).returning();
    return result;
  }

  async updateSubmissionDocument(id: string, data: Partial<InsertSubmissionDocument>): Promise<SubmissionDocument | undefined> {
    const [result] = await db
      .update(submissionDocuments)
      .set(data)
      .where(eq(submissionDocuments.id, id))
      .returning();
    return result;
  }

  async deleteSubmissionDocument(id: string): Promise<boolean> {
    const result = await db.delete(submissionDocuments).where(eq(submissionDocuments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Evaluation Scores
  async getEvaluationScores(submissionId: string): Promise<EvaluationScore[]> {
    return await db.select().from(evaluationScores).where(eq(evaluationScores.submissionId, submissionId)).orderBy(evaluationScores.createdAt);
  }

  async createEvaluationScore(data: InsertEvaluationScore): Promise<EvaluationScore> {
    const [result] = await db.insert(evaluationScores).values(data).returning();
    return result;
  }

  async updateEvaluationScore(id: string, data: Partial<InsertEvaluationScore>): Promise<EvaluationScore | undefined> {
    const [result] = await db
      .update(evaluationScores)
      .set(data)
      .where(eq(evaluationScores.id, id))
      .returning();
    return result;
  }

  async deleteEvaluationScore(id: string): Promise<boolean> {
    const result = await db.delete(evaluationScores).where(eq(evaluationScores.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Letter Templates
  async getLetterTemplates(municipalityId?: string): Promise<LetterTemplate[]> {
    if (municipalityId) {
      return await db.select().from(letterTemplates).where(
        or(eq(letterTemplates.municipalityId, municipalityId), eq(letterTemplates.isDefault, true))
      ).orderBy(desc(letterTemplates.createdAt));
    }
    return await db.select().from(letterTemplates).orderBy(desc(letterTemplates.createdAt));
  }

  async getLetterTemplate(id: string): Promise<LetterTemplate | undefined> {
    const [result] = await db.select().from(letterTemplates).where(eq(letterTemplates.id, id));
    return result;
  }

  async createLetterTemplate(data: InsertLetterTemplate): Promise<LetterTemplate> {
    const [result] = await db.insert(letterTemplates).values(data).returning();
    return result;
  }

  async updateLetterTemplate(id: string, data: Partial<InsertLetterTemplate>): Promise<LetterTemplate | undefined> {
    const [result] = await db
      .update(letterTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(letterTemplates.id, id))
      .returning();
    return result;
  }

  async deleteLetterTemplate(id: string): Promise<boolean> {
    const result = await db.delete(letterTemplates).where(eq(letterTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Generated Letters
  async getGeneratedLetters(submissionId: string): Promise<GeneratedLetter[]> {
    return await db.select().from(generatedLetters).where(eq(generatedLetters.submissionId, submissionId)).orderBy(desc(generatedLetters.createdAt));
  }

  async createGeneratedLetter(data: InsertGeneratedLetter): Promise<GeneratedLetter> {
    const [result] = await db.insert(generatedLetters).values(data).returning();
    return result;
  }

  async deleteGeneratedLettersBySubmission(submissionId: string): Promise<boolean> {
    const result = await db.delete(generatedLetters).where(eq(generatedLetters.submissionId, submissionId));
    return (result.rowCount ?? 0) >= 0;
  }

  async deleteEvaluationScoresBySubmission(submissionId: string): Promise<boolean> {
    const result = await db.delete(evaluationScores).where(eq(evaluationScores.submissionId, submissionId));
    return (result.rowCount ?? 0) >= 0;
  }

  async deleteComplianceChecksByTender(tenderId: string): Promise<boolean> {
    const result = await db.delete(complianceChecks).where(eq(complianceChecks.tenderId, tenderId));
    return (result.rowCount ?? 0) >= 0;
  }

  async deleteComplianceChecksByVendor(vendorId: string): Promise<boolean> {
    const result = await db.delete(complianceChecks).where(eq(complianceChecks.vendorId, vendorId));
    return (result.rowCount ?? 0) >= 0;
  }

  async deleteDocumentsByTender(tenderId: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.tenderId, tenderId));
    return (result.rowCount ?? 0) >= 0;
  }

  async deleteDocumentsByVendor(vendorId: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.vendorId, vendorId));
    return (result.rowCount ?? 0) >= 0;
  }

  // WhatsApp Templates
  async getWhatsappTemplates(municipalityId?: string): Promise<WhatsappTemplate[]> {
    if (municipalityId) {
      return await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.municipalityId, municipalityId)).orderBy(desc(whatsappTemplates.createdAt));
    }
    return await db.select().from(whatsappTemplates).orderBy(desc(whatsappTemplates.createdAt));
  }

  async getWhatsappTemplate(id: string): Promise<WhatsappTemplate | undefined> {
    const [result] = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.id, id)).limit(1);
    return result;
  }

  async getWhatsappTemplateByTrigger(trigger: string): Promise<WhatsappTemplate | undefined> {
    const [result] = await db.select().from(whatsappTemplates).where(and(
      eq(whatsappTemplates.trigger, trigger),
      eq(whatsappTemplates.isActive, true)
    )).limit(1);
    return result;
  }

  async createWhatsappTemplate(data: InsertWhatsappTemplate): Promise<WhatsappTemplate> {
    const [result] = await db.insert(whatsappTemplates).values(data).returning();
    return result;
  }

  async updateWhatsappTemplate(id: string, data: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate | undefined> {
    const [result] = await db.update(whatsappTemplates).set({ ...data, updatedAt: new Date() }).where(eq(whatsappTemplates.id, id)).returning();
    return result;
  }

  async deleteWhatsappTemplate(id: string): Promise<boolean> {
    const result = await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Notification Settings
  async getNotificationSettings(channel: string): Promise<NotificationSettings | undefined> {
    const [result] = await db.select().from(notificationSettings).where(eq(notificationSettings.channel, channel)).limit(1);
    return result;
  }

  async upsertNotificationSettings(data: InsertNotificationSettings): Promise<NotificationSettings> {
    const existing = await this.getNotificationSettings(data.channel);
    if (existing) {
      const [result] = await db.update(notificationSettings).set({ ...data, updatedAt: new Date() }).where(eq(notificationSettings.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(notificationSettings).values(data).returning();
    return result;
  }

  // Notification Logs
  async createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog> {
    const [result] = await db.insert(notificationLogs).values(data).returning();
    return result;
  }

  async getNotificationLogs(vendorId?: string): Promise<NotificationLog[]> {
    if (vendorId) {
      return await db.select().from(notificationLogs).where(eq(notificationLogs.vendorId, vendorId)).orderBy(desc(notificationLogs.createdAt));
    }
    return await db.select().from(notificationLogs).orderBy(desc(notificationLogs.createdAt)).limit(100);
  }
}

export const storage = new DatabaseStorage();
