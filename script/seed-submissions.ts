import { db } from "../server/db";
import { 
  municipalities, 
  vendors, 
  tenders, 
  tenderRequirements,
  bidSubmissions,
  submissionDocuments,
  letterTemplates,
  tenderScoringCriteria,
  evaluationScores
} from "../shared/schema";
import { sql, eq } from "drizzle-orm";

async function seed() {
  console.log("Starting seed for submission workflow...");

  // Create sample municipality if not exists
  const [existingMunicipality] = await db.select().from(municipalities).limit(1);
  let municipalityId = existingMunicipality?.id;

  if (!municipalityId) {
    const [newMunicipality] = await db.insert(municipalities).values({
      name: "City of Johannesburg Metropolitan Municipality",
      code: "JHB",
      province: "Gauteng",
      contactEmail: "procurement@joburg.org.za",
      contactPhone: "+27 11 407 6111",
      address: "Metropolitan Centre, 158 Civic Boulevard, Braamfontein, Johannesburg",
      status: "active",
    }).returning();
    municipalityId = newMunicipality.id;
    console.log("Created municipality:", newMunicipality.name);
  }

  // Create sample vendors
  const vendorData = [
    {
      companyName: "ABC Construction (Pty) Ltd",
      tradingName: "ABC Construction",
      registrationNumber: "2015/123456/07",
      vatNumber: "4850123456",
      csdId: "MAAA0012345678",
      bbbeeLevel: "Level 1",
      contactPerson: "John Mokoena",
      contactEmail: "john@abcconstruction.co.za",
      contactPhone: "0112345678",
      physicalAddress: "123 Main Road, Sandton, Johannesburg",
      status: "approved",
      debarmentStatus: "clear",
      municipalityId,
    },
    {
      companyName: "XYZ Services CC",
      tradingName: "XYZ Services",
      registrationNumber: "2018/654321/23",
      vatNumber: "4850654321",
      csdId: "MAAA0087654321",
      bbbeeLevel: "Level 3",
      contactPerson: "Sarah Ndlovu",
      contactEmail: "sarah@xyzservices.co.za",
      contactPhone: "0119876543",
      physicalAddress: "456 Oak Avenue, Pretoria",
      status: "approved",
      debarmentStatus: "clear",
      municipalityId,
    },
    {
      companyName: "Kgotso Consulting Engineers",
      tradingName: "Kgotso Engineers",
      registrationNumber: "2020/789012/07",
      vatNumber: "4850789012",
      csdId: "MAAA0056789012",
      bbbeeLevel: "Level 2",
      contactPerson: "Thabo Kgotso",
      contactEmail: "thabo@kgotsoconsulting.co.za",
      contactPhone: "0123456789",
      physicalAddress: "789 Engineering Lane, Centurion",
      status: "approved",
      debarmentStatus: "clear",
      municipalityId,
    },
  ];

  const createdVendors: any[] = [];
  for (const vendor of vendorData) {
    const [existingVendor] = await db.select().from(vendors).where(sql`${vendors.registrationNumber} = ${vendor.registrationNumber}`);
    if (!existingVendor) {
      const [newVendor] = await db.insert(vendors).values(vendor).returning();
      createdVendors.push(newVendor);
      console.log("Created vendor:", newVendor.companyName);
    } else {
      createdVendors.push(existingVendor);
    }
  }

  // Create sample tender
  const tenderData = {
    tenderNumber: "SCM/JHB/2024/001",
    title: "Supply and Delivery of Construction Materials for Road Rehabilitation Project",
    description: "The City of Johannesburg invites bids from registered and compliant suppliers for the supply and delivery of construction materials including aggregate, bitumen, and road marking paint for the rehabilitation of Soweto roads.",
    tenderType: "RFQ",
    category: "Construction",
    estimatedValue: 25000000,
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    openingDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
    status: "open",
    priority: "high",
    municipalityId,
    issuer: "City of Johannesburg Supply Chain Management",
    bbbeeRequirement: "Level 4 or higher",
    localContentRequirement: 30,
  };

  const [existingTender] = await db.select().from(tenders).where(sql`${tenders.tenderNumber} = ${tenderData.tenderNumber}`);
  let tender;
  if (!existingTender) {
    [tender] = await db.insert(tenders).values(tenderData).returning();
    console.log("Created tender:", tender.tenderNumber);
  } else {
    tender = existingTender;
    console.log("Tender already exists:", tender.tenderNumber);
  }

  // Create tender requirements (based on real SA municipal tender requirements)
  const requirementsData = [
    {
      tenderId: tender.id,
      requirementType: "CSD Registration",
      description: "Valid Central Supplier Database (CSD) registration report not older than 10 days from the closing date of this bid",
      isMandatory: true,
      maxAgeDays: 10,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "Tax Clearance",
      description: "Valid SARS Tax Clearance Certificate or Tax Compliance Status (TCS) PIN verification",
      isMandatory: true,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "BBBEE Certificate",
      description: "Valid B-BBEE Status Level Certificate or sworn affidavit (for EMEs and QSEs). Minimum Level 4 required for preference points.",
      isMandatory: true,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "Company Registration",
      description: "CIPC company registration documents (CK1/CM1/CM29 or Company Profile)",
      isMandatory: true,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "COIDA Certificate",
      description: "Compensation for Occupational Injuries and Diseases Act (COIDA) Letter of Good Standing",
      isMandatory: true,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "Public Liability Insurance",
      description: "Valid Public Liability Insurance cover of minimum R5,000,000",
      isMandatory: true,
      minValue: 5000000,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "Municipal Rates Clearance",
      description: "Original municipal rates clearance certificate not older than 3 months",
      isMandatory: true,
      maxAgeDays: 90,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "Audited Financials",
      description: "Audited financial statements for the past 3 financial years",
      isMandatory: true,
      validityPeriod: "3 years",
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "Declaration of Interest",
      description: "Completed and signed SBD 4 - Declaration of Interest form",
      isMandatory: true,
      aiExtracted: false,
    },
    {
      tenderId: tender.id,
      requirementType: "Bid Defaulters Check",
      description: "Confirmation of non-listing on National Treasury Restricted Suppliers Database and Bid Defaulters Register",
      isMandatory: true,
      aiExtracted: false,
    },
  ];

  for (const req of requirementsData) {
    const [existingReq] = await db.select().from(tenderRequirements)
      .where(sql`${tenderRequirements.tenderId} = ${req.tenderId} AND ${tenderRequirements.requirementType} = ${req.requirementType}`);
    if (!existingReq) {
      await db.insert(tenderRequirements).values(req);
      console.log("Created requirement:", req.requirementType);
    }
  }

  // Create sample bid submissions
  if (createdVendors.length >= 2) {
    const submissionsData = [
      {
        tenderId: tender.id,
        vendorId: createdVendors[0].id,
        submissionDate: new Date(),
        status: "submitted",
        bidAmount: 22500000,
        scoringSystem: "80/20",
        complianceResult: "pending",
      },
      {
        tenderId: tender.id,
        vendorId: createdVendors[1].id,
        submissionDate: new Date(),
        status: "draft",
        bidAmount: 24800000,
        scoringSystem: "80/20",
        complianceResult: "pending",
      },
    ];

    const createdSubmissions: any[] = [];
    for (const sub of submissionsData) {
      const [existingSub] = await db.select().from(bidSubmissions)
        .where(sql`${bidSubmissions.tenderId} = ${sub.tenderId} AND ${bidSubmissions.vendorId} = ${sub.vendorId}`);
      if (!existingSub) {
        const [newSub] = await db.insert(bidSubmissions).values(sub).returning();
        createdSubmissions.push(newSub);
        console.log("Created submission for vendor:", sub.vendorId);
      } else {
        createdSubmissions.push(existingSub);
      }
    }

    // Create scoring criteria for the tender (SA preferential procurement standard)
    const scoringCriteriaData = [
      {
        tenderId: tender.id,
        criteriaName: "Price",
        criteriaCategory: "Price",
        description: "Price points calculated using 80/20 formula: Ps = 80(1 - (Pt - Pmin)/Pmin) where Pt is bid price and Pmin is lowest acceptable bid",
        maxScore: 80,
        weight: 1,
        sortOrder: 1,
        aiExtracted: false,
      },
      {
        tenderId: tender.id,
        criteriaName: "B-BBEE Status Level",
        criteriaCategory: "BBBEE",
        description: "B-BBEE preference points as per Preferential Procurement Regulations: Level 1 = 20pts, Level 2 = 18pts, Level 3 = 14pts, Level 4 = 12pts, etc.",
        maxScore: 20,
        weight: 1,
        sortOrder: 2,
        aiExtracted: false,
      },
      {
        tenderId: tender.id,
        criteriaName: "Technical Capability",
        criteriaCategory: "Technical",
        description: "Demonstrated experience and technical capacity to deliver the required goods/services",
        maxScore: 30,
        weight: 1,
        sortOrder: 3,
        aiExtracted: false,
      },
      {
        tenderId: tender.id,
        criteriaName: "Previous Experience",
        criteriaCategory: "Experience",
        description: "Proven track record with similar projects in the past 5 years",
        maxScore: 25,
        weight: 1,
        sortOrder: 4,
        aiExtracted: false,
      },
      {
        tenderId: tender.id,
        criteriaName: "Local Content",
        criteriaCategory: "Local Content",
        description: "Percentage of local content in goods/services as per designated sectors",
        maxScore: 15,
        weight: 1,
        sortOrder: 5,
        aiExtracted: false,
      },
      {
        tenderId: tender.id,
        criteriaName: "Quality Management",
        criteriaCategory: "Quality",
        description: "ISO certification or equivalent quality management systems in place",
        maxScore: 10,
        weight: 1,
        sortOrder: 6,
        aiExtracted: false,
      },
    ];

    for (const criteria of scoringCriteriaData) {
      const [existingCriteria] = await db.select().from(tenderScoringCriteria)
        .where(sql`${tenderScoringCriteria.tenderId} = ${criteria.tenderId} AND ${tenderScoringCriteria.criteriaName} = ${criteria.criteriaName}`);
      if (!existingCriteria) {
        await db.insert(tenderScoringCriteria).values(criteria);
        console.log("Created scoring criteria:", criteria.criteriaName);
      }
    }

    // Create evaluation scores for the first submission (ABC Construction - Level 1 B-BBEE)
    if (createdSubmissions.length > 0) {
      const submission1 = createdSubmissions[0];
      const submission1Scores = [
        {
          submissionId: submission1.id,
          criteriaName: "Price",
          criteriaCategory: "Price",
          maxScore: 80,
          score: 80, // Lowest price gets max points
          weight: 1,
          comments: "Lowest acceptable bid - full price points awarded. Ps = 80(1 - (22,500,000 - 22,500,000)/22,500,000) = 80",
        },
        {
          submissionId: submission1.id,
          criteriaName: "B-BBEE Status Level",
          criteriaCategory: "BBBEE",
          maxScore: 20,
          score: 20, // Level 1 = 20 points
          weight: 1,
          comments: "Level 1 B-BBEE contributor - maximum preference points",
        },
        {
          submissionId: submission1.id,
          criteriaName: "Technical Capability",
          criteriaCategory: "Technical",
          maxScore: 30,
          score: 26,
          weight: 1,
          comments: "Strong technical capability demonstrated with relevant equipment and skilled workforce",
        },
        {
          submissionId: submission1.id,
          criteriaName: "Previous Experience",
          criteriaCategory: "Experience",
          maxScore: 25,
          score: 22,
          weight: 1,
          comments: "5+ years experience with 3 similar municipal road projects completed",
        },
        {
          submissionId: submission1.id,
          criteriaName: "Local Content",
          criteriaCategory: "Local Content",
          maxScore: 15,
          score: 12,
          weight: 1,
          comments: "Local content of 85% - exceeds minimum requirement of 30%",
        },
        {
          submissionId: submission1.id,
          criteriaName: "Quality Management",
          criteriaCategory: "Quality",
          maxScore: 10,
          score: 8,
          weight: 1,
          comments: "ISO 9001:2015 certified quality management system",
        },
      ];

      for (const evalScore of submission1Scores) {
        const [existingScore] = await db.select().from(evaluationScores)
          .where(sql`${evaluationScores.submissionId} = ${evalScore.submissionId} AND ${evaluationScores.criteriaName} = ${evalScore.criteriaName}`);
        if (!existingScore) {
          await db.insert(evaluationScores).values(evalScore);
          console.log("Created evaluation score:", evalScore.criteriaName, "for submission", submission1.id);
        }
      }

      // Update submission 1 with calculated totals
      const totalScore1 = submission1Scores.reduce((sum, s) => sum + s.score, 0);
      await db.update(bidSubmissions)
        .set({ 
          priceScore: 80, 
          bbbeePoints: 20, 
          technicalScore: 26 + 22 + 12 + 8,
          totalScore: totalScore1,
          status: "passed",
          complianceResult: "passed"
        })
        .where(eq(bidSubmissions.id, submission1.id));
      console.log("Updated submission 1 with total score:", totalScore1);
    }

    // Create evaluation scores for the second submission (XYZ Services - Level 3 B-BBEE)
    if (createdSubmissions.length > 1) {
      const submission2 = createdSubmissions[1];
      const submission2Scores = [
        {
          submissionId: submission2.id,
          criteriaName: "Price",
          criteriaCategory: "Price",
          maxScore: 80,
          score: 73, // Higher price = fewer points: Ps = 80(1 - (24,800,000 - 22,500,000)/22,500,000) = 80(1 - 0.102) = 71.8
          weight: 1,
          comments: "Price points: Ps = 80(1 - (24,800,000 - 22,500,000)/22,500,000) = 72 points",
        },
        {
          submissionId: submission2.id,
          criteriaName: "B-BBEE Status Level",
          criteriaCategory: "BBBEE",
          maxScore: 20,
          score: 14, // Level 3 = 14 points
          weight: 1,
          comments: "Level 3 B-BBEE contributor - 14 preference points",
        },
        {
          submissionId: submission2.id,
          criteriaName: "Technical Capability",
          criteriaCategory: "Technical",
          maxScore: 30,
          score: 20,
          weight: 1,
          comments: "Adequate technical capability, smaller team and equipment inventory",
        },
        {
          submissionId: submission2.id,
          criteriaName: "Previous Experience",
          criteriaCategory: "Experience",
          maxScore: 25,
          score: 15,
          weight: 1,
          comments: "3 years experience with 1 similar project completed",
        },
        {
          submissionId: submission2.id,
          criteriaName: "Local Content",
          criteriaCategory: "Local Content",
          maxScore: 15,
          score: 9,
          weight: 1,
          comments: "Local content of 60% - meets minimum requirement",
        },
        {
          submissionId: submission2.id,
          criteriaName: "Quality Management",
          criteriaCategory: "Quality",
          maxScore: 10,
          score: 5,
          weight: 1,
          comments: "Quality procedures in place but no ISO certification",
        },
      ];

      for (const evalScore of submission2Scores) {
        const [existingScore] = await db.select().from(evaluationScores)
          .where(sql`${evaluationScores.submissionId} = ${evalScore.submissionId} AND ${evaluationScores.criteriaName} = ${evalScore.criteriaName}`);
        if (!existingScore) {
          await db.insert(evaluationScores).values(evalScore);
          console.log("Created evaluation score:", evalScore.criteriaName, "for submission", submission2.id);
        }
      }

      // Update submission 2 with calculated totals
      const totalScore2 = submission2Scores.reduce((sum, s) => sum + s.score, 0);
      await db.update(bidSubmissions)
        .set({ 
          priceScore: 73, 
          bbbeePoints: 14, 
          technicalScore: 20 + 15 + 9 + 5,
          totalScore: totalScore2,
          status: "manual_review",
          complianceResult: "passed"
        })
        .where(eq(bidSubmissions.id, submission2.id));
      console.log("Updated submission 2 with total score:", totalScore2);
    }
  }

  // Create default letter templates
  const letterTemplatesData = [
    {
      name: "Standard Award Letter",
      letterType: "award",
      subject: "Award of Tender {{tenderNumber}} - {{tenderTitle}}",
      bodyTemplate: `Dear {{contactPerson}},

RE: AWARD OF TENDER {{tenderNumber}} - {{tenderTitle}}

We are pleased to inform you that {{vendorName}} has been awarded the above-mentioned tender.

Your bid amount of R{{bidAmount}} has been accepted subject to the terms and conditions of the tender document.

Please find attached the formal award letter and contract documents for your signature.

Next Steps:
1. Review and sign the contract documents within 14 days
2. Submit the required performance guarantee (if applicable)
3. Attend the project briefing session (date to be confirmed)

Should you have any queries, please do not hesitate to contact our Supply Chain Management office.

Congratulations on your successful bid.

Yours faithfully,
Supply Chain Management Unit`,
      municipalityId,
      isDefault: true,
    },
    {
      name: "Standard Rejection Letter",
      letterType: "rejection",
      subject: "Outcome of Tender {{tenderNumber}} - {{tenderTitle}}",
      bodyTemplate: `Dear {{contactPerson}},

RE: OUTCOME OF TENDER {{tenderNumber}} - {{tenderTitle}}

We refer to your bid submission for the above-mentioned tender.

After careful evaluation of all submissions received, we regret to inform you that your bid was not successful.

Reasons for non-selection:
{{rejectionReasons}}

We thank you for your participation in this tender process and encourage you to submit bids for future tender opportunities.

Should you require a debriefing session to better understand the evaluation outcome, please contact our Supply Chain Management office within 14 days of receiving this letter.

Yours faithfully,
Supply Chain Management Unit`,
      municipalityId,
      isDefault: true,
    },
    {
      name: "Disqualification Letter",
      letterType: "disqualification",
      subject: "Disqualification Notice - Tender {{tenderNumber}}",
      bodyTemplate: `Dear {{contactPerson}},

RE: DISQUALIFICATION FROM TENDER {{tenderNumber}} - {{tenderTitle}}

We refer to your bid submission for the above-mentioned tender.

We regret to inform you that your submission has been disqualified from further consideration due to non-compliance with mandatory requirements.

Non-compliant items:
{{rejectionReasons}}

In terms of the Municipal Finance Management Act and Supply Chain Management Regulations, bids that do not meet mandatory requirements cannot be considered for evaluation.

We encourage you to ensure full compliance with tender requirements in future submissions.

Yours faithfully,
Supply Chain Management Unit`,
      municipalityId,
      isDefault: true,
    },
  ];

  for (const template of letterTemplatesData) {
    const [existingTemplate] = await db.select().from(letterTemplates)
      .where(sql`${letterTemplates.name} = ${template.name}`);
    if (!existingTemplate) {
      await db.insert(letterTemplates).values(template);
      console.log("Created letter template:", template.name);
    }
  }

  console.log("Seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
