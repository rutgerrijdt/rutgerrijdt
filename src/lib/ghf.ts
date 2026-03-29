// ============================================================
// GHF – Gedragscode Hypothecaire Financieringen
// Financieringslastnormen 2025
// ============================================================

import type { IncomeSource, EntrepreneurIncome, GHFResult, MortgageDetails } from './types';

// Toetsrente: min 5% voor rentevaste periodes < 10 jaar (NIBUD/GHF 2025)
export const MIN_TOETS_RENTE = 0.05;

// ---- Financieringslasttabel 2025 (gebaseerd op NIBUD-normen) ----
// Percentage van bruto jaarinkomen dat maximaal aan woonlasten mag worden besteed
// Bron: GHF bijlage A 2025 (vereenvoudigde versie)
interface FinancingLoadRow {
  minIncome: number;
  maxIncome: number;
  percentage: number; // bij toetsrente 5%
}

const FINANCING_LOAD_TABLE: FinancingLoadRow[] = [
  { minIncome: 0,      maxIncome: 20000,   percentage: 13.0 },
  { minIncome: 20001,  maxIncome: 22000,   percentage: 16.0 },
  { minIncome: 22001,  maxIncome: 24000,   percentage: 18.0 },
  { minIncome: 24001,  maxIncome: 26000,   percentage: 19.0 },
  { minIncome: 26001,  maxIncome: 28000,   percentage: 20.0 },
  { minIncome: 28001,  maxIncome: 30000,   percentage: 21.0 },
  { minIncome: 30001,  maxIncome: 33000,   percentage: 22.0 },
  { minIncome: 33001,  maxIncome: 36000,   percentage: 22.5 },
  { minIncome: 36001,  maxIncome: 40000,   percentage: 23.0 },
  { minIncome: 40001,  maxIncome: 45000,   percentage: 23.5 },
  { minIncome: 45001,  maxIncome: 50000,   percentage: 24.0 },
  { minIncome: 50001,  maxIncome: 55000,   percentage: 24.5 },
  { minIncome: 55001,  maxIncome: 60000,   percentage: 25.0 },
  { minIncome: 60001,  maxIncome: 70000,   percentage: 25.5 },
  { minIncome: 70001,  maxIncome: 80000,   percentage: 26.0 },
  { minIncome: 80001,  maxIncome: 90000,   percentage: 26.5 },
  { minIncome: 90001,  maxIncome: 110000,  percentage: 27.0 },
  { minIncome: 110001, maxIncome: Infinity, percentage: 27.5 },
];

export function getFinancingLoadPercentage(grossAnnualIncome: number): number {
  for (const row of FINANCING_LOAD_TABLE) {
    if (grossAnnualIncome >= row.minIncome && grossAnnualIncome <= row.maxIncome) {
      return row.percentage;
    }
  }
  return 27.5;
}

// ---- Toetsrente bepalen ----
export function getToetsRente(fixedRatePeriod: number, actualRate: number): number {
  if (fixedRatePeriod >= 10) {
    // Gebruik werkelijke rente als dit hoger is dan toetsrente
    return Math.max(actualRate, 0.035); // min 3.5% voor >= 10 jaar
  }
  // Voor < 10 jaar: min 5% of werkelijke rente als die hoger is
  return Math.max(MIN_TOETS_RENTE, actualRate);
}

