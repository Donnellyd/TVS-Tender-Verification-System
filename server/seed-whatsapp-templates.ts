import { storage } from "./storage";
import type { InsertWhatsappTemplate } from "@shared/schema";

const whatsappTemplates: InsertWhatsappTemplate[] = [
  {
    name: "Tender Published",
    trigger: "tender_published",
    body: `New Tender Alert!

Tender: [TenderNo]
Title: [TenderTitle]
Closing: [ClosingDate]

Visit the TVS portal to view full details and submit your bid.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Closing Soon Reminder",
    trigger: "tender_closing_soon",
    body: `Reminder: [TenderNo] closes soon!

Title: [TenderTitle]
Closing Date: [ClosingDate]

Don't miss the deadline - submit your bid now.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Tender Closed",
    trigger: "tender_closed",
    body: `Tender [TenderNo] is now closed.

Title: [TenderTitle]

Your submission has been received. We will notify you once evaluation is complete.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Under Evaluation",
    trigger: "under_evaluation",
    body: `Dear [VendorName],

Your bid for [TenderNo] is currently under evaluation.

We will notify you of the outcome in due course.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Clarification Requested",
    trigger: "clarification_requested",
    body: `Action Required: [TenderNo]

Dear [VendorName],

We require clarification on your bid submission. Please log in to the TVS portal to view the request and respond within the specified timeframe.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Shortlisted Notification",
    trigger: "shortlisted",
    body: `Congratulations [VendorName]!

You have been shortlisted for tender [TenderNo].

Title: [TenderTitle]

Further instructions will follow.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Standstill Period Notice",
    trigger: "standstill_period",
    body: `Standstill Period - [TenderNo]

Dear [VendorName],

A 10-day standstill period has commenced for [TenderNo]. The final award decision will be communicated after this period ends.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Award Notification",
    trigger: "awarded",
    body: `Congratulations [VendorName]!

We are pleased to inform you that your bid for [TenderNo] has been successful.

Amount: R[Amount]

Contract documentation will follow shortly.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Unsuccessful Notification",
    trigger: "unsuccessful",
    body: `Dear [VendorName],

Thank you for your participation in [TenderNo].

We regret to inform you that your bid was not successful on this occasion. You may request a debrief meeting through the portal.

We encourage you to participate in future opportunities.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Tender Cancelled",
    trigger: "tender_cancelled",
    body: `Notice: [TenderNo] Cancelled

Dear [VendorName],

We regret to inform you that tender [TenderNo] has been cancelled.

For any queries, please contact the procurement office.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Submission Received",
    trigger: "submission_received",
    body: `Submission Confirmed

Dear [VendorName],

Your bid for [TenderNo] has been received successfully.

Reference: [TenderNo]
Amount: R[Amount]
Date: [ClosingDate]

[Municipality]`,
    isActive: true,
  },
  {
    name: "Document Verified",
    trigger: "document_verified",
    body: `Document Verified

Dear [VendorName],

Your document submission for [TenderNo] has been verified and approved.

[Municipality]`,
    isActive: true,
  },
  {
    name: "Document Rejected",
    trigger: "document_rejected",
    body: `Document Issue - [TenderNo]

Dear [VendorName],

A document in your submission for [TenderNo] requires attention. Please log in to the portal to view details and re-upload.

[Municipality]`,
    isActive: true,
  },
];

export async function seedWhatsappTemplates() {
  console.log("Seeding WhatsApp templates...");
  
  for (const template of whatsappTemplates) {
    try {
      await storage.createWhatsappTemplate(template);
      console.log(`Created: ${template.name}`);
    } catch (error) {
      console.error(`Failed to create ${template.name}:`, error);
    }
  }
  
  console.log("WhatsApp templates seeding complete.");
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedWhatsappTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
