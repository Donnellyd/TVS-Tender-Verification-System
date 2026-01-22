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
}

export const storage = new DatabaseStorage();