// ---- Annuïteitsfactor (maandbetaling per euro geleend) ----
export function annuityFactor(annualRate: number, termYears: number): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return 1 / n;
  return (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ---- Inkomen berekenen per inkomstenbron ----
export function calculateIncomeFromSource(source: IncomeSource): number {
  if (source.kind === 'employed') {
    // Toetsinkomen = bruto jaarsalaris + vakantiegeld + 13e maand + vaste toeslagen
    // Onregelmatigheidstoeslag: 100% meegenomen als structureel
    return (
      source.grossAnnualSalary +
      source.holidayAllowance +
      source.thirteenthMonth +
      source.irregularityAllowance +
      source.otherAllowances
    );
  } else {
    return calculateEntrepreneurToetsinkomen(source);
  }
}

// ---- Ondernemersinkomen berekenen (GHF norm) ----
export function calculateEntrepreneurToetsinkomen(income: EntrepreneurIncome): number {
  if (income.businessType === 'bv_dga') {
    // DGA: toetsinkomen = DGA-loon (salaris uit BV)
    // Dividend wordt niet meegenomen tenzij structureel en aangetoond
    return income.dgaSalary ?? 0;
  }

  // ZZP / VOF / Maatschap: gemiddelde van 3 jaar fiscale winst
  const profits = [
    income.year1.fiscalProfit + income.year1.addBackItems,
    income.year2.fiscalProfit + income.year2.addBackItems,
    income.year3.fiscalProfit + income.year3.addBackItems,
  ];

  const average = profits.reduce((a, b) => a + b, 0) / 3;

  // GHF norm: als het inkomen daalt, gebruik dan het gemiddelde
  // maar sommige geldverstrekkers gebruiken het laagste jaar
  // We gebruiken hier het gemiddelde (meest gangbaar)
  return Math.max(0, Math.round(average));
}

// ---- Minimale bedrijfsleeftijd check ----
export function checkBusinessAge(income: EntrepreneurIncome): { ok: boolean; yearsActive: number; minRequired: number } {
  if (!income.startDate) return { ok: false, yearsActive: 0, minRequired: 3 };
  const start = new Date(income.startDate);
  const now = new Date();
  const yearsActive = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const minRequired = income.businessType === 'bv_dga' ? 1 : 3;
  return { ok: yearsActive >= minRequired, yearsActive: Math.floor(yearsActive), minRequired };
}

// ---- Hoofdberekening: maximale hypotheek (GHF) ----
export function calculateGHF(
  incomeSources: IncomeSource[],
  partnerIncomeSources: IncomeSource[],
  mortgage: MortgageDetails
): GHFResult {
  // Totaal toetsinkomen aanvrager(s)
  const applicantIncome = incomeSources.reduce(
    (sum, src) => sum + calculateIncomeFromSource(src),
    0
  );
  const partnerIncome = partnerIncomeSources.reduce(
    (sum, src) => sum + calculateIncomeFromSource(src),
    0
  );
  const totalIncome = applicantIncome + partnerIncome;

  // Financieringslastpercentage
  const financingLoadPercentage = getFinancingLoadPercentage(totalIncome);

  // Toetsrente
  const toetsRente = getToetsRente(mortgage.fixedRatePeriod, mortgage.interestRate);

  // Max jaarlijkse woonlasten
  const maxAnnualHousingCosts = totalIncome * (financingLoadPercentage / 100);
  const maxMonthlyPayment = maxAnnualHousingCosts / 12;

  // Max hypotheek via toetsrente (annuïtair)
  const factor = annuityFactor(toetsRente, mortgage.loanTerm);
  const maxMortgage = Math.round(maxMonthlyPayment / factor);

  // LTV (Loan-to-Value)
  const ltvRatio = mortgage.propertyValue > 0
    ? (mortgage.requestedAmount / mortgage.propertyValue) * 100
    : 0;

  return {
    totalIncome: Math.round(totalIncome),
    financingLoadPercentage,
    toetsRente,
    maxAnnualHousingCosts: Math.round(maxAnnualHousingCosts),
    maxMonthlyPayment: Math.round(maxMonthlyPayment),
    maxMortgage,
    ltvRatio: Math.round(ltvRatio * 10) / 10,
    ltvAllowed: ltvRatio <= 100,
  };
}

// ---- Werkelijke maandlast berekenen ----
export function calculateActualMonthlyPayment(
  amount: number,
  annualRate: number,
  termYears: number,
  type: 'annuiteit' | 'lineair'
) {
  const n = termYears * 12;
  const r = annualRate / 12;

  if (type === 'annuiteit') {
    const monthly = amount * annuityFactor(annualRate, termYears);
    const totalPaid = monthly * n;
    return {
      firstMonth: Math.round(monthly),
      lastMonth: Math.round(monthly),
      averageMonth: Math.round(monthly),
      totalInterest: Math.round(totalPaid - amount),
      totalRepayment: Math.round(totalPaid),
    };
  } else {
    // Lineair
    const monthlyPrincipal = amount / n;
    const firstInterest = amount * r;
    const lastInterest = monthlyPrincipal * r;
    const totalInterest = ((amount * r) + (monthlyPrincipal * r)) / 2 * n;

    return {
      firstMonth: Math.round(monthlyPrincipal + firstInterest),
      lastMonth: Math.round(monthlyPrincipal + lastInterest),
      averageMonth: Math.round(monthlyPrincipal + (firstInterest + lastInterest) / 2),
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(amount + totalInterest),
    };
  }
}
