import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  complianceRuleSets,
  complianceRuleDefinitions,
  ruleVersionHistory,
  ruleExecutionLogs,
  type InsertComplianceRuleSet,
  type ComplianceRuleSet,
  type InsertComplianceRuleDefinition,
  type ComplianceRuleDefinition,
  type InsertRuleVersionHistory,
  type RuleVersionHistory,
  type InsertRuleExecutionLog,
  type RuleExecutionLog,
  COUNTRY_COMPLIANCE_CONFIGS,
} from "@shared/schema";

export interface IComplianceRulesStorage {
  getRuleSets(tenantId?: string, country?: string): Promise<ComplianceRuleSet[]>;
  getRuleSet(id: string): Promise<ComplianceRuleSet | undefined>;
  getDefaultRuleSet(country: string): Promise<ComplianceRuleSet | undefined>;
  createRuleSet(data: InsertComplianceRuleSet): Promise<ComplianceRuleSet>;
  updateRuleSet(id: string, data: Partial<InsertComplianceRuleSet>): Promise<ComplianceRuleSet | undefined>;
  deleteRuleSet(id: string): Promise<boolean>;
  publishRuleSet(id: string, userId: string): Promise<ComplianceRuleSet | undefined>;

  getRuleDefinitions(ruleSetId: string): Promise<ComplianceRuleDefinition[]>;
  getRuleDefinition(id: string): Promise<ComplianceRuleDefinition | undefined>;
  createRuleDefinition(data: InsertComplianceRuleDefinition): Promise<ComplianceRuleDefinition>;
  updateRuleDefinition(id: string, data: Partial<InsertComplianceRuleDefinition>): Promise<ComplianceRuleDefinition | undefined>;
  deleteRuleDefinition(id: string): Promise<boolean>;
  createBulkRuleDefinitions(data: InsertComplianceRuleDefinition[]): Promise<ComplianceRuleDefinition[]>;

  getRuleVersions(ruleSetId: string): Promise<RuleVersionHistory[]>;
  createRuleVersion(data: InsertRuleVersionHistory): Promise<RuleVersionHistory>;

  getExecutionLogs(tenantId: string, entityType?: string, entityId?: string): Promise<RuleExecutionLog[]>;
  createExecutionLog(data: InsertRuleExecutionLog): Promise<RuleExecutionLog>;
}

class ComplianceRulesStorage implements IComplianceRulesStorage {
  async getRuleSets(tenantId?: string, country?: string): Promise<ComplianceRuleSet[]> {
    let query = db.select().from(complianceRuleSets);
    
    if (tenantId && country) {
      return db.select().from(complianceRuleSets)
        .where(and(
          eq(complianceRuleSets.tenantId, tenantId),
          eq(complianceRuleSets.country, country)
        ))
        .orderBy(desc(complianceRuleSets.createdAt));
    } else if (tenantId) {
      return db.select().from(complianceRuleSets)
        .where(eq(complianceRuleSets.tenantId, tenantId))
        .orderBy(desc(complianceRuleSets.createdAt));
    } else if (country) {
      return db.select().from(complianceRuleSets)
        .where(eq(complianceRuleSets.country, country))
        .orderBy(desc(complianceRuleSets.createdAt));
    }
    
    return db.select().from(complianceRuleSets).orderBy(desc(complianceRuleSets.createdAt));
  }

  async getRuleSet(id: string): Promise<ComplianceRuleSet | undefined> {
    const [ruleSet] = await db.select().from(complianceRuleSets).where(eq(complianceRuleSets.id, id));
    return ruleSet;
  }

  async getDefaultRuleSet(country: string): Promise<ComplianceRuleSet | undefined> {
    const [ruleSet] = await db.select().from(complianceRuleSets)
      .where(and(
        eq(complianceRuleSets.country, country),
        eq(complianceRuleSets.isDefault, true),
        eq(complianceRuleSets.isActive, true)
      ));
    return ruleSet;
  }

  async createRuleSet(data: InsertComplianceRuleSet): Promise<ComplianceRuleSet> {
    const [ruleSet] = await db.insert(complianceRuleSets).values(data).returning();
    return ruleSet;
  }

  async updateRuleSet(id: string, data: Partial<InsertComplianceRuleSet>): Promise<ComplianceRuleSet | undefined> {
    const [ruleSet] = await db.update(complianceRuleSets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(complianceRuleSets.id, id))
      .returning();
    return ruleSet;
  }

