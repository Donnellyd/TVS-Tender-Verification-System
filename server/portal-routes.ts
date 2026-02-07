import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from './storage';
import { sendWhatsAppOTP, sendWhatsAppMessage } from './twilio-whatsapp';
import { z } from 'zod';
import type { Vendor } from '@shared/schema';

export const portalRouter = Router();

declare global {
  namespace Express {
    interface Request {
      portalVendor?: Vendor;
    }
  }
}

async function portalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const vendor = await storage.getVendorByPortalToken(token);

  if (!vendor) {
    return res.status(401).json({ error: 'Invalid portal token' });
  }

  if (vendor.portalTokenExpiry && new Date(vendor.portalTokenExpiry) < new Date()) {
    return res.status(401).json({ error: 'Portal token expired' });
  }

  req.portalVendor = vendor;
  next();
}

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  whatsappPhone: z.string().min(10, 'WhatsApp phone number is required'),
  country: z.string().default('ZA'),
});

portalRouter.post('/api/portal/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingByPhone = await storage.getVendorByPhone(data.whatsappPhone);
    if (existingByPhone) {
      return res.status(400).json({ error: 'A vendor with this phone number already exists' });
    }

    const existingByEmail = await storage.getVendorByEmail(data.contactEmail);
    if (existingByEmail) {
      return res.status(400).json({ error: 'A vendor with this email already exists' });
    }

    const vendor = await storage.createVendor({
      companyName: data.companyName,
      registrationNumber: data.registrationNumber,
      contactPerson: data.contactPerson,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      whatsappPhone: data.whatsappPhone,
      country: data.country,
      whatsappOptIn: true,
      status: 'pending',
    });

    await storage.updateVendorPortalAuth(vendor.id, {
      portalRegistered: true,
    });

    res.status(201).json({
      message: 'Vendor registered successfully. Please verify your WhatsApp number.',
      vendorId: vendor.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Portal registration error:', error);
    res.status(500).json({ error: 'Failed to register vendor' });
  }
});

