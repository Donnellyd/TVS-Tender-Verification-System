# VeritasAI - VeritasAI

## Overview
VeritasAI is a comprehensive AI-powered multi-tenant SaaS platform designed for global bid evaluation and procurement compliance. It streamlines vendor management, tender tracking, and ensures adherence to country-specific compliance rules. The platform leverages AI for document processing, including extraction, classification, and fraud detection, and features enterprise-grade security with full API integration. Its primary purpose is to serve governments and large enterprises in managing complex procurement processes, initially targeting African nations and the Middle East with a vision for global expansion.

## User Preferences
I prefer iterative development with clear communication at each step.
I want to be asked before any major architectural changes are made.
I prefer detailed explanations for complex features and design choices.
Do not make changes to the `server/stripe*.ts` files or `docs/stripe-setup-guide.md` as they are preserved for future re-integration.

## System Architecture

### Multi-Tenant SaaS Features
The platform supports multi-tenancy with complete data isolation via a `tenant_id` on all tables. It offers subscription tiers (Starter, Professional, Enterprise, Government) and implements usage-based billing for bids, documents, storage, and API calls. A REST API v1 is available with API key authentication and OAuth support.

### Frontend (React + TypeScript)
The frontend, developed with React and TypeScript, utilizes Tailwind CSS for styling with a professional blue/teal color scheme and dark mode support. State management is handled by TanStack Query, and Wouter is used for routing. Key pages include Dashboard, Vendors, Tenders, Documents, Compliance, Analytics, and a dedicated Vendor Portal. Core UI components provide a consistent user experience, including a chatbot, help manual, and guided tours.

### Backend (Express + TypeScript)
The backend is built with Express and TypeScript, organizing routes for core CRUD operations, AI endpoints, analytics, multi-tenancy, billing, and external API v1. It integrates with an AI document processor for analysis, OCR, and fraud detection. Security features include rate limiting, RBAC, audit logging, and field encryption. Authentication is managed via Replit Auth with session management.

### Database (PostgreSQL)
The PostgreSQL database schema supports core entities like municipalities, vendors, tenders, documents, and compliance rules. It includes specific tables for submission management, multi-tenancy (tenants, subscriptions, usage_tracking), and a robust compliance engine.

### AI-Powered Features
The platform incorporates advanced AI for:
- **Document Analysis**: Extraction of critical data from various document types.
- **Document Classification**: Automatic categorization of uploaded documents.
- **Fraud Detection**: Identification of anomalies and fraud indicators in documents.
- **Compliance Validation**: Automated checks against configurable compliance rules.
- **Multi-Language Support**: Processing documents in English, French, Portuguese, and Arabic.
- **PDF Requirement Extraction**: AI-driven extraction of compliance requirements from tender PDFs.
- **Letter Generation**: AI-powered or template-based generation of award/rejection letters.
- **AI Chatbot**: A GPT-4o powered assistant for user support.

### Security Features
Enterprise-grade security is implemented through:
- Configurable per-tenant rate limiting.
- Role-based access control (RBAC) with distinct roles.
- Comprehensive audit logging of all user actions.
- AES-256-GCM encryption for sensitive data.
- Secure API key management.
- Implementation of security headers (HSTS, XSS protection).

### Comprehensive Help System
A robust help system provides:
- Context-sensitive help accessible from each page.
- A global search functionality for help content.
- Keyboard shortcuts and an interactive guided tour for new users.
- Field-level help and status explanations.

### Multi-Phase Evaluation System
A comprehensive evaluation engine supporting:
- **Automated Scoring**: Reusable scoring templates with weighted criteria, auto-scoring for price/BBBEE/compliance
- **Multi-Level Adjudication**: Configurable 2-3 level approval workflows (Level 1 automated compliance, Level 2+ manual review)
- **Evaluation Committees**: Independent scoring by committee members with weighted aggregation
- **Panel Sessions**: Real-time synchronized voting for 8-10 panelists with facilitator/projector view
- **Comparative Bid Analysis**: Side-by-side bid comparison with charts and price analysis
- **Tables**: scoring_templates, adjudication_configs/assignments/decisions, evaluation_committees/members/scores, panel_sessions/members/votes

### Vendor Experience Features
- **Document Vault**: Persistent document storage per vendor with categorization, expiry tracking, and verification status
- **Document Expiry Alerts**: Automated tracking with WhatsApp/email notification scheduling (30/14/7 days, expired)
- **Tender Q&A System**: Structured clarification Q&A on active tenders with public/private visibility
- **Bid Status Timeline**: Visual progress tracker showing submission through adjudication to award
- **Tables**: vendor_document_vault, document_expiry_alerts, tender_clarifications

### Analytics & Reporting
- **Spend Analytics**: Monthly trends, category breakdown, top vendor analysis with interactive charts
- **Vendor Performance**: Win rates, compliance rates, performance ratings across all vendors
- **Report Builder**: Custom reports from any data source with column selection, filters, CSV/JSON/TXT export
- **Audit Trail Export**: Full audit log with date/action/user filters and downloadable exports
- **Tender Calendar**: Month/list view of all tender deadlines and milestones

### Platform Configuration
- **Notification Workflows**: Configurable automated notification triggers for document expiry, bid received, tender closing, award decisions
- **White-Label Portal**: Tenant branding customization (logo, colors, content, domain)
- **Mobile PWA Settings**: Progressive Web App configuration and installation guides

### Vendor Portal System
The Vendor Portal allows vendors to register, submit bids, and track submissions. It uses WhatsApp OTP for authentication, offers a compliance pre-check, and supports online award acceptance with digital signatures.

### Country Launch Control System
A phased country-by-country rollout is managed through a control system, allowing activation of full payment capabilities or "enquiry-only" status based on country readiness.

## External Dependencies

- **SendGrid**: For email notifications, including templated emails, bulk sending, and domain authentication.
- **Yoco**: Integrated for local card payments in South Africa (ZAR).
- **Twilio**: Used for WhatsApp OTP verification in the Vendor Portal.
- **ip-api.com**: For IP geolocation to automatically detect user country.
- **GPT-4o**: Powers the AI chatbot for user assistance.