import twilio from 'twilio';
import crypto from 'crypto';
import { storage } from './storage';
import type { NotificationTrigger, Vendor, Tender } from '@shared/schema';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, { accountSid });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendWhatsAppOTP(
  phone: string
): Promise<{ success: boolean; otpCode?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    const otpCode = crypto.randomInt(100000, 999999).toString();

    const from = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

    await client.messages.create({
      body: `Your VeritasAI Vendor Portal verification code is: ${otpCode}. This code expires in 5 minutes. Do not share this code with anyone.`,
      from,
      to,
    });

    return { success: true, otpCode };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send WhatsApp OTP:', error);
    return { success: false, error: errorMessage };
  }
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    const from = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const message = await client.messages.create({
      body,
      from,
      to: toNumber,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send WhatsApp message:', error);
    return { success: false, error: errorMessage };
  }
}

interface NotificationContext {
  vendor?: Vendor;
  tender?: Tender;
  municipality?: { name: string; contactPhone?: string | null };
  amount?: string;
  customData?: Record<string, string>;
}

function replacePlaceholders(template: string, context: NotificationContext): string {
  let message = template;

  if (context.vendor) {
    message = message.replace(/\[VendorName\]/g, context.vendor.companyName || '');
  }

  if (context.tender) {
    message = message.replace(/\[TenderNo\]/g, context.tender.tenderNumber || '');
    message = message.replace(/\[TenderTitle\]/g, context.tender.title || '');
    message = message.replace(/\[ClosingDate\]/g, context.tender.closingDate ? new Date(context.tender.closingDate).toLocaleDateString('en-ZA') : '');
    message = message.replace(/\[Status\]/g, context.tender.status || '');
  }

  if (context.municipality) {
    message = message.replace(/\[Municipality\]/g, context.municipality.name || '');
    message = message.replace(/\[ContactPhone\]/g, context.municipality.contactPhone || '');
  }

  if (context.amount) {
    message = message.replace(/\[Amount\]/g, context.amount);
  }

  if (context.customData) {
    for (const [key, value] of Object.entries(context.customData)) {
      message = message.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    }
  }

  return message;
}

export async function sendProcurementNotification(
  vendorId: string,
  trigger: string,
  context: NotificationContext
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }

    if (!vendor.whatsappOptIn || !vendor.whatsappPhone) {
      return { success: false, error: 'Vendor has not opted in for WhatsApp notifications or no phone number provided' };
    }

    const templates = await storage.getWhatsappTemplates();
    const template = templates.find(t => t.trigger === trigger && t.isActive);

    if (!template) {
      return { success: false, error: `No active template found for trigger: ${trigger}` };
    }

    context.vendor = vendor;
    const messageBody = replacePlaceholders(template.body, context);

    const result = await sendWhatsAppMessage(vendor.whatsappPhone, messageBody);

    await storage.createNotificationLog({
      vendorId,
      tenderId: context.tender?.id || null,
      trigger: trigger as NotificationTrigger,
      channel: 'whatsapp',
      body: messageBody,
      deliveryStatus: result.success ? 'sent' : 'failed',
      externalId: result.messageId || undefined,
      recipientPhone: vendor.whatsappPhone,
      errorMessage: result.error || undefined,
    });

    if (result.success) {
      console.log(`WhatsApp procurement notification sent: ${result.messageId}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send procurement notification:', error);
    return { success: false, error: errorMessage };
  }
}