portalRouter.post('/api/portal/send-otp', async (req: Request, res: Response) => {
  try {
    const { whatsappPhone } = req.body;
    if (!whatsappPhone) {
      return res.status(400).json({ error: 'WhatsApp phone number is required' });
    }

    const vendor = await storage.getVendorByPhone(whatsappPhone);
    if (!vendor) {
      return res.status(404).json({ error: 'No vendor found with this phone number' });
    }

    const otpResult = await sendWhatsAppOTP(whatsappPhone);
    if (!otpResult.success) {
      return res.status(500).json({ error: otpResult.error || 'Failed to send OTP' });
    }

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await storage.updateVendorPortalAuth(vendor.id, {
      otpCode: otpResult.otpCode!,
      otpExpiresAt,
    });

    res.json({ message: 'OTP sent to your WhatsApp number' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

portalRouter.post('/api/portal/verify-otp', async (req: Request, res: Response) => {
  try {
    const { whatsappPhone, otpCode } = req.body;
    if (!whatsappPhone || !otpCode) {
      return res.status(400).json({ error: 'WhatsApp phone and OTP code are required' });
    }

    const vendor = await storage.getVendorByPhone(whatsappPhone);
    if (!vendor) {
      return res.status(404).json({ error: 'No vendor found with this phone number' });
    }

    if (!vendor.otpCode || vendor.otpCode !== otpCode) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    if (vendor.otpExpiresAt && new Date(vendor.otpExpiresAt) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const portalToken = crypto.randomUUID();
    const portalTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await storage.updateVendorPortalAuth(vendor.id, {
      otpCode: null,
      otpExpiresAt: null,
      portalToken,
      portalTokenExpiry,
      lastPortalLogin: new Date(),
      portalRegistered: true,
    });

    res.json({
      message: 'OTP verified successfully',
      portalToken,
      expiresAt: portalTokenExpiry.toISOString(),
      vendor: {
        id: vendor.id,
        companyName: vendor.companyName,
        contactEmail: vendor.contactEmail,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

portalRouter.post('/api/portal/login', async (req: Request, res: Response) => {
  try {
    const { whatsappPhone } = req.body;
    if (!whatsappPhone) {
      return res.status(400).json({ error: 'WhatsApp phone number is required' });
    }

    const vendor = await storage.getVendorByPhone(whatsappPhone);
    if (!vendor) {
      return res.status(404).json({ error: 'No vendor found with this phone number. Please register first.' });
    }

    const otpResult = await sendWhatsAppOTP(whatsappPhone);
    if (!otpResult.success) {
      return res.status(500).json({ error: otpResult.error || 'Failed to send OTP' });
    }

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await storage.updateVendorPortalAuth(vendor.id, {
      otpCode: otpResult.otpCode!,
      otpExpiresAt,
    });

    res.json({ message: 'OTP sent to your WhatsApp number. Please verify to complete login.' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to initiate login' });
  }
});

portalRouter.get('/api/portal/profile', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const unreadCount = await storage.getUnreadMessageCount(vendor.id);
    res.json({
      ...vendor,
      otpCode: undefined,
      otpExpiresAt: undefined,
      portalToken: undefined,
      portalTokenExpiry: undefined,
      unreadMessages: unreadCount,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

portalRouter.get('/api/portal/tenders', portalAuth, async (req: Request, res: Response) => {
  try {
    const country = req.query.country as string | undefined;
    const openTenders = await storage.getOpenTendersForPortal(country || req.portalVendor?.country || undefined);
    res.json(openTenders);
  } catch (error) {
    console.error('Get tenders error:', error);
    res.status(500).json({ error: 'Failed to fetch tenders' });
  }
});

portalRouter.get('/api/portal/tenders/:id', portalAuth, async (req: Request, res: Response) => {
  try {
    const tender = await storage.getTender(req.params.id);
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const requirements = await storage.getTenderRequirements(tender.id);
    const scoringCriteria = await storage.getTenderScoringCriteria(tender.id);

    res.json({
      ...tender,
      requirements,
      scoringCriteria,
    });
  } catch (error) {
    console.error('Get tender details error:', error);
    res.status(500).json({ error: 'Failed to fetch tender details' });
  }
});

const submissionSchema = z.object({
  tenderId: z.string().min(1, 'Tender ID is required'),
  bidAmount: z.number().optional(),
  currency: z.string().default('ZAR'),
  documents: z.array(z.object({
    documentName: z.string(),
    documentType: z.string(),
    filePath: z.string().optional(),
  })).optional(),
});

portalRouter.post('/api/portal/submissions', portalAuth, async (req: Request, res: Response) => {
  try {
    const data = submissionSchema.parse(req.body);
    const vendor = req.portalVendor!;

    const tender = await storage.getTender(data.tenderId);
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    if (tender.status !== 'open' && tender.status !== 'published') {
      return res.status(400).json({ error: 'This tender is not accepting submissions' });
    }

    const submission = await storage.createBidSubmission({
      tenderId: data.tenderId,
      vendorId: vendor.id,
      tenantId: tender.tenantId,
      bidAmount: data.bidAmount,
      currency: data.currency,
      status: 'submitted',
      submissionDate: new Date(),
    });

    if (data.documents && data.documents.length > 0) {
      for (const doc of data.documents) {
        await storage.createSubmissionDocument({
          submissionId: submission.id,
          documentName: doc.documentName,
          documentType: doc.documentType as any,
          filePath: doc.filePath,
        });
      }
    }

    res.status(201).json({
      message: 'Submission created successfully',
      submission,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

portalRouter.get('/api/portal/submissions', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const submissions = await storage.getVendorSubmissions(vendor.id);
    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

portalRouter.get('/api/portal/submissions/:id', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const submission = await storage.getBidSubmission(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.vendorId !== vendor.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const documents = await storage.getSubmissionDocuments(submission.id);
    const scores = await storage.getEvaluationScores(submission.id);

    res.json({
      ...submission,
      documents,
      evaluationScores: scores,
    });
  } catch (error) {
    console.error('Get submission details error:', error);
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
});

portalRouter.get('/api/portal/messages', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const messages = await storage.getVendorMessages(vendor.id);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

portalRouter.post('/api/portal/messages/:id/read', portalAuth, async (req: Request, res: Response) => {
  try {
    const message = await storage.markMessageRead(req.params.id, 'vendor');
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(message);
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

portalRouter.get('/api/portal/compliance-check/:tenderId', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const tender = await storage.getTender(req.params.tenderId);

    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const requirements = await storage.getTenderRequirements(tender.id);
    const vendorDocuments = await storage.getDocuments();
    const vendorDocs = vendorDocuments.filter(d => d.vendorId === vendor.id);

    const checks: Array<{ requirement: string; status: 'green' | 'amber' | 'red'; message: string }> = [];

    for (const req of requirements) {
      const matchingDoc = vendorDocs.find(d => d.documentType === req.requirementType);

      if (!matchingDoc) {
        checks.push({
          requirement: req.requirementType,
          status: 'red',
          message: 'Not provided',
        });
      } else if (matchingDoc.expiryDate) {
        const now = new Date();
        const expiryDate = new Date(matchingDoc.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          checks.push({
            requirement: req.requirementType,
            status: 'red',
            message: `Expired on ${expiryDate.toLocaleDateString('en-ZA')}`,
          });
        } else if (daysUntilExpiry <= 30) {
          checks.push({
            requirement: req.requirementType,
            status: 'amber',
            message: `Expires in ${daysUntilExpiry} days`,
          });
        } else {
          checks.push({
            requirement: req.requirementType,
            status: 'green',
            message: `Valid until ${expiryDate.toLocaleDateString('en-ZA')}`,
          });
        }
      } else if (matchingDoc.verificationStatus === 'verified') {
        checks.push({
          requirement: req.requirementType,
          status: 'green',
          message: 'Verified',
        });
      } else if (matchingDoc.verificationStatus === 'rejected') {
        checks.push({
          requirement: req.requirementType,
          status: 'red',
          message: 'Document rejected',
        });
      } else {
        checks.push({
          requirement: req.requirementType,
          status: 'amber',
          message: 'Pending verification',
        });
      }
    }

    if (vendor.taxClearanceExpiry) {
      const taxExpiry = new Date(vendor.taxClearanceExpiry);
      const daysUntilExpiry = Math.ceil((taxExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const existingTaxCheck = checks.find(c => c.requirement === 'Tax Clearance');
      if (!existingTaxCheck) {
        checks.push({
          requirement: 'Tax Clearance',
          status: daysUntilExpiry < 0 ? 'red' : daysUntilExpiry <= 30 ? 'amber' : 'green',
          message: daysUntilExpiry < 0 ? `Expired` : `Valid until ${taxExpiry.toLocaleDateString('en-ZA')}`,
        });
      }
    }

    if (vendor.bbbeeCertificateExpiry) {
      const bbbeeExpiry = new Date(vendor.bbbeeCertificateExpiry);
      const daysUntilExpiry = Math.ceil((bbbeeExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const existingBbbeeCheck = checks.find(c => c.requirement === 'BBBEE Certificate');
      if (!existingBbbeeCheck) {
        checks.push({
          requirement: 'BBBEE Certificate',
          status: daysUntilExpiry < 0 ? 'red' : daysUntilExpiry <= 30 ? 'amber' : 'green',
          message: daysUntilExpiry < 0 ? `Expired` : `Valid until ${bbbeeExpiry.toLocaleDateString('en-ZA')}`,
        });
      }
    }

    const hasRed = checks.some(c => c.status === 'red');
    const hasAmber = checks.some(c => c.status === 'amber');
    const mandatoryRequirements = requirements.filter(r => r.isMandatory);
    const mandatoryRed = mandatoryRequirements.some(r => {
      const check = checks.find(c => c.requirement === r.requirementType);
      return check?.status === 'red';
    });

    const overallStatus = hasRed ? 'red' : hasAmber ? 'amber' : 'green';
    const canSubmit = !mandatoryRed;

    res.json({
      status: overallStatus,
      checks,
      canSubmit,
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({ error: 'Failed to perform compliance check' });
  }
});

portalRouter.get('/api/portal/awards', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const acceptances = await storage.getVendorAwardAcceptances(vendor.id);
    
    const enriched = await Promise.all(acceptances.map(async (a) => {
      const tender = await storage.getTender(a.tenderId);
      const slaDocuments = await storage.getTenderSlaDocuments(a.tenderId);
      return {
        ...a,
        tender: tender ? { id: tender.id, title: tender.title, tenderNumber: tender.tenderNumber, estimatedValue: tender.estimatedValue, currency: tender.currency } : null,
        slaDocuments: slaDocuments.map(s => ({ id: s.id, title: s.title, description: s.description, isRequired: s.isRequired })),
        hasSla: slaDocuments.length > 0,
      };
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Get awards error:', error);
    res.status(500).json({ error: 'Failed to fetch awards' });
  }
});

portalRouter.get('/api/portal/awards/:id', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const acceptance = await storage.getAwardAcceptance(req.params.id);
    
    if (!acceptance) {
      return res.status(404).json({ error: 'Award not found' });
    }
    
    if (acceptance.vendorId !== vendor.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const tender = await storage.getTender(acceptance.tenderId);
    const submission = await storage.getBidSubmission(acceptance.submissionId);
    const slaDocuments = await storage.getTenderSlaDocuments(acceptance.tenderId);
    
    res.json({
      ...acceptance,
      tender: tender ? { id: tender.id, title: tender.title, tenderNumber: tender.tenderNumber, estimatedValue: tender.estimatedValue, currency: tender.currency, description: tender.description } : null,
      submission: submission ? { id: submission.id, bidAmount: submission.bidAmount, currency: submission.currency, totalScore: submission.totalScore } : null,
      slaDocuments,
    });
  } catch (error) {
    console.error('Get award details error:', error);
    res.status(500).json({ error: 'Failed to fetch award details' });
  }
});

portalRouter.get('/api/portal/awards/:id/sla/:slaId', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const acceptance = await storage.getAwardAcceptance(req.params.id);
    
    if (!acceptance || acceptance.vendorId !== vendor.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const sla = await storage.getTenderSlaDocument(req.params.slaId);
    if (!sla || sla.tenderId !== acceptance.tenderId) {
      return res.status(404).json({ error: 'SLA document not found' });
    }
    
    res.json(sla);
  } catch (error) {
    console.error('Get SLA document error:', error);
    res.status(500).json({ error: 'Failed to fetch SLA document' });
  }
});

const signAwardSchema = z.object({
  signatoryName: z.string().min(2, 'Full name is required'),
  signatoryTitle: z.string().min(2, 'Job title is required'),
  signatureData: z.string().min(1, 'Signature is required'),
  slaAccepted: z.boolean().optional(),
});

portalRouter.post('/api/portal/awards/:id/sign', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const acceptance = await storage.getAwardAcceptance(req.params.id);
    
    if (!acceptance) {
      return res.status(404).json({ error: 'Award not found' });
    }
    
    if (acceptance.vendorId !== vendor.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (acceptance.status === 'signed') {
      return res.status(400).json({ error: 'Award has already been signed' });
    }
    
    if (acceptance.status === 'declined') {
      return res.status(400).json({ error: 'Award has been declined and cannot be signed' });
    }
    
    const data = signAwardSchema.parse(req.body);
    
    const slaDocuments = await storage.getTenderSlaDocuments(acceptance.tenderId);
    const requiredSlas = slaDocuments.filter(s => s.isRequired);
    if (requiredSlas.length > 0 && !data.slaAccepted) {
      return res.status(400).json({ error: 'You must accept the SLA before signing' });
    }
    
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    
    const updated = await storage.updateAwardAcceptance(acceptance.id, {
      status: 'signed',
      signatoryName: data.signatoryName,
      signatoryTitle: data.signatoryTitle,
      signatureData: data.signatureData,
      signedAt: new Date(),
      slaAccepted: requiredSlas.length > 0 ? data.slaAccepted : null,
      slaAcceptedAt: requiredSlas.length > 0 && data.slaAccepted ? new Date() : null,
      ipAddress,
    });
    
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Sign award error:', error);
    res.status(500).json({ error: 'Failed to sign award' });
  }
});

const declineAwardSchema = z.object({
  declineReason: z.string().min(10, 'Please provide a reason for declining'),
});

portalRouter.post('/api/portal/awards/:id/decline', portalAuth, async (req: Request, res: Response) => {
  try {
    const vendor = req.portalVendor!;
    const acceptance = await storage.getAwardAcceptance(req.params.id);
    
    if (!acceptance) {
      return res.status(404).json({ error: 'Award not found' });
    }
    
    if (acceptance.vendorId !== vendor.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (acceptance.status === 'signed') {
      return res.status(400).json({ error: 'Award has already been signed and cannot be declined' });
    }
    
    const data = declineAwardSchema.parse(req.body);
    
    const updated = await storage.updateAwardAcceptance(acceptance.id, {
      status: 'declined',
      declinedAt: new Date(),
      declineReason: data.declineReason,
    });
    
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Decline award error:', error);
    res.status(500).json({ error: 'Failed to decline award' });
  }
});
