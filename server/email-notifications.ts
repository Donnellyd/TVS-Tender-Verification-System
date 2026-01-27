// SendGrid Email Notification Service
// Uses Replit's SendGrid connector for authentication

import sgMail from '@sendgrid/mail';
import { storage } from './storage';

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export interface EmailContext {
  tender?: {
    tenderNumber?: string;
    title?: string;
    closingDate?: Date | string;
    estimatedValue?: number;
  };
  vendor?: {
    name?: string;
    email?: string;
  };
  municipality?: {
    name?: string;
    contactPhone?: string;
  };
  amount?: number;
  status?: string;
  senderName?: string;
  senderPosition?: string;
  senderOrganisation?: string;
  senderContactDetails?: string;
}

// Email template placeholders: [TenderNo], [TenderTitle], [BidderName], [Date], [Amount], [YourName], [Position], [Organisation], [ContactDetails]
function replacePlaceholders(template: string, context: EmailContext): string {
  let result = template;
  
  // Tender placeholders
  if (context.tender) {
    result = result.replace(/\[TenderNo\]/g, context.tender.tenderNumber || '');
    result = result.replace(/\[TenderTitle\]/g, context.tender.title || '');
    if (context.tender.closingDate) {
      const date = new Date(context.tender.closingDate);
      result = result.replace(/\[Date\]/g, date.toLocaleDateString('en-ZA'));
    }
  }
  
  // Vendor/Bidder placeholders
  if (context.vendor) {
    result = result.replace(/\[BidderName\]/g, context.vendor.name || '');
  }
  
  // Amount placeholder
  if (context.amount !== undefined) {
    result = result.replace(/\[Amount\]/g, `R${context.amount.toLocaleString('en-ZA')}`);
  } else if (context.tender?.estimatedValue) {
    result = result.replace(/\[Amount\]/g, `R${context.tender.estimatedValue.toLocaleString('en-ZA')}`);
  }
  
  // Sender placeholders
  result = result.replace(/\[YourName\]/g, context.senderName || '');
  result = result.replace(/\[Position\]/g, context.senderPosition || '');
  result = result.replace(/\[Organisation\]/g, context.senderOrganisation || context.municipality?.name || '');
  result = result.replace(/\[ContactDetails\]/g, context.senderContactDetails || context.municipality?.contactPhone || '');
  
  return result;
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const msg = {
      to,
      from: fromEmail,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      html: htmlContent,
    };
    
    const response = await client.send(msg);
    
    return {
      success: true,
      messageId: response[0]?.headers?.['x-message-id']
    };
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

export async function sendTemplatedEmail(
  templateId: string,
  vendorId: string,
  context: EmailContext,
  trigger: string = 'tender_published'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get the template
    const template = await storage.getLetterTemplate(templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    
    // Get the vendor
    const vendor = await storage.getVendor(vendorId);
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    if (!vendor.contactEmail) {
      return { success: false, error: 'Vendor has no email address' };
    }
    
    // Build context with vendor info
    const fullContext: EmailContext = {
      ...context,
      vendor: {
        name: vendor.companyName,
        email: vendor.contactEmail,
        ...context.vendor
      }
    };
    
    // Replace placeholders in subject and content
    const subject = replacePlaceholders(template.subject, fullContext);
    const htmlContent = replacePlaceholders(template.bodyTemplate, fullContext);
    
    // Send the email
    const result = await sendEmail(vendor.contactEmail, subject, htmlContent);
    
    // Log the notification using the correct schema
    const logData: any = {
      vendorId: vendor.id,
      channel: 'email' as const,
      trigger: trigger as any,
      body: htmlContent.substring(0, 1000),
      deliveryStatus: result.success ? 'sent' : 'failed',
      externalId: result.messageId || undefined,
      errorMessage: result.error || undefined,
    };
    
    await storage.createNotificationLog(logData);
    
    return result;
  } catch (error: any) {
    console.error('Error sending templated email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export async function sendBulkTemplatedEmail(
  templateId: string,
  vendorIds: string[],
  context: EmailContext
): Promise<{ sent: number; failed: number; results: Array<{ vendorId: string; success: boolean; error?: string }> }> {
  const results: Array<{ vendorId: string; success: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;
  
  for (const vendorId of vendorIds) {
    const result = await sendTemplatedEmail(templateId, vendorId, context);
    results.push({
      vendorId,
      success: result.success,
      error: result.error
    });
    
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }
  
  return { sent, failed, results };
}

export async function testSendGridConnection(): Promise<{ success: boolean; error?: string; fromEmail?: string }> {
  try {
    const credentials = await getCredentials();
    return { success: true, fromEmail: credentials.email };
  } catch (error: any) {
    return { success: false, error: error.message || 'SendGrid connection failed' };
  }
}
