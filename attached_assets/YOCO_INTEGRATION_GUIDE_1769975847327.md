# Yoco Payment Integration Guide

This guide provides the complete code and instructions for integrating Yoco payments into a new Replit application.

## Prerequisites

1. **Yoco Account**: Sign up at [yoco.com](https://www.yoco.com)
2. **API Keys**: Get your secret key from the Yoco Dashboard
3. **PostgreSQL Database**: Required for storing orders and payment status
4. **Express.js Backend**: Server framework for handling API routes

## Environment Variables

Add these to your Replit Secrets:

```
YOCO_SECRET_KEY=sk_live_xxxxx        # Your Yoco secret key
YOCO_WEBHOOK_SECRET=whsec_xxxxx      # Optional: For webhook verification
```

## Database Schema (Drizzle ORM)

Add these tables to your `shared/schema.ts`:

```typescript
import { pgTable, text, integer, timestamp, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Orders table - stores order information and payment status
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingPostalCode: text("shipping_postal_code").notNull(),
  items: jsonb("items").notNull(), // Array of order items
  subtotal: integer("subtotal").notNull(), // In cents
  shippingCost: integer("shipping_cost").notNull().default(0),
  total: integer("total").notNull(), // In cents (ZAR)
  status: text("status").notNull().default("pending"), // pending, confirmed, shipped, delivered, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  paymentReference: text("payment_reference"), // Yoco payment ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order item type for JSON storage
export const orderItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  size: z.string(),
  quantity: z.number(),
  price: z.number(), // Unit price in cents
});
export type OrderItem = z.infer<typeof orderItemSchema>;
```

## Storage Interface

Add these methods to your `server/storage.ts`:

```typescript
import { eq } from "drizzle-orm";
import { db } from "./db";
import { orders, type Order, type InsertOrder } from "@shared/schema";

export interface IStorage {
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updatePaymentStatus(id: number, paymentStatus: string, paymentReference?: string): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updatePaymentStatus(id: number, paymentStatus: string, paymentReference?: string): Promise<Order | undefined> {
    const updateData: { paymentStatus: string; paymentReference?: string } = { paymentStatus };
    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }
    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
```

## Backend API Routes

Add these routes to your `server/routes.ts`:

```typescript
import type { Express } from "express";
import { storage } from "./storage";
import crypto from "crypto";

export function registerPaymentRoutes(app: Express) {
  
  // Create Yoco checkout session
  app.post("/api/payment/create-checkout", async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ error: "Order already paid" });
      }
      
      const yocoSecretKey = process.env.YOCO_SECRET_KEY;
      if (!yocoSecretKey) {
        return res.status(500).json({ error: "Payment gateway not configured" });
      }
      
      // Build base URL for redirects
      // For production, use your custom domain
      const baseUrl = process.env.BASE_URL || 
        (process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : `http://localhost:5000`);
        
      // Create Yoco checkout session
      const response = await fetch('https://payments.yoco.com/api/checkouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${yocoSecretKey}`
        },
        body: JSON.stringify({
          amount: order.total, // Amount in cents (ZAR)
          currency: 'ZAR',
          successUrl: `${baseUrl}/order-success?orderId=${orderId}`,
          cancelUrl: `${baseUrl}/checkout?cancelled=true`,
          failureUrl: `${baseUrl}/checkout?failed=true`,
          metadata: {
            orderId: orderId.toString()
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Yoco API error:", errorData);
        return res.status(500).json({ error: "Failed to create payment session" });
      }
      
      const checkoutData = await response.json();
      res.json({ redirectUrl: checkoutData.redirectUrl, checkoutId: checkoutData.id });
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Yoco webhook handler - receives payment confirmations
  app.post("/api/webhooks/yoco", async (req, res) => {
    try {
      const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
      
      // Verify webhook signature (recommended for production)
      if (webhookSecret) {
        const webhookId = req.headers['webhook-id'] as string;
        const webhookTimestamp = req.headers['webhook-timestamp'] as string;
        const webhookSignature = req.headers['webhook-signature'] as string;
        
        if (!webhookId || !webhookTimestamp || !webhookSignature) {
          return res.status(401).json({ error: "Missing webhook headers" });
        }
        
        // Verify timestamp is recent (within 5 minutes)
        const timestamp = parseInt(webhookTimestamp);
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > 300) {
          return res.status(401).json({ error: "Webhook timestamp expired" });
        }
        
        // Verify signature
        const signedContent = `${webhookId}.${webhookTimestamp}.${JSON.stringify(req.body)}`;
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(signedContent)
          .digest('base64');
        
        const signatures = webhookSignature.split(' ').map(s => s.replace('v1,', ''));
        if (!signatures.includes(expectedSignature)) {
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      }
      
      const event = req.body;
      
      // Handle successful payment
      if (event.type === 'payment.succeeded') {
        const orderId = event.payload?.metadata?.orderId;
        const paymentAmount = event.payload?.amount;
        
        if (!orderId) {
          console.warn("Payment webhook missing orderId in metadata");
          return res.status(400).json({ error: "Missing order reference" });
        }
        
        const order = await storage.getOrder(parseInt(orderId));
        if (!order) {
          console.warn(`Payment webhook for unknown order: ${orderId}`);
          return res.status(400).json({ error: "Order not found" });
        }
        
        // Idempotency check - don't process twice
        if (order.paymentStatus === 'paid') {
          return res.status(200).json({ received: true, status: 'already_processed' });
        }
        
        // Verify amount matches (with 1 cent tolerance)
        if (paymentAmount && Math.abs(paymentAmount - order.total) > 1) {
          console.warn(`Payment amount mismatch for order ${orderId}`);
          return res.status(400).json({ error: "Amount mismatch" });
        }
        
        // Update order payment status
        await storage.updatePaymentStatus(
          parseInt(orderId), 
          'paid', 
          event.payload?.id
        );
        await storage.updateOrderStatus(parseInt(orderId), 'confirmed');
        
        return res.status(200).json({ received: true });
      }
      
      // Acknowledge other event types
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
```

## Frontend Checkout Flow

Create `client/src/pages/checkout.tsx`:

```typescript
import { useState } from "react";
import { useLocation } from "wouter";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Step 1: Create the order
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: cartItems, // Your cart items array
        }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create order");
      }

      const order = await orderRes.json();

      // Step 2: Create Yoco payment session
      const paymentRes = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        // Redirect to Yoco hosted payment page
        window.location.href = paymentData.redirectUrl;
      } else {
        // Fallback: Show order confirmation for manual payment
        setLocation(`/order-success?orderId=${order.id}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields here */}
      <button type="submit" disabled={submitting}>
        {submitting ? "Processing..." : "Place Order"}
      </button>
    </form>
  );
}
```

## Order Success Page

Create `client/src/pages/order-success.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useSearch } from "wouter";

export default function OrderSuccess() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const orderId = params.get("orderId");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(setOrder);
    }
  }, [orderId]);

  return (
    <div>
      <h1>Order Confirmed!</h1>
      <p>Order #{orderId}</p>
      {order?.paymentStatus === 'paid' && (
        <p>Payment received - Thank you!</p>
      )}
    </div>
  );
}
```

## Registering Routes

In your main server file (`server/index.ts` or `server/routes.ts`), register the payment routes:

```typescript
import express from "express";
import { registerPaymentRoutes } from "./paymentRoutes"; // Your payment routes file

const app = express();
app.use(express.json());

// ... session and other middleware ...

// Register payment routes
registerPaymentRoutes(app);

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
```

## Production Considerations

### 1. Set BASE_URL for Production
In your production environment, set the `BASE_URL` environment variable to your custom domain:
```
BASE_URL=https://yourdomain.com
```

### 2. Configure Webhook URL in Yoco Dashboard
Add your webhook URL in the Yoco Dashboard:
```
https://yourdomain.com/api/webhooks/yoco
```

### 3. Use Webhook Secrets
Always verify webhook signatures in production by setting `YOCO_WEBHOOK_SECRET`.

## Testing

1. Use Yoco's test API keys for development
2. Test card number: `4111 1111 1111 1111`
3. Any future expiry date and any 3-digit CVV

## API Reference

### POST /api/payment/create-checkout
Creates a Yoco checkout session and returns a redirect URL.

**Request:**
```json
{
  "orderId": 123
}
```

**Response:**
```json
{
  "redirectUrl": "https://payments.yoco.com/...",
  "checkoutId": "ch_xxxxx"
}
```

### POST /api/webhooks/yoco
Receives payment events from Yoco. Automatically updates order status.
