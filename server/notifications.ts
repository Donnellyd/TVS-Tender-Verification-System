import Twilio from "twilio";
import { storage } from "./storage";
import type { NotificationTrigger, Vendor, Tender } from "@shared/schema";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient: Twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = Twilio(accountSid, authToken);
  console.log("Twilio client initialized for WhatsApp notifications");
} else {
  console.warn("Twilio credentials not configured - WhatsApp notifications disabled");
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
    message = message.replace(/\[VendorName\]/g, context.vendor.companyName || "");
  }
  
  if (context.tender) {
    message = message.replace(/\[TenderNo\]/g, context.tender.tenderNumber || "");
    message = message.replace(/\[TenderTitle\]/g, context.tender.title || "");
    message = message.replace(/\[ClosingDate\]/g, context.tender.closingDate ? new Date(context.tender.closingDate).toLocaleDateString("en-ZA") : "");
    message = message.replace(/\[Status\]/g, context.tender.status || "");
  }
  
  if (context.municipality) {
    message = message.replace(/\[Municipality\]/g, context.municipality.name || "");
    message = message.replace(/\[ContactPhone\]/g, context.municipality.contactPhone || "");
  }
  
  if (context.amount) {
    message = message.replace(/\[Amount\]/g, context.amount);
  }
  
  if (context.customData) {
    for (const [key, value] of Object.entries(context.customData)) {
      message = message.replace(new RegExp(`\\[${key}\\]`, "g"), value);
    }
  }
  
  return message;
}

export async function sendWhatsAppNotification(
  trigger: NotificationTrigger,
  vendorId: string,
  context: NotificationContext
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!twilioClient) {
    return { success: false, error: "Twilio client not configured" };
  }

  if (!twilioWhatsAppNumber) {
    return { success: false, error: "Twilio WhatsApp number not configured" };
  }

  try {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    if (!vendor.whatsappOptIn || !vendor.whatsappPhone) {
      return { success: false, error: "Vendor has not opted in for WhatsApp notifications or no phone number provided" };
    }

    const templates = await storage.getWhatsappTemplates();
    const template = templates.find(t => t.trigger === trigger && t.isActive);
    
    if (!template) {
      return { success: false, error: `No active template found for trigger: ${trigger}` };
    }

    context.vendor = vendor;
    const messageBody = replacePlaceholders(template.body, context);

    const fromNumber = twilioWhatsAppNumber.startsWith("whatsapp:")
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;

    const toNumber = vendor.whatsappPhone.startsWith("whatsapp:")
      ? vendor.whatsappPhone
      : `whatsapp:${vendor.whatsappPhone}`;

    const message = await twilioClient.messages.create({
      body: messageBody,
      from: fromNumber,
      to: toNumber,
    });

    await storage.createNotificationLog({
      vendorId,
      tenderId: context.tender?.id || null,
      trigger,
      channel: "whatsapp",
      body: messageBody,
      deliveryStatus: "sent",
      externalId: message.sid,
      recipientPhone: toNumber,
    });

    console.log(`WhatsApp notification sent: ${message.sid}`);
    return { success: true, messageId: message.sid };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send WhatsApp notification:`, error);

    await storage.createNotificationLog({
      vendorId,
      tenderId: context.tender?.id || null,
      trigger,
      channel: "whatsapp",
      body: `Failed to send notification for trigger: ${trigger}`,
      deliveryStatus: "failed",
      errorMessage,
      recipientPhone: context.vendor?.whatsappPhone || undefined,
    });

    return { success: false, error: errorMessage };
  }
}

export async function sendBulkWhatsAppNotification(
  trigger: NotificationTrigger,
  vendorIds: string[],
  context: Omit<NotificationContext, "vendor">
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const vendorId of vendorIds) {
    const result = await sendWhatsAppNotification(trigger, vendorId, context);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push(`Vendor ${vendorId}: ${result.error}`);
      }
    }
  }

  return results;
}

export async function notifyTenderStatusChange(
  tenderId: string,
  newStatus: string,
  affectedVendorIds?: string[]
): Promise<void> {
  const tender = await storage.getTender(tenderId);
  if (!tender) {
    console.error(`Tender ${tenderId} not found for notification`);
    return;
  }

  let municipality;
  if (tender.municipalityId) {
    municipality = await storage.getMunicipality(tender.municipalityId);
  }

  const triggerMap: Record<string, NotificationTrigger> = {
    published: "tender_published",
    closing_soon: "tender_closing_soon",
    closed: "tender_closed",
    under_evaluation: "under_evaluation",
    clarification_requested: "clarification_requested",
    shortlisted: "shortlisted",
    standstill_period: "standstill_period",
    awarded: "awarded",
    unsuccessful: "unsuccessful",
    cancelled: "tender_cancelled",
  };

  const trigger = triggerMap[newStatus];
  if (!trigger) {
    console.log(`No notification trigger for status: ${newStatus}`);
    return;
  }

  const context: NotificationContext = {
    tender,
    municipality: municipality ? { name: municipality.name, contactPhone: municipality.contactPhone } : undefined,
  };

  let vendorIdsToNotify = affectedVendorIds;
  
  if (!vendorIdsToNotify || vendorIdsToNotify.length === 0) {
    const submissions = await storage.getBidSubmissions(tenderId);
    const uniqueVendorIds = new Set(submissions.map(s => s.vendorId).filter((id): id is string => id !== null));
    vendorIdsToNotify = Array.from(uniqueVendorIds);
  }

  if (vendorIdsToNotify.length > 0) {
    const result = await sendBulkWhatsAppNotification(trigger, vendorIdsToNotify, context);
    console.log(`Tender ${tenderId} status change notifications: ${result.sent} sent, ${result.failed} failed`);
  } else {
    console.log(`No vendors to notify for tender ${tenderId} status change to ${newStatus}`);
  }
}

export async function testWhatsAppConnection(): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient) {
    return { success: false, error: "Twilio client not configured" };
  }

  try {
    const account = await twilioClient.api.accounts(accountSid!).fetch();
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
