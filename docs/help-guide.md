# VeritasAI Help Guide

Complete documentation for the VeritasAI - your AI-powered bid evaluation platform.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Billing & Subscriptions](#billing--subscriptions)
3. [Platform Usage](#platform-usage)
4. [API Integration](#api-integration)
5. [Frequently Asked Questions](#frequently-asked-questions)

---

## Getting Started

### Quick Start Guide

Get up and running with VeritasAI in 5 simple steps:

#### Step 1: Create Your Account
Sign up using your email or organization credentials. Your account will be linked to a tenant (organization) which provides complete data isolation.

#### Step 2: Choose Your Subscription
Select a plan that fits your needs:
- **Starter** ($499/year): 50 bids/month for small procurement teams
- **Professional** ($1,499/year): 300 bids/month for growing organizations
- **Enterprise** ($3,999/year): 1,500 bids/month for large organizations
- **Government**: Contact us for custom pricing

You can start with Starter and upgrade anytime as your needs grow.

#### Step 3: Configure Your Country
Set your country to load the appropriate compliance rules. Each country has specific requirements we verify:
- **South Africa**: B-BBEE, CSD, Tax Clearance, 80/20 and 90/10 scoring
- **Kenya**: AGPO preferences, PPRA compliance
- **Nigeria**: Local Content Act, BPP compliance
- **Ghana**: PPA regulations, local participation
- **UAE**: In-Country Value requirements
- **UK**: Public Contracts Regulations
- **USA**: FAR/DFAR, SBA preferences
- **Global**: Universal framework for any other country

#### Step 4: Add Your First Vendor
Register vendors by entering their company details and contact information. Upload compliance documents such as:
- Tax clearance certificates
- Company registration documents
- B-BBEE certificates (South Africa)
- Trade licenses
- Insurance certificates

#### Step 5: Create Your First Tender
Set up a tender with requirements and deadlines. Upload tender PDFs and our AI will automatically extract compliance requirements for you.

### User Roles

VeritasAI supports role-based access control:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features including user management |
| **Manager** | Manage vendors, tenders, and team members |
| **Analyst** | Review and score bids |
| **Viewer** | Read-only access to view data |

### Supported Countries

We have pre-configured compliance modules for 70 countries:
- **All 54 African nations**: South Africa, Kenya, Nigeria, Ghana, Egypt, Morocco, Ethiopia, Tanzania, and more
- **Europe**: UK, Germany, France, Netherlands, Italy, Spain, Belgium, Portugal, Sweden, Denmark, Poland
- **Asia-Pacific**: Australia, UAE
- **Americas**: United States

Our **Global framework** works for any country not specifically configured. You can customize compliance rules to match your specific requirements.

---

## Billing & Subscriptions

### Subscription Plans

| Plan | Price | Bids/Month | Documents/Month | Storage | Support |
|------|-------|------------|-----------------|---------|---------|
| Starter | $499/year | 50 | 500 | 5 GB | Email |
| Professional | $1,499/year | 300 | 3,000 | 25 GB | Priority Email |
| Enterprise | $3,999/year | 1,500 | 15,000 | 100 GB | Phone & Email |
| Government | Custom | Custom | Custom | Custom | Dedicated |

### What's Included in Each Plan

**Starter**
- AI document verification
- GLOBAL compliance rules
- Email notifications
- Basic analytics
- 1 user seat
- Email support

**Professional** (Everything in Starter, plus:)
- Country-specific compliance modules
- Multi-language support (EN/FR/PT/AR)
- Advanced fraud detection
- Webhook integrations
- 5 user seats
- Priority email support

**Enterprise** (Everything in Professional, plus:)
- Custom compliance rule builder
- API access with high rate limits
- SSO/SAML integration
- Dedicated account manager
- 25 user seats
- Phone & email support

**Government**
- Tailored for national, provincial, and municipal procurement
- Unlimited capacity options
- On-premise deployment available
- Custom integrations
- SLA guarantee
- 24/7 dedicated support

### How Billing Works

**Annual Billing**
All plans are billed annually. You can pay via:
- Credit card (all plans)
- Invoice/bank transfer (Enterprise and Government plans)

**Usage Tracking**
Your dashboard shows real-time usage including:
- Bids processed this month
- Documents verified
- Storage used

You'll receive alerts at 80% and 100% of your limits.

**Upgrading**
You can upgrade your plan anytime. The price difference is prorated for the remaining period of your subscription.

**Downgrades**
Downgrades take effect at the next billing cycle to ensure you don't lose access to features mid-cycle.

**Overage Pricing**
If you exceed your monthly bid limit, you can continue processing bids at the following per-bid rates:

| Plan | Included Bids | Overage Rate |
|------|---------------|--------------|
| Starter | 50/month | $2.00/bid |
| Professional | 300/month | $1.00/bid |
| Enterprise | 1,500/month | $0.50/bid |
| Government | Custom | Custom |

You'll receive alerts at 80% and 100% of your limits. Overage charges are billed at the end of your billing cycle.

---

## Platform Usage

### Core Features

#### Vendor Management
- Register vendors with company details and contact information
- Upload and verify compliance documents (tax clearance, certificates)
- Track document expiry dates with automatic notifications
- View vendor risk scores and compliance history
- Check debarment status against government databases

#### Tender Management
- Create tenders with requirements and deadlines
- Upload tender PDFs - AI extracts compliance requirements automatically
- Track tender lifecycle from draft to award
- Receive and manage bid submissions
- Generate award and rejection letters

#### Document Processing
- AI-powered document classification and data extraction
- Multi-language support (English, French, Portuguese, Arabic)
- Fraud detection for tampered or suspicious documents
- Automatic expiry date detection and tracking
- Secure cloud storage with encryption

#### Analytics & Reporting
- Real-time dashboard with key metrics
- Tender volume and compliance rate trends
- Vendor performance analytics
- Export audit-ready compliance reports
- Custom report generation

### Typical Workflow

1. **Create Tender** - Upload tender PDF, AI extracts requirements
2. **Receive Bids** - Vendors submit via portal or API
3. **AI Verification** - Documents analyzed for compliance automatically
4. **Score & Review** - Apply scoring rules, conduct manual review if needed
5. **Award** - Generate letters, complete audit trail

### Best Practices

1. **Keep Documents Updated**: Regularly check for expiring documents and request updates from vendors
2. **Use Templates**: Create letter templates for common scenarios to save time
3. **Review AI Results**: While our AI is highly accurate, always review flagged items manually
4. **Export Reports**: Generate compliance reports before tender close for audit purposes

---

## API Integration

### Overview

VeritasAI provides a RESTful API for integrating with your existing systems. API access is available on Professional plans and above.

### Authentication

Use API keys for authentication. Generate keys from the **API Settings** page in your dashboard.

Include your key in the request header:
```
X-API-Key: your-api-key-here
```

### Base URL

```
https://your-domain.com/api/v1
```

### Rate Limits

Rate limits vary by subscription plan:

| Plan | Requests per Minute |
|------|---------------------|
| Starter | N/A (no API access) |
| Professional | 100/min |
| Enterprise | 500/min |
| Government | Custom |

### Available Endpoints

#### Bids

**Submit a Bid**
```
POST /api/v1/bids
```
Submit a bid for evaluation with vendor and document information.

**List Bids**
```
GET /api/v1/bids
```
List bids with pagination. Supports filtering by status, date, and vendor.

**Get Bid Details**
```
GET /api/v1/bids/:id
```
Get detailed information about a specific bid including compliance results.

#### Documents

**Verify Document**
```
POST /api/v1/documents/verify
```
Verify a single document and get compliance status.

#### Compliance

**List Compliance Rules**
```
GET /api/v1/compliance/rules
```
List compliance rules filtered by country code.

#### Webhooks

**Register Webhook**
```
POST /api/v1/webhooks
```
Register a webhook endpoint to receive notifications about bid status changes.

#### Usage

**Get Usage Statistics**
```
GET /api/v1/usage
```
Get current usage statistics for your tenant.

### Response Format

All API responses are in JSON format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Handling

Errors return appropriate HTTP status codes with details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid document format",
    "details": [ ... ]
  }
}
```

---

## Frequently Asked Questions

### General

**What is VeritasAI?**
VeritasAI (VeritasAI) is an AI-powered multi-tenant SaaS platform for bid evaluation and procurement compliance. It helps organizations verify vendor documents, evaluate bids against compliance rules, and manage the entire tender lifecycle.

**Which countries do you support?**
We have pre-configured compliance modules for South Africa, Kenya, Nigeria, Ghana, UAE, UK, and USA. Our Global framework works for any other country - you can customize the compliance rules to match your specific requirements.

**What languages do you support?**
Our AI can process documents in English, French, Portuguese, and Arabic. The platform interface is currently in English.

### AI & Documents

**How does AI document verification work?**
Our AI analyzes uploaded documents to:
- Extract key information (dates, amounts, registration numbers)
- Classify document types automatically
- Detect potential fraud indicators (tampering, inconsistencies)
- Validate against compliance rules

It supports multiple languages and processes documents in seconds rather than hours.

**What document formats are supported?**
We support PDF, JPEG, PNG, and TIFF formats. PDF is recommended for best results.

**How accurate is the AI?**
Our AI achieves over 95% accuracy for document classification and data extraction. We recommend manual review for flagged items or critical decisions.

### Integration & Security

**Can I integrate VeritasAI with my existing systems?**
Yes! Professional and higher plans include API access. You can:
- Submit bids programmatically
- Verify documents via API
- Receive webhook notifications for status changes
- Export data to your systems

**Is my data secure?**
Absolutely. We implement:
- AES-256-GCM encryption for sensitive data
- Complete audit logging of all actions
- Role-based access control (RBAC)
- Secure cloud infrastructure
- Compliance with POPIA (South Africa), GDPR (Europe), and other data protection regulations

### Billing & Support

**What happens if I exceed my plan limits?**
You'll receive alerts at 80% and 100% of your limits. If you exceed limits, you can upgrade your plan or wait until the next billing period. We don't charge overage fees.

**Do you offer a free trial?**
We offer personalized demos for organizations evaluating VeritasAI. Contact our sales team to schedule a demo. For smaller organizations, the Starter plan offers an affordable entry point.

**How do I get support?**
Support options vary by plan:
- **Starter**: Email support
- **Professional**: Priority email support
- **Enterprise**: Phone & email support with dedicated account manager
- **Government**: 24/7 dedicated support with SLA

---

## Contact Us

**Sales Inquiries**
For pricing questions, enterprise solutions, or government partnerships, contact our sales team.

**Technical Support**
Access support through your dashboard or via the channels available for your subscription tier.

**General Information**
Visit our website or use the AI chatbot for instant answers to common questions.

---

*Last updated: February 2026*
*Version: 1.0*
