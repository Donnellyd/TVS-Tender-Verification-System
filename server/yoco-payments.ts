import crypto from 'crypto';

const YOCO_API_BASE = 'https://payments.yoco.com/api';

interface YocoCheckoutRequest {
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  metadata?: Record<string, string>;
}

interface YocoCheckoutResponse {
  id: string;
  redirectUrl: string;
  status: string;
}

interface YocoWebhookPayload {
  type: string;
  payload: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: Record<string, string>;
  };
}

export class YocoPaymentService {
  private secretKey: string;

  constructor() {
    const key = process.env.YOCO_SECRET_KEY;
    if (!key) {
      throw new Error('YOCO_SECRET_KEY environment variable is required');
    }
    this.secretKey = key;
  }

  async createCheckout(request: YocoCheckoutRequest): Promise<YocoCheckoutResponse> {
    const response = await fetch(`${YOCO_API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency || 'ZAR',
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        failureUrl: request.failureUrl,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Yoco API error:', errorData);
      throw new Error(`Yoco checkout creation failed: ${response.status}`);
    }

    return response.json();
  }

  verifyWebhookSignature(
    payload: string,
    webhookId: string,
    webhookTimestamp: string,
    webhookSignature: string,
    webhookSecret: string
  ): boolean {
    const timestamp = parseInt(webhookTimestamp);
    const now = Math.floor(Date.now() / 1000);
    
    if (Math.abs(now - timestamp) > 300) {
      console.warn('Yoco webhook timestamp expired');
      return false;
    }

    const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedContent)
      .digest('base64');

    const signatures = webhookSignature.split(' ').map(s => s.replace('v1,', ''));
    return signatures.includes(expectedSignature);
  }

  parseWebhookEvent(body: any): YocoWebhookPayload {
    return body as YocoWebhookPayload;
  }
}

let yocoServiceInstance: YocoPaymentService | null = null;

export function getYocoPaymentService(): YocoPaymentService | null {
  if (!process.env.YOCO_SECRET_KEY) {
    return null;
  }
  
  if (!yocoServiceInstance) {
    yocoServiceInstance = new YocoPaymentService();
  }
  
  return yocoServiceInstance;
}

export function isYocoConfigured(): boolean {
  return !!process.env.YOCO_SECRET_KEY;
}
