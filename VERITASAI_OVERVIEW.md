# VeritasAI - AI-Powered Bid Evaluation Platform
## High-Level Overview

---

## Executive Summary

VeritasAI is a comprehensive AI-powered multi-tenant SaaS platform for global bid evaluation and procurement compliance. The system handles vendor management, tender tracking, AI-powered document processing, country-specific compliance rules, and enterprise-grade security with full API integration. VeritasAI serves organizations across 70 countries with multi-language support (English, French, Portuguese, Arabic).

---

## Purpose

VeritasAI addresses the critical need for transparent, efficient, and compliant public procurement by providing:

- **Global Compliance Coverage** - Support for 70 countries including all 54 African nations, Middle East, EU, UK, USA, and Australia
- **AI-Powered Document Processing** - Automated verification, classification, and fraud detection
- **Multi-Tenant Architecture** - Complete data isolation with subscription-based billing
- **Configurable Compliance Rules** - Country-specific rule engines with versioning
- **Enterprise API** - REST API v1 for external integrations
- **Comprehensive Help System** - Context-sensitive documentation with keyboard shortcuts

---

## Key Features

### 1. Vendor Management
- Register and track vendors with country-specific compliance details
- Document verification with AI-powered analysis
- Expiry tracking and automatic alerts
- Debarment status monitoring
- Multi-country vendor profiles

### 2. Tender Management
- Create and publish tenders (RFQ, RFP, RFT, EOI)
- Define tender requirements and scoring criteria
- AI-powered extraction of requirements from PDF documents
- Full tender lifecycle tracking with 13+ status stages
- Country-specific compliance templates

### 3. Bid Submission Workflow
| Stage | Description |
|-------|-------------|
| Draft | Vendor prepares submission |
| Submitted | Bid formally submitted |
| Auto-Checking | AI verifies documents |
| Manual Review | Human evaluation |
| Passed/Failed | Compliance decision |
| Awarded | Contract awarded |

### 4. AI-Powered Document Processing
- **Document Analysis** - AI-powered extraction of document data
- **Document Classification** - Automatic detection of document types
- **Fraud Detection** - AI-based detection of anomalies and fraud indicators
- **Multi-Language Support** - Processing in English, French, Portuguese, and Arabic
- **PDF Requirement Extraction** - Upload tender PDF, AI extracts compliance requirements
- **Letter Generation** - AI-powered or template-based award/rejection letters

### 5. Country-Specific Compliance

VeritasAI supports 70 countries with tailored compliance modules:

#### Africa (54 Countries)
All African nations including South Africa, Kenya, Nigeria, Ghana, Egypt, Morocco, Algeria, Tunisia, Ethiopia, Tanzania, Uganda, Rwanda, Côte d'Ivoire, Senegal, Cameroon, Angola, Mozambique, Zimbabwe, Zambia, Botswana, Namibia, and more.

#### Other Regions
- **Middle East**: UAE (ICV requirements)
- **Europe**: UK, Germany, France, Netherlands, Italy, Spain, Belgium, Portugal, Sweden, Denmark, Poland
- **Americas**: USA (FAR/DFAR, SBA preferences)
- **Oceania**: Australia (Commonwealth Procurement Rules)

### 6. South African Compliance (Launch Market)

| Requirement | VeritasAI Feature |
|-------------|-------------------|
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

### 7. B-BBEE Preferential Points (South Africa)

#### 80/20 System (Tenders < R50M)
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

#### 90/10 System (Tenders >= R50M)
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

## Multi-Tenant SaaS Architecture

### Subscription Tiers

| Tier | Monthly Price (ZAR) | Annual Price (ZAR) | Features |
|------|---------------------|-------------------|----------|
| Starter | R899 | R8,990 | 50 bids/month, 100 documents, 5GB storage |
| Professional | R2,499 | R24,990 | 200 bids/month, 500 documents, 25GB storage |
| Enterprise | R6,999 | R69,990 | Unlimited bids, unlimited documents, 100GB storage |
| Government | Custom | Custom | Tailored enterprise solutions |

### Tenant Features
- **Complete Data Isolation** - Tenant ID on all database tables
- **Usage-Based Billing** - Track bids, documents, storage, API calls
- **Custom Branding** - Tenant-specific logos and colors
- **Role-Based Access** - Admin, Owner, Manager, Analyst, Viewer roles

---

## Comprehensive Help System

VeritasAI includes a built-in help system designed to assist users at every step:

### Help Components

| Component | Description |
|-----------|-------------|
| **HelpManual** | Full documentation organized by module with search |
| **GlobalHelpSearch** | Quick command palette search across all content (Ctrl+K) |
| **KeyboardShortcuts** | Visual guide to all keyboard shortcuts (Ctrl+/) |
| **GuidedTour** | Interactive first-time user walkthrough |
| **FieldHelp** | Contextual tooltips for form fields |
| **StatusBadgeHelp** | Click any status badge for explanation |
| **AI Chatbot** | GPT-4o powered assistant for instant answers |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + K | Open global search |
| Ctrl + / | Show keyboard shortcuts |
| Ctrl + H | Open help for current page |
| Ctrl + N | Create new item (context-aware) |
| Escape | Close modals and dialogs |

