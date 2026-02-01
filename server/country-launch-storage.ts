import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  countryLaunchStatus,
  countryEnquiries,
  type InsertCountryLaunchStatus,
  type CountryLaunchStatus,
  type InsertCountryEnquiry,
  type CountryEnquiry,
} from "@shared/schema";

export interface ICountryLaunchStorage {
  getCountryLaunchStatuses(): Promise<CountryLaunchStatus[]>;
  getCountryLaunchStatus(countryCode: string): Promise<CountryLaunchStatus | undefined>;
  createCountryLaunchStatus(data: InsertCountryLaunchStatus): Promise<CountryLaunchStatus>;
  updateCountryLaunchStatus(countryCode: string, data: Partial<InsertCountryLaunchStatus>): Promise<CountryLaunchStatus | undefined>;
  deleteCountryLaunchStatus(countryCode: string): Promise<boolean>;
  getActiveCountries(): Promise<CountryLaunchStatus[]>;

  getEnquiries(): Promise<CountryEnquiry[]>;
  getEnquiry(id: string): Promise<CountryEnquiry | undefined>;
  getEnquiriesByCountry(countryCode: string): Promise<CountryEnquiry[]>;
  createEnquiry(data: InsertCountryEnquiry): Promise<CountryEnquiry>;
  updateEnquiry(id: string, data: Partial<InsertCountryEnquiry>): Promise<CountryEnquiry | undefined>;
  deleteEnquiry(id: string): Promise<boolean>;
}

class CountryLaunchStorage implements ICountryLaunchStorage {
  async getCountryLaunchStatuses(): Promise<CountryLaunchStatus[]> {
    return await db.select().from(countryLaunchStatus).orderBy(countryLaunchStatus.countryName);
  }

  async getCountryLaunchStatus(countryCode: string): Promise<CountryLaunchStatus | undefined> {
    const [status] = await db
      .select()
      .from(countryLaunchStatus)
      .where(eq(countryLaunchStatus.countryCode, countryCode));
    return status;
  }

  async createCountryLaunchStatus(data: InsertCountryLaunchStatus): Promise<CountryLaunchStatus> {
    const [status] = await db.insert(countryLaunchStatus).values(data).returning();
    return status;
  }

  async updateCountryLaunchStatus(countryCode: string, data: Partial<InsertCountryLaunchStatus>): Promise<CountryLaunchStatus | undefined> {
    const [status] = await db
      .update(countryLaunchStatus)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(countryLaunchStatus.countryCode, countryCode))
      .returning();
    return status;
  }

  async deleteCountryLaunchStatus(countryCode: string): Promise<boolean> {
    const result = await db
      .delete(countryLaunchStatus)
      .where(eq(countryLaunchStatus.countryCode, countryCode));
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveCountries(): Promise<CountryLaunchStatus[]> {
    return await db
      .select()
      .from(countryLaunchStatus)
      .where(eq(countryLaunchStatus.status, "active"));
  }

  async getEnquiries(): Promise<CountryEnquiry[]> {
    return await db.select().from(countryEnquiries).orderBy(desc(countryEnquiries.createdAt));
  }

  async getEnquiry(id: string): Promise<CountryEnquiry | undefined> {
    const [enquiry] = await db.select().from(countryEnquiries).where(eq(countryEnquiries.id, id));
    return enquiry;
  }

  async getEnquiriesByCountry(countryCode: string): Promise<CountryEnquiry[]> {
    return await db
      .select()
      .from(countryEnquiries)
      .where(eq(countryEnquiries.countryCode, countryCode))
      .orderBy(desc(countryEnquiries.createdAt));
  }

  async createEnquiry(data: InsertCountryEnquiry): Promise<CountryEnquiry> {
    const [enquiry] = await db.insert(countryEnquiries).values(data).returning();
    return enquiry;
  }

  async updateEnquiry(id: string, data: Partial<InsertCountryEnquiry>): Promise<CountryEnquiry | undefined> {
    const [enquiry] = await db
      .update(countryEnquiries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(countryEnquiries.id, id))
      .returning();
    return enquiry;
  }

  async deleteEnquiry(id: string): Promise<boolean> {
    const result = await db.delete(countryEnquiries).where(eq(countryEnquiries.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const countryLaunchStorage = new CountryLaunchStorage();

const SUPPORTED_COUNTRIES = [
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "NG", name: "Nigeria", region: "Africa" },
  { code: "GH", name: "Ghana", region: "Africa" },
  { code: "EG", name: "Egypt", region: "Africa" },
  { code: "MA", name: "Morocco", region: "Africa" },
  { code: "DZ", name: "Algeria", region: "Africa" },
  { code: "TN", name: "Tunisia", region: "Africa" },
  { code: "ET", name: "Ethiopia", region: "Africa" },
  { code: "TZ", name: "Tanzania", region: "Africa" },
  { code: "UG", name: "Uganda", region: "Africa" },
  { code: "RW", name: "Rwanda", region: "Africa" },
  { code: "CI", name: "Ivory Coast", region: "Africa" },
  { code: "SN", name: "Senegal", region: "Africa" },
  { code: "CM", name: "Cameroon", region: "Africa" },
  { code: "AO", name: "Angola", region: "Africa" },
  { code: "MZ", name: "Mozambique", region: "Africa" },
  { code: "ZW", name: "Zimbabwe", region: "Africa" },
  { code: "ZM", name: "Zambia", region: "Africa" },
  { code: "BW", name: "Botswana", region: "Africa" },
  { code: "NA", name: "Namibia", region: "Africa" },
  { code: "MW", name: "Malawi", region: "Africa" },
  { code: "LS", name: "Lesotho", region: "Africa" },
  { code: "SZ", name: "Eswatini", region: "Africa" },
  { code: "AE", name: "United Arab Emirates", region: "Middle East" },
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "US", name: "United States", region: "North America" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "BE", name: "Belgium", region: "Europe" },
  { code: "PT", name: "Portugal", region: "Europe" },
  { code: "SE", name: "Sweden", region: "Europe" },
  { code: "DK", name: "Denmark", region: "Europe" },
  { code: "PL", name: "Poland", region: "Europe" },
];

export async function seedCountryLaunchStatuses() {
  const existing = await countryLaunchStorage.getCountryLaunchStatuses();
  if (existing.length > 0) return;

  for (const country of SUPPORTED_COUNTRIES) {
    const status = country.code === "ZA" ? "active" : "enquiry_only";
    const paymentGateway = country.code === "ZA" ? "yoco" : null;
    const currency = country.code === "ZA" ? "ZAR" : null;

    await countryLaunchStorage.createCountryLaunchStatus({
      countryCode: country.code,
      countryName: country.name,
      region: country.region,
      status,
      paymentGateway,
      currency,
    });
  }
  console.log("Seeded country launch statuses with ZA as active");
}
