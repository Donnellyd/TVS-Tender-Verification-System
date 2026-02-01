# GLOBAL-TVS - Global Tender Verification System

## Overview
A comprehensive AI-powered multi-tenant SaaS platform for global bid evaluation and procurement compliance. The system handles vendor management, tender tracking, AI-powered document processing, country-specific compliance rules, and enterprise-grade security with full API integration.

## Current State
- **Status**: Global SaaS Platform MVP (Phase 1-6 Complete)
- **Last Updated**: February 2026
- **Target Markets**: All 54 African nations, Middle East (UAE), with global expansion potential
- **Languages**: English, French, Portuguese, Arabic (EN/FR/PT/AR)

## Platform Architecture

### Multi-Tenant SaaS Features
- **Tenant Isolation**: Complete data separation with tenant_id on all tables
- **Subscription Tiers**: Starter ($499), Professional ($1,999), Enterprise ($4,999), Government ($9,999)
- **Usage-Based Billing**: Track bids, documents, storage, API calls per tenant
- **API Integration**: REST API v1 with API key authentication and OAuth support

### Supported Countries
- **South Africa (ZA)**: BBBEE, CSD, Tax Clearance, 80/20 and 90/10 scoring
- **Kenya (KE)**: AGPO (Youth, Women, PWD preferences), PPRA compliance
- **Nigeria (NG)**: Local Content Act, BPP compliance
- **Ghana (GH)**: PPA regulations, local participation
- **UAE (AE)**: Local ICV requirements
- **UK (UK)**: Public Contracts Regulations
- **USA (US)**: FAR/DFAR, SBA preferences

### Frontend (React + TypeScript)
- **Entry**: `client/src/App.tsx`
- **Pages**: 
  - Core: Landing, Dashboard, Vendors, Tenders, Documents, Compliance, Analytics
  - Admin: Municipalities, Submissions, TenderRequirements
  - SaaS: Billing, ComplianceRules, ApiSettings
  - Communication: EmailTemplates, WhatsappTemplates
  - Public: Pricing, ComplianceExplorer, Help
- **Components**: AppSidebar, PageHeader, StatsCard, StatusBadge, EmptyState, DataTableSkeleton, ThemeToggle, Chatbot
- **Styling**: Tailwind CSS with professional blue/teal color scheme, dark mode support
- **State Management**: TanStack Query for server state
- **Routing**: Wouter

### Backend (Express + TypeScript)
- **Entry**: `server/index.ts`
- **Routes**:
  - `server/routes.ts`: Core CRUD + AI endpoints + analytics
  - `server/tenant-routes.ts`: Multi-tenant, billing, compliance rules
  - `server/api-v1-routes.ts`: External API v1 endpoints
- **Storage**:
  - `server/storage.ts`: Core DatabaseStorage class
  - `server/tenant-storage.ts`: Tenant-specific operations
  - `server/compliance-storage.ts`: Compliance rules engine
- **AI Integration**: 
  - `server/ai-document-processor.ts`: Document analysis, OCR, fraud detection
- **Security**:
  - `server/security-middleware.ts`: Rate limiting, RBAC, audit logging
- **Auth**: Replit Auth integration with session management

### Database (PostgreSQL)
- **Schema**: `shared/schema.ts`
- **Core Tables**: municipalities, vendors, tenders, documents, compliance_rules, compliance_checks, audit_logs, notifications, sessions, users
- **Submission Tables**: tender_requirements, bid_submissions, submission_documents, evaluation_scores, letter_templates, generated_letters
- **Multi-Tenant Tables**: tenants, subscriptions, usage_tracking, invoices, api_keys, tenant_users
- **Compliance Engine Tables**: compliance_rule_sets, compliance_rule_definitions, rule_version_history, rule_execution_logs

### AI-Powered Features
- **Document Analysis**: AI-powered extraction of document data (tax clearance, company registration, BBBEE, etc.)
- **Document Classification**: Automatic detection of document types
- **Fraud Detection**: AI-based detection of document anomalies and fraud indicators
- **Compliance Validation**: Automated validation against configurable compliance rules
- **Multi-Language Support**: Document processing in multiple languages
- **PDF Requirement Extraction**: Upload tender PDF → AI extracts compliance requirements automatically
- **Letter Generation**: AI-powered or template-based award/rejection letter generation
- **AI Chatbot**: GPT-4o powered assistant for answering user questions about the platform

### API v1 Endpoints
- `POST /api/v1/bids`: Submit bid for evaluation
- `GET /api/v1/bids`: List bids with pagination
- `GET /api/v1/bids/:id`: Get bid details and results
- `POST /api/v1/documents/verify`: Verify a single document
- `GET /api/v1/compliance/rules`: List compliance rules by country
- `POST /api/v1/webhooks`: Register webhook endpoints
- `GET /api/v1/usage`: Get current usage stats

### Security Features
- **Rate Limiting**: Configurable per-tenant rate limits
- **RBAC**: Role-based access control (admin, owner, manager, analyst, viewer)
- **Audit Logging**: Complete audit trail of all actions
- **Field Encryption**: AES-256-GCM encryption for sensitive data
- **API Key Management**: Secure API key generation and validation
- **Security Headers**: HSTS, XSS protection, content type sniffing prevention

## Development Commands
- `npm run dev`: Start development server
- `npm run db:push`: Push schema changes to database
- `npm run db:push --force`: Force push schema changes

## Recent Changes
- Added multi-tenant architecture with complete tenant isolation
- Implemented subscription billing with 4 tiers ($499-$9,999/year)
- Created country-specific compliance modules (ZA, KE, NG, GH, AE, UK, US) with GLOBAL fallback
- Built AI document processing pipeline with multi-language support (EN/FR/PT/AR)
- Added API v1 for external integrations
- Built Country Compliance Explorer page with interactive country selector and detailed compliance info
- Added Help/Documentation page with 5 tabs (Getting Started, Billing, Platform Usage, API, FAQ)
- Integrated AI Chatbot (GPT-4o) as floating widget on all pages for user assistance
- Implemented security middleware (rate limiting, RBAC, audit logging)
- Updated branding to "GLOBAL-TVS" with Pan-African messaging
- Added Pricing page with subscription tier comparison
- Added language preferences to tenant configuration
- Added payment method placeholder for Stripe integration
- Configured autoscale deployment for production
