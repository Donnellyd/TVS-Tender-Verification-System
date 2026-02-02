import { storage } from './storage';
import { checkAndUpdateDomainVerification } from './sendgrid-domain-service';

const VERIFICATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let isRunning = false;

async function runVerificationChecks(): Promise<void> {
  try {
    const pendingDomains = await storage.getPendingDomainVerifications();
    
    if (pendingDomains.length === 0) {
      return;
    }

    console.log(`[DomainVerification] Checking ${pendingDomains.length} pending domain(s)...`);

    for (const settings of pendingDomains) {
      try {
        const result = await checkAndUpdateDomainVerification(settings.tenantId);
        
        if (result.verified) {
          console.log(`[DomainVerification] Domain verified for tenant ${settings.tenantId}`);
        } else if (result.status === 'failed') {
          console.log(`[DomainVerification] Domain verification failed for tenant ${settings.tenantId} after max attempts`);
        }
      } catch (error) {
        console.error(`[DomainVerification] Error checking domain for tenant ${settings.tenantId}:`, error);
      }
    }
  } catch (error) {
    console.error('[DomainVerification] Error in verification job:', error);
  }
}

export function startDomainVerificationJob(): void {
  if (isRunning) {
    console.log('[DomainVerification] Job already running');
    return;
  }

  isRunning = true;
  console.log('[DomainVerification] Starting background verification job');

  setInterval(async () => {
    await runVerificationChecks();
  }, VERIFICATION_INTERVAL_MS);

  runVerificationChecks();
}

export function stopDomainVerificationJob(): void {
  isRunning = false;
  console.log('[DomainVerification] Job stopped');
}
