# Tender Vetting and Verification System (TVS)

## Overview
A comprehensive procurement management system for South African municipalities. The system handles vendor management, tender tracking, AI-powered compliance checking, document verification, bid submission workflow, and analytics dashboards with full CRUD operations.

## Current State
- **Status**: MVP Complete with AI-Powered Tender Workflow
- **Last Updated**: January 2026

## Project Architecture

### Frontend (React + TypeScript)
- **Entry**: `client/src/App.tsx`
- **Pages**: Landing, Dashboard, Vendors, Tenders, Documents, Compliance, Analytics, Municipalities, Submissions, TenderRequirements
- **Components**: AppSidebar, PageHeader, StatsCard, StatusBadge, EmptyState, DataTableSkeleton, ThemeToggle
- **Styling**: Tailwind CSS with professional blue/teal government color scheme, dark mode support
- **State Management**: TanStack Query for server state
- **Routing**: Wouter

### Backend (Express + TypeScript)
- **Entry**: `server/index.ts`
- **Routes**: `server/routes.ts` - Full CRUD for all entities + AI endpoints + analytics
- **Storage**: `server/storage.ts` - DatabaseStorage class with PostgreSQL
- **Auth**: Replit Auth integration with session management
- **AI Integration**: OpenAI gpt-4o for PDF requirement extraction and letter generation
- **PDF Processing**: pdf-parse for extracting text from uploaded tender documents

### Database (PostgreSQL)
- **Schema**: `shared/schema.ts`
- **Core Tables**: municipalities, vendors, tenders, documents, compliance_rules, compliance_checks, audit_logs, notifications, sessions, users
- **Submission Tables**: tender_requirements, bid_submissions, submission_documents, evaluation_scores, letter_templates, generated_letters

### AI-Powered Features
- **PDF Requirement Extraction**: Upload tender PDF → AI extracts compliance requirements automatically
- **Automated Compliance Checking**: Verify vendor documents against tender requirements
- **Letter Generation**: AI-powered or template-based award/rejection letter generation
- **B-BBEE Points Calculator**: Support for 80/20 (under R50M) and 90/10 (over R50M) preferential scoring systems

### SA-Specific Features
- CSD ID verification (max 10 days old requirement)
- Tax Clearance PIN verification with SARS
- BBBEE certificate tracking (Levels 1-8 + Non-Compliant) with preferential points
- COIDA Letter of Good Standing
- Municipal Rates Clearance (max 90 days old)
- Public Liability Insurance (minimum R5M cover)
- Audited Financials (3 years)
- Declaration of Interest forms
- Bid Defaulters Register check
- Debarment status tracking
- PFMA/MFMA compliance alignment

### Authentication
- Replit Auth for user authentication
- Session-based authentication with PostgreSQL storage
- Global 401 handling with automatic redirect to login

## Key Files
- `shared/schema.ts` - Database schema with Zod validation
- `server/routes.ts` - API endpoints with auth middleware
- `server/storage.ts` - Database operations (CRUD + analytics)
- `client/src/App.tsx` - Main app with routing and sidebar
- `client/src/lib/queryClient.ts` - React Query setup with auth handling

## Validation Enums
- vendorStatusEnum: pending, approved, suspended, debarred
- tenderStatusEnum: open, closed, under_review, awarded, cancelled
- tenderTypeEnum: RFQ, RFP, RFT, EOI
- bbbeeeLevelEnum: Level 1-8, Non-Compliant
- documentTypeEnum: VAT Certificate, Tax Clearance, BBBEE Certificate, etc.
- verificationStatusEnum: pending, verified, rejected, expired
- complianceResultEnum: passed, failed, pending, flagged

## Running the Project
```bash
npm run dev
```
Starts Express backend and Vite frontend on port 5000.

## Database Commands
```bash
npm run db:push  # Push schema changes
```

### WhatsApp Notifications (Twilio Integration)
- **Service**: `server/notifications.ts` - Twilio WhatsApp notification service
- **Templates**: CRUD for WhatsApp templates with trigger-based messaging
- **Notification Triggers**: tender_published, tender_closing_soon, tender_closed, under_evaluation, clarification_requested, shortlisted, standstill_period, awarded, unsuccessful, tender_cancelled, submission_received, document_verified, document_rejected
- **Placeholders**: [VendorName], [TenderNo], [TenderTitle], [ClosingDate], [Amount], [Status], [Municipality], [ContactPhone]
- **API Endpoints**:
  - `GET /api/notifications/whatsapp/test` - Test Twilio connection
  - `POST /api/notifications/whatsapp/send` - Send single notification
  - `POST /api/notifications/whatsapp/send-bulk` - Send bulk notifications
  - `POST /api/notifications/tender-status-change` - Trigger notifications on status change
- **Database Tables**: whatsapp_templates, notification_settings, notification_logs
- **Vendor Opt-in**: whatsappPhone, whatsappOptIn fields on vendors table

### Environment Variables (Secrets)
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_WHATSAPP_NUMBER` - WhatsApp-enabled Twilio number

## Recent Changes
- Added WhatsApp notification system with Twilio integration
- Created WhatsApp Templates page for managing notification templates
- Implemented 13 notification triggers for tender lifecycle events
- Added vendor WhatsApp opt-in fields for communication preferences
- Added notification logging for delivery tracking and audit trail
- Added AI-powered PDF parsing for automatic tender requirement extraction
- Implemented bid submission tracking with workflow stages (draft → submitted → auto_checking → manual_review → passed/failed → awarded)
- Created automated compliance checking engine with document verification
- Added letter template system with AI-powered generation for award/rejection letters
- Implemented B-BBEE preferential points calculator (80/20 and 90/10 systems)
- Added 6 new database tables for submission workflow
- Created seed script with realistic SA municipal tender data
