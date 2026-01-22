# Tender Vetting and Verification System (TVS)

## Overview
A comprehensive procurement management system for South African municipalities. The system handles vendor management, tender tracking, compliance checks, document verification, and analytics dashboards with full CRUD operations.

## Current State
- **Status**: MVP Complete
- **Last Updated**: January 2026

## Project Architecture

### Frontend (React + TypeScript)
- **Entry**: `client/src/App.tsx`
- **Pages**: Landing, Dashboard, Vendors, Tenders, Documents, Compliance, Analytics, Municipalities
- **Components**: AppSidebar, PageHeader, StatsCard, StatusBadge, EmptyState, DataTableSkeleton, ThemeToggle
- **Styling**: Tailwind CSS with professional blue/teal government color scheme, dark mode support
- **State Management**: TanStack Query for server state
- **Routing**: Wouter

### Backend (Express + TypeScript)
- **Entry**: `server/index.ts`
- **Routes**: `server/routes.ts` - Full CRUD for all entities + analytics endpoints
- **Storage**: `server/storage.ts` - DatabaseStorage class with PostgreSQL
- **Auth**: Replit Auth integration with session management

### Database (PostgreSQL)
- **Schema**: `shared/schema.ts`
- **Tables**: municipalities, vendors, tenders, documents, compliance_rules, compliance_checks, audit_logs, notifications, sessions, users

### SA-Specific Features
- CSD ID verification fields
- VAT status checking
- BBBEE certificate tracking (Levels 1-8 + Non-Compliant)
- Tax clearance validation with expiry dates
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

## Recent Changes
- Added global 401 handling for queries and mutations
- Enhanced schema validation with SA-specific enums
- Implemented stricter validation on insert schemas with min length, email, and enum constraints