  async deleteRuleSet(id: string): Promise<boolean> {
    await db.delete(complianceRuleSets).where(eq(complianceRuleSets.id, id));
    return true;
  }

  async publishRuleSet(id: string, userId: string): Promise<ComplianceRuleSet | undefined> {
    const ruleSet = await this.getRuleSet(id);
    if (!ruleSet) return undefined;

    const rules = await this.getRuleDefinitions(id);
    
    await this.createRuleVersion({
      ruleSetId: id,
      version: (ruleSet.version || 0) + 1,
      snapshot: { ruleSet, rules },
      changedBy: userId,
      changeReason: "Published new version",
    });

    const [updated] = await db.update(complianceRuleSets)
      .set({ 
        version: (ruleSet.version || 0) + 1,
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(complianceRuleSets.id, id))
      .returning();
    
    return updated;
  }

  async getRuleDefinitions(ruleSetId: string): Promise<ComplianceRuleDefinition[]> {
    return db.select().from(complianceRuleDefinitions)
      .where(eq(complianceRuleDefinitions.ruleSetId, ruleSetId))
      .orderBy(complianceRuleDefinitions.sortOrder);
  }

  async getRuleDefinition(id: string): Promise<ComplianceRuleDefinition | undefined> {
    const [rule] = await db.select().from(complianceRuleDefinitions).where(eq(complianceRuleDefinitions.id, id));
    return rule;
  }

  async createRuleDefinition(data: InsertComplianceRuleDefinition): Promise<ComplianceRuleDefinition> {
    const [rule] = await db.insert(complianceRuleDefinitions).values(data).returning();
    return rule;
  }

  async updateRuleDefinition(id: string, data: Partial<InsertComplianceRuleDefinition>): Promise<ComplianceRuleDefinition | undefined> {
    const [rule] = await db.update(complianceRuleDefinitions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(complianceRuleDefinitions.id, id))
      .returning();
    return rule;
  }

  async deleteRuleDefinition(id: string): Promise<boolean> {
    await db.delete(complianceRuleDefinitions).where(eq(complianceRuleDefinitions.id, id));
    return true;
  }

  async createBulkRuleDefinitions(data: InsertComplianceRuleDefinition[]): Promise<ComplianceRuleDefinition[]> {
    if (data.length === 0) return [];
    return db.insert(complianceRuleDefinitions).values(data).returning();
  }

  async getRuleVersions(ruleSetId: string): Promise<RuleVersionHistory[]> {
    return db.select().from(ruleVersionHistory)
      .where(eq(ruleVersionHistory.ruleSetId, ruleSetId))
      .orderBy(desc(ruleVersionHistory.version));
  }

  async createRuleVersion(data: InsertRuleVersionHistory): Promise<RuleVersionHistory> {
    const [version] = await db.insert(ruleVersionHistory).values(data).returning();
    return version;
  }

  async getExecutionLogs(tenantId: string, entityType?: string, entityId?: string): Promise<RuleExecutionLog[]> {
    if (entityType && entityId) {
      return db.select().from(ruleExecutionLogs)
        .where(and(
          eq(ruleExecutionLogs.tenantId, tenantId),
          eq(ruleExecutionLogs.entityType, entityType),
          eq(ruleExecutionLogs.entityId, entityId)
        ))
        .orderBy(desc(ruleExecutionLogs.createdAt));
    }
    
    return db.select().from(ruleExecutionLogs)
      .where(eq(ruleExecutionLogs.tenantId, tenantId))
      .orderBy(desc(ruleExecutionLogs.createdAt));
  }

  async createExecutionLog(data: InsertRuleExecutionLog): Promise<RuleExecutionLog> {
    const [log] = await db.insert(ruleExecutionLogs).values(data).returning();
    return log;
  }

  async getSupportedCountries(): Promise<{ code: string; name: string; currency: string }[]> {
    return Object.entries(COUNTRY_COMPLIANCE_CONFIGS).map(([code, config]) => ({
      code,
      name: config.name,
      currency: config.currency,
    }));
  }
}

export const complianceRulesStorage = new ComplianceRulesStorage();

export function getCountryComplianceConfig(country: string) {
  return COUNTRY_COMPLIANCE_CONFIGS[country as keyof typeof COUNTRY_COMPLIANCE_CONFIGS] || COUNTRY_COMPLIANCE_CONFIGS.GLOBAL;
}
