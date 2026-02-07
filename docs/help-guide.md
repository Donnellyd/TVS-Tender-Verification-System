# VeritasAI Help Guide

Complete documentation for VeritasAI - your AI-powered bid evaluation and procurement compliance platform.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [System Overview](#system-overview)
3. [Platform Usage](#platform-usage)
4. [Vendor Portal](#vendor-portal)
5. [Billing & Subscriptions](#billing--subscriptions)
6. [API Integration](#api-integration)
7. [Email & Communications](#email--communications)
8. [Security & Compliance](#security--compliance)
9. [Frequently Asked Questions](#frequently-asked-questions)

---

## Getting Started

### Welcome to VeritasAI

VeritasAI is an AI-powered platform that streamlines procurement compliance and bid evaluation. Whether you manage tenders for a municipality, government department, or private organization, VeritasAI helps you verify vendor documents, evaluate bids against compliance rules, and maintain a complete audit trail.

### Quick Start Guide

Get up and running with VeritasAI in 5 simple steps:

#### Step 1: Create Your Account
Sign up using your email or organization credentials. Your account will be linked to a tenant (organization) which provides complete data isolation - your data is never accessible to other organizations.

#### Step 2: Choose Your Subscription
Select a plan that fits your needs:
- **Starter** ($499/year): Up to 50 bids/month for small procurement teams
- **Professional** ($1,499/year): Up to 300 bids/month for growing organizations
- **Enterprise** ($3,999/year): Up to 1,500 bids/month for large organizations
- **Government**: Contact us for custom pricing tailored to your requirements

You can start with Starter and upgrade anytime as your needs grow. South African customers pay in ZAR via Yoco.

#### Step 3: Configure Your Country
Set your country to load the appropriate compliance rules. Each country has specific requirements we verify:
- **South Africa**: B-BBEE, CSD, Tax Clearance, 80/20 and 90/10 scoring
- **Kenya**: AGPO preferences, PPRA compliance
- **Nigeria**: Local Content Act, BPP compliance
- **Ghana**: PPA regulations, local participation
- **UAE**: In-Country Value requirements
- **UK**: Public Contracts Regulations
- **USA**: FAR/DFAR, SBA preferences
- **Australia**: Commonwealth Procurement Rules, Indigenous Procurement Policy
- **EU Countries**: Public procurement directives
- **Global**: Universal framework for any other country

#### Step 4: Add Your First Vendor
Register vendors by entering their company details and contact information. Upload compliance documents such as:
- Tax clearance certificates
- Company registration documents
- B-BBEE certificates (South Africa)
- Trade licenses
- Insurance certificates

Our AI will automatically analyze and extract key information from each document.

#### Step 5: Create Your First Tender
Set up a tender with requirements and deadlines. Upload tender PDFs and our AI will automatically extract compliance requirements for you. Then publish the tender for vendors to submit bids.

### Setting Up the Vendor Portal

Enable vendors to submit bids online through the Vendor Portal:

1. **Share the Portal Link**: Direct vendors to your portal URL (accessible from the landing page or sidebar).
2. **Vendor Registration**: Vendors register with their company details and WhatsApp number for verification.
3. **WhatsApp Verification**: Vendors receive a one-time password (OTP) via WhatsApp to verify their identity.
4. **Online Submissions**: Once verified, vendors can browse open tenders, check compliance requirements, and submit bids online.
5. **Track Progress**: Vendors can track their submission status and receive messages through the portal.

### Setting Up Email Communications

Configure how your organization sends emails:

1. **Default Email**: Use the VeritasAI email address (veritasai@zd-solutions.com) for instant setup - no configuration needed.
2. **Custom Domain**: Set up your own email domain for branded communications. Navigate to Email Setup to configure DNS records for verification.

### User Roles

VeritasAI supports role-based access control:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features including user management, billing, and system configuration |
| **Owner** | Organization owner with complete control over all settings |
| **Manager** | Manage vendors, tenders, and team members |
| **Analyst** | Review and score bids, run compliance checks |
| **Viewer** | Read-only access to view data and reports |

### Supported Countries

We have pre-configured compliance modules for 70+ countries:
- **All 54 African nations**: South Africa, Kenya, Nigeria, Ghana, Egypt, Morocco, Ethiopia, Tanzania, Uganda, Rwanda, Senegal, and more
- **Europe**: UK, Germany, France, Netherlands, Italy, Spain, Belgium, Portugal, Sweden, Denmark, Poland
- **Asia-Pacific**: Australia, UAE
- **Americas**: United States

Our **Global framework** works for any country not specifically configured. You can customize compliance rules to match your specific requirements.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + K | Open help search |
| Ctrl + / | Show keyboard shortcuts |
| Ctrl + H | Open page help |
| Escape | Close dialogs and panels |
| Ctrl + S | Save current form |
| Ctrl + Enter | Submit form |

---

## System Overview

### What VeritasAI Does

VeritasAI is a multi-tenant SaaS platform designed to automate and streamline procurement compliance. Here is what the platform handles:

1. **Vendor Management**: Maintain a registry of vendors with their compliance documents, contact details, and performance history.
2. **Tender Management**: Create tenders, define requirements, publish them for bid submissions, and manage the entire lifecycle from draft to award.
3. **AI Document Processing**: Automatically analyze uploaded documents to extract data, classify document types, detect fraud indicators, and validate compliance.
4. **Compliance Engine**: Apply country-specific compliance rules to evaluate bids automatically, with configurable rule sets.
5. **Vendor Portal**: Allow vendors to register, browse open tenders, check their compliance status, submit bids, and track their submissions online.
6. **Analytics & Reporting**: Monitor procurement activity with dashboards, trend analysis, and exportable compliance reports.
7. **Email & WhatsApp Communications**: Send award letters, rejection notices, document reminders, and procurement updates via email and WhatsApp.
8. **API Integration**: Connect VeritasAI to your existing systems via REST API for programmatic bid submission, document verification, and event notifications.

### Platform Architecture

- **Multi-Tenant**: Each organization operates in complete isolation with its own data, users, and settings.
- **AI-Powered**: GPT-4o powers document analysis, compliance checking, fraud detection, and the in-app chatbot assistant.
- **Multi-Language**: Processes documents in English, French, Portuguese, and Arabic.
- **Country-Specific**: Pre-configured compliance modules for 70+ countries with customizable rules.
- **Secure**: AES-256-GCM encryption, role-based access control, audit logging, and security headers.

### Typical Workflow

1. **Create Tender** - Upload tender PDF, AI extracts requirements
2. **Publish to Portal** - Vendors browse open tenders on the Vendor Portal
3. **Receive Bids** - Vendors submit via portal, or you receive bids through API
4. **AI Verification** - Documents analyzed for compliance automatically
5. **Compliance Pre-Check** - Traffic-light system (green/amber/red) shows compliance status
6. **Score & Review** - Apply scoring rules, conduct manual review if needed
7. **Award** - Generate letters, send notifications via email/WhatsApp, complete audit trail

---

## Platform Usage

### Core Features

#### Vendor Management
- Register vendors with company details and contact information
- Upload and verify compliance documents (tax clearance, certificates)
- Track document expiry dates with automatic notifications
- View vendor risk scores and compliance history
- Check debarment status against government databases
- Portal-registered vendors can self-manage their profiles

#### Tender Management
- Create tenders with requirements and deadlines
- Upload tender PDFs - AI extracts compliance requirements automatically
- Track tender lifecycle from draft to award
- Define scoring criteria with configurable weights
- Receive and manage bid submissions from the Vendor Portal or manually
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

#### Submissions Management
- Track all bid submissions with status monitoring
- View evaluation scores and compliance results
- Download submission documents
- Generate award and rejection letters from templates or AI

### Best Practices

1. **Keep Documents Updated**: Regularly check for expiring documents and request updates from vendors.
2. **Use Templates**: Create letter templates for common scenarios to save time.
3. **Review AI Results**: While our AI is highly accurate, always review flagged items manually.
4. **Export Reports**: Generate compliance reports before tender close for audit purposes.
5. **Enable the Vendor Portal**: Allow vendors to submit bids online to reduce manual data entry.
6. **Set Up Email**: Configure email notifications to keep vendors informed about tender updates.

---

## Vendor Portal

### Overview

The Vendor Portal is a self-service system that allows vendors to register online, submit quotes and tenders, track their submissions, and communicate with your procurement team. It operates independently from the admin dashboard with its own authentication system.

### How Vendors Access the Portal

Vendors can access the portal through the link on your landing page or by navigating directly to the portal URL. The portal does not require an admin account - vendors use WhatsApp-based authentication.

### Vendor Registration

1. **Enter Company Details**: The vendor fills in their company name, registration number, contact person name, email address, and WhatsApp phone number.
2. **Country Selection**: The vendor selects their country of operation.
3. **WhatsApp Verification**: A one-time password (OTP) is sent to the vendor's WhatsApp number via Twilio. The OTP is valid for 5 minutes.
4. **Account Activation**: Once the OTP is verified, the vendor's portal account is activated and they receive a session token valid for 24 hours.

### Vendor Login

Returning vendors can log in using their WhatsApp number. A new OTP is sent for verification each time they log in.

### Browsing Open Tenders

Once logged in, vendors can:
- View all currently open tenders
- Filter tenders by country
- See tender details including title, description, closing date, and estimated value
- View tender requirements and scoring criteria

### Compliance Pre-Check

Before submitting a bid, vendors can run a compliance pre-check. This uses a traffic-light system:
- **Green**: The vendor has all required documents and meets the requirement
- **Amber**: The vendor partially meets the requirement or has documents expiring soon
- **Red**: The vendor is missing required documents or does not meet the requirement

This helps vendors understand their compliance status before investing time in a full submission.

### Submitting a Bid

1. **Select a Tender**: Choose from the list of open tenders.
2. **Run Pre-Check**: Review your compliance status against tender requirements.
3. **Enter Bid Details**: Provide bid amount and currency.
4. **Upload Documents**: Attach required supporting documents.
5. **Submit**: Confirm and submit your bid for evaluation.

### Tracking Submissions

Vendors can view all their past submissions with:
- Submission date and status (submitted, under review, shortlisted, awarded, rejected)
- Tender details and bid amount
- Evaluation progress

### Portal Messages

Vendors can receive and view messages from the procurement team, including:
- Submission confirmations
- Status updates
- Document requests
- Award and rejection notifications

Messages are delivered via the portal dashboard and optionally through WhatsApp.

### Admin Management

On the admin side, procurement teams can:
- View all portal-registered vendors in the Vendor Messages page
- Send messages to vendors through the system
- Track message delivery status
- Filter messages by vendor, channel, and read status
- Monitor vendor registration activity

### WhatsApp Notifications

VeritasAI uses WhatsApp (via Twilio) to send procurement notifications:
- OTP verification codes for portal login
- Bid received confirmations
- Award notifications
- Rejection notifications
- Document expiry reminders
- General procurement updates

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
- Email notifications (500/month included)
- Basic analytics
- 1 user seat
- Vendor Portal access
- Email support

**Professional** (Everything in Starter, plus:)
- Country-specific compliance modules
- Multi-language support (EN/FR/PT/AR)
- Advanced fraud detection
- Webhook integrations
- WhatsApp notifications
- 5 user seats
- 3,000 emails/month included
- Priority email support

**Enterprise** (Everything in Professional, plus:)
- Custom compliance rule builder
- API access with high rate limits
- Custom email domain setup
- SSO/SAML integration
- Dedicated account manager
- 25 user seats
- 15,000 emails/month included
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
- Yoco local card payments in ZAR (South Africa)
- Invoice/bank transfer (Enterprise and Government plans)

**Usage Tracking**
Your dashboard shows real-time usage including:
- Bids processed this month
- Documents verified
- Storage used
- Emails sent

You'll receive alerts at 80% and 100% of your limits.

**Upgrading**
You can upgrade your plan anytime. The price difference is prorated for the remaining period of your subscription.

**Downgrades**
Downgrades take effect at the next billing cycle to ensure you don't lose access to features mid-cycle.

### Country-Specific Pricing

For countries where VeritasAI is fully launched (e.g., South Africa), pricing is displayed in local currency with local payment methods. For other countries, you can submit an enquiry to express interest and our team will contact you.

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

## Email & Communications

### Email Notifications (SendGrid)

VeritasAI uses SendGrid to send email notifications. Available email types include:
- Award letters to winning vendors
- Rejection letters with feedback
- Document expiry alerts
- Bid received confirmations
- Custom email templates

### Email Domain Options

**Default Email**: Use veritasai@zd-solutions.com with no configuration required. All emails are sent with VeritasAI branding.

**Custom Domain**: Configure your own domain for branded communications:
1. Navigate to Email Setup in the sidebar
2. Enter your domain name
3. Add the provided DNS records (CNAME/DKIM) to your domain registrar
4. Wait for automatic verification (checked every 5 minutes)
5. Once verified, all emails will be sent from your domain

### Email Templates

Create and manage email templates for common communications:
- Use dynamic variables like {{vendor_name}}, {{tender_title}}, {{due_date}}
- Preview templates before sending
- Send to individual vendors or in bulk
- Track delivery, opens, and bounces

### WhatsApp Communications

WhatsApp messages are sent via Twilio for:
- Portal OTP verification
- Bid submission confirmations
- Award and rejection notifications
- Document expiry reminders
- Custom procurement updates

### Monthly Email Limits

| Plan | Included Emails |
|------|----------------|
| Starter | 500/month |
| Professional | 3,000/month |
| Enterprise | 15,000/month |
| Government | Custom |

---

## Security & Compliance

### Data Security
- **Encryption**: AES-256-GCM encryption for all sensitive data at rest
- **Transport**: All connections use HTTPS with TLS 1.2+
- **Security Headers**: HSTS, XSS protection, content type sniffing prevention

### Access Control
- **Role-Based Access (RBAC)**: Five roles with granular permissions (Admin, Owner, Manager, Analyst, Viewer)
- **Multi-Tenant Isolation**: Complete data separation between organizations
- **Session Management**: Secure session handling with automatic expiry
- **API Key Security**: Encrypted storage, per-tenant isolation, configurable rate limits

### Audit & Compliance
- **Audit Logging**: Complete audit trail of all actions including document access, compliance checks, and system changes
- **Data Retention**: Configurable data retention policies
- **Regulatory Compliance**: Designed to support POPIA (South Africa), GDPR (Europe), and other data protection regulations

### Vendor Portal Security
- **WhatsApp OTP**: Two-factor authentication via WhatsApp for vendor access
- **Token Expiry**: Portal session tokens expire after 24 hours
- **OTP Expiry**: One-time passwords expire after 5 minutes
- **Vendor Isolation**: Vendors can only access their own submissions and messages

---

## Frequently Asked Questions

### General

**What is VeritasAI?**
VeritasAI is an AI-powered multi-tenant SaaS platform for bid evaluation and procurement compliance. It helps organizations verify vendor documents, evaluate bids against compliance rules, and manage the entire tender lifecycle.

**Which countries do you support?**
We have pre-configured compliance modules for 70+ countries including all 54 African nations, major European markets, Australia, UAE, UK, and USA. Our Global framework works for any country not specifically configured.

**What languages do you support?**
Our AI can process documents in English, French, Portuguese, and Arabic. The platform interface is currently in English.

### Vendor Portal

**How do vendors access the portal?**
Vendors can access the portal through the link on your landing page or by navigating directly to the portal URL. They register with their company details and WhatsApp number.

**Is WhatsApp required for the Vendor Portal?**
Yes, vendors need a WhatsApp number for identity verification via OTP. This ensures secure access without requiring email-based passwords.

**Can vendors track their submission status?**
Yes, vendors can log into the portal at any time to see the status of all their submissions, including whether they are under review, shortlisted, awarded, or rejected.

**What is the compliance pre-check?**
Before submitting a bid, vendors can run a compliance pre-check that shows a traffic-light assessment (green/amber/red) of their compliance status against the tender requirements. This helps them address gaps before submitting.

**Can I send messages to vendors through the portal?**
Yes, use the Vendor Messages page in the admin dashboard to send messages to portal-registered vendors. Messages appear in the vendor's portal dashboard.

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

You can also use the AI chatbot on any page for instant answers to common questions.

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
*Version: 2.0*
