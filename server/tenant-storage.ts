import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  tenants,
  subscriptions,
  usageRecords,
  invoices,
  tenantUsers,
  apiKeys,
  type InsertTenant,
  type Tenant,
  type InsertSubscription,
  type Subscription,
  type InsertUsageRecord,
  type UsageRecord,
  type InsertInvoice,
  type Invoice,
  type InsertTenantUser,
  type TenantUser,
  type InsertApiKey,
  type ApiKey,
  SUBSCRIPTION_TIERS,
} from "@shared/schema";

export interface ITenantStorage {
  getTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(data: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined>;
  deleteTenant(id: string): Promise<boolean>;

  getSubscription(tenantId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeCustomer(stripeCustomerId: string): Promise<Subscription | undefined>;
  createSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;

  getUsageRecords(tenantId: string, periodStart?: Date): Promise<UsageRecord[]>;
  getCurrentUsage(tenantId: string): Promise<UsageRecord | undefined>;
  createUsageRecord(data: InsertUsageRecord): Promise<UsageRecord>;
  updateUsageRecord(id: string, data: Partial<InsertUsageRecord>): Promise<UsageRecord | undefined>;
  incrementUsage(tenantId: string, field: 'bidsProcessed' | 'documentsVerified' | 'apiCalls' | 'aiTokensUsed', amount?: number): Promise<void>;

  getInvoices(tenantId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  getTenantUsers(tenantId: string): Promise<TenantUser[]>;
  getTenantUser(tenantId: string, userId: string): Promise<TenantUser | undefined>;
  getUserTenants(userId: string): Promise<TenantUser[]>;
  createTenantUser(data: InsertTenantUser): Promise<TenantUser>;
  updateTenantUser(id: string, data: Partial<InsertTenantUser>): Promise<TenantUser | undefined>;
  deleteTenantUser(id: string): Promise<boolean>;

  getApiKeys(tenantId: string): Promise<ApiKey[]>;
  getApiKeyByPrefix(keyPrefix: string): Promise<ApiKey | undefined>;
  createApiKey(data: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, data: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<boolean>;
}

class TenantStorage implements ITenantStorage {
  async getTenants(): Promise<Tenant[]> {
    return db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant;
  }

  async createTenant(data: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(data).returning();
    return tenant;
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, id)).returning();
    return tenant;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const result = await db.delete(tenants).where(eq(tenants.id, id));
    return true;
  }

  async getSubscription(tenantId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId));
    return subscription;
  }

  async getSubscriptionByStripeCustomer(stripeCustomerId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
    return subscription;
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const tier = data.tier as keyof typeof SUBSCRIPTION_TIERS || 'starter';
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    
    const [subscription] = await db.insert(subscriptions).values({
      ...data,
      bidsIncluded: tierConfig.bidsIncluded,
      documentsIncluded: tierConfig.documentsIncluded,
      storageIncludedMb: tierConfig.storageIncludedMb,
      overageBidPrice: tierConfig.overageBidPrice,
      overageDocPrice: tierConfig.overageDocPrice,
    }).returning();
    return subscription;
  }

  async updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db.update(subscriptions).set({ ...data, updatedAt: new Date() }).where(eq(subscriptions.id, id)).returning();
    return subscription;
  }

  async getUsageRecords(tenantId: string, periodStart?: Date): Promise<UsageRecord[]> {
    if (periodStart) {
      return db.select().from(usageRecords)
        .where(and(
          eq(usageRecords.tenantId, tenantId),
          sql`${usageRecords.periodStart} >= ${periodStart}`
        ))
        .orderBy(desc(usageRecords.periodStart));
    }
    return db.select().from(usageRecords)
      .where(eq(usageRecords.tenantId, tenantId))
      .orderBy(desc(usageRecords.periodStart));
  }

  async getCurrentUsage(tenantId: string): Promise<UsageRecord | undefined> {
    const now = new Date();
    const [usage] = await db.select().from(usageRecords)
      .where(and(
        eq(usageRecords.tenantId, tenantId),
        sql`${usageRecords.periodStart} <= ${now}`,
        sql`${usageRecords.periodEnd} >= ${now}`
      ));
    return usage;
  }

  async createUsageRecord(data: InsertUsageRecord): Promise<UsageRecord> {
    const [usage] = await db.insert(usageRecords).values(data).returning();
    return usage;
  }

  async updateUsageRecord(id: string, data: Partial<InsertUsageRecord>): Promise<UsageRecord | undefined> {
    const [usage] = await db.update(usageRecords).set(data).where(eq(usageRecords.id, id)).returning();
    return usage;
  }

  async incrementUsage(tenantId: string, field: 'bidsProcessed' | 'documentsVerified' | 'apiCalls' | 'aiTokensUsed', amount: number = 1): Promise<void> {
    const current = await this.getCurrentUsage(tenantId);
    if (current) {
      const updateData: Partial<InsertUsageRecord> = {};
      updateData[field] = (current[field] || 0) + amount;
      await this.updateUsageRecord(current.id, updateData);
    }
  }

  async getInvoices(tenantId: string): Promise<Invoice[]> {
    return db.select().from(invoices)
      .where(eq(invoices.tenantId, tenantId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return invoice;
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return db.select().from(tenantUsers)
      .where(eq(tenantUsers.tenantId, tenantId))
      .orderBy(desc(tenantUsers.createdAt));
  }

  async getTenantUser(tenantId: string, userId: string): Promise<TenantUser | undefined> {
    const [user] = await db.select().from(tenantUsers)
      .where(and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.userId, userId)
      ));
    return user;
  }

  async getUserTenants(userId: string): Promise<TenantUser[]> {
    return db.select().from(tenantUsers)
      .where(eq(tenantUsers.userId, userId))
      .orderBy(desc(tenantUsers.createdAt));
  }

  async createTenantUser(data: InsertTenantUser): Promise<TenantUser> {
    const [user] = await db.insert(tenantUsers).values(data).returning();
    return user;
  }

  async updateTenantUser(id: string, data: Partial<InsertTenantUser>): Promise<TenantUser | undefined> {
    const [user] = await db.update(tenantUsers).set({ ...data, updatedAt: new Date() }).where(eq(tenantUsers.id, id)).returning();
    return user;
  }

  async deleteTenantUser(id: string): Promise<boolean> {
    await db.delete(tenantUsers).where(eq(tenantUsers.id, id));
    return true;
  }

  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    return db.select().from(apiKeys)
      .where(eq(apiKeys.tenantId, tenantId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByPrefix(keyPrefix: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.keyPrefix, keyPrefix));
    return key;
  }

  async createApiKey(data: InsertApiKey): Promise<ApiKey> {
    const [key] = await db.insert(apiKeys).values(data).returning();
    return key;
  }

  async updateApiKey(id: string, data: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [key] = await db.update(apiKeys).set(data).where(eq(apiKeys.id, id)).returning();
    return key;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return true;
  }

  async validateApiKey(key: string): Promise<{ tenantId: string; keyId: string; permissions: string[]; rateLimit: number } | null> {
    const [apiKey] = await db.select().from(apiKeys)
      .where(and(
        eq(apiKeys.keyHash, key),
        eq(apiKeys.isActive, true)
      ));
    
    if (!apiKey) {
      return null;
    }
    
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return null;
    }

    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));
    
    return {
      tenantId: apiKey.tenantId,
      keyId: apiKey.id,
      permissions: apiKey.permissions || [],
      rateLimit: apiKey.rateLimit || 1000,
    };
  }
}

export const tenantStorage = new TenantStorage();