### Modules Covered
1. Dashboard
2. Vendors
3. Tenders
4. Documents
5. Compliance
6. Analytics
7. Billing
8. API Settings
9. Email Templates
10. Country Launch
11. Pricing
12. Help

---

## Communication System

### Email Notifications (SendGrid)
- Template-based communication
- Bulk notifications
- Award/rejection letters
- Document expiry alerts
- Bid received confirmations

### Email Domain Authentication
- **Default Email**: Use veritasai@zd-solutions.com (instant setup)
- **Custom Domain**: Configure client's own domain with DNS verification
- Automated CNAME/DKIM record generation
- Background verification checks every 5 minutes

### Monthly Email Limits (Included Free)
| Tier | Monthly Emails |
|------|----------------|
| Starter | 500 |
| Professional | 3,000 |
| Enterprise | 15,000 |

---

## Payment Processing

### South Africa (Launch Market)
- **Provider**: Yoco
- **Currency**: ZAR (South African Rand)
- **Features**: Local card payments, checkout integration

### Global Expansion
- Country-by-country rollout with payment gateway control
- Enquiry-only mode for pre-launch countries
- IP-based country auto-detection

---

## API v1 Integration

VeritasAI provides a comprehensive REST API for external integrations:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/bids` | POST | Submit bid for evaluation |
| `/api/v1/bids` | GET | List bids with pagination |
| `/api/v1/bids/:id` | GET | Get bid details and results |
| `/api/v1/documents/verify` | POST | Verify a single document |
| `/api/v1/compliance/rules` | GET | List compliance rules by country |
| `/api/v1/webhooks` | POST | Register webhook endpoints |
| `/api/v1/usage` | GET | Get current usage stats |

### Authentication
- API Key-based authentication
- OAuth support for enterprise clients
- Rate limiting per tenant

---

## Security Features

- **Rate Limiting** - Configurable per-tenant rate limits
- **RBAC** - Role-based access control (5 roles)
- **Audit Logging** - Complete audit trail of all actions
- **Field Encryption** - AES-256-GCM for sensitive data
- **API Key Management** - Secure generation and validation
- **Security Headers** - HSTS, XSS protection, content type sniffing prevention

---

## Notification Triggers

VeritasAI automatically sends notifications at these key points:

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

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, tenant configuration |
| **Owner** | Organization management, billing |
| **Manager** | Tender management, evaluations |
| **Analyst** | View and analyze data, generate reports |
| **Viewer** | Read-only access to assigned content |

---

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, TanStack Query
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon-backed)
- **AI**: OpenAI GPT-4o for document analysis and chatbot
- **Authentication**: Replit Auth (SSO)
- **Email**: SendGrid with domain authentication
- **Payments**: Yoco (South Africa)
- **Storage**: Object Storage for documents

---

## Country Launch Control

VeritasAI uses a phased country-by-country rollout:

| Status | Description |
|--------|-------------|
| **Active** | Full payment and subscription available |
| **Enquiry Only** | Contact form for interested customers |
| **Coming Soon** | Announced but not yet available |
| **Disabled** | Not available in this region |

### Initial Launch
- **South Africa (ZA)**: Active with Yoco payment gateway
- **All Other Countries**: Enquiry-only mode

---

## Benefits

1. **Global Reach** - Support for 70 countries with local compliance
2. **Transparency** - Full audit trail of all procurement activities
3. **Efficiency** - AI-powered automation reduces manual work by 80%
4. **Compliance** - Country-specific regulatory requirements built-in
5. **Multi-Language** - Document processing in EN/FR/PT/AR
6. **Scalability** - Multi-tenant architecture handles enterprise workloads
7. **Integration** - REST API for seamless system connectivity
8. **Support** - Comprehensive help system with AI chatbot

---

## Getting Started

1. **Sign Up** - Create your organization account
2. **Select Plan** - Choose a subscription tier
3. **Configure** - Set up country-specific compliance rules
4. **Onboard Vendors** - Import or register vendor profiles
5. **Create Tenders** - Publish your first tender
6. **Evaluate Bids** - Let AI assist with compliance checking

### Keyboard Quick Start
- Press **Ctrl + K** to search anything
- Press **Ctrl + /** to see all shortcuts
- Click any **?** icon for context help

---

## Contact

- **Website**: veritasai-tender.online
- **Support**: Contact your account administrator
- **Documentation**: Available in-app via Help menu

---

*VeritasAI - Transforming procurement with AI-powered compliance*
