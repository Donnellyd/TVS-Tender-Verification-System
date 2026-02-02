import { storage } from './storage';
import { 
  tenantEmailSettings, 
  domainAuthenticationLogs,
  type InsertTenantEmailSettings,
  type InsertDomainAuthenticationLog,
  type TenantEmailSettings
} from '@shared/models/tenant';

interface SendGridCredentials {
  apiKey: string;
  email: string;
}

interface DnsRecord {
  host: string;
  type: string;
  data: string;
  valid: boolean;
}

interface DomainAuthResponse {
  id: number;
  domain: string;
  subdomain: string;
  valid: boolean;
  dns: {
    mail_cname?: { host: string; data: string; valid: boolean };
    dkim1?: { host: string; data: string; valid: boolean };
    dkim2?: { host: string; data: string; valid: boolean };
  };
}

interface ValidationResponse {
  id: number;
  valid: boolean;
  validation_results?: {
    mail_cname?: { valid: boolean };
    dkim1?: { valid: boolean };
    dkim2?: { valid: boolean };
  };
}

async function getSendGridCredentials(): Promise<SendGridCredentials> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Replit token not found');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('SendGrid not connected');
  }

  return { 
    apiKey: connectionSettings.settings.api_key, 
    email: connectionSettings.settings.from_email || 'veritasai@zd-solutions.com'
  };
}

async function callSendGridAPI(
  endpoint: string, 
  method: string = 'GET', 
  body?: object
): Promise<any> {
  const { apiKey } = await getSendGridCredentials();
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`https://api.sendgrid.com/v3${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export async function authenticateDomain(
  tenantId: string, 
  domain: string
): Promise<{ success: boolean; dnsRecords?: DnsRecord[]; domainId?: string; error?: string }> {
  try {
    const response = await callSendGridAPI('/whitelabel/domains', 'POST', {
      domain: domain,
      subdomain: 'mail',
      automatic_security: false,
      custom_spf: true,
      default: false
    }) as DomainAuthResponse;
    
    const dnsRecords: DnsRecord[] = [];
    
    if (response.dns.mail_cname) {
      dnsRecords.push({
        host: response.dns.mail_cname.host,
        type: 'CNAME',
        data: response.dns.mail_cname.data,
        valid: response.dns.mail_cname.valid
      });
    }
    
    if (response.dns.dkim1) {
      dnsRecords.push({
        host: response.dns.dkim1.host,
        type: 'CNAME',
        data: response.dns.dkim1.data,
        valid: response.dns.dkim1.valid
      });
    }
    
    if (response.dns.dkim2) {
      dnsRecords.push({
        host: response.dns.dkim2.host,
        type: 'CNAME',
        data: response.dns.dkim2.data,
        valid: response.dns.dkim2.valid
      });
    }
    
    await logDomainAction(tenantId, domain, 'authenticate', 'success', response);
    
    return {
      success: true,
      dnsRecords,
      domainId: String(response.id)
    };
  } catch (error: any) {
    await logDomainAction(tenantId, domain, 'authenticate', 'error', null, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function validateDomain(
  tenantId: string,
  domainId: string,
  domain: string
): Promise<{ valid: boolean; results?: any; error?: string }> {
  try {
    const response = await callSendGridAPI(
      `/whitelabel/domains/${domainId}/validate`, 
      'POST'
    ) as ValidationResponse;
    
    await logDomainAction(tenantId, domain, 'validate', response.valid ? 'success' : 'pending', response);
    
    return {
      valid: response.valid,
      results: response.validation_results
    };
  } catch (error: any) {
    await logDomainAction(tenantId, domain, 'validate', 'error', null, error.message);
    return {
      valid: false,
      error: error.message
    };
  }
}

export async function getDomainStatus(domainId: string): Promise<DomainAuthResponse | null> {
  try {
    const response = await callSendGridAPI(`/whitelabel/domains/${domainId}`);
    return response as DomainAuthResponse;
  } catch (error) {
    console.error('Error getting domain status:', error);
    return null;
  }
}

export async function deleteDomainAuthentication(domainId: string): Promise<boolean> {
  try {
    await callSendGridAPI(`/whitelabel/domains/${domainId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting domain:', error);
    return false;
  }
}

async function logDomainAction(
  tenantId: string,
  domain: string,
  action: string,
  status: string,
  sendgridResponse?: any,
  errorMessage?: string
): Promise<void> {
  try {
    await storage.createDomainAuthLog({
      tenantId,
      domain,
      action,
      status,
      sendgridResponse: sendgridResponse || {},
      errorMessage
    });
  } catch (error) {
    console.error('Error logging domain action:', error);
  }
}

