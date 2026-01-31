# Tender Vetting and Verification System (TVS)
## Detailed Technical Documentation

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Authentication](#authentication)
5. [AI Integration](#ai-integration)
6. [Notification System](#notification-system)
7. [File Structure](#file-structure)
8. [Configuration](#configuration)
9. [Validation Rules](#validation-rules)
10. [Workflows](#workflows)

---

## Architecture Overview

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| UI Framework | Tailwind CSS + Shadcn/UI |
| State Management | TanStack Query v5 |
| Routing | Wouter |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Authentication | Replit Auth (OpenID Connect) |
| AI | OpenAI GPT-4o |
| PDF Processing | pdf-parse |
| WhatsApp | Twilio API |
| Email | SendGrid API |
| Object Storage | Replit Object Storage |

### Application Structure

```
/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and query client
├── server/                 # Backend Express application
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── notifications.ts    # WhatsApp service (Twilio)
│   └── email-notifications.ts  # Email service (SendGrid)
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle schema + Zod validation
└── script/                 # Database scripts
    └── seed.ts             # Seed data
```

---

## Database Schema

### Core Tables

#### municipalities
```typescript
{
  id: varchar (PK, UUID),
  name: text,
  code: text (unique),
  province: text,
  contactEmail: text,
  contactPhone: text,
  address: text,
  status: text ("active" | "suspended"),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### vendors
```typescript
{
  id: varchar (PK, UUID),
  companyName: text,
  tradingName: text,
  registrationNumber: text,
  vatNumber: text,
  csdId: text,
  bbbeeLevel: text ("Level 1" - "Level 8" | "Non-Compliant"),
  bbbeeCertificateExpiry: timestamp,
  taxClearanceExpiry: timestamp,
  contactPerson: text,
  contactEmail: text,
  contactPhone: text,
  physicalAddress: text,
  postalAddress: text,
  bankName: text,
  bankAccountNumber: text,
  bankBranchCode: text,
  status: text ("pending" | "approved" | "suspended" | "debarred"),
  debarmentStatus: text ("clear" | "flagged" | "debarred"),
  whatsappPhone: text,
  whatsappOptIn: boolean,
  municipalityId: varchar (FK),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### tenders
```typescript
{
  id: varchar (PK, UUID),
  tenderNumber: text (unique),
  title: text,
  description: text,
  tenderType: text ("RFQ" | "RFP" | "RFT" | "EOI"),
  category: text ("Goods" | "Services" | "Works" | "Consulting" | "IT" | "Construction" | "Transport"),
  estimatedValue: integer,
  closingDate: timestamp,
  openingDate: timestamp,
  awardDate: timestamp,
  status: text (see tender statuses below),
  priority: text ("low" | "medium" | "high" | "critical"),
  municipalityId: varchar (FK),
  vendorId: varchar (FK),
  issuer: text,
  requirements: text,
  localContentRequirement: integer,
  bbbeeRequirement: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Tender Statuses:**
- draft, published, closing_soon, closed, under_evaluation
- clarification_requested, shortlisted, standstill_period
- awarded, unsuccessful, cancelled, open, under_review

#### documents
```typescript
{
  id: varchar (PK, UUID),
  name: text,
  documentType: text,
  filePath: text,
  fileSize: integer,
  mimeType: text,
  version: integer,
  hash: text,
  expiryDate: timestamp,
  verificationStatus: text ("pending" | "verified" | "rejected" | "expired"),
  verifiedBy: varchar,
  verifiedAt: timestamp,
  vendorId: varchar (FK),
  tenderId: varchar (FK),
  notes: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Submission Workflow Tables

#### tender_requirements
```typescript
{
  id: varchar (PK, UUID),
  tenderId: varchar (FK),
  requirementType: text,
  description: text,
  isMandatory: boolean,
  maxAgeDays: integer,
  minValue: integer,
  validityPeriod: text,
  sourceDocument: text,
  pageReference: text,
  aiExtracted: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Requirement Types:**
- CSD Registration, Tax Clearance, BBBEE Certificate
- Company Registration, COIDA Certificate
- Public Liability Insurance, Municipal Rates Clearance
- Audited Financials, Declaration of Interest
- Bid Defaulters Check, Professional Registration
- Safety Certification, Other

#### tender_scoring_criteria
```typescript
{
  id: varchar (PK, UUID),
  tenderId: varchar (FK),
  criteriaName: text,
  criteriaCategory: text ("Technical" | "Price" | "BBBEE" | "Experience" | "Functionality" | "Quality" | "Local Content" | "Other"),
  description: text,
  maxScore: integer,
  weight: integer,
  sortOrder: integer,
  aiExtracted: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### bid_submissions
```typescript
{
  id: varchar (PK, UUID),
  tenderId: varchar (FK),
  vendorId: varchar (FK),
  submissionDate: timestamp,
  status: text ("draft" | "submitted" | "auto_checking" | "manual_review" | "passed" | "failed" | "awarded" | "rejected"),
  bidAmount: integer,
  technicalScore: integer,
  bbbeePoints: integer,
  priceScore: integer,
  totalScore: integer,
  scoringSystem: text ("80/20" | "90/10"),
  complianceResult: text ("passed" | "failed" | "pending" | "flagged"),
  complianceNotes: text,
  autoCheckCompletedAt: timestamp,
  manualReviewCompletedAt: timestamp,
  reviewedBy: varchar,
  awardedAt: timestamp,
  rejectedAt: timestamp,
  rejectionReasons: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### submission_documents
```typescript
{
  id: varchar (PK, UUID),
  submissionId: varchar (FK),
  requirementId: varchar (FK),
  documentName: text,
  documentType: text,
  filePath: text,
  fileSize: integer,
  uploadedAt: timestamp,
  documentDate: timestamp,
  expiryDate: timestamp,
  verificationStatus: text,
  verificationNotes: text,
  aiVerified: boolean,
  aiConfidenceScore: integer,
  meetsRequirement: boolean,
  failureReason: text,
  createdAt: timestamp
}
```

#### evaluation_scores
```typescript
{
  id: varchar (PK, UUID),
  submissionId: varchar (FK),
  evaluatorId: varchar,
  criteriaName: text,
  criteriaCategory: text,
  maxScore: integer,
  score: integer,
  weight: integer,
  comments: text,
  evaluatedAt: timestamp,
  createdAt: timestamp
}
```

### Template Tables

#### letter_templates
```typescript
{
  id: varchar (PK, UUID),
  name: text,
  letterType: text,
  subject: text,
  bodyTemplate: text,
  municipalityId: varchar (FK),
  isDefault: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Letter Types:**
- award, rejection, regret, disqualification
- not_shortlisted, shortlisted, request_clarification
- request_information, addendum, extension
- non_compliant, standstill_notice, standstill_expiry
- debrief_invitation, debrief_response, tender_cancelled
- correction_notice, re_tender

#### whatsapp_templates
```typescript
{
  id: varchar (PK, UUID),
  name: text,
  trigger: text,
  messageTemplate: text,
  isActive: boolean,
  municipalityId: varchar (FK),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### notification_logs
```typescript
{
  id: varchar (PK, UUID),
  vendorId: varchar (FK),
  tenderId: varchar (FK),
  channel: text ("email" | "whatsapp"),
  trigger: text,
  recipient: text,
  subject: text,
  message: text,
  status: text ("pending" | "sent" | "failed" | "delivered"),
  errorMessage: text,
  externalMessageId: text,
  sentAt: timestamp,
  deliveredAt: timestamp,
  createdAt: timestamp
}
```

---

## API Endpoints

### Municipalities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/municipalities | List all municipalities |
| GET | /api/municipalities/:id | Get municipality by ID |
| POST | /api/municipalities | Create municipality |
| PATCH | /api/municipalities/:id | Update municipality |
| DELETE | /api/municipalities/:id | Delete municipality |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/vendors | List all vendors |
| GET | /api/vendors/:id | Get vendor by ID |
| POST | /api/vendors | Create vendor |
| PATCH | /api/vendors/:id | Update vendor |
| DELETE | /api/vendors/:id | Delete vendor |

### Tenders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tenders | List all tenders |
| GET | /api/tenders/:id | Get tender by ID |
| POST | /api/tenders | Create tender |
| PATCH | /api/tenders/:id | Update tender |
| DELETE | /api/tenders/:id | Delete tender |

### Tender Requirements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tenders/:tenderId/requirements | List requirements for tender |
| POST | /api/tenders/:tenderId/requirements | Add requirement |
| PATCH | /api/requirements/:id | Update requirement |
| DELETE | /api/requirements/:id | Delete requirement |

### Scoring Criteria
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tenders/:tenderId/scoring-criteria | List scoring criteria |
| POST | /api/tenders/:tenderId/scoring-criteria | Add criteria |
| PATCH | /api/scoring-criteria/:id | Update criteria |
| DELETE | /api/scoring-criteria/:id | Delete criteria |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/submissions | List all submissions |
| GET | /api/submissions/:id | Get submission by ID |
| POST | /api/submissions | Create submission |
| PATCH | /api/submissions/:id | Update submission |
| DELETE | /api/submissions/:id | Delete submission |
| POST | /api/submissions/:id/submit | Submit bid |
| POST | /api/submissions/:id/run-compliance-check | Run AI compliance check |
| POST | /api/submissions/:id/auto-score | Run AI auto-scoring |

### Submission Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/submissions/:submissionId/documents | List submission documents |
| POST | /api/submissions/:submissionId/documents | Upload document |
| DELETE | /api/submission-documents/:id | Delete document |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/letter-templates | List letter templates |
| POST | /api/letter-templates | Create template |
| PATCH | /api/letter-templates/:id | Update template |
| DELETE | /api/letter-templates/:id | Delete template |
| GET | /api/whatsapp-templates | List WhatsApp templates |
| POST | /api/whatsapp-templates | Create template |
| PATCH | /api/whatsapp-templates/:id | Update template |
| DELETE | /api/whatsapp-templates/:id | Delete template |

### AI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tenders/:tenderId/parse-pdf | Extract requirements from PDF |
| POST | /api/submissions/:id/generate-letter | Generate award/rejection letter |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications/whatsapp/test | Test Twilio connection |
| POST | /api/notifications/whatsapp/send | Send WhatsApp message |
| POST | /api/notifications/whatsapp/send-bulk | Send bulk WhatsApp |
| POST | /api/notifications/tender-status-change | Trigger status notifications |
| GET | /api/notifications/email/test | Test SendGrid connection |
| POST | /api/notifications/email/send | Send raw email |
| POST | /api/notifications/email/send-templated | Send templated email |
| POST | /api/notifications/email/send-bulk-templated | Send bulk emails |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/tenders-by-status | Count by tender status |
| GET | /api/analytics/tenders-by-type | Count by tender type |
| GET | /api/analytics/vendors-by-status | Count by vendor status |
| GET | /api/analytics/compliance-summary | Compliance check summary |
| GET | /api/analytics/submissions-by-stage | Count by submission stage |
| GET | /api/analytics/submissions-stats | Detailed submission stats |

---

## Authentication

TVS uses Replit Auth with OpenID Connect:

```typescript
// Session configuration
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));
```

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/user | Get current user |
| GET | /api/login | Initiate login |
| GET | /api/login/callback | OAuth callback |
| POST | /api/logout | Logout |

---

## AI Integration

### PDF Requirement Extraction

Uses OpenAI GPT-4o to parse tender documents:

```typescript
POST /api/tenders/:tenderId/parse-pdf
Content-Type: multipart/form-data

// Request: PDF file upload
// Response: Extracted requirements array
```

**Extracted Data:**
- Requirement type
- Description
- Mandatory flag
- Max age days
- Minimum value
- Validity period
- Source document reference
- Page reference

### Auto-Scoring

AI evaluates submissions against scoring criteria:

```typescript
POST /api/submissions/:id/auto-score

// Analyzes:
// - Submitted documents vs requirements
// - B-BBEE level and points
// - Technical compliance
// - Document validity dates
```

### Letter Generation

AI generates professional letters:

```typescript
POST /api/submissions/:id/generate-letter
{
  "templateId": "uuid",
  "letterType": "award" | "rejection" | ...
}
```

---

## Notification System

### WhatsApp (Twilio)

**Environment Variables:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Template Placeholders:**
- `[VendorName]` - Vendor company name
- `[TenderNo]` - Tender number
- `[TenderTitle]` - Tender title
- `[ClosingDate]` - Closing date
- `[Amount]` - Bid amount
- `[Status]` - Current status
- `[Municipality]` - Municipality name
- `[ContactPhone]` - Contact number

### Email (SendGrid)

SendGrid API key is managed via Replit Connectors (automatic).

**Template Placeholders:**
- `[TenderNo]` - Tender number
- `[TenderTitle]` - Tender title
- `[BidderName]` - Vendor name
- `[Date]` - Current date
- `[Amount]` - Bid amount
- `[YourName]` - Sender name
- `[Position]` - Sender position
- `[Organisation]` - Municipality name
- `[ContactDetails]` - Contact info

---

## File Structure

### Frontend Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Overview statistics |
| Vendors | `/vendors` | Vendor management |
| Tenders | `/tenders` | Tender management |
| Tender Requirements | `/tenders/:id/requirements` | Tender requirements |
| Submissions | `/submissions` | Bid submissions |
| Documents | `/documents` | Document library |
| Compliance | `/compliance` | Compliance checks |
| Analytics | `/analytics` | Reports & charts |
| Municipalities | `/municipalities` | Municipality setup |
| Email Templates | `/email-templates` | Email templates |
| WhatsApp Templates | `/whatsapp-templates` | WhatsApp templates |
| Compliance Rules | `/rules` | Rule configuration |
| Notifications | `/notifications` | Notification history |
| Settings | `/settings` | System settings |

### Key Components

| Component | Purpose |
|-----------|---------|
| AppSidebar | Main navigation sidebar |
| PageHeader | Page title and actions |
| StatsCard | Dashboard statistics |
| StatusBadge | Status indicators |
| EmptyState | Empty data placeholder |
| DataTableSkeleton | Loading state |
| ThemeToggle | Dark/light mode toggle |

---

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | Express session secret |
| TWILIO_ACCOUNT_SID | Twilio Account SID |
| TWILIO_AUTH_TOKEN | Twilio Auth Token |
| TWILIO_WHATSAPP_NUMBER | WhatsApp sender number |

### Database Commands

```bash
# Push schema changes
npm run db:push

# Force push (use with caution)
npm run db:push --force

# Run seed script
npx tsx script/seed.ts
```

### Running the Application

```bash
# Development
npm run dev

# The app runs on port 5000
# Frontend: http://localhost:5000
# API: http://localhost:5000/api
```

---

## Validation Rules

### SA-Specific Patterns

```typescript
// Company registration: YYYY/NNNNNN/NN
const saRegistrationNumberRegex = /^\d{4}\/\d{6}\/\d{2}$/;

// VAT number: 10 digits
const saVatNumberRegex = /^\d{10}$/;

// CSD ID: 4 letters + 10 digits
const csdIdRegex = /^[A-Z]{4}\d{10}$/;
```

### Document Validity Rules

| Document | Validity |
|----------|----------|
| CSD Registration | Max 10 days old |
| Tax Clearance | Check expiry date |
| BBBEE Certificate | Check expiry date |
| Municipal Rates Clearance | Max 90 days old |
| Public Liability Insurance | Min R5M cover |
| Audited Financials | 3 years required |

---

## Workflows

### Bid Submission Workflow

```
1. DRAFT
   └─> Vendor creates submission, uploads documents

2. SUBMITTED
   └─> Vendor submits bid before closing date

3. AUTO_CHECKING
   └─> AI verifies documents against requirements

4. MANUAL_REVIEW
   └─> Human evaluator reviews and scores

5. PASSED / FAILED
   └─> Compliance decision made

6. AWARDED / REJECTED
   └─> Final tender outcome
```

### Tender Lifecycle

```
1. DRAFT
   └─> Internal preparation

2. PUBLISHED
   └─> Open for submissions

3. CLOSING_SOON
   └─> Approaching deadline

4. CLOSED
   └─> No more submissions

5. UNDER_EVALUATION
   └─> Reviewing bids

6. SHORTLISTED
   └─> Top candidates selected

7. STANDSTILL_PERIOD
   └─> Mandatory waiting period

8. AWARDED
   └─> Winner selected

9. UNSUCCESSFUL
   └─> Tender not awarded

10. CANCELLED
    └─> Tender withdrawn
```

---

## B-BBEE Points Calculation

### 80/20 System (< R50M)

```typescript
const bbbeePoints8020: Record<string, number> = {
  "Level 1": 20,
  "Level 2": 18,
  "Level 3": 14,
  "Level 4": 12,
  "Level 5": 8,
  "Level 6": 6,
  "Level 7": 4,
  "Level 8": 2,
  "Non-Compliant": 0
};

// Price Score = 80 points
// B-BBEE = up to 20 points
// Total = 100 points
```

### 90/10 System (>= R50M)

```typescript
const bbbeePoints9010: Record<string, number> = {
  "Level 1": 10,
  "Level 2": 9,
  "Level 3": 6,
  "Level 4": 5,
  "Level 5": 4,
  "Level 6": 3,
  "Level 7": 2,
  "Level 8": 1,
  "Non-Compliant": 0
};

// Price Score = 90 points
// B-BBEE = up to 10 points
// Total = 100 points
```

---

## Support

For technical support or feature requests, contact the system administrator.
