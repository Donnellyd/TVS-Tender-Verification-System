# Tender Vetting and Verification System (TVS)
## High-Level Overview

---

## Executive Summary

The Tender Vetting and Verification System (TVS) is a comprehensive procurement management platform designed specifically for South African municipalities. It streamlines the entire tender lifecycle from publication to award, ensuring compliance with PFMA/MFMA regulations and B-BBEE requirements.

---

## Purpose

TVS addresses the critical need for transparent, efficient, and compliant public procurement by providing:

- **Centralized Vendor Management** - Single source of truth for all supplier information
- **Automated Compliance Checking** - AI-powered verification of vendor documents
- **Multi-Channel Notifications** - WhatsApp and Email communication with vendors
- **Audit Trail** - Complete tracking of all actions for accountability
- **Analytics Dashboard** - Real-time insights into procurement activities

---

## Key Features

### 1. Vendor Management
- Register and track vendors with full SA compliance details
- CSD ID verification (max 10 days old requirement)
- Tax Clearance PIN verification
- B-BBEE certificate tracking (Levels 1-8)
- Debarment status monitoring

### 2. Tender Management
- Create and publish tenders (RFQ, RFP, RFT, EOI)
- Define tender requirements and scoring criteria
- AI-powered extraction of requirements from PDF documents
- Full tender lifecycle tracking with 13+ status stages

### 3. Bid Submission Workflow
| Stage | Description |
|-------|-------------|
| Draft | Vendor prepares submission |
| Submitted | Bid formally submitted |
| Auto-Checking | AI verifies documents |
| Manual Review | Human evaluation |
| Passed/Failed | Compliance decision |
| Awarded | Contract awarded |

### 4. Compliance Verification
- Automated document expiry checking
- B-BBEE preferential points calculation
  - **80/20 System** for tenders under R50M
  - **90/10 System** for tenders R50M and above
- Document age verification (e.g., 90-day municipal rates clearance)

### 5. Communication
- **WhatsApp Notifications** (via Twilio)
  - Tender published alerts
  - Closing date reminders
  - Award/rejection notifications
- **Email Notifications** (via SendGrid)
  - Template-based communication
  - Bulk notifications
  - Award/rejection letters

### 6. Analytics & Reporting
- Tender status distribution
- Vendor compliance rates
- Submission pipeline tracking
- Municipality-level reporting

---

## South African Compliance

TVS is built specifically for SA public procurement:

| Requirement | TVS Feature |
|-------------|-------------|
| CSD Registration | Automated verification, age tracking |
| Tax Clearance | PIN validation, expiry alerts |
| B-BBEE Certificate | Level tracking, points calculation |
| COIDA | Document storage and verification |
| Municipal Rates Clearance | 90-day validity enforcement |
| Public Liability Insurance | R5M minimum cover validation |
| Audited Financials | 3-year document storage |
| Declaration of Interest | Form tracking |
| Bid Defaulters Check | Automated register lookup |
| PFMA/MFMA Alignment | Built-in compliance rules |

---

## B-BBEE Preferential Points

### 80/20 System (Tenders < R50M)
| B-BBEE Level | Points |
|--------------|--------|
| Level 1 | 20 |
| Level 2 | 18 |
| Level 3 | 14 |
| Level 4 | 12 |
| Level 5 | 8 |
| Level 6 | 6 |
| Level 7 | 4 |
| Level 8 | 2 |
| Non-Compliant | 0 |

### 90/10 System (Tenders >= R50M)
| B-BBEE Level | Points |
|--------------|--------|
| Level 1 | 10 |
| Level 2 | 9 |
| Level 3 | 6 |
| Level 4 | 5 |
| Level 5 | 4 |
| Level 6 | 3 |
| Level 7 | 2 |
| Level 8 | 1 |
| Non-Compliant | 0 |

---

## Notification Triggers

TVS automatically sends notifications at these key points:

1. **tender_published** - New tender available
2. **tender_closing_soon** - Deadline approaching
3. **tender_closed** - Submissions closed
4. **under_evaluation** - Bids being reviewed
5. **clarification_requested** - Information needed
6. **shortlisted** - Vendor shortlisted
7. **standstill_period** - Waiting period before award
8. **awarded** - Tender awarded
9. **unsuccessful** - Bid not successful
10. **tender_cancelled** - Tender cancelled
11. **submission_received** - Bid received confirmation
12. **document_verified** - Document approved
13. **document_rejected** - Document rejected

---

## User Roles

- **Administrators** - Full system access, configuration
- **Procurement Officers** - Tender management, evaluations
- **Vendors** - Submit bids, upload documents, receive notifications

---

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4o for document analysis
- **Authentication**: Replit Auth (SSO)
- **Notifications**: Twilio (WhatsApp), SendGrid (Email)
- **Storage**: Object Storage for documents

---

## Benefits

1. **Transparency** - Full audit trail of all procurement activities
2. **Efficiency** - Automated compliance checking reduces manual work
3. **Compliance** - Built-in SA regulatory requirements
4. **Communication** - Multi-channel vendor engagement
5. **Accuracy** - AI-powered document verification
6. **Accessibility** - Web-based, accessible from anywhere

---

## Contact

For more information about TVS, please contact the system administrator.