export async function initializeTenantEmailSettings(
  tenantId: string,
  configType: 'default' | 'custom' = 'default',
  customConfig?: {
    domain?: string;
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
  }
): Promise<TenantEmailSettings> {
  const existingSettings = await storage.getTenantEmailSettings(tenantId);
  
  if (existingSettings) {
    return existingSettings;
  }
  
  const settings: InsertTenantEmailSettings = {
    tenantId,
    emailConfigType: configType,
    defaultFromEmail: 'veritasai@zd-solutions.com',
    defaultFromName: 'VeritasAI',
  };
  
  if (configType === 'custom' && customConfig) {
    settings.customDomain = customConfig.domain;
    settings.customFromEmail = customConfig.fromEmail;
    settings.customFromName = customConfig.fromName;
    settings.customReplyTo = customConfig.replyTo;
    settings.domainVerificationStatus = 'pending';
  }
  
  return await storage.createTenantEmailSettings(settings);
}

export async function setupCustomDomain(
  tenantId: string,
  domain: string,
  fromEmail: string,
  fromName: string,
  replyTo?: string
): Promise<{ success: boolean; dnsRecords?: DnsRecord[]; error?: string }> {
  const authResult = await authenticateDomain(tenantId, domain);
  
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }
  
  await storage.updateTenantEmailSettings(tenantId, {
    emailConfigType: 'custom',
    customDomain: domain,
    customFromEmail: fromEmail,
    customFromName: fromName,
    customReplyTo: replyTo,
    sendgridDomainId: authResult.domainId,
    domainVerificationStatus: 'pending',
    dnsRecords: authResult.dnsRecords,
    verificationAttempts: 0
  });
  
  return {
    success: true,
    dnsRecords: authResult.dnsRecords
  };
}

export async function checkAndUpdateDomainVerification(
  tenantId: string
): Promise<{ verified: boolean; status: string }> {
  const settings = await storage.getTenantEmailSettings(tenantId);
  
  if (!settings || !settings.sendgridDomainId) {
    return { verified: false, status: 'not_configured' };
  }
  
  const result = await validateDomain(
    tenantId, 
    settings.sendgridDomainId, 
    settings.customDomain || ''
  );
  
  const newStatus: 'verified' | 'pending' | 'failed' = result.valid ? 'verified' : 'pending';
  const attempts = (settings.verificationAttempts || 0) + 1;
  
  let finalStatus: 'verified' | 'pending' | 'failed' = newStatus;
  if (!result.valid && attempts >= 10) {
    finalStatus = 'failed';
  }
  
  await storage.updateTenantEmailSettings(tenantId, {
    domainVerificationStatus: finalStatus,
    lastVerificationCheck: new Date(),
    verificationAttempts: attempts,
    setupCompletedAt: result.valid ? new Date() : undefined
  });
  
  return { verified: result.valid, status: finalStatus };
}

export async function switchToDefaultEmail(tenantId: string): Promise<void> {
  const settings = await storage.getTenantEmailSettings(tenantId);
  
  if (settings?.sendgridDomainId) {
    await deleteDomainAuthentication(settings.sendgridDomainId);
  }
  
  await storage.updateTenantEmailSettings(tenantId, {
    emailConfigType: 'default',
    customDomain: undefined,
    customFromEmail: undefined,
    customFromName: undefined,
    customReplyTo: undefined,
    sendgridDomainId: undefined,
    domainVerificationStatus: undefined,
    dnsRecords: {}
  });
}

export async function getEffectiveSenderInfo(tenantId: string): Promise<{
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  isCustomDomain: boolean;
  isVerified: boolean;
}> {
  const settings = await storage.getTenantEmailSettings(tenantId);
  
  if (!settings || settings.emailConfigType === 'default') {
    return {
      fromEmail: 'veritasai@zd-solutions.com',
      fromName: 'VeritasAI',
      isCustomDomain: false,
      isVerified: true
    };
  }
  
  const isVerified = settings.domainVerificationStatus === 'verified';
  
  if (isVerified && settings.customFromEmail) {
    return {
      fromEmail: settings.customFromEmail,
      fromName: settings.customFromName || 'VeritasAI',
      replyTo: settings.customReplyTo || undefined,
      isCustomDomain: true,
      isVerified: true
    };
  }
  
  return {
    fromEmail: 'veritasai@zd-solutions.com',
    fromName: 'VeritasAI',
    isCustomDomain: false,
    isVerified: true
  };
}
