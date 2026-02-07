export interface ModuleHelp {
  title: string;
  description: string;
  sections: Array<{ title: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  quickStart: Array<{ step: number; title: string; description: string }>;
  bestPractices: string[];
  relatedModules?: string[];
}

export interface FieldHelpContent {
  [fieldId: string]: {
    title: string;
    description: string;
    example?: string;
  };
}

export interface StatusDefinition {
  label: string;
  description: string;
  variant: "default" | "success" | "warning" | "destructive" | "secondary";
}

export interface StatusDefinitions {
  [type: string]: {
    [status: string]: StatusDefinition;
  };
}

export const helpContent: Record<string, ModuleHelp> = {
  dashboard: {
    title: "Dashboard",
    description: "Your central command center for monitoring bid evaluations, compliance status, and platform activity at a glance.",
    sections: [
      {
        title: "Overview",
        content: "The Dashboard provides real-time insights into your procurement activities. View pending evaluations, compliance alerts, recent submissions, and key performance metrics all in one place."
      },
      {
        title: "Key Metrics",
        content: "Monitor important statistics including total active tenders, pending document reviews, compliance pass rates, and vendor activity. These metrics update automatically as your team processes submissions."
      },
      {
        title: "Quick Actions",
        content: "Access frequently used features directly from the dashboard. Start new evaluations, review pending documents, or jump to compliance reports with just one click."
      },
      {
        title: "Notifications",
        content: "Stay informed with real-time alerts about document expirations, compliance issues, new submissions, and system updates. Critical alerts are highlighted for immediate attention."
      }
    ],
    faqs: [
      {
        question: "How often do the dashboard statistics update?",
        answer: "Dashboard statistics update in real-time as documents are processed and evaluations are completed. The page automatically refreshes every few minutes."
      },
      {
        question: "Can I customize what metrics I see on the dashboard?",
        answer: "Currently, the dashboard shows standard metrics. Custom dashboards are available in the Enterprise tier."
      },
      {
        question: "What do the different alert colors mean?",
        answer: "Red indicates critical issues requiring immediate attention, orange shows warnings, blue is informational, and green confirms successful completions."
      },
      {
        question: "Why are some statistics showing zero?",
        answer: "New accounts start with empty data. Statistics will populate as you add vendors, upload documents, and create tenders."
      },
      {
        question: "Can I export dashboard data?",
        answer: "Yes, use the Analytics module for comprehensive reports and exports of all your platform data."
      }
    ],
    quickStart: [
      { step: 1, title: "Review Your Overview", description: "Check the summary cards at the top for pending items and overall status." },
      { step: 2, title: "Check Alerts", description: "Review any notifications or alerts that need your attention." },
      { step: 3, title: "Monitor Activity", description: "Scroll down to see recent submissions and evaluation progress." },
      { step: 4, title: "Take Quick Actions", description: "Use the action buttons to jump to common tasks quickly." },
      { step: 5, title: "Explore Modules", description: "Click sidebar items to dive deeper into specific areas." }
    ],
    bestPractices: [
      "Check the dashboard daily to stay on top of pending evaluations",
      "Address red alerts immediately as they indicate compliance issues",
      "Use the quick actions to streamline your workflow",
      "Monitor document expiry warnings to avoid compliance gaps"
    ],
    relatedModules: ["vendors", "tenders", "documents", "analytics"]
  },

  vendors: {
    title: "Vendor Management",
    description: "Manage your vendor database, track compliance status, and maintain up-to-date vendor information for bid evaluations.",
    sections: [
      {
        title: "Vendor Registry",
        content: "The vendor registry is your central database of all companies that participate in your tenders. Each vendor profile includes company details, contact information, compliance documents, and historical performance data."
      },
      {
        title: "Compliance Tracking",
        content: "Track each vendor's compliance status including tax clearance, company registration, industry certifications, and country-specific requirements. The system automatically alerts you when documents are about to expire."
      },
      {
        title: "Document Management",
        content: "Upload and manage vendor documents directly in their profiles. AI automatically analyzes documents to extract key information like expiry dates, certificate numbers, and compliance indicators."
      },
      {
        title: "Vendor Categories",
        content: "Organize vendors by category, industry, or custom tags. Filter and search your vendor database to quickly find qualified suppliers for specific tenders."
      }
    ],
    faqs: [
      {
        question: "How do I add a new vendor?",
        answer: "Click 'Add Vendor' button, fill in the company details, and upload their compliance documents. The AI will automatically process and verify the documents."
      },
      {
        question: "What happens when a vendor's documents expire?",
        answer: "You'll receive notifications before documents expire. The vendor's compliance status will change to 'At Risk' and then 'Non-Compliant' if not renewed."
      },
      {
        question: "Can vendors manage their own profiles online?",
        answer: "Yes, vendors can register on the Vendor Portal using their WhatsApp number. Once registered, they can submit bids, upload documents, track their submissions, and communicate with your procurement team online."
      },
      {
        question: "How do I bulk import vendors?",
        answer: "Use the Import feature to upload a CSV or Excel file with vendor information. The system will create vendor profiles automatically."
      },
      {
        question: "What BBBEE levels are supported?",
        answer: "The system supports all South African BBBEE levels (1-8) and can validate BBBEE certificates against the required thresholds for each tender."
      }
    ],
    quickStart: [
      { step: 1, title: "Add Your First Vendor", description: "Click 'Add Vendor' and enter the company's basic information." },
      { step: 2, title: "Upload Documents", description: "Add compliance documents like tax clearance, registration certificates, and BBBEE." },
      { step: 3, title: "Wait for AI Processing", description: "The system will analyze documents and extract key information automatically." },
      { step: 4, title: "Review Compliance Status", description: "Check the vendor's overall compliance status and address any gaps." },
      { step: 5, title: "Categorize the Vendor", description: "Add relevant tags and categories for easy filtering." }
    ],
    bestPractices: [
      "Keep vendor documents up-to-date to ensure accurate compliance status",
      "Use categories and tags consistently for better organization",
      "Review vendor compliance before including them in new tenders",
      "Set up document expiry alerts well in advance of actual expiry dates",
      "Maintain accurate contact information for vendor communications"
    ],
    relatedModules: ["documents", "tenders", "compliance"]
  },

  tenders: {
    title: "Tender Management",
    description: "Create, manage, and evaluate tenders with AI-powered compliance checking and automated bid assessment.",
    sections: [
      {
        title: "Creating Tenders",
        content: "Create new tenders by defining requirements, setting deadlines, and specifying compliance criteria. Upload tender documents and let AI extract requirements automatically."
      },
      {
        title: "Bid Submissions",
        content: "Receive and track bid submissions from vendors. Each submission is automatically checked against tender requirements and compliance rules."
      },
      {
        title: "AI Evaluation",
        content: "VeritasAI analyzes bid documents, verifies compliance, scores submissions, and highlights potential issues. Review AI recommendations before making final decisions."
      },
      {
        title: "Award Letters",
        content: "Generate professional award and rejection letters using templates or AI-powered writing. Letters include all required legal language and specific feedback."
      }
    ],
    faqs: [
      {
        question: "How do I create a new tender?",
        answer: "Click 'New Tender', fill in the tender details, upload the tender document (PDF), and set the closing date. AI will automatically extract requirements from your document."
      },
      {
        question: "Can I set custom compliance requirements?",
        answer: "Yes, you can add custom requirements beyond the standard country-specific rules. Use the Requirements tab to add, remove, or modify criteria."
      },
      {
        question: "How does the AI scoring work?",
        answer: "AI evaluates each submission against your requirements, checking document validity, compliance status, and completeness. Scores are weighted based on your configured criteria."
      },
      {
        question: "What happens after I close a tender?",
        answer: "You can review all submissions, compare scores, select winners, and generate award/rejection letters. The system maintains a complete audit trail."
      },
      {
        question: "Can I reopen a closed tender?",
        answer: "Yes, administrators can reopen closed tenders if needed, though this action is logged for audit purposes."
      }
    ],
    quickStart: [
      { step: 1, title: "Create a Tender", description: "Click 'New Tender' and enter the basic tender information." },
      { step: 2, title: "Upload Tender Document", description: "Upload your tender PDF and let AI extract requirements automatically." },
      { step: 3, title: "Review Requirements", description: "Check the extracted requirements and adjust as needed." },
      { step: 4, title: "Publish the Tender", description: "Set the deadline and publish to start receiving submissions." },
      { step: 5, title: "Evaluate Submissions", description: "Review AI-scored submissions and make your award decisions." }
    ],
    bestPractices: [
      "Upload complete tender documents for better AI requirement extraction",
      "Review extracted requirements before publishing the tender",
      "Set realistic deadlines that give vendors adequate time to respond",
      "Use the AI evaluation as a guide but apply human judgment for final decisions",
      "Document your rationale when overriding AI recommendations"
    ],
    relatedModules: ["submissions", "documents", "compliance", "vendors"]
  },

  documents: {
    title: "Document Processing",
    description: "Upload, analyze, and verify compliance documents with AI-powered extraction and fraud detection.",
    sections: [
      {
        title: "Document Upload",
        content: "Upload documents in PDF, image, or common office formats. The system supports batch uploads and automatic categorization."
      },
      {
        title: "AI Analysis",
        content: "VeritasAI automatically extracts key information from documents including dates, certificate numbers, company names, and compliance indicators. Multi-language support covers English, French, Portuguese, and Arabic."
      },
      {
        title: "Fraud Detection",
        content: "Advanced AI analyzes documents for signs of tampering, forgery, or inconsistencies. Suspicious documents are flagged for manual review."
      },
      {
        title: "Document Types",
        content: "The system recognizes common procurement documents including tax clearances, company registrations, BBBEE certificates, insurance policies, and industry-specific certifications."
      }
    ],
    faqs: [
      {
        question: "What file formats are supported?",
        answer: "PDF, JPG, PNG, and common image formats. For best results, use clear PDF documents or high-resolution scans."
      },
      {
        question: "How accurate is the AI extraction?",
        answer: "AI extraction accuracy is typically above 95% for standard documents. Always review extracted data before relying on it for decisions."
      },
      {
        question: "What triggers a fraud alert?",
        answer: "The AI looks for signs of digital manipulation, inconsistent fonts, mismatched dates, invalid certificate numbers, and other anomalies."
      },
      {
        question: "How do I handle a false positive fraud alert?",
        answer: "Review the document manually and mark it as verified if legitimate. The AI learns from your corrections to improve accuracy."
      },
      {
        question: "Can I process documents in other languages?",
        answer: "Yes, the system supports English, French, Portuguese, and Arabic. Language is detected automatically."
      }
    ],
    quickStart: [
      { step: 1, title: "Upload a Document", description: "Click 'Upload' and select your document file." },
      { step: 2, title: "Wait for Processing", description: "AI will analyze the document and extract information." },
      { step: 3, title: "Review Results", description: "Check the extracted data for accuracy." },
      { step: 4, title: "Address Any Alerts", description: "Review and resolve any fraud or compliance alerts." },
      { step: 5, title: "Link to Vendor", description: "Associate the document with the appropriate vendor profile." }
    ],
    bestPractices: [
      "Upload clear, high-quality scans for best AI accuracy",
      "Review AI-extracted dates carefully, especially for handwritten documents",
      "Investigate all fraud alerts, even if they seem like false positives",
      "Keep original document files even after extraction",
      "Process documents promptly to maintain current compliance status"
    ],
    relatedModules: ["vendors", "compliance", "tenders"]
  },

  compliance: {
    title: "Compliance Rules",
    description: "Configure and manage country-specific compliance rules that govern bid evaluation criteria.",
    sections: [
      {
        title: "Country Rules",
        content: "Each country has specific procurement compliance requirements. VeritasAI includes pre-configured rules for 70+ countries covering document requirements, validity periods, and scoring criteria."
      },
      {
        title: "Custom Rules",
        content: "Create custom compliance rules for your organization's specific requirements beyond standard country regulations."
      },
      {
        title: "Rule Versions",
        content: "Track changes to compliance rules over time. The system maintains version history so you can understand how requirements have evolved."
      },
      {
        title: "Compliance Reports",
        content: "Generate detailed compliance reports showing vendor status, rule adherence, and areas of concern across your portfolio."
      }
    ],
    faqs: [
      {
        question: "How often are country rules updated?",
        answer: "We update country-specific rules as regulations change. Major updates are communicated via email and in-app notifications."
      },
      {
        question: "Can I override built-in rules?",
        answer: "Yes, you can modify rule thresholds, add exceptions, or create entirely custom rules for your organization."
      },
      {
        question: "What happens if a rule changes during an active tender?",
        answer: "Active tenders continue with the rules in effect when created. New rules apply only to future tenders unless you explicitly update."
      },
      {
        question: "How do I know which rules apply to my tender?",
        answer: "Rules are applied based on the tender's location/jurisdiction. You can view all applicable rules in the Tender Requirements tab."
      },
      {
        question: "Can I test rule changes before applying them?",
        answer: "Yes, use the Preview feature to see how rule changes would affect current vendors without actually applying the changes."
      }
    ],
    quickStart: [
      { step: 1, title: "Select Your Country", description: "Choose your primary jurisdiction to see applicable rules." },
      { step: 2, title: "Review Default Rules", description: "Examine the pre-configured compliance requirements." },
      { step: 3, title: "Customize If Needed", description: "Adjust thresholds or add custom rules for your needs." },
      { step: 4, title: "Apply to Tenders", description: "Rules automatically apply to new tenders in that jurisdiction." },
      { step: 5, title: "Monitor Compliance", description: "Track vendor compliance against your configured rules." }
    ],
    bestPractices: [
      "Regularly review compliance rules for regulatory updates",
      "Document reasons for any custom rule modifications",
      "Test rule changes in a sandbox before production use",
      "Keep stakeholders informed of significant rule changes",
      "Maintain consistent rules across similar tender categories"
    ],
    relatedModules: ["tenders", "vendors", "documents"]
  },

  analytics: {
    title: "Analytics & Reports",
    description: "Gain insights into your procurement operations with comprehensive analytics and customizable reports.",
    sections: [
      {
        title: "Dashboard Analytics",
        content: "View real-time metrics on tender performance, vendor compliance rates, processing times, and evaluation outcomes."
      },
      {
        title: "Custom Reports",
        content: "Build custom reports by selecting metrics, filters, and time periods. Export reports in PDF, Excel, or CSV formats."
      },
      {
        title: "Trend Analysis",
        content: "Track performance trends over time to identify patterns, improvements, and areas needing attention."
      },
      {
        title: "Compliance Insights",
        content: "Analyze compliance patterns across vendors, categories, and regions to proactively address common issues."
      }
    ],
    faqs: [
      {
        question: "How far back does historical data go?",
        answer: "All data from your account creation is retained. You can analyze trends from the beginning of your usage."
      },
      {
        question: "Can I schedule automatic report delivery?",
        answer: "Yes, set up scheduled reports to be emailed daily, weekly, or monthly to specified recipients."
      },
      {
        question: "What export formats are available?",
        answer: "Reports can be exported as PDF, Excel (.xlsx), or CSV files. Charts can be exported as images."
      },
      {
        question: "Can I share reports with external stakeholders?",
        answer: "Yes, generate shareable links or download reports to share. Access permissions can be configured."
      },
      {
        question: "How do I create a custom report?",
        answer: "Click 'New Report', select your metrics and dimensions, apply filters, and save. Saved reports can be rerun anytime."
      }
    ],
    quickStart: [
      { step: 1, title: "Explore Pre-built Reports", description: "Start with standard reports to see available data." },
      { step: 2, title: "Select Time Period", description: "Choose the date range for your analysis." },
      { step: 3, title: "Apply Filters", description: "Narrow down data by vendor, tender, or category." },
      { step: 4, title: "Create Custom Views", description: "Build personalized dashboards with relevant metrics." },
      { step: 5, title: "Export and Share", description: "Download or schedule reports for stakeholders." }
    ],
    bestPractices: [
      "Review key metrics weekly to stay on top of trends",
      "Use filters to focus on specific areas of concern",
      "Compare periods to identify improvements or regressions",
      "Share relevant reports with stakeholders regularly",
      "Set up alerts for metrics that exceed thresholds"
    ],
    relatedModules: ["dashboard", "compliance", "tenders", "vendors"]
  },

  billing: {
    title: "Billing & Subscription",
    description: "Manage your subscription, view usage, and handle billing information for your VeritasAI account.",
    sections: [
      {
        title: "Subscription Plans",
        content: "Choose from Starter, Professional, Enterprise, or Government tiers based on your organization's needs. Each tier includes different usage limits and features."
      },
      {
        title: "Usage Tracking",
        content: "Monitor your usage of documents, bids, storage, and API calls. Stay informed about approaching limits."
      },
      {
        title: "Invoices",
        content: "View and download invoices, payment history, and billing statements for your records."
      },
      {
        title: "Payment Methods",
        content: "Manage payment methods securely. South African customers use Yoco for local card payments in ZAR."
      }
    ],
    faqs: [
      {
        question: "How do I upgrade my plan?",
        answer: "Go to Billing, click 'Change Plan', and select your new tier. Upgrades take effect immediately with prorated billing."
      },
      {
        question: "What happens if I exceed my usage limits?",
        answer: "You'll receive warnings as you approach limits. If exceeded, additional usage may be blocked until you upgrade or the next billing cycle."
      },
      {
        question: "Can I get a refund?",
        answer: "Please contact our support team to discuss refund requests. Policies vary by situation and billing period."
      },
      {
        question: "Do you offer annual billing discounts?",
        answer: "Yes, annual billing provides significant savings compared to monthly payments. Switch to annual in your billing settings."
      },
      {
        question: "How do I update my billing information?",
        answer: "Go to Billing > Payment Methods to update your card details or billing address."
      }
    ],
    quickStart: [
      { step: 1, title: "Review Current Plan", description: "Check your subscription tier and included features." },
      { step: 2, title: "Monitor Usage", description: "Track your consumption against plan limits." },
      { step: 3, title: "View Invoices", description: "Access billing history and download invoices." },
      { step: 4, title: "Manage Payment", description: "Update payment methods as needed." },
      { step: 5, title: "Consider Upgrades", description: "Evaluate if a higher tier would benefit your needs." }
    ],
    bestPractices: [
      "Monitor usage regularly to avoid unexpected limits",
      "Consider annual billing for cost savings",
      "Keep payment information up-to-date to avoid service interruption",
      "Review plan features periodically as your needs evolve",
      "Contact support proactively for Enterprise pricing discussions"
    ],
    relatedModules: ["dashboard", "api-settings"]
  },

  "api-settings": {
    title: "API Settings",
    description: "Configure API access for integrating VeritasAI with your existing systems and workflows.",
    sections: [
      {
        title: "API Keys",
        content: "Generate and manage API keys for programmatic access to VeritasAI features. Each key can have specific permissions and rate limits."
      },
      {
        title: "Webhooks",
        content: "Configure webhook endpoints to receive real-time notifications when events occur in your VeritasAI account."
      },
      {
        title: "Rate Limits",
        content: "Understand and monitor your API rate limits based on your subscription tier."
      },
      {
        title: "Documentation",
        content: "Access comprehensive API documentation with examples, endpoint references, and authentication guides."
      }
    ],
    faqs: [
      {
        question: "How do I create an API key?",
        answer: "Go to API Settings, click 'Create Key', set permissions, and copy the generated key. Store it securely as it won't be shown again."
      },
      {
        question: "What are the API rate limits?",
        answer: "Rate limits vary by subscription tier. Check your plan details for specific limits on requests per minute and daily quotas."
      },
      {
        question: "Can I test the API without affecting production data?",
        answer: "Yes, use the sandbox environment for testing. Sandbox requests don't count against your production limits."
      },
      {
        question: "How do I set up webhooks?",
        answer: "Add a webhook URL in API Settings, select which events to subscribe to, and we'll send POST requests to your endpoint."
      },
      {
        question: "What authentication method does the API use?",
        answer: "The API uses API key authentication. Include your key in the Authorization header of each request."
      }
    ],
    quickStart: [
      { step: 1, title: "Generate API Key", description: "Create your first API key with appropriate permissions." },
      { step: 2, title: "Store Key Securely", description: "Save the key in a secure location like environment variables." },
      { step: 3, title: "Read Documentation", description: "Review the API docs to understand available endpoints." },
      { step: 4, title: "Test in Sandbox", description: "Make test requests to verify your integration works." },
      { step: 5, title: "Configure Webhooks", description: "Set up webhooks for events you want to track." }
    ],
    bestPractices: [
      "Never expose API keys in client-side code or public repositories",
      "Use separate keys for development and production",
      "Implement proper error handling for API responses",
      "Monitor your API usage to stay within rate limits",
      "Rotate keys periodically for security"
    ],
    relatedModules: ["billing", "dashboard"]
  },

  "email-templates": {
    title: "Email Templates",
    description: "Configure email templates for automated communications with vendors and stakeholders.",
    sections: [
      {
        title: "Template Library",
        content: "Access pre-built templates for common procurement communications including award letters, rejection notices, document requests, and reminders."
      },
      {
        title: "Customization",
        content: "Customize templates with your organization's branding, language, and specific messaging requirements."
      },
      {
        title: "Variables",
        content: "Use dynamic variables to automatically insert vendor names, tender details, dates, and other relevant information into emails."
      },
      {
        title: "Email Settings",
        content: "Configure your sender email address, either using the default VeritasAI address or your own custom domain."
      }
    ],
    faqs: [
      {
        question: "Can I use my own email domain?",
        answer: "Yes, set up custom domain authentication in Email Setup to send emails from your own domain."
      },
      {
        question: "What variables can I use in templates?",
        answer: "Common variables include {{vendor_name}}, {{tender_title}}, {{due_date}}, {{company_name}}, and many more. See the template editor for full list."
      },
      {
        question: "How do I preview an email before sending?",
        answer: "Use the Preview feature in the template editor to see how your email will look with sample data filled in."
      },
      {
        question: "Can I send bulk emails to multiple vendors?",
        answer: "Yes, select multiple recipients when sending. Each email will be personalized with the recipient's specific information."
      },
      {
        question: "Are emails tracked?",
        answer: "Yes, the system tracks delivery, opens, and bounces. View email analytics in your reports."
      }
    ],
    quickStart: [
      { step: 1, title: "Choose a Template", description: "Select from pre-built templates or create a new one." },
      { step: 2, title: "Customize Content", description: "Edit the text and add your branding elements." },
      { step: 3, title: "Add Variables", description: "Insert dynamic variables for personalization." },
      { step: 4, title: "Preview and Test", description: "Send a test email to verify formatting." },
      { step: 5, title: "Save and Use", description: "Save the template for use in your communications." }
    ],
    bestPractices: [
      "Keep email templates professional and concise",
      "Test templates with different data to ensure variables work correctly",
      "Include clear calls-to-action and contact information",
      "Use consistent branding across all email templates",
      "Review and update templates periodically"
    ],
    relatedModules: ["vendors", "tenders", "email-setup"]
  },

  "country-launch": {
    title: "Country Launch Control",
    description: "Manage phased country-by-country rollout and payment gateway configurations for different markets.",
    sections: [
      {
        title: "Launch Status",
        content: "Control which countries are active (accepting payments), in enquiry-only mode (collecting leads), or coming soon."
      },
      {
        title: "Payment Gateways",
        content: "Configure appropriate payment gateways for each country based on local payment preferences and currency requirements."
      },
      {
        title: "Enquiry Management",
        content: "Track and manage enquiries from countries not yet fully launched. Follow up with potential customers as markets open."
      },
      {
        title: "Currency Settings",
        content: "Set the primary currency for each country to display accurate pricing in local terms."
      }
    ],
    faqs: [
      {
        question: "How do I launch a new country?",
        answer: "Change the country's status from 'Coming Soon' or 'Enquiry Only' to 'Active', configure the payment gateway, and set the currency."
      },
      {
        question: "What payment gateways are available?",
        answer: "Currently Yoco (South Africa/ZAR), Paystack (Africa), and Flutterwave (Africa) are available. More gateways coming soon."
      },
      {
        question: "How do I handle enquiries from unlaunched countries?",
        answer: "Enquiries are stored in the system. Review them in the Enquiries tab and follow up as you expand to new markets."
      },
      {
        question: "Can I run different pricing for different countries?",
        answer: "Yes, pricing can be configured per country/currency to reflect local market conditions."
      },
      {
        question: "What happens when a user from an unlaunched country visits?",
        answer: "They see an enquiry form instead of the payment button, allowing them to express interest in your service."
      }
    ],
    quickStart: [
      { step: 1, title: "Review Country Status", description: "See which countries are active, enquiry-only, or coming soon." },
      { step: 2, title: "Configure Gateway", description: "Set up the appropriate payment gateway for the country." },
      { step: 3, title: "Set Currency", description: "Configure the local currency for pricing display." },
      { step: 4, title: "Activate Country", description: "Change status to 'Active' when ready to accept payments." },
      { step: 5, title: "Monitor Enquiries", description: "Track and respond to enquiries from unlaunched markets." }
    ],
    bestPractices: [
      "Launch countries where you have local support and payment infrastructure",
      "Use enquiry-only mode to gauge demand before full launch",
      "Respond promptly to enquiries to build customer relationships",
      "Keep currency and pricing updated with market conditions",
      "Document compliance requirements specific to each country"
    ],
    relatedModules: ["billing", "compliance"]
  },

  pricing: {
    title: "Pricing Page",
    description: "View subscription plans, compare features, and select the right tier for your organization.",
    sections: [
      {
        title: "Plan Comparison",
        content: "Compare Starter, Professional, Enterprise, and Government tiers to find the best fit for your organization's size and needs."
      },
      {
        title: "Feature Overview",
        content: "Understand what's included in each plan including document limits, user seats, support levels, and advanced features."
      },
      {
        title: "Annual vs Monthly",
        content: "Choose between monthly flexibility or annual billing with significant savings."
      },
      {
        title: "Regional Pricing",
        content: "Pricing adjusts based on your region with appropriate local currencies and payment methods."
      }
    ],
    faqs: [
      {
        question: "Which plan is right for me?",
        answer: "Starter for small teams, Professional for growing organizations, Enterprise for large operations, and Government for public sector with custom needs."
      },
      {
        question: "Can I change plans later?",
        answer: "Yes, you can upgrade or downgrade at any time. Changes take effect at the next billing cycle."
      },
      {
        question: "Is there a free trial?",
        answer: "Contact us for trial options. We offer guided demos and pilot programs for qualified organizations."
      },
      {
        question: "What payment methods are accepted?",
        answer: "We accept major credit cards. South African customers can use local cards via Yoco."
      },
      {
        question: "Do you offer discounts for NGOs or government?",
        answer: "Yes, contact our sales team to discuss special pricing for non-profit and government organizations."
      }
    ],
    quickStart: [
      { step: 1, title: "Select Your Region", description: "Choose your country to see local pricing and features." },
      { step: 2, title: "Compare Plans", description: "Review what's included in each subscription tier." },
      { step: 3, title: "Choose Billing", description: "Decide between monthly or annual billing." },
      { step: 4, title: "Select Your Plan", description: "Click 'Get Started' on your chosen plan." },
      { step: 5, title: "Complete Checkout", description: "Enter your details and complete the secure payment." }
    ],
    bestPractices: [
      "Consider your growth when choosing a plan",
      "Annual billing provides the best value",
      "Contact sales for custom Enterprise pricing",
      "Review included features carefully before deciding"
    ],
    relatedModules: ["billing"]
  },

  "vendor-portal": {
    title: "Vendor Portal",
    description: "A self-service portal for vendors to register, submit bids, check compliance, and track submissions online.",
    sections: [
      {
        title: "Portal Overview",
        content: "The Vendor Portal allows vendors to register online, browse open tenders, run compliance pre-checks, submit bids with supporting documents, and track their submission status. It operates independently with WhatsApp OTP authentication."
      },
      {
        title: "Vendor Registration",
        content: "Vendors register by entering their company name, registration number, contact person, email, WhatsApp phone number, and country. A one-time password (OTP) is sent to their WhatsApp for verification. Once verified, vendors can log in anytime with their WhatsApp number."
      },
      {
        title: "Compliance Pre-Check",
        content: "Before submitting a bid, vendors can run a compliance pre-check against tender requirements. The system uses a traffic-light system: Green means the vendor meets the requirement, Amber means partial compliance or documents expiring soon, and Red means the vendor is missing required documents."
      },
      {
        title: "Bid Submission",
        content: "Vendors can submit bids by selecting an open tender, entering their bid amount, uploading supporting documents, and confirming the submission. Submissions are automatically linked to the correct tenant and tracked in real-time."
      },
      {
        title: "Submission Tracking",
        content: "Vendors can view all their past and current submissions with status tracking (submitted, under review, shortlisted, awarded, rejected). Each submission shows the tender details, bid amount, and submission date."
      },
      {
        title: "Portal Messages",
        content: "Vendors receive messages from the procurement team through the portal, including submission confirmations, status updates, document requests, and award or rejection notifications. Messages can also be delivered via WhatsApp."
      }
    ],
    faqs: [
      {
        question: "How do vendors register for the portal?",
        answer: "Vendors visit the portal link, fill in their company details and WhatsApp number, then verify their identity with a one-time password sent to WhatsApp. The OTP is valid for 5 minutes."
      },
      {
        question: "Is WhatsApp required for vendor registration?",
        answer: "Yes, WhatsApp is used for secure identity verification via OTP. Vendors need an active WhatsApp number to register and log in."
      },
      {
        question: "How long does a portal session last?",
        answer: "Portal login sessions are valid for 24 hours. After that, the vendor will need to log in again with a new OTP."
      },
      {
        question: "What is the compliance pre-check?",
        answer: "The compliance pre-check uses a traffic-light system (green/amber/red) to show vendors how well their documents match the tender requirements before they submit a bid."
      },
      {
        question: "Can vendors submit multiple bids?",
        answer: "Yes, vendors can submit bids to multiple open tenders. Each submission is tracked separately."
      },
      {
        question: "How do I send messages to vendors?",
        answer: "Use the Vendor Messages page in the admin dashboard to send messages to portal-registered vendors. Messages appear in their portal dashboard."
      }
    ],
    quickStart: [
      { step: 1, title: "Share the Portal Link", description: "Direct vendors to your portal URL from the landing page or sidebar." },
      { step: 2, title: "Vendor Registers", description: "Vendors fill in company details and verify via WhatsApp OTP." },
      { step: 3, title: "Browse Tenders", description: "Vendors view open tenders and check compliance requirements." },
      { step: 4, title: "Run Pre-Check", description: "Vendors check their compliance status (green/amber/red) before submitting." },
      { step: 5, title: "Submit Bid", description: "Vendors enter bid details, upload documents, and submit." }
    ],
    bestPractices: [
      "Share the portal link prominently with your vendor community",
      "Encourage vendors to run the compliance pre-check before submitting bids",
      "Respond to vendor messages promptly to maintain engagement",
      "Monitor portal registrations to track vendor adoption",
      "Use WhatsApp notifications to keep vendors informed about tender updates"
    ],
    relatedModules: ["vendors", "tenders", "vendor-messages"]
  },

  "vendor-messages": {
    title: "Vendor Messages",
    description: "Track and manage communications with portal-registered vendors across WhatsApp, email, and system channels.",
    sections: [
      {
        title: "Message Overview",
        content: "The Vendor Messages page shows all communications with portal-registered vendors. Messages are tracked by channel (WhatsApp, email, system), direction (inbound/outbound), and read status for both admin and vendor sides."
      },
      {
        title: "Sending Messages",
        content: "Send messages to vendors through multiple channels. System messages appear in the vendor's portal dashboard. WhatsApp messages are delivered directly to the vendor's phone via Twilio."
      },
      {
        title: "Message Tracking",
        content: "Track message delivery status, read status, and filter by vendor, channel, or date. Unread messages are highlighted for quick identification."
      },
      {
        title: "Automated Notifications",
        content: "The system automatically sends WhatsApp notifications for key events: bid received confirmations, award notifications, rejection notices, and document expiry reminders."
      }
    ],
    faqs: [
      {
        question: "How do I send a message to a vendor?",
        answer: "Go to Vendor Messages, click 'Send Message', select the vendor, choose the channel (system or WhatsApp), enter your message, and click Send."
      },
      {
        question: "What channels are available for messaging?",
        answer: "Three channels are available: System (in-portal messages), WhatsApp (via Twilio), and Email (via SendGrid). Each has different use cases and delivery methods."
      },
      {
        question: "How do I know if a vendor has read my message?",
        answer: "The message list shows read/unread status for both admin and vendor sides. You can filter to show only unread messages."
      },
      {
        question: "Are WhatsApp messages sent automatically?",
        answer: "Yes, for key events like bid submissions and award notifications. You can also send manual WhatsApp messages from the Vendor Messages page."
      },
      {
        question: "Can vendors reply to messages?",
        answer: "Vendors can send messages through the portal dashboard. These appear as inbound messages in your Vendor Messages page."
      }
    ],
    quickStart: [
      { step: 1, title: "View Messages", description: "Open Vendor Messages from the sidebar to see all communications." },
      { step: 2, title: "Filter Messages", description: "Use filters to find messages by vendor, channel, or status." },
      { step: 3, title: "Send a Message", description: "Click Send Message, select the vendor and channel, type your message." },
      { step: 4, title: "Track Delivery", description: "Monitor delivery status and read receipts." },
      { step: 5, title: "Manage Responses", description: "Review and respond to vendor replies." }
    ],
    bestPractices: [
      "Respond to vendor messages within 24 hours",
      "Use system messages for general updates and WhatsApp for urgent notifications",
      "Include clear subject lines for easy message identification",
      "Check unread messages daily to stay on top of vendor communications",
      "Use automated notifications to reduce manual messaging workload"
    ],
    relatedModules: ["vendor-portal", "vendors", "email-templates"]
  },

  help: {
    title: "Help & Documentation",
    description: "Access guides, tutorials, FAQs, and support resources to get the most out of VeritasAI.",
    sections: [
      {
        title: "Getting Started",
        content: "New to VeritasAI? Start here for step-by-step guides on setting up your account and processing your first bid."
      },
      {
        title: "User Guides",
        content: "Detailed guides for every feature and module in the platform."
      },
      {
        title: "Video Tutorials",
        content: "Watch demonstrations of key workflows and best practices."
      },
      {
        title: "Support Options",
        content: "Reach out to our support team via chat, email, or phone depending on your subscription tier."
      }
    ],
    faqs: [
      {
        question: "How do I contact support?",
        answer: "Use the chat widget, email support@veritasai.com, or access phone support if included in your plan."
      },
      {
        question: "Are there video tutorials?",
        answer: "Yes, video tutorials are available in the Help section covering all major features."
      },
      {
        question: "Can I request a feature?",
        answer: "Absolutely! Submit feature requests through the feedback form or discuss with your account manager."
      },
      {
        question: "Is there API documentation?",
        answer: "Yes, comprehensive API documentation is available in the API Settings section."
      },
      {
        question: "How do I report a bug?",
        answer: "Use the feedback widget in the app or contact support with details about the issue."
      }
    ],
    quickStart: [
      { step: 1, title: "Browse Topics", description: "Explore help topics by category or search." },
      { step: 2, title: "Watch Tutorials", description: "View video guides for visual learning." },
      { step: 3, title: "Search FAQs", description: "Find answers to common questions." },
      { step: 4, title: "Use Chat Support", description: "Chat with AI assistant or live support." },
      { step: 5, title: "Submit Feedback", description: "Share suggestions or report issues." }
    ],
    bestPractices: [
      "Check help documentation before contacting support",
      "Use search to find specific topics quickly",
      "Watch tutorial videos for complex features",
      "Bookmark frequently referenced guides"
    ],
    relatedModules: ["dashboard"]
  }
};

export const fieldHelp: FieldHelpContent = {
  "bbbee-level": {
    title: "BBBEE Level",
    description: "Broad-Based Black Economic Empowerment level indicates the vendor's compliance with South African transformation requirements. Levels range from 1 (highest) to 8 (lowest).",
    example: "Level 1 contributors receive 135% procurement recognition"
  },
  "tax-clearance-pin": {
    title: "Tax Clearance PIN",
    description: "The unique PIN number on SARS tax clearance certificates. This PIN can be verified on the SARS eFiling system.",
    example: "Format: 9999/9999/99/9"
  },
  "cipc-registration": {
    title: "CIPC Registration Number",
    description: "Companies and Intellectual Property Commission registration number for South African companies.",
    example: "Format: YYYY/NNNNNN/NN (e.g., 2020/123456/07)"
  },
  "document-expiry": {
    title: "Document Expiry Date",
    description: "The date when this document will no longer be valid. Expired documents may affect vendor compliance status.",
    example: "Select a date in the future"
  },
  "tender-closing-date": {
    title: "Tender Closing Date",
    description: "The deadline for bid submissions. No submissions will be accepted after this date and time.",
    example: "Ensure adequate time for vendors to prepare their bids"
  },
  "evaluation-weight": {
    title: "Evaluation Weight",
    description: "The percentage importance of this criterion in the overall bid evaluation. All weights should total 100%.",
    example: "Price might be weighted at 80%, BBBEE at 20%"
  },
  "minimum-threshold": {
    title: "Minimum Threshold",
    description: "The minimum score or value required to pass this criterion. Bids below this threshold may be disqualified.",
    example: "A minimum of 60% might be required for technical evaluation"
  },
  "api-key": {
    title: "API Key",
    description: "A secret key used to authenticate API requests. Keep this secure and never share it publicly.",
    example: "vta_live_abc123..."
  },
  "webhook-url": {
    title: "Webhook URL",
    description: "The HTTPS endpoint where VeritasAI will send event notifications. Must be publicly accessible.",
    example: "https://your-domain.com/api/webhooks/veritasai"
  },
  "rate-limit": {
    title: "Rate Limit",
    description: "The maximum number of API requests allowed per minute. Exceeding this limit will result in temporary throttling.",
    example: "100 requests per minute"
  },
  "custom-domain": {
    title: "Custom Email Domain",
    description: "Your organization's domain for sending emails. Requires DNS configuration for verification.",
    example: "notifications@yourcompany.com"
  },
  "whatsapp-phone": {
    title: "WhatsApp Phone Number",
    description: "The vendor's WhatsApp phone number used for portal authentication via OTP and receiving procurement notifications.",
    example: "Enter digits only, e.g., 821234567"
  },
  "portal-otp": {
    title: "One-Time Password (OTP)",
    description: "A 6-digit verification code sent to the vendor's WhatsApp number. Valid for 5 minutes.",
    example: "Check your WhatsApp for a message from VeritasAI"
  },
  "bid-amount": {
    title: "Bid Amount",
    description: "The total price quoted by the vendor for the tender. Enter the amount in the currency specified by the tender.",
    example: "e.g., 250000.00"
  },
  "compliance-status": {
    title: "Compliance Pre-Check Status",
    description: "Traffic-light indicator showing vendor compliance: Green (meets requirement), Amber (partial/expiring), Red (missing/non-compliant).",
    example: "Run the pre-check before submitting to identify gaps"
  }
};

export const statusDefinitions: StatusDefinitions = {
  vendor: {
    active: {
      label: "Active",
      description: "Vendor is fully compliant and can participate in tenders",
      variant: "success"
    },
    pending: {
      label: "Pending",
      description: "Vendor registration is being processed or awaiting document verification",
      variant: "warning"
    },
    suspended: {
      label: "Suspended",
      description: "Vendor is temporarily suspended due to compliance issues",
      variant: "destructive"
    },
    inactive: {
      label: "Inactive",
      description: "Vendor is no longer actively participating in tenders",
      variant: "secondary"
    },
    "at-risk": {
      label: "At Risk",
      description: "Vendor has documents expiring soon or minor compliance issues",
      variant: "warning"
    },
    "non-compliant": {
      label: "Non-Compliant",
      description: "Vendor has expired documents or failed compliance checks",
      variant: "destructive"
    }
  },
  tender: {
    draft: {
      label: "Draft",
      description: "Tender is being prepared and not yet published",
      variant: "secondary"
    },
    open: {
      label: "Open",
      description: "Tender is published and accepting submissions",
      variant: "success"
    },
    closed: {
      label: "Closed",
      description: "Submission deadline has passed, evaluation in progress",
      variant: "warning"
    },
    awarded: {
      label: "Awarded",
      description: "Winner has been selected and notified",
      variant: "success"
    },
    cancelled: {
      label: "Cancelled",
      description: "Tender has been cancelled and is no longer valid",
      variant: "destructive"
    },
    evaluation: {
      label: "Evaluation",
      description: "Submissions are being reviewed and scored",
      variant: "warning"
    }
  },
  document: {
    valid: {
      label: "Valid",
      description: "Document is verified and within validity period",
      variant: "success"
    },
    expired: {
      label: "Expired",
      description: "Document has passed its expiry date",
      variant: "destructive"
    },
    pending: {
      label: "Pending",
      description: "Document is awaiting AI analysis and verification",
      variant: "warning"
    },
    rejected: {
      label: "Rejected",
      description: "Document failed verification or contains issues",
      variant: "destructive"
    },
    "expiring-soon": {
      label: "Expiring Soon",
      description: "Document will expire within 30 days",
      variant: "warning"
    },
    processing: {
      label: "Processing",
      description: "AI is currently analyzing this document",
      variant: "default"
    }
  },
  submission: {
    submitted: {
      label: "Submitted",
      description: "Bid has been received and logged",
      variant: "default"
    },
    "under-review": {
      label: "Under Review",
      description: "Bid is being evaluated by the assessment team",
      variant: "warning"
    },
    shortlisted: {
      label: "Shortlisted",
      description: "Bid has passed initial screening and is being considered",
      variant: "success"
    },
    awarded: {
      label: "Awarded",
      description: "This bid has been selected as the winner",
      variant: "success"
    },
    rejected: {
      label: "Rejected",
      description: "Bid did not meet requirements or was not selected",
      variant: "destructive"
    },
    disqualified: {
      label: "Disqualified",
      description: "Bid was disqualified due to non-compliance",
      variant: "destructive"
    }
  },
  compliance: {
    passed: {
      label: "Passed",
      description: "Meets all compliance requirements",
      variant: "success"
    },
    failed: {
      label: "Failed",
      description: "Does not meet one or more compliance requirements",
      variant: "destructive"
    },
    partial: {
      label: "Partial",
      description: "Meets some requirements but has gaps",
      variant: "warning"
    },
    pending: {
      label: "Pending",
      description: "Compliance check is in progress",
      variant: "default"
    },
    "not-applicable": {
      label: "N/A",
      description: "This compliance check does not apply",
      variant: "secondary"
    }
  },
  subscription: {
    active: {
      label: "Active",
      description: "Subscription is current and in good standing",
      variant: "success"
    },
    trial: {
      label: "Trial",
      description: "Currently on a trial period",
      variant: "warning"
    },
    past_due: {
      label: "Past Due",
      description: "Payment is overdue - please update billing",
      variant: "destructive"
    },
    cancelled: {
      label: "Cancelled",
      description: "Subscription has been cancelled",
      variant: "secondary"
    },
    expired: {
      label: "Expired",
      description: "Subscription period has ended",
      variant: "destructive"
    }
  }
};

export const keyboardShortcuts = [
  { keys: ["Ctrl", "K"], action: "Open help search", category: "Help" },
  { keys: ["Ctrl", "/"], action: "Show keyboard shortcuts", category: "Help" },
  { keys: ["Ctrl", "H"], action: "Open page help", category: "Help" },
  { keys: ["Escape"], action: "Close dialogs and panels", category: "Navigation" },
  { keys: ["Ctrl", "S"], action: "Save current form", category: "Editing" },
  { keys: ["Ctrl", "Enter"], action: "Submit form", category: "Editing" }
];
