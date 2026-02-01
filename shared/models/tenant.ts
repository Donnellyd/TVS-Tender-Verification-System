import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subscriptionTierEnum = z.enum(["starter", "professional", "enterprise", "government"]);
export const subscriptionStatusEnum = z.enum(["active", "past_due", "cancelled", "trialing", "paused"]);
export const billingIntervalEnum = z.enum(["monthly", "annual"]);
export const tenantStatusEnum = z.enum(["active", "suspended", "pending"]);

export const languageEnum = z.enum(["en", "fr", "pt", "ar"]);

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3b82f6"),
  country: text("country").notNull().default("ZA"),
  timezone: text("timezone").default("Africa/Johannesburg"),
  currency: text("currency").default("ZAR"),
  language: text("language").default("en"),
  supportedLanguages: text("supported_languages").array().default(sql`ARRAY['en']::text[]`),
  status: text("status").notNull().default("active"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tenant_slug").on(table.slug),
  index("idx_tenant_status").on(table.status),
]);

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Tenant name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  status: tenantStatusEnum.optional(),
});

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  tier: text("tier").notNull().default("starter"),
  status: text("status").notNull().default("active"),
  billingInterval: text("billing_interval").default("monthly"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelledAt: timestamp("cancelled_at"),
  bidsIncluded: integer("bids_included").default(50),
  documentsIncluded: integer("documents_included").default(500),
  storageIncludedMb: integer("storage_included_mb").default(5000),
  overageBidPrice: integer("overage_bid_price").default(1000),
  overageDocPrice: integer("overage_doc_price").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_subscription_tenant").on(table.tenantId),
  index("idx_subscription_stripe_customer").on(table.stripeCustomerId),
]);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id],
  }),
}));

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tier: subscriptionTierEnum.optional(),
  status: subscriptionStatusEnum.optional(),
  billingInterval: billingIntervalEnum.optional(),
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  bidsProcessed: integer("bids_processed").default(0),
  documentsVerified: integer("documents_verified").default(0),
  storageUsedMb: integer("storage_used_mb").default(0),
  apiCalls: integer("api_calls").default(0),
  aiTokensUsed: integer("ai_tokens_used").default(0),
  overageBids: integer("overage_bids").default(0),
  overageDocuments: integer("overage_documents").default(0),
  overageStorage: integer("overage_storage").default(0),
  overageAmount: integer("overage_amount").default(0),
  reportedToStripe: boolean("reported_to_stripe").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_usage_tenant").on(table.tenantId),
  index("idx_usage_period").on(table.periodStart, table.periodEnd),
]);

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usageRecords.tenantId],
    references: [tenants.id],
  }),
}));

export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;
export type UsageRecord = typeof usageRecords.$inferSelect;

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  stripeInvoiceId: text("stripe_invoice_id"),
  invoiceNumber: text("invoice_number").notNull(),
  status: text("status").notNull().default("draft"),
  subtotal: integer("subtotal").default(0),
  tax: integer("tax").default(0),
  total: integer("total").default(0),
  currency: text("currency").default("USD"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  pdfUrl: text("pdf_url"),
  lineItems: jsonb("line_items").default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_invoice_tenant").on(table.tenantId),
  index("idx_invoice_stripe").on(table.stripeInvoiceId),
]);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const tenantUsers = pgTable("tenant_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("member"),
  permissions: jsonb("permissions").default([]),
  invitedBy: varchar("invited_by"),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tenant_user_tenant").on(table.tenantId),
  index("idx_tenant_user_user").on(table.userId),
]);

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
}));

export const insertTenantUserSchema = createInsertSchema(tenantUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;
export type TenantUser = typeof tenantUsers.$inferSelect;

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  permissions: jsonb("permissions").default(["read"]),
  rateLimit: integer("rate_limit").default(1000),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_api_key_tenant").on(table.tenantId),
  index("idx_api_key_prefix").on(table.keyPrefix),
]);

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}));

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type SubscriptionTier = z.infer<typeof subscriptionTierEnum>;

export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: 49900,
    priceAnnual: 479000,
    bidsIncluded: 50,
    documentsIncluded: 500,
    storageIncludedMb: 5000,
    overageBidPrice: 1000,
    overageDocPrice: 100,
    features: [
      "Basic compliance checking",
      "Document verification",
      "Email notifications",
      "Standard reporting",
      "Basic audit trail",
    ],
  },
  professional: {
    name: "Professional",
    price: 199900,
    priceAnnual: 1919000,
    bidsIncluded: 250,
    documentsIncluded: 2500,
    storageIncludedMb: 25000,
    overageBidPrice: 800,
    overageDocPrice: 80,
    features: [
      "Advanced AI compliance checking",
      "Automated scoring",
      "Multi-channel notifications",
      "Advanced analytics",
      "Full audit trail",
      "API access",
      "Custom scoring rules",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 499900,
    priceAnnual: 4799000,
    bidsIncluded: 1000,
    documentsIncluded: 10000,
    storageIncludedMb: 100000,
    overageBidPrice: 500,
    overageDocPrice: 50,
    features: [
      "Everything in Professional",
      "Unlimited custom rules",
      "Dedicated instance",
      "SLA 99.9%",
      "24/7 support",
      "Custom integrations",
      "White-label option",
    ],
  },
  government: {
    name: "Government Edition",
    price: 999900,
    priceAnnual: 9599000,
    bidsIncluded: -1,
    documentsIncluded: -1,
    storageIncludedMb: -1,
    overageBidPrice: 0,
    overageDocPrice: 0,
    features: [
      "Full system customization",
      "On-premise deployment option",
      "Training for 100+ users",
      "Custom development hours",
      "Priority feature development",
      "Dedicated support team",
      "Unlimited bids and documents",
    ],
  },
} as const;
