// ============================================================
// Core types for Hypotheken App
// GHF (Gedragscode Hypothecaire Financieringen) & NHG norms
// ============================================================

export type EmploymentType = 'vast' | 'tijdelijk' | 'uitzend';
export type BusinessType = 'zzp' | 'bv_dga' | 'vof' | 'maatschap';
export type MortgageType = 'annuiteit' | 'lineair';
export type DocumentCategory = 'inkomen' | 'identiteit' | 'woning' | 'belasting' | 'overig';
export type ApplicationStatus = 'concept' | 'ingediend' | 'in_behandeling' | 'goedgekeurd' | 'afgewezen';

// ---- Personal info ----
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bsn: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  nationality: string;
}

// ---- Income: employed ----
export interface EmployedIncome {
  kind: 'employed';
  employmentType: EmploymentType;
  employer: string;
  startDate: string;
  grossAnnualSalary: number;     // Bruto jaarsalaris
  holidayAllowance: number;      // Vakantiegeld (usually 8%)
  thirteenthMonth: number;       // 13e maand / eindejaarsuitkering
  irregularityAllowance: number; // Onregelmatigheidstoeslag
  otherAllowances: number;       // Overige vaste toeslagen
}

// ---- Income: entrepreneur ----
export interface ProfitYear {
  year: number;
  fiscalProfit: number;    // Fiscale winst (aangifte IB of jaarrekening)
  addBackItems: number;    // Afschrijvingen e.d. die worden opgeteld
}

export interface EntrepreneurIncome {
  kind: 'entrepreneur';
  businessType: BusinessType;
  businessName: string;
  kvkNumber: string;
  startDate: string;        // Startdatum onderneming
  // Last 3 years
  year1: ProfitYear;
  year2: ProfitYear;
  year3: ProfitYear;
  // DGA-specific
  dgaSalary?: number;       // DGA loon (loonstrook)
  dgaDividend?: number;     // Dividend (structureel)
}

export type IncomeSource = EmployedIncome | EntrepreneurIncome;

// ---- Applicant ----
export interface Applicant {
  id: string;
  role: 'hoofdaanvrager' | 'medeaanvrager';
  personal: PersonalInfo;
  incomeSources: IncomeSource[];
}

export type EnergyLabel = 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'onbekend';

// ---- Mortgage details ----
export interface MortgageDetails {
  propertyValue: number;        // Woningwaarde / koopsom
  requestedAmount: number;      // Gevraagd hypotheekbedrag
  renovationBudget: number;     // Verbouwingsbudget (onderdeel van hypotheek)
  mortgageType: MortgageType;
  fixedRatePeriod: number;      // Rentevaste periode (years)
  interestRate: number;         // Rente (decimal, e.g. 0.042 = 4.2%)
  loanTerm: number;             // Looptijd (years, default 30)
  ghfYear: 2025 | 2026;         // GHF normjaar (financieringslastnormen)
  nhgDesired: boolean;          // NHG gewenst
  nhgYear: 2025 | 2026;         // NHG normjaar
  includeEnergyMeasures: boolean; // Energiebesparende maatregelen (voor hogere NHG grens)
  existingMortgage: number;     // Bestaande hypotheek (bij verbouw)
  energyLabel: EnergyLabel;     // Energielabel van de woning
}

// ---- Uploaded document ----
export interface UploadedDocument {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  uploadedAt: string;
  dataUrl: string; // base64 stored client-side
  description?: string;
}

// ---- Full application ----
export interface Application {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  applicants: Applicant[];
  mortgage: MortgageDetails;
  debts: import('./debts').DebtItem[];
  documents: UploadedDocument[];
  notes: string;
}

// ---- Calculation results ----
export interface GHFResult {
  totalIncome: number;
  financingLoadPercentage: number;
  toetsRente: number;
  maxAnnualHousingCosts: number;
  maxMonthlyPayment: number;        // Zonder schulden
  maxMonthlyPaymentNet: number;     // Na aftrek maandlasten schulden
  maxMortgage: number;              // Na aftrek schulden
  maxMortgageWithoutDebts: number;  // Zonder schulden (referentie)
  ltvRatio: number;
  ltvAllowed: boolean;
}

export interface NHGResult {
  eligible: boolean;
  reason?: string;
  maxLimit: number;
  fee: number;
  interestDiscount: number;
  netBenefit: number;
}

export interface MonthlyPaymentResult {
  firstMonth: number;
  lastMonth: number;
  averageMonth: number;
  totalInterest: number;
  totalRepayment: number;
}

export interface CalculationResult {
  ghf: GHFResult;
  nhg: NHGResult;
  actualPayment: MonthlyPaymentResult;
  feasible: boolean;
  warnings: string[];
  advice: string[];
  totalMonthlyDebts: number;
  debtMortgageImpact: number;
}

// ---- Default empty objects ----
export function emptyPersonalInfo(): PersonalInfo {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    bsn: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    nationality: 'Nederlands',
  };
}

export function emptyEmployedIncome(): EmployedIncome {
  return {
    kind: 'employed',
    employmentType: 'vast',
    employer: '',
    startDate: '',
    grossAnnualSalary: 0,
    holidayAllowance: 0,
    thirteenthMonth: 0,
    irregularityAllowance: 0,
    otherAllowances: 0,
  };
}

export function emptyEntrepreneurIncome(): EntrepreneurIncome {
  const currentYear = new Date().getFullYear();
  return {
    kind: 'entrepreneur',
    businessType: 'zzp',
    businessName: '',
    kvkNumber: '',
    startDate: '',
    year1: { year: currentYear - 3, fiscalProfit: 0, addBackItems: 0 },
    year2: { year: currentYear - 2, fiscalProfit: 0, addBackItems: 0 },
    year3: { year: currentYear - 1, fiscalProfit: 0, addBackItems: 0 },
  };
}

export function emptyMortgageDetails(): MortgageDetails {
  return {
    propertyValue: 0,
    requestedAmount: 0,
    mortgageType: 'annuiteit',
    fixedRatePeriod: 10,
    interestRate: 0.042,
    loanTerm: 30,
    ghfYear: 2026,
    nhgDesired: true,
    nhgYear: 2026,
    includeEnergyMeasures: false,
    existingMortgage: 0,
    renovationBudget: 0,
    energyLabel: 'onbekend',
  };
}
