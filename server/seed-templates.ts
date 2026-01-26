import { db } from "./db";
import { letterTemplates } from "@shared/schema";

const communicationTemplates = [
  {
    name: "Not Shortlisted / Tender Declined",
    letterType: "not_shortlisted",
    subject: "[TenderNo] – Outcome of your tender submission",
    bodyTemplate: `Dear [BidderName],

Thank you for your submission in response to [TenderTitle] [TenderNo]. After careful evaluation, your tender has not been shortlisted for the next stage.

We appreciate your effort and encourage you to participate in future opportunities. If you would like feedback on your submission, you may request a debriefing within [X] days of this notice.

Kind regards,
[YourName]
[Position]
[Organisation]
[ContactDetails]`,
    isDefault: true,
  },
  {
    name: "Shortlisted for Evaluation (Stage 2)",
    letterType: "shortlisted",
    subject: "[TenderNo] – Shortlisted for Stage 2 – next steps",
    bodyTemplate: `Dear [BidderName],

We are pleased to inform you that your tender for [TenderTitle] [TenderNo] has been shortlisted for the next stage of evaluation. Please provide any requested clarifications or additional information by [Date].

Next steps will include [e.g., a site visit, presentations, or additional documentation]. We will confirm a schedule in due course.

Best regards,
[YourName]
[Position]
[Organisation]`,
    isDefault: true,
  },
  {
    name: "Request for Clarification (RFC)",
    letterType: "request_clarification",
    subject: "[TenderNo] – Clarification required",
    bodyTemplate: `Dear [BidderName],

To complete the evaluation of your tender for [TenderTitle] [TenderNo], please provide the following clarifications by [Date]:

[Clarification item 1]
[Clarification item 2]
[Any supporting documents]

Please submit in the format requested in the tender documents. Thank you for your prompt attention.

Kind regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Request for Additional Information (RFI)",
    letterType: "request_information",
    subject: "[TenderNo] – Additional information required",
    bodyTemplate: `Dear [BidderName],

As part of the evaluation process for [TenderTitle] [TenderNo], please supply the following information by [Date]:

[Item 1]
[Item 2]
[Item 3]

This information will assist us in completing the evaluation.

Best regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Addendum or Amendment to Tender",
    letterType: "addendum",
    subject: "[TenderNo] – Addendum/Clarification issued",
    bodyTemplate: `Dear [BidderName],

Please be advised of Addendum/Clarification No. [X] for [TenderTitle] [TenderNo]. The addendum contains [brief description of changes] and must be considered in your submission.

Please acknowledge receipt and include any required adjustments in your proposal by [Date].

Regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Extension of Tender Closing Date",
    letterType: "extension",
    subject: "[TenderNo] – Extension of closing date",
    bodyTemplate: `Dear [BidderName],

In response to participant requests, the closing date for [TenderTitle] [TenderNo] has been extended to [NewDate]. Please ensure your submission is received by this new deadline.

Best wishes,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Non-Compliant Bid",
    letterType: "non_compliant",
    subject: "[TenderNo] – Non-compliant bid status",
    bodyTemplate: `Dear [BidderName],

After screening, your submission for [TenderTitle] [TenderNo] has been determined non-compliant due to [reason]. As a result, it will not proceed to the evaluation stage.

If you believe this assessment is in error, you may request a formal reconsideration by [Date].

Sincerely,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Standstill Notification",
    letterType: "standstill_notice",
    subject: "[TenderNo] – Standstill period notice",
    bodyTemplate: `Dear [BidderName],

Please be advised that a standstill period of [X] days applies to the award of [TenderTitle] [TenderNo]. No contract will be awarded during this period.

If you wish to submit additional information or request a debrief, please do so within the standstill window.

Regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Award Notification",
    letterType: "award",
    subject: "[TenderNo] – Tender Award Notice",
    bodyTemplate: `Dear [BidderName],

We are pleased to inform you that your tender for [TenderTitle] [TenderNo] has been awarded. The contract details are as follows:

Contractor: [ContractorName]
Contract value: [Currency + Amount]
Start date: [Date]
Standstill period: [Date] to [Date]

Please review the attached contract and return acceptance by [Date]. If you wish to request a debrief or clarification, you may do so within [X] days.

Congratulations,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Standstill Expiry / Debrief Invitation",
    letterType: "standstill_expiry",
    subject: "[TenderNo] – Standstill expiry and debrief invitation",
    bodyTemplate: `Dear [BidderName],

The standstill period for [TenderTitle] [TenderNo] has ended. If you would like a debrief on the evaluation and award decision, we invite you to a debrief session on [Date/Time] at [Venue/Link]. Please confirm attendance by [Date].

Kind regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Debrief Invitation (Vendor-Initiated)",
    letterType: "debrief_invitation",
    subject: "Debrief request – [TenderTitle] [TenderNo]",
    bodyTemplate: `Dear [BidderName],

You requested a debrief for [TenderTitle] [TenderNo]. We can provide feedback on evaluation criteria, scoring, and areas for improvement. Please propose preferred dates/times, and we'll schedule a session.

Best regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Debrief Response (Proactive Feedback)",
    letterType: "debrief_response",
    subject: "Debrief for [TenderTitle] [TenderNo]",
    bodyTemplate: `Dear [BidderName],

Thank you for attending the debrief session. Here are the key takeaways and suggestions for improvement:

[Feedback point 1]
[Feedback point 2]
[Next steps or resources]

If you'd like further assistance, please reach out.

Best regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Tender Cancellation",
    letterType: "tender_cancelled",
    subject: "[TenderNo] – Tender cancelled",
    bodyTemplate: `Dear [BidderName],

We regret to inform you that [TenderTitle] [TenderNo] has been cancelled. This decision was made after careful consideration of [brief reason]. You may be notified if a new tender is issued for the same scope.

Thank you for your interest.

Kind regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Correction Notice (Tender Documents)",
    letterType: "correction_notice",
    subject: "[TenderNo] – Correction to tender documents",
    bodyTemplate: `Dear [BidderName],

Please note a correction to the tender documents for [TenderTitle] [TenderNo]: [Describe correction]. The closing date remains [Date] unless otherwise updated.

Please acknowledge receipt and adjust your submission accordingly.

Sincerely,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Re-Tender (Following Cancellation)",
    letterType: "re_tender",
    subject: "[TenderNo] – New tender issued for [scope] (re-bid)",
    bodyTemplate: `Dear [BidderName],

A new tender for [scope] has been issued following the cancellation of [Previous TenderNo]. Details are available at [Link]. We invite you to submit proposals by the new closing date [Date].

Best regards,
[YourName]`,
    isDefault: true,
  },
  {
    name: "Rejection Letter",
    letterType: "rejection",
    subject: "[TenderNo] – Tender Rejection Notice",
    bodyTemplate: `Dear [BidderName],

Thank you for your submission for [TenderTitle] [TenderNo]. After careful evaluation, we regret to inform you that your tender has not been successful on this occasion.

The successful bidder was selected based on the published evaluation criteria. If you would like to request feedback on your submission, please contact us within [X] days.

We appreciate your interest and encourage you to participate in future tender opportunities.

Kind regards,
[YourName]
[Position]
[Organisation]`,
    isDefault: true,
  },
  {
    name: "Disqualification Notice",
    letterType: "disqualification",
    subject: "[TenderNo] – Tender Disqualification Notice",
    bodyTemplate: `Dear [BidderName],

Following our review of submissions for [TenderTitle] [TenderNo], we must inform you that your tender has been disqualified from the evaluation process.

The reason for disqualification is: [Reason for disqualification]

This decision was made in accordance with the tender requirements and applicable procurement regulations. If you believe this decision was made in error, you may submit a formal objection within [X] days of this notice.

Sincerely,
[YourName]
[Position]
[Organisation]`,
    isDefault: true,
  },
];

async function seedTemplates() {
  console.log("Seeding communication templates...");
  
  for (const template of communicationTemplates) {
    try {
      await db.insert(letterTemplates).values(template).onConflictDoNothing();
      console.log(`  Added template: ${template.name}`);
    } catch (error) {
      console.log(`  Skipped (may already exist): ${template.name}`);
    }
  }
  
  console.log("Template seeding complete!");
}

seedTemplates().catch(console.error);
