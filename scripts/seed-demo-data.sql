-- VeritasAI Comprehensive Demo Data Seed Script
-- This populates all modules with realistic data for dashboard and analytics testing

-- 1. Create Tenants
INSERT INTO tenants (id, name, slug, country, timezone, currency, language, status) VALUES
('tenant-001', 'City of Johannesburg', 'joburg', 'ZA', 'Africa/Johannesburg', 'ZAR', 'en', 'active'),
('tenant-002', 'eThekwini Municipality', 'ethekwini', 'ZA', 'Africa/Johannesburg', 'ZAR', 'en', 'active'),
('tenant-003', 'Kenya Power & Lighting', 'kenya-power', 'KE', 'Africa/Nairobi', 'KES', 'en', 'active'),
('tenant-004', 'Lagos State Government', 'lagos-state', 'NG', 'Africa/Lagos', 'NGN', 'en', 'active'),
('tenant-005', 'Abu Dhabi Procurement', 'adnoc-proc', 'AE', 'Asia/Dubai', 'AED', 'en', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Subscriptions for each tenant
INSERT INTO subscriptions (id, tenant_id, tier, status, billing_interval, bids_included, documents_included, storage_included_mb, current_period_start, current_period_end) VALUES
('sub-001', 'tenant-001', 'enterprise', 'active', 'annual', 1000, 5000, 100000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days'),
('sub-002', 'tenant-002', 'professional', 'active', 'annual', 200, 500, 25000, NOW() - INTERVAL '60 days', NOW() + INTERVAL '305 days'),
('sub-003', 'tenant-003', 'starter', 'active', 'annual', 50, 100, 5000, NOW() - INTERVAL '15 days', NOW() + INTERVAL '350 days'),
('sub-004', 'tenant-004', 'professional', 'active', 'annual', 200, 500, 25000, NOW() - INTERVAL '45 days', NOW() + INTERVAL '320 days'),
('sub-005', 'tenant-005', 'enterprise', 'active', 'annual', 1000, 5000, 100000, NOW() - INTERVAL '90 days', NOW() + INTERVAL '275 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Municipalities
INSERT INTO municipalities (id, tenant_id, name, code, province, country, contact_email, status) VALUES
('muni-001', 'tenant-001', 'City of Johannesburg Metropolitan', 'JHB', 'Gauteng', 'ZA', 'procurement@joburg.org.za', 'active'),
('muni-002', 'tenant-001', 'City of Tshwane Metropolitan', 'TSH', 'Gauteng', 'ZA', 'scm@tshwane.gov.za', 'active'),
('muni-003', 'tenant-002', 'eThekwini Metropolitan Municipality', 'ETH', 'KwaZulu-Natal', 'ZA', 'bids@ethekwini.gov.za', 'active'),
('muni-004', 'tenant-002', 'uMgungundlovu District', 'UMG', 'KwaZulu-Natal', 'ZA', 'procurement@umdm.gov.za', 'active'),
('muni-005', 'tenant-003', 'Kenya Power HQ', 'KPLC', 'Nairobi', 'KE', 'tenders@kplc.co.ke', 'active'),
('muni-006', 'tenant-004', 'Lagos State Procurement Agency', 'LSPA', 'Lagos', 'NG', 'procurement@lagos.gov.ng', 'active'),
('muni-007', 'tenant-005', 'Abu Dhabi Government', 'ADG', 'Abu Dhabi', 'AE', 'tenders@abudhabi.ae', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Create Vendors with varied B-BBEE levels and statuses
INSERT INTO vendors (id, tenant_id, company_name, trading_name, registration_number, vat_number, csd_id, country, bbbee_level, bbbee_certificate_expiry, tax_clearance_expiry, contact_person, contact_email, contact_phone, status, debarment_status, risk_score, municipality_id) VALUES
-- South African Vendors (tenant-001)
('vendor-001', 'tenant-001', 'Sizwe Construction (Pty) Ltd', 'Sizwe Build', '2019/123456/07', '4123456789', 'MAAA1234567890', 'ZA', 'Level 1', NOW() + INTERVAL '180 days', NOW() + INTERVAL '90 days', 'Thabo Molefe', 'thabo@sizweconstruction.co.za', '+27115551234', 'approved', 'clear', 15, 'muni-001'),
('vendor-002', 'tenant-001', 'Mzansi IT Solutions', 'Mzansi IT', '2018/234567/07', '4234567890', 'MAAA2345678901', 'ZA', 'Level 2', NOW() + INTERVAL '120 days', NOW() + INTERVAL '60 days', 'Nomvula Dlamini', 'nomvula@mzansiit.co.za', '+27825552345', 'approved', 'clear', 20, 'muni-001'),
('vendor-003', 'tenant-001', 'Ubuntu Cleaning Services', 'Ubuntu Clean', '2020/345678/07', '4345678901', 'MAAA3456789012', 'ZA', 'Level 3', NOW() + INTERVAL '60 days', NOW() + INTERVAL '30 days', 'Sipho Ndlovu', 'sipho@ubuntuclean.co.za', '+27735553456', 'approved', 'clear', 25, 'muni-001'),
('vendor-004', 'tenant-001', 'Rainbow Security Group', 'Rainbow Sec', '2017/456789/07', '4456789012', 'MAAA4567890123', 'ZA', 'Level 4', NOW() - INTERVAL '30 days', NOW() + INTERVAL '45 days', 'David Botha', 'david@rainbowsec.co.za', '+27115554567', 'approved', 'flagged', 45, 'muni-001'),
('vendor-005', 'tenant-001', 'Gauteng Fleet Management', 'Gauteng Fleet', '2016/567890/07', '4567890123', 'MAAA5678901234', 'ZA', 'Level 5', NOW() + INTERVAL '200 days', NOW() + INTERVAL '120 days', 'Pieter van der Merwe', 'pieter@gautengfleet.co.za', '+27825555678', 'approved', 'clear', 30, 'muni-002'),
('vendor-006', 'tenant-001', 'Joburg Waste Solutions', 'JWS', '2021/678901/07', '4678901234', 'MAAA6789012345', 'ZA', 'Level 1', NOW() + INTERVAL '240 days', NOW() + INTERVAL '180 days', 'Lerato Mokoena', 'lerato@jws.co.za', '+27115556789', 'approved', 'clear', 10, 'muni-001'),
('vendor-007', 'tenant-001', 'Soweto Electrical Contractors', 'Soweto Elec', '2019/789012/07', '4789012345', 'MAAA7890123456', 'ZA', 'Level 2', NOW() + INTERVAL '90 days', NOW() - INTERVAL '15 days', 'Mandla Khumalo', 'mandla@sowetoelec.co.za', '+27735557890', 'suspended', 'clear', 55, 'muni-001'),
('vendor-008', 'tenant-001', 'Pretoria Plumbing Pros', 'PPP', '2018/890123/07', '4890123456', 'MAAA8901234567', 'ZA', 'Level 6', NOW() + INTERVAL '150 days', NOW() + INTERVAL '100 days', 'Jan Pretorius', 'jan@ppp.co.za', '+27125558901', 'approved', 'clear', 35, 'muni-002'),
-- eThekwini Vendors (tenant-002)
('vendor-009', 'tenant-002', 'Durban Marine Services', 'DMS', '2020/901234/07', '4901234567', 'MAAA9012345678', 'ZA', 'Level 1', NOW() + INTERVAL '300 days', NOW() + INTERVAL '200 days', 'Siyabonga Zulu', 'siya@durbanmarine.co.za', '+27315559012', 'approved', 'clear', 12, 'muni-003'),
('vendor-010', 'tenant-002', 'KZN Construction Holdings', 'KZN Build', '2017/012345/07', '4012345678', 'MAAA0123456789', 'ZA', 'Level 3', NOW() + INTERVAL '45 days', NOW() + INTERVAL '75 days', 'Nhlanhla Mkhize', 'nhlanhla@kznbuild.co.za', '+27825550123', 'approved', 'clear', 28, 'muni-003'),
('vendor-011', 'tenant-002', 'Coastal IT Systems', 'Coastal IT', '2019/111222/07', '4111222333', 'MAAA1112223334', 'ZA', 'Level 2', NOW() + INTERVAL '180 days', NOW() + INTERVAL '90 days', 'Priya Naidoo', 'priya@coastalit.co.za', '+27315551122', 'approved', 'clear', 18, 'muni-003'),
('vendor-012', 'tenant-002', 'Zululand Transport Co', 'Zulu Trans', '2018/222333/07', '4222333444', 'MAAA2223334445', 'ZA', 'Level 4', NOW() + INTERVAL '60 days', NOW() + INTERVAL '120 days', 'Themba Buthelezi', 'themba@zulutrans.co.za', '+27355552233', 'approved', 'clear', 32, 'muni-004'),
-- Kenya Vendors (tenant-003)
('vendor-013', 'tenant-003', 'Nairobi Power Solutions', 'NPS', '2020/KE/12345', NULL, NULL, 'KE', NULL, NULL, NOW() + INTERVAL '180 days', 'James Ochieng', 'james@nairobips.co.ke', '+254712345678', 'approved', 'clear', 20, 'muni-005'),
('vendor-014', 'tenant-003', 'Mombasa Electrical Works', 'MEW', '2019/KE/23456', NULL, NULL, 'KE', NULL, NULL, NOW() + INTERVAL '120 days', 'Fatuma Hassan', 'fatuma@mombasaew.co.ke', '+254723456789', 'approved', 'clear', 15, 'muni-005'),
('vendor-015', 'tenant-003', 'Kisumu Tech Hub', 'KTH', '2021/KE/34567', NULL, NULL, 'KE', NULL, NULL, NOW() + INTERVAL '200 days', 'Peter Otieno', 'peter@kisumutechhub.co.ke', '+254734567890', 'pending', 'clear', 25, 'muni-005'),
-- Nigeria Vendors (tenant-004)
('vendor-016', 'tenant-004', 'Lagos Infrastructure Ltd', 'Lagos Infra', 'RC1234567', NULL, NULL, 'NG', NULL, NULL, NOW() + INTERVAL '150 days', 'Chidi Okonkwo', 'chidi@lagosinfra.ng', '+2348012345678', 'approved', 'clear', 22, 'muni-006'),
('vendor-017', 'tenant-004', 'Ikeja Construction Group', 'ICG', 'RC2345678', NULL, NULL, 'NG', NULL, NULL, NOW() + INTERVAL '90 days', 'Amina Ibrahim', 'amina@ikejagroup.ng', '+2348023456789', 'approved', 'clear', 18, 'muni-006'),
('vendor-018', 'tenant-004', 'Victoria Island IT Services', 'VI-ITS', 'RC3456789', NULL, NULL, 'NG', NULL, NULL, NOW() + INTERVAL '240 days', 'Emeka Eze', 'emeka@viits.ng', '+2348034567890', 'approved', 'clear', 12, 'muni-006'),
-- UAE Vendors (tenant-005)
('vendor-019', 'tenant-005', 'Emirates Contracting LLC', 'Emirates Con', 'TL-12345', NULL, NULL, 'AE', NULL, NULL, NOW() + INTERVAL '365 days', 'Mohammed Al Maktoum', 'mohammed@emiratescon.ae', '+971501234567', 'approved', 'clear', 10, 'muni-007'),
('vendor-020', 'tenant-005', 'Abu Dhabi Tech Solutions', 'AD Tech', 'TL-23456', NULL, NULL, 'AE', NULL, NULL, NOW() + INTERVAL '300 days', 'Fatima Al Nahyan', 'fatima@adtech.ae', '+971502345678', 'approved', 'clear', 8, 'muni-007')
ON CONFLICT (id) DO NOTHING;

-- 5. Create Tenders with various statuses
INSERT INTO tenders (id, tenant_id, tender_number, title, description, tender_type, category, country, estimated_value, currency, closing_date, opening_date, award_date, status, priority, scoring_system, municipality_id, vendor_id, issuer, local_content_requirement, bbbee_requirement) VALUES
-- Active/Open Tenders
('tender-001', 'tenant-001', 'JHB/2026/IT/001', 'Enterprise Resource Planning System Implementation', 'Full ERP implementation including HR, Finance, and Supply Chain modules', 'RFP', 'IT', 'ZA', 15000000, 'ZAR', NOW() + INTERVAL '30 days', NOW() - INTERVAL '14 days', NULL, 'published', 'high', '80/20', 'muni-001', NULL, 'City of Johannesburg', 30, 'Level 4'),
('tender-002', 'tenant-001', 'JHB/2026/CONST/002', 'Road Rehabilitation Project - Soweto', 'Rehabilitation of 25km of roads in Soweto region', 'RFT', 'Construction', 'ZA', 45000000, 'ZAR', NOW() + INTERVAL '45 days', NOW() - INTERVAL '7 days', NULL, 'published', 'critical', '90/10', 'muni-001', NULL, 'City of Johannesburg', 50, 'Level 2'),
('tender-003', 'tenant-001', 'TSH/2026/SVC/003', 'Waste Management Services - Northern Region', 'Comprehensive waste collection and recycling services', 'RFQ', 'Services', 'ZA', 8500000, 'ZAR', NOW() + INTERVAL '21 days', NOW() - INTERVAL '21 days', NULL, 'closing_soon', 'medium', '80/20', 'muni-002', NULL, 'City of Tshwane', 40, 'Level 3'),
('tender-004', 'tenant-002', 'ETH/2026/MARINE/001', 'Port Terminal Equipment Maintenance', 'Annual maintenance contract for port terminal equipment', 'RFP', 'Services', 'ZA', 12000000, 'ZAR', NOW() + INTERVAL '60 days', NOW() - INTERVAL '5 days', NULL, 'published', 'high', '80/20', 'muni-003', NULL, 'eThekwini Municipality', 35, 'Level 3'),
('tender-005', 'tenant-002', 'ETH/2026/IT/002', 'Municipal IT Infrastructure Upgrade', 'Server room modernization and network infrastructure upgrade', 'RFT', 'IT', 'ZA', 22000000, 'ZAR', NOW() + INTERVAL '15 days', NOW() - INTERVAL '30 days', NULL, 'closing_soon', 'critical', '80/20', 'muni-003', NULL, 'eThekwini Municipality', 25, 'Level 4'),
-- Under Evaluation
('tender-006', 'tenant-001', 'JHB/2026/SEC/004', 'Security Services - Municipal Buildings', '24/7 security services for 50 municipal buildings', 'RFQ', 'Services', 'ZA', 18000000, 'ZAR', NOW() - INTERVAL '10 days', NOW() - INTERVAL '45 days', NULL, 'under_evaluation', 'high', '80/20', 'muni-001', NULL, 'City of Johannesburg', 60, 'Level 2'),
('tender-007', 'tenant-001', 'JHB/2026/FLEET/005', 'Fleet Management and Vehicle Procurement', 'Procurement of 100 municipal vehicles with fleet management', 'RFP', 'Transport', 'ZA', 35000000, 'ZAR', NOW() - INTERVAL '5 days', NOW() - INTERVAL '40 days', NULL, 'under_evaluation', 'critical', '90/10', 'muni-001', NULL, 'City of Johannesburg', 45, 'Level 3'),
('tender-008', 'tenant-002', 'UMG/2026/WATER/001', 'Water Infrastructure Rehabilitation', 'Upgrade of water treatment and distribution systems', 'RFT', 'Works', 'ZA', 55000000, 'ZAR', NOW() - INTERVAL '15 days', NOW() - INTERVAL '60 days', NULL, 'shortlisted', 'critical', '90/10', 'muni-004', NULL, 'uMgungundlovu District', 40, 'Level 2'),
-- Awarded Tenders
('tender-009', 'tenant-001', 'JHB/2025/CLEAN/010', 'Municipal Building Cleaning Services', 'Professional cleaning for all municipal offices', 'RFQ', 'Services', 'ZA', 6500000, 'ZAR', NOW() - INTERVAL '60 days', NOW() - INTERVAL '120 days', NOW() - INTERVAL '30 days', 'awarded', 'medium', '80/20', 'muni-001', 'vendor-003', 'City of Johannesburg', 70, 'Level 3'),
('tender-010', 'tenant-001', 'TSH/2025/ELEC/011', 'Electrical Maintenance Contract', 'Annual electrical maintenance for municipal facilities', 'RFP', 'Services', 'ZA', 9200000, 'ZAR', NOW() - INTERVAL '90 days', NOW() - INTERVAL '150 days', NOW() - INTERVAL '45 days', 'awarded', 'high', '80/20', 'muni-002', 'vendor-007', 'City of Tshwane', 55, 'Level 2'),
('tender-011', 'tenant-002', 'ETH/2025/CONST/012', 'Community Centre Construction - Umlazi', 'Construction of multi-purpose community centre', 'RFT', 'Construction', 'ZA', 28000000, 'ZAR', NOW() - INTERVAL '120 days', NOW() - INTERVAL '180 days', NOW() - INTERVAL '60 days', 'awarded', 'high', '90/10', 'muni-003', 'vendor-010', 'eThekwini Municipality', 50, 'Level 1'),
-- Cancelled/Unsuccessful
('tender-012', 'tenant-001', 'JHB/2025/IT/013', 'Legacy System Migration', 'Migration of legacy systems to cloud infrastructure', 'RFP', 'IT', 'ZA', 12000000, 'ZAR', NOW() - INTERVAL '45 days', NOW() - INTERVAL '90 days', NULL, 'cancelled', 'medium', '80/20', 'muni-001', NULL, 'City of Johannesburg', 30, 'Level 4'),
('tender-013', 'tenant-002', 'ETH/2025/TRANS/014', 'Public Transport Bus Procurement', 'Procurement of 50 public transport buses', 'RFT', 'Transport', 'ZA', 120000000, 'ZAR', NOW() - INTERVAL '30 days', NOW() - INTERVAL '75 days', NULL, 'unsuccessful', 'critical', '90/10', 'muni-003', NULL, 'eThekwini Municipality', 40, 'Level 2'),
-- Kenya Tenders
('tender-014', 'tenant-003', 'KPLC/2026/POWER/001', 'Transformer Procurement and Installation', 'Supply and installation of 100 distribution transformers', 'RFT', 'Works', 'KE', 250000000, 'KES', NOW() + INTERVAL '40 days', NOW() - INTERVAL '10 days', NULL, 'published', 'high', '80/20', 'muni-005', NULL, 'Kenya Power', 30, NULL),
('tender-015', 'tenant-003', 'KPLC/2026/IT/002', 'Smart Meter System Implementation', 'Rollout of smart meters for commercial customers', 'RFP', 'IT', 'KE', 180000000, 'KES', NOW() + INTERVAL '55 days', NOW() - INTERVAL '5 days', NULL, 'published', 'critical', '80/20', 'muni-005', NULL, 'Kenya Power', 25, NULL),
('tender-016', 'tenant-003', 'KPLC/2025/MAINT/003', 'Power Line Maintenance - Coast Region', 'Annual maintenance of power lines', 'RFQ', 'Services', 'KE', 75000000, 'KES', NOW() - INTERVAL '30 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days', 'awarded', 'medium', '80/20', 'muni-005', 'vendor-014', 'Kenya Power', 50, NULL),
-- Nigeria Tenders
('tender-017', 'tenant-004', 'LSPA/2026/ROAD/001', 'Lagos-Epe Expressway Rehabilitation', 'Major road rehabilitation project', 'RFT', 'Construction', 'NG', 5000000000, 'NGN', NOW() + INTERVAL '75 days', NOW() - INTERVAL '3 days', NULL, 'published', 'critical', '90/10', 'muni-006', NULL, 'Lagos State', 60, NULL),
('tender-018', 'tenant-004', 'LSPA/2026/IT/002', 'E-Government Platform Development', 'Digital government services platform', 'RFP', 'IT', 'NG', 1200000000, 'NGN', NOW() + INTERVAL '45 days', NOW() - INTERVAL '15 days', NULL, 'published', 'high', '80/20', 'muni-006', NULL, 'Lagos State', 40, NULL),
('tender-019', 'tenant-004', 'LSPA/2025/HEALTH/003', 'Medical Equipment Procurement', 'Procurement of medical equipment for state hospitals', 'RFQ', 'Goods', 'NG', 800000000, 'NGN', NOW() - INTERVAL '20 days', NOW() - INTERVAL '60 days', NULL, 'under_evaluation', 'high', '80/20', 'muni-006', NULL, 'Lagos State', 30, NULL),
-- UAE Tenders
('tender-020', 'tenant-005', 'ADG/2026/CONST/001', 'Marina Development Project Phase 2', 'Construction of marina facilities and infrastructure', 'RFT', 'Construction', 'AE', 50000000, 'AED', NOW() + INTERVAL '90 days', NOW() - INTERVAL '7 days', NULL, 'published', 'critical', '80/20', 'muni-007', NULL, 'Abu Dhabi Government', 40, NULL),
('tender-021', 'tenant-005', 'ADG/2026/IT/002', 'Smart City IoT Infrastructure', 'Implementation of city-wide IoT sensor network', 'RFP', 'IT', 'AE', 25000000, 'AED', NOW() + INTERVAL '60 days', NOW() - INTERVAL '14 days', NULL, 'published', 'high', '80/20', 'muni-007', NULL, 'Abu Dhabi Government', 30, NULL),
('tender-022', 'tenant-005', 'ADG/2025/SVC/003', 'Government Building Maintenance', 'Comprehensive facility maintenance services', 'RFQ', 'Services', 'AE', 8000000, 'AED', NOW() - INTERVAL '45 days', NOW() - INTERVAL '100 days', NOW() - INTERVAL '20 days', 'awarded', 'medium', '80/20', 'muni-007', 'vendor-019', 'Abu Dhabi Government', 50, NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Create Documents with various statuses
INSERT INTO documents (id, tenant_id, name, document_type, file_path, file_size, mime_type, version, language, expiry_date, verification_status, ai_verified, ai_confidence_score, vendor_id, tender_id, notes) VALUES
-- Verified Documents
('doc-001', 'tenant-001', 'Tax Clearance Certificate - Sizwe Construction', 'Tax Clearance', '/docs/vendor-001/tax-clearance.pdf', 245000, 'application/pdf', 1, 'en', NOW() + INTERVAL '90 days', 'verified', true, 95, 'vendor-001', NULL, 'SARS Tax Clearance verified'),
('doc-002', 'tenant-001', 'BBBEE Certificate Level 1 - Sizwe Construction', 'BBBEE Certificate', '/docs/vendor-001/bbbee.pdf', 180000, 'application/pdf', 1, 'en', NOW() + INTERVAL '180 days', 'verified', true, 98, 'vendor-001', NULL, 'Level 1 B-BBEE verified'),
('doc-003', 'tenant-001', 'Company Registration - Sizwe Construction', 'Company Registration', '/docs/vendor-001/cipc.pdf', 120000, 'application/pdf', 1, 'en', NULL, 'verified', true, 99, 'vendor-001', NULL, 'CIPC Registration verified'),
('doc-004', 'tenant-001', 'VAT Certificate - Mzansi IT', 'VAT Certificate', '/docs/vendor-002/vat.pdf', 95000, 'application/pdf', 1, 'en', NULL, 'verified', true, 97, 'vendor-002', NULL, 'SARS VAT Registration verified'),
('doc-005', 'tenant-001', 'Tax Clearance - Mzansi IT', 'Tax Clearance', '/docs/vendor-002/tax-clearance.pdf', 230000, 'application/pdf', 1, 'en', NOW() + INTERVAL '60 days', 'verified', true, 94, 'vendor-002', NULL, NULL),
('doc-006', 'tenant-001', 'BBBEE Certificate Level 2 - Mzansi IT', 'BBBEE Certificate', '/docs/vendor-002/bbbee.pdf', 175000, 'application/pdf', 1, 'en', NOW() + INTERVAL '120 days', 'verified', true, 96, 'vendor-002', NULL, NULL),
-- Pending Documents
('doc-007', 'tenant-001', 'Professional Indemnity Insurance - Ubuntu Clean', 'Professional Indemnity', '/docs/vendor-003/pi-insurance.pdf', 320000, 'application/pdf', 1, 'en', NOW() + INTERVAL '200 days', 'pending', false, NULL, 'vendor-003', NULL, 'Awaiting manual review'),
('doc-008', 'tenant-001', 'Health & Safety Certificate - Ubuntu Clean', 'Health & Safety Certificate', '/docs/vendor-003/health-safety.pdf', 280000, 'application/pdf', 1, 'en', NOW() + INTERVAL '150 days', 'pending', false, NULL, 'vendor-003', NULL, 'Submitted for verification'),
('doc-009', 'tenant-001', 'Bank Confirmation Letter - Rainbow Security', 'Bank Confirmation', '/docs/vendor-004/bank-letter.pdf', 85000, 'application/pdf', 1, 'en', NULL, 'pending', false, NULL, 'vendor-004', NULL, 'Bank details to be verified'),
-- Expired Documents
('doc-010', 'tenant-001', 'BBBEE Certificate - Rainbow Security', 'BBBEE Certificate', '/docs/vendor-004/bbbee-expired.pdf', 170000, 'application/pdf', 1, 'en', NOW() - INTERVAL '30 days', 'expired', true, 92, 'vendor-004', NULL, 'Certificate expired - renewal required'),
('doc-011', 'tenant-001', 'Tax Clearance - Soweto Electrical', 'Tax Clearance', '/docs/vendor-007/tax-clearance.pdf', 240000, 'application/pdf', 1, 'en', NOW() - INTERVAL '15 days', 'expired', true, 88, 'vendor-007', NULL, 'Tax clearance expired'),
-- Rejected Documents
('doc-012', 'tenant-001', 'Company Registration - Invalid Format', 'Company Registration', '/docs/vendor-004/cipc-invalid.pdf', 110000, 'application/pdf', 1, 'en', NULL, 'rejected', true, 35, 'vendor-004', NULL, 'Document appears to be altered - flagged for review'),
-- Tender-specific documents
('doc-013', 'tenant-001', 'Technical Proposal - ERP Implementation', 'Other', '/docs/tender-001/sizwe-proposal.pdf', 5500000, 'application/pdf', 1, 'en', NULL, 'verified', true, 91, 'vendor-001', 'tender-001', 'Technical proposal submitted'),
('doc-014', 'tenant-001', 'Financial Proposal - ERP Implementation', 'Other', '/docs/tender-001/sizwe-financial.pdf', 850000, 'application/pdf', 1, 'en', NULL, 'verified', true, 89, 'vendor-001', 'tender-001', 'Financial proposal verified'),
('doc-015', 'tenant-001', 'Technical Proposal - Road Rehabilitation', 'Other', '/docs/tender-002/ubuntu-proposal.pdf', 8200000, 'application/pdf', 1, 'en', NULL, 'pending', false, NULL, 'vendor-003', 'tender-002', 'Under technical review'),
-- eThekwini Documents
('doc-016', 'tenant-002', 'Tax Clearance - Durban Marine', 'Tax Clearance', '/docs/vendor-009/tax-clearance.pdf', 235000, 'application/pdf', 1, 'en', NOW() + INTERVAL '200 days', 'verified', true, 97, 'vendor-009', NULL, NULL),
('doc-017', 'tenant-002', 'BBBEE Certificate - Durban Marine', 'BBBEE Certificate', '/docs/vendor-009/bbbee.pdf', 182000, 'application/pdf', 1, 'en', NOW() + INTERVAL '300 days', 'verified', true, 99, 'vendor-009', NULL, 'Level 1 certified'),
('doc-018', 'tenant-002', 'Company Registration - KZN Build', 'Company Registration', '/docs/vendor-010/cipc.pdf', 125000, 'application/pdf', 1, 'en', NULL, 'verified', true, 98, 'vendor-010', NULL, NULL),
('doc-019', 'tenant-002', 'BBBEE Certificate - KZN Build', 'BBBEE Certificate', '/docs/vendor-010/bbbee.pdf', 178000, 'application/pdf', 1, 'en', NOW() + INTERVAL '45 days', 'verified', true, 94, 'vendor-010', NULL, 'Renewal due soon'),
-- Kenya Documents
('doc-020', 'tenant-003', 'KRA Tax Certificate - Nairobi Power', 'Tax Clearance', '/docs/vendor-013/kra-tax.pdf', 195000, 'application/pdf', 1, 'en', NOW() + INTERVAL '180 days', 'verified', true, 96, 'vendor-013', NULL, 'KRA Tax Compliance Certificate'),
('doc-021', 'tenant-003', 'Company Registration - Mombasa Electrical', 'Company Registration', '/docs/vendor-014/registration.pdf', 140000, 'application/pdf', 1, 'en', NULL, 'verified', true, 95, 'vendor-014', NULL, NULL),
-- Nigeria Documents
('doc-022', 'tenant-004', 'CAC Registration - Lagos Infrastructure', 'Company Registration', '/docs/vendor-016/cac.pdf', 155000, 'application/pdf', 1, 'en', NULL, 'verified', true, 97, 'vendor-016', NULL, 'CAC Certificate verified'),
('doc-023', 'tenant-004', 'FIRS Tax Certificate - Lagos Infrastructure', 'Tax Clearance', '/docs/vendor-016/firs.pdf', 210000, 'application/pdf', 1, 'en', NOW() + INTERVAL '150 days', 'verified', true, 94, 'vendor-016', NULL, NULL),
-- UAE Documents
('doc-024', 'tenant-005', 'Trade License - Emirates Contracting', 'Company Registration', '/docs/vendor-019/trade-license.pdf', 165000, 'application/pdf', 1, 'en', NOW() + INTERVAL '365 days', 'verified', true, 99, 'vendor-019', NULL, 'DED Trade License verified'),
('doc-025', 'tenant-005', 'ICV Certificate - Emirates Contracting', 'Other', '/docs/vendor-019/icv.pdf', 145000, 'application/pdf', 1, 'en', NOW() + INTERVAL '300 days', 'verified', true, 98, 'vendor-019', NULL, 'ICV Score: 45%')
ON CONFLICT (id) DO NOTHING;

-- 7. Create Compliance Rules
INSERT INTO compliance_rules (id, name, description, category, check_type, threshold, weight, is_active, municipality_id) VALUES
('rule-001', 'CSD Registration Check', 'Verify Central Supplier Database registration is current', 'Registration', 'document_age', 10, 10, true, 'muni-001'),
('rule-002', 'Tax Clearance Validity', 'Tax clearance certificate must be valid', 'Tax', 'expiry_check', 90, 15, true, 'muni-001'),
('rule-003', 'BBBEE Level Verification', 'Verify B-BBEE certificate and level', 'Empowerment', 'level_check', 4, 20, true, 'muni-001'),
('rule-004', 'Company Registration', 'CIPC company registration verification', 'Registration', 'document_check', NULL, 10, true, 'muni-001'),
('rule-005', 'Debarment Check', 'Check against national debarment register', 'Compliance', 'register_check', NULL, 25, true, 'muni-001'),
('rule-006', 'Municipal Rates Clearance', 'Rates clearance max 90 days old', 'Tax', 'document_age', 90, 10, true, 'muni-001'),
('rule-007', 'Public Liability Insurance', 'Minimum R5M coverage required', 'Insurance', 'minimum_value', 5000000, 10, true, 'muni-001'),
('rule-008', 'Local Content Requirement', 'Minimum local content percentage', 'Empowerment', 'percentage_check', 30, 15, true, 'muni-001'),
-- eThekwini Rules
('rule-009', 'Tax Clearance Validity', 'Tax clearance certificate must be valid', 'Tax', 'expiry_check', 90, 15, true, 'muni-003'),
('rule-010', 'BBBEE Level Verification', 'Verify B-BBEE certificate and level', 'Empowerment', 'level_check', 4, 20, true, 'muni-003'),
('rule-011', 'Company Registration', 'CIPC company registration verification', 'Registration', 'document_check', NULL, 10, true, 'muni-003'),
-- Kenya Rules
('rule-012', 'KRA Tax Compliance', 'Kenya Revenue Authority tax compliance', 'Tax', 'expiry_check', 180, 20, true, 'muni-005'),
('rule-013', 'Business Registration', 'Registrar of Companies registration', 'Registration', 'document_check', NULL, 15, true, 'muni-005'),
('rule-014', 'Local Content - Kenya', 'Local content requirements', 'Empowerment', 'percentage_check', 30, 15, true, 'muni-005'),
-- Nigeria Rules
('rule-015', 'FIRS Tax Certificate', 'Federal Inland Revenue Service clearance', 'Tax', 'expiry_check', 365, 20, true, 'muni-006'),
('rule-016', 'CAC Registration', 'Corporate Affairs Commission registration', 'Registration', 'document_check', NULL, 15, true, 'muni-006'),
('rule-017', 'Local Content Act', 'Nigerian Content Development Act compliance', 'Empowerment', 'percentage_check', 50, 20, true, 'muni-006'),
-- UAE Rules
('rule-018', 'Trade License', 'Valid DED trade license', 'Registration', 'expiry_check', 365, 15, true, 'muni-007'),
('rule-019', 'ICV Certificate', 'In-Country Value certification', 'Empowerment', 'percentage_check', 40, 25, true, 'muni-007')
ON CONFLICT (id) DO NOTHING;

-- 8. Create Compliance Checks
INSERT INTO compliance_checks (id, vendor_id, tender_id, rule_id, check_type, result, score, notes, performed_at) VALUES
-- Checks for Sizwe Construction
('check-001', 'vendor-001', 'tender-001', 'rule-001', 'document_age', 'passed', 100, 'CSD registration valid - 5 days old', NOW() - INTERVAL '2 days'),
('check-002', 'vendor-001', 'tender-001', 'rule-002', 'expiry_check', 'passed', 100, 'Tax clearance valid for 90 days', NOW() - INTERVAL '2 days'),
('check-003', 'vendor-001', 'tender-001', 'rule-003', 'level_check', 'passed', 100, 'B-BBEE Level 1 verified', NOW() - INTERVAL '2 days'),
('check-004', 'vendor-001', 'tender-001', 'rule-004', 'document_check', 'passed', 100, 'CIPC registration verified', NOW() - INTERVAL '2 days'),
('check-005', 'vendor-001', 'tender-001', 'rule-005', 'register_check', 'passed', 100, 'No debarment records found', NOW() - INTERVAL '2 days'),
-- Checks for Mzansi IT
('check-006', 'vendor-002', 'tender-001', 'rule-001', 'document_age', 'passed', 100, 'CSD registration valid', NOW() - INTERVAL '3 days'),
('check-007', 'vendor-002', 'tender-001', 'rule-002', 'expiry_check', 'passed', 100, 'Tax clearance valid', NOW() - INTERVAL '3 days'),
('check-008', 'vendor-002', 'tender-001', 'rule-003', 'level_check', 'passed', 90, 'B-BBEE Level 2 verified', NOW() - INTERVAL '3 days'),
-- Checks with failures
('check-009', 'vendor-004', 'tender-006', 'rule-003', 'level_check', 'failed', 0, 'B-BBEE certificate expired', NOW() - INTERVAL '5 days'),
('check-010', 'vendor-004', 'tender-006', 'rule-005', 'register_check', 'flagged', 50, 'Historical compliance issues noted', NOW() - INTERVAL '5 days'),
('check-011', 'vendor-007', 'tender-010', 'rule-002', 'expiry_check', 'failed', 0, 'Tax clearance expired 15 days ago', NOW() - INTERVAL '1 day'),
-- eThekwini checks
('check-012', 'vendor-009', 'tender-004', 'rule-009', 'expiry_check', 'passed', 100, 'Tax clearance valid for 200 days', NOW() - INTERVAL '4 days'),
('check-013', 'vendor-009', 'tender-004', 'rule-010', 'level_check', 'passed', 100, 'B-BBEE Level 1 verified', NOW() - INTERVAL '4 days'),
('check-014', 'vendor-010', 'tender-008', 'rule-009', 'expiry_check', 'passed', 100, 'Tax clearance valid', NOW() - INTERVAL '10 days'),
('check-015', 'vendor-010', 'tender-008', 'rule-010', 'level_check', 'passed', 85, 'B-BBEE Level 3 verified', NOW() - INTERVAL '10 days'),
-- Kenya checks
('check-016', 'vendor-013', 'tender-014', 'rule-012', 'expiry_check', 'passed', 100, 'KRA certificate valid', NOW() - INTERVAL '6 days'),
('check-017', 'vendor-014', 'tender-016', 'rule-012', 'expiry_check', 'passed', 100, 'KRA certificate valid', NOW() - INTERVAL '25 days'),
-- Nigeria checks
('check-018', 'vendor-016', 'tender-017', 'rule-015', 'expiry_check', 'passed', 100, 'FIRS certificate valid', NOW() - INTERVAL '2 days'),
('check-019', 'vendor-016', 'tender-017', 'rule-016', 'document_check', 'passed', 100, 'CAC registration verified', NOW() - INTERVAL '2 days'),
-- UAE checks
('check-020', 'vendor-019', 'tender-020', 'rule-018', 'expiry_check', 'passed', 100, 'Trade license valid for 365 days', NOW() - INTERVAL '5 days'),
('check-021', 'vendor-019', 'tender-020', 'rule-019', 'percentage_check', 'passed', 95, 'ICV score: 45% (exceeds 40% threshold)', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 9. Create Audit Logs for analytics
INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, details, ip_address, created_at) VALUES
-- Today's activity
('audit-001', 'tenant-001', 'user-001', 'create', 'tender', 'tender-001', '{"title": "ERP Implementation"}', '196.21.45.123', NOW() - INTERVAL '2 hours'),
('audit-002', 'tenant-001', 'user-001', 'update', 'vendor', 'vendor-001', '{"status": "approved"}', '196.21.45.123', NOW() - INTERVAL '3 hours'),
('audit-003', 'tenant-001', 'user-001', 'verify', 'document', 'doc-001', '{"result": "verified"}', '196.21.45.123', NOW() - INTERVAL '4 hours'),
('audit-004', 'tenant-001', 'user-001', 'verify', 'document', 'doc-002', '{"result": "verified"}', '196.21.45.123', NOW() - INTERVAL '4 hours'),
('audit-005', 'tenant-002', 'user-002', 'create', 'tender', 'tender-004', '{"title": "Port Terminal Equipment"}', '41.13.67.89', NOW() - INTERVAL '5 hours'),
-- Yesterday's activity
('audit-006', 'tenant-001', 'user-001', 'create', 'vendor', 'vendor-006', '{"name": "Joburg Waste Solutions"}', '196.21.45.123', NOW() - INTERVAL '1 day'),
('audit-007', 'tenant-001', 'user-001', 'update', 'tender', 'tender-003', '{"status": "closing_soon"}', '196.21.45.123', NOW() - INTERVAL '1 day'),
('audit-008', 'tenant-002', 'user-002', 'verify', 'document', 'doc-016', '{"result": "verified"}', '41.13.67.89', NOW() - INTERVAL '1 day'),
('audit-009', 'tenant-003', 'user-003', 'create', 'tender', 'tender-014', '{"title": "Transformer Procurement"}', '105.27.89.45', NOW() - INTERVAL '1 day'),
-- This week's activity
('audit-010', 'tenant-001', 'user-001', 'compliance_check', 'vendor', 'vendor-001', '{"result": "passed", "score": 100}', '196.21.45.123', NOW() - INTERVAL '2 days'),
('audit-011', 'tenant-001', 'user-001', 'compliance_check', 'vendor', 'vendor-002', '{"result": "passed", "score": 95}', '196.21.45.123', NOW() - INTERVAL '2 days'),
('audit-012', 'tenant-001', 'user-001', 'reject', 'document', 'doc-012', '{"reason": "altered document"}', '196.21.45.123', NOW() - INTERVAL '3 days'),
('audit-013', 'tenant-002', 'user-002', 'award', 'tender', 'tender-011', '{"vendor": "KZN Construction"}', '41.13.67.89', NOW() - INTERVAL '3 days'),
('audit-014', 'tenant-004', 'user-004', 'create', 'vendor', 'vendor-016', '{"name": "Lagos Infrastructure"}', '102.89.34.56', NOW() - INTERVAL '4 days'),
('audit-015', 'tenant-005', 'user-005', 'create', 'tender', 'tender-020', '{"title": "Marina Development"}', '94.56.123.78', NOW() - INTERVAL '4 days'),
-- Last week
('audit-016', 'tenant-001', 'user-001', 'cancel', 'tender', 'tender-012', '{"reason": "budget constraints"}', '196.21.45.123', NOW() - INTERVAL '7 days'),
('audit-017', 'tenant-002', 'user-002', 'update', 'tender', 'tender-008', '{"status": "shortlisted"}', '41.13.67.89', NOW() - INTERVAL '8 days'),
('audit-018', 'tenant-001', 'user-001', 'suspend', 'vendor', 'vendor-007', '{"reason": "tax clearance expired"}', '196.21.45.123', NOW() - INTERVAL '10 days'),
('audit-019', 'tenant-003', 'user-003', 'award', 'tender', 'tender-016', '{"vendor": "Mombasa Electrical"}', '105.27.89.45', NOW() - INTERVAL '12 days'),
('audit-020', 'tenant-005', 'user-005', 'award', 'tender', 'tender-022', '{"vendor": "Emirates Contracting"}', '94.56.123.78', NOW() - INTERVAL '14 days'),
-- Previous month
('audit-021', 'tenant-001', 'user-001', 'award', 'tender', 'tender-009', '{"vendor": "Ubuntu Cleaning"}', '196.21.45.123', NOW() - INTERVAL '30 days'),
('audit-022', 'tenant-001', 'user-001', 'award', 'tender', 'tender-010', '{"vendor": "Soweto Electrical"}', '196.21.45.123', NOW() - INTERVAL '45 days'),
('audit-023', 'tenant-002', 'user-002', 'award', 'tender', 'tender-011', '{"vendor": "KZN Construction"}', '41.13.67.89', NOW() - INTERVAL '60 days'),
('audit-024', 'tenant-001', 'user-001', 'create', 'tender', 'tender-006', '{"title": "Security Services"}', '196.21.45.123', NOW() - INTERVAL '50 days'),
('audit-025', 'tenant-001', 'user-001', 'create', 'tender', 'tender-007', '{"title": "Fleet Management"}', '196.21.45.123', NOW() - INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

-- 10. Create Usage Records for billing analytics
INSERT INTO usage_records (id, tenant_id, period_start, period_end, bids_processed, documents_verified, storage_used_mb, api_calls, ai_tokens_used) VALUES
-- Current period
('usage-001', 'tenant-001', NOW() - INTERVAL '30 days', NOW(), 45, 128, 2340, 1250, 450000),
('usage-002', 'tenant-002', NOW() - INTERVAL '30 days', NOW(), 28, 76, 1560, 890, 280000),
('usage-003', 'tenant-003', NOW() - INTERVAL '30 days', NOW(), 12, 34, 780, 420, 120000),
('usage-004', 'tenant-004', NOW() - INTERVAL '30 days', NOW(), 18, 52, 1120, 650, 185000),
('usage-005', 'tenant-005', NOW() - INTERVAL '30 days', NOW(), 8, 24, 560, 320, 95000),
-- Previous period
('usage-006', 'tenant-001', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 52, 145, 2180, 1380, 520000),
('usage-007', 'tenant-002', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 35, 92, 1420, 980, 310000),
('usage-008', 'tenant-003', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 15, 42, 650, 480, 140000),
('usage-009', 'tenant-004', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 22, 68, 980, 720, 210000),
('usage-010', 'tenant-005', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 10, 30, 480, 380, 110000)
ON CONFLICT (id) DO NOTHING;

-- 11. Create Notifications
INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, is_read, created_at) VALUES
('notif-001', 'user-001', 'tender_closing_soon', 'Tender Closing Soon', 'Waste Management Services tender closes in 7 days', 'tender', 'tender-003', false, NOW() - INTERVAL '1 hour'),
('notif-002', 'user-001', 'document_verified', 'Document Verified', 'Tax Clearance for Sizwe Construction has been verified', 'document', 'doc-001', true, NOW() - INTERVAL '4 hours'),
('notif-003', 'user-001', 'document_expired', 'Document Expired', 'BBBEE Certificate for Rainbow Security has expired', 'document', 'doc-010', false, NOW() - INTERVAL '1 day'),
('notif-004', 'user-001', 'compliance_failed', 'Compliance Check Failed', 'Vendor Rainbow Security failed B-BBEE verification', 'vendor', 'vendor-004', false, NOW() - INTERVAL '2 days'),
('notif-005', 'user-002', 'tender_published', 'New Tender Published', 'Port Terminal Equipment Maintenance tender is now open', 'tender', 'tender-004', true, NOW() - INTERVAL '5 days'),
('notif-006', 'user-002', 'tender_awarded', 'Tender Awarded', 'Community Centre Construction awarded to KZN Construction', 'tender', 'tender-011', true, NOW() - INTERVAL '60 days'),
('notif-007', 'user-003', 'tender_published', 'New Tender Published', 'Transformer Procurement tender is now open', 'tender', 'tender-014', false, NOW() - INTERVAL '10 days'),
('notif-008', 'user-004', 'document_verified', 'Document Verified', 'CAC Registration for Lagos Infrastructure verified', 'document', 'doc-022', true, NOW() - INTERVAL '2 days'),
('notif-009', 'user-005', 'tender_awarded', 'Tender Awarded', 'Government Building Maintenance awarded to Emirates Contracting', 'tender', 'tender-022', true, NOW() - INTERVAL '20 days'),
('notif-010', 'user-001', 'vendor_flagged', 'Vendor Flagged', 'Rainbow Security has been flagged for review', 'vendor', 'vendor-004', false, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Complete!
SELECT 
  'Demo data seeded successfully!' as status,
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM subscriptions) as subscriptions,
  (SELECT COUNT(*) FROM municipalities) as municipalities,
  (SELECT COUNT(*) FROM vendors) as vendors,
  (SELECT COUNT(*) FROM tenders) as tenders,
  (SELECT COUNT(*) FROM documents) as documents,
  (SELECT COUNT(*) FROM compliance_rules) as compliance_rules,
  (SELECT COUNT(*) FROM compliance_checks) as compliance_checks,
  (SELECT COUNT(*) FROM audit_logs) as audit_logs,
  (SELECT COUNT(*) FROM usage_records) as usage_records,
  (SELECT COUNT(*) FROM notifications) as notifications;
