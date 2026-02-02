# Stripe Payment Integration Setup Guide

This guide explains how to re-enable Stripe payment processing for VeritasAI.

## Overview

Stripe was previously integrated for international (USD) payments. The integration used:
- `stripe-replit-sync` for syncing Stripe data
- Stripe Checkout for payment processing
- Customer Portal for subscription management
- Webhooks for event handling

## Files to Restore

The following files contain Stripe integration code (currently disabled):

1. **server/stripeClient.ts** - Stripe client initialization and sync
2. **server/stripeService.ts** - Stripe service methods (checkout, portal, subscriptions)
3. **server/webhookHandlers.ts** - Stripe webhook event handlers
4. **server/seed-stripe-products.ts** - Script to seed products/prices in Stripe

## Step-by-Step Setup

### 1. Add Stripe Integration in Replit

1. Go to your Replit project
2. Open the **Integrations** or **Connections** panel
3. Search for "Stripe"
4. Click to add the Stripe integration
5. Follow the prompts to connect your Stripe account

### 2. Update .replit Configuration

Add stripe to the integrations list in `.replit`:
```toml
[agent]
integrations = ["...", "stripe:2.0.0"]
```

### 3. Restore Server Code

Add these imports back to `server/index.ts`:
```typescript
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
```

Add the Stripe initialization function:
```typescript
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl, schema: 'stripe' });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();
    
    // Setup webhook
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    
    // Sync data
    stripeSync.syncBackfill();
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

await initStripe();
```

Add the webhook handler route before `app.use(express.json(...))`:
```typescript
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);
```

### 4. Restore API Routes

Add the Stripe routes back to `server/routes.ts`. See the backup files for the full implementation.

### 5. Seed Products

Run the seed script to create products in Stripe:
```bash
npx tsx server/seed-stripe-products.ts
```

### 6. Publish

After connecting Stripe in the Replit integration panel, you can publish and Replit will handle the webhook configuration automatically.

## Pricing Tiers (for reference)

| Tier | Monthly | Annual |
|------|---------|--------|
| Starter | $49/mo | $499/yr |
| Professional | $149/mo | $1,499/yr |
| Enterprise | $399/mo | $3,999/yr |
| Government | Custom | Contact Us |

## API Routes Reference

- `GET /api/stripe/publishable-key` - Get publishable key
- `GET /api/stripe/products` - List products with prices
- `GET /api/stripe/prices` - List all prices
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create customer portal session
- `GET /api/stripe/subscription/:tenantId` - Get subscription status
- `POST /api/stripe/webhook` - Webhook handler

## Notes

- Yoco remains available for South African (ZAR) payments
- The pricing page should detect region and show appropriate payment options
- Stripe is for international customers, Yoco for South Africa
