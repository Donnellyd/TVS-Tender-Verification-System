import { getStripeSync } from './stripeClient';
import { db } from './db';
import { tenants, subscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before parsing this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }

  static async handleSubscriptionCreated(subscriptionData: {
    customerId: string;
    subscriptionId: string;
    planTier: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<void> {
    console.log('Handling subscription created:', subscriptionData);
    
    const tierLimits: Record<string, { bids: number; documents: number; storageGb: number; emails: number }> = {
      starter: { bids: 50, documents: 500, storageGb: 5, emails: 500 },
      professional: { bids: 300, documents: 3000, storageGb: 25, emails: 3000 },
      enterprise: { bids: 1500, documents: 15000, storageGb: 100, emails: 15000 },
    };

    const limits = tierLimits[subscriptionData.planTier] || tierLimits.starter;

    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.stripeCustomerId, subscriptionData.customerId))
      .limit(1);

    if (tenant) {
      await db.update(tenants)
        .set({
          subscriptionTier: subscriptionData.planTier as any,
          subscriptionStatus: subscriptionData.status as any,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      await db.insert(subscriptions).values({
        tenantId: tenant.id,
        tier: subscriptionData.planTier as any,
        status: 'active',
        stripeSubscriptionId: subscriptionData.subscriptionId,
        stripeCustomerId: subscriptionData.customerId,
        currentPeriodStart: subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        monthlyBidLimit: limits.bids,
        monthlyDocumentLimit: limits.documents,
        storageLimit: limits.storageGb * 1024 * 1024 * 1024,
      }).onConflictDoUpdate({
        target: subscriptions.tenantId,
        set: {
          tier: subscriptionData.planTier as any,
          status: 'active',
          stripeSubscriptionId: subscriptionData.subscriptionId,
          currentPeriodStart: subscriptionData.currentPeriodStart,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          monthlyBidLimit: limits.bids,
          monthlyDocumentLimit: limits.documents,
          storageLimit: limits.storageGb * 1024 * 1024 * 1024,
          updatedAt: new Date(),
        },
      });

      console.log(`Subscription created for tenant ${tenant.id}: ${subscriptionData.planTier}`);
    }
  }

  static async handleSubscriptionRenewed(subscriptionData: {
    customerId: string;
    subscriptionId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<void> {
    console.log('Handling subscription renewed:', subscriptionData);

    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.stripeCustomerId, subscriptionData.customerId))
      .limit(1);

    if (tenant) {
      await db.update(subscriptions)
        .set({
          status: 'active',
          currentPeriodStart: subscriptionData.currentPeriodStart,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.tenantId, tenant.id));

      console.log(`Subscription renewed for tenant ${tenant.id}, usage reset`);
    }
  }

  static async handleSubscriptionCancelled(subscriptionData: {
    customerId: string;
    subscriptionId: string;
    cancelledAt: Date;
  }): Promise<void> {
    console.log('Handling subscription cancelled:', subscriptionData);

    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.stripeCustomerId, subscriptionData.customerId))
      .limit(1);

    if (tenant) {
      await db.update(tenants)
        .set({
          subscriptionStatus: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      await db.update(subscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: subscriptionData.cancelledAt,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.tenantId, tenant.id));

      console.log(`Subscription cancelled for tenant ${tenant.id}`);
    }
  }
}
