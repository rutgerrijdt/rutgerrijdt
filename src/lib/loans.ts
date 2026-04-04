// Dutch Financial Calculation Functions
// Personal loans, student loans (DUO), car lease vs buy, rent vs buy, gift/inheritance tax
// Based on 2026 Dutch tax rates and rules

// ============================================================
// SECTION 1: PERSONAL LOAN CALCULATOR
// ============================================================

export interface PersonalLoanInput {
  /** Loan amount in euros */
  loanAmount: number;
  /** Annual interest rate as a decimal (e.g. 0.06 for 6%) */
  annualInterestRate: number;
  /** Loan duration in months */
  durationMonths: number;
  /** Optional: monthly extra repayment */
  extraMonthlyPayment?: number;
}

export interface PersonalLoanResult {
  /** Monthly installment (annuity) */
  monthlyPayment: number;
  /** Total amount paid over the full term */
  totalPaid: number;
  /** Total interest paid */
  totalInterest: number;
  /** Effective annual interest rate (APR approximation) */
  effectiveAnnualRate: number;
  /** Month-by-month amortization schedule */
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }>;
  /** Number of months if extra payment is applied */
  actualDurationMonths: number;
}

/**
 * Calculates a Dutch personal loan (persoonlijke lening / doorlopend krediet annuïteit).
 * Uses annuity formula. Interest is calculated monthly on the outstanding balance.
 */
export function calculatePersonalLoan(input: PersonalLoanInput): PersonalLoanResult {
  const { loanAmount, annualInterestRate, durationMonths } = input;
  const extraMonthlyPayment = input.extraMonthlyPayment ?? 0;
  const monthlyRate = annualInterestRate / 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / durationMonths;
  } else {
    monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
      (Math.pow(1 + monthlyRate, durationMonths) - 1);
  }

  const schedule: PersonalLoanResult['schedule'] = [];
  let balance = loanAmount;
  let totalPaid = 0;
  let month = 0;

  while (balance > 0.005 && month < durationMonths * 2) {
    month++;
    const interestCharge = balance * monthlyRate;
    const totalPayment = Math.min(monthlyPayment + extraMonthlyPayment, balance + interestCharge);
    const principalPayment = totalPayment - interestCharge;
    balance = Math.max(0, balance - principalPayment);
    totalPaid += totalPayment;

    schedule.push({
      month,
      payment: Math.round(totalPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestCharge * 100) / 100,
      remainingBalance: Math.round(balance * 100) / 100,
    });
  }

  const totalInterest = totalPaid - loanAmount;
  const effectiveAnnualRate = Math.pow(1 + monthlyRate, 12) - 1;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    effectiveAnnualRate: Math.round(effectiveAnnualRate * 10000) / 10000,
    schedule,
    actualDurationMonths: month,
  };
}


// ============================================================
// SECTION 2: STUDENT LOAN DUO CALCULATOR
// ============================================================

export interface StudentLoanInput {
  /** Total outstanding DUO student loan debt in euros */
  totalDebt: number;
  /**
   * Repayment system:
   * - 'oud': before 2015 (5% of income above social minimum, max 15 years)
   * - 'nieuw': 2015-2023 (income-based, max 35 years, 4% income above threshold)
   * - 'nieuwnieuw': from Sept 2023 onwards (income-based, max 15 years, 4%)
   */
  repaymentSystem: 'oud' | 'nieuw' | 'nieuwnieuw';
  /** Gross annual income in euros */
  grossAnnualIncome: number;
  /** Current DUO interest rate as a decimal */
  duoInterestRate: number;
  /** Expected annual income growth as a decimal (e.g. 0.02 for 2%) */
  annualIncomeGrowth?: number;
  /** Partner's gross annual income (relevant for income-based threshold) */
  partnerIncome?: number;
}

export interface StudentLoanResult {
  /** Annual repayment amount in euros */
  annualRepayment: number;
  /** Monthly repayment amount in euros */
  monthlyRepayment: number;
  /** Number of years until debt is repaid (or forgiven) */
  yearsToRepay: number;
  /** Total amount paid */
  totalPaid: number;
  /** Amount forgiven at end of term (if applicable) */
  amountForgiven: number;
  /** Total interest paid */
  totalInterest: number;
  /** Year-by-year repayment schedule */
  schedule: Array<{
    year: number;
    income: number;
    annualRepayment: number;
    interestCharge: number;
    remainingDebt: number;
  }>;
}

/**
 * DUO social minimum thresholds for 2026 (annual, gross approximation).
 * Based on CBS social minimum: ~€15,600/year for singles.
 */
const DUO_SOCIAL_MINIMUM_2026 = 15_600;

/**
 * Income thresholds above which DUO repayment is calculated (2026 values).
 * For 'nieuw' and 'nieuwnieuw' systems.
 */
const DUO_INCOME_THRESHOLD_SINGLE_2026 = 15_600;
const DUO_INCOME_THRESHOLD_PARTNER_2026 = 21_800;

/**
 * Calculates DUO student loan repayment schedule based on Dutch rules.
 *
 * Key rules (2026):
 * - Oud stelsel: 15 years max, repay 5% of income above social minimum
 * - Nieuw stelsel (2015-2023): 35 years max, repay 4% of income above threshold
 * - Nieuwnieuw stelsel (Sept 2023+): 15 years max, repay 4% of income above threshold
 * - Remaining debt is forgiven after the maximum repayment period
 */
export function calculateStudentLoan(input: StudentLoanInput): StudentLoanResult {
  const {
    totalDebt,
    repaymentSystem,
    grossAnnualIncome,
    duoInterestRate,
    annualIncomeGrowth = 0.02,
    partnerIncome = 0,
  } = input;

  const maxYears = repaymentSystem === 'nieuw' ? 35 : 15;
  const repaymentPercentage = repaymentSystem === 'oud' ? 0.05 : 0.04;

  // Income threshold above which repayment is required
  const baseThreshold =
    partnerIncome > 0 ? DUO_INCOME_THRESHOLD_PARTNER_2026 : DUO_INCOME_THRESHOLD_SINGLE_2026;

  const schedule: StudentLoanResult['schedule'] = [];
  let remainingDebt = totalDebt;
  let totalPaid = 0;
  let currentIncome = grossAnnualIncome;
  let yearsToRepay = maxYears;

  for (let year = 1; year <= maxYears; year++) {
    if (remainingDebt <= 0) {
      yearsToRepay = year - 1;
      break;
    }

    const threshold = baseThreshold * Math.pow(1 + annualIncomeGrowth, year - 1);
    const incomeAboveThreshold = Math.max(0, currentIncome - threshold);
    let annualRepayment = incomeAboveThreshold * repaymentPercentage;

    const interestCharge = remainingDebt * duoInterestRate;
    remainingDebt += interestCharge;

    // Cap repayment at outstanding debt
    annualRepayment = Math.min(annualRepayment, remainingDebt);
    remainingDebt -= annualRepayment;
    totalPaid += annualRepayment;

    schedule.push({
      year,
      income: Math.round(currentIncome),
      annualRepayment: Math.round(annualRepayment * 100) / 100,
      interestCharge: Math.round(interestCharge * 100) / 100,
      remainingDebt: Math.round(Math.max(0, remainingDebt) * 100) / 100,
    });

    currentIncome *= 1 + annualIncomeGrowth;
  }

  const amountForgiven = Math.max(0, remainingDebt);
  const totalInterest = totalPaid + amountForgiven - totalDebt;

  return {
    annualRepayment: schedule.length > 0 ? schedule[0].annualRepayment : 0,
    monthlyRepayment: schedule.length > 0 ? Math.round((schedule[0].annualRepayment / 12) * 100) / 100 : 0,
    yearsToRepay,
    totalPaid: Math.round(totalPaid * 100) / 100,
    amountForgiven: Math.round(amountForgiven * 100) / 100,
    totalInterest: Math.round(Math.max(0, totalInterest) * 100) / 100,
    schedule,
  };
}


// ============================================================
// SECTION 3: CAR LEASE VS BUY COMPARISON
// ============================================================

export interface AutoKoopInput {
  /** Purchase price of the car in euros */
  purchasePrice: number;
  /** Down payment in euros */
  downPayment?: number;
  /** Loan interest rate as a decimal if financing (0 if cash) */
  financingRate?: number;
  /** Loan duration in months (if financing) */
  financingMonths?: number;
  /** Expected annual depreciation rate as a decimal (e.g. 0.15 for 15%) */
  annualDepreciationRate?: number;
  /** Annual maintenance and repair costs in euros */
  annualMaintenanceCost?: number;
  /** Annual insurance cost in euros */
  annualInsuranceCost?: number;
  /** Annual road tax (wegenbelasting) in euros */
  annualRoadTax?: number;
  /** Number of years of ownership */
  ownershipYears: number;
  /** Fuel/energy cost per month in euros */
  monthlyFuelCost?: number;
}

export interface AutoLeaseInput {
  /** Monthly lease payment in euros (operational lease) */
  monthlyLeaseCost: number;
  /** Lease term in months */
  leaseTermMonths: number;
  /** Down payment / first higher payment in euros */
  initialPayment?: number;
  /** Monthly fuel/energy cost in euros (if not included in lease) */
  monthlyFuelCost?: number;
  /**
   * Fiscal addition percentage for private use (bijtelling).
   * 2026: 16% for EVs up to €30,000 catalogue, 22% for others.
   */
  bijtellingPercentage?: number;
  /** Catalogue price for bijtelling calculation */
  cataloguePriceForBijtelling?: number;
  /** Marginal tax rate for bijtelling tax (e.g. 0.3693 for ~37%) */
  marginalTaxRate?: number;
  /** Number of comparison years */
  ownershipYears: number;
}

export interface AutoVergelijkingResult {
  /** Total cost of buying the car */
  totalCostKopen: number;
  /** Total cost of leasing */
  totalCostLease: number;
  /** Residual value of the car at end of period (buying scenario) */
  residualValueKopen: number;
  /** Net cost buying (total cost minus residual value) */
  netCostKopen: number;
  /** Net cost lease */
  netCostLease: number;
  /** Which option is cheaper */
  cheaperOption: 'kopen' | 'lease' | 'gelijk';
  /** Difference in net cost (positive = lease is more expensive) */
  differenceEuros: number;
  /** Monthly average cost buying */
  monthlyCostKopen: number;
  /** Monthly average cost lease */
  monthlyCostLease: number;
  /** Annual bijtelling tax cost (lease only) */
  annualBijtellingTax?: number;
  breakdown: {
    kopen: {
      purchasePrice: number;
      downPayment: number;
      financingCost: number;
      maintenanceCost: number;
      insuranceCost: number;
      roadTax: number;
      fuelCost: number;
      residualValue: number;
    };
    lease: {
      leasePayments: number;
      initialPayment: number;
      fuelCost: number;
      bijtellingTax: number;
    };
  };
}

/**
 * Compares the total cost of buying vs. leasing a car over the same period.
 * Accounts for Dutch 2026 bijtelling rules for operational lease.
 */
export function compareAutoLease(
  koopInput: AutoKoopInput,
  leaseInput: AutoLeaseInput
): AutoVergelijkingResult {
  const years = koopInput.ownershipYears;
  const months = years * 12;

  // --- Buying cost calculation ---
  const purchasePrice = koopInput.purchasePrice;
  const downPayment = koopInput.downPayment ?? purchasePrice;
  const financedAmount = purchasePrice - downPayment;
  const financingRate = koopInput.financingRate ?? 0;
  const financingMonths = koopInput.financingMonths ?? months;
  const annualDepreciationRate = koopInput.annualDepreciationRate ?? 0.15;
  const annualMaintenance = koopInput.annualMaintenanceCost ?? 1_200;
  const annualInsurance = koopInput.annualInsuranceCost ?? 1_500;
  const annualRoadTax = koopInput.annualRoadTax ?? 600;
  const monthlyFuelKopen = koopInput.monthlyFuelCost ?? 150;

  // Financing cost (interest paid on car loan)
  let financingCost = 0;
  if (financedAmount > 0 && financingRate > 0 && financingMonths > 0) {
    const mr = financingRate / 12;
    const monthlyLoan =
      (financedAmount * mr * Math.pow(1 + mr, financingMonths)) /
      (Math.pow(1 + mr, financingMonths) - 1);
    financingCost = monthlyLoan * financingMonths - financedAmount;
  }

  // Residual value after depreciation
  const residualValue = purchasePrice * Math.pow(1 - annualDepreciationRate, years);

  const totalMaintenanceCost = annualMaintenance * years;
  const totalInsuranceCost = annualInsurance * years;
  const totalRoadTax = annualRoadTax * years;
  const totalFuelKopen = monthlyFuelKopen * months;

  const totalCostKopen =
    downPayment +
    financingCost +
    totalMaintenanceCost +
    totalInsuranceCost +
    totalRoadTax +
    totalFuelKopen;

  const netCostKopen = totalCostKopen - residualValue;

  // --- Lease cost calculation ---
  const leaseMonths = Math.min(leaseInput.leaseTermMonths, months);
  const leasePaymentsTotal = leaseInput.monthlyLeaseCost * leaseMonths;
  const initialPayment = leaseInput.initialPayment ?? 0;
  const monthlyFuelLease = leaseInput.monthlyFuelCost ?? 0;
  const totalFuelLease = monthlyFuelLease * leaseMonths;

  // Bijtelling calculation (private use tax on lease car)
  let annualBijtellingTax = 0;
  if (
    leaseInput.bijtellingPercentage &&
    leaseInput.cataloguePriceForBijtelling &&
    leaseInput.marginalTaxRate
  ) {
    const bijtellingBase =
      leaseInput.cataloguePriceForBijtelling * leaseInput.bijtellingPercentage;
    annualBijtellingTax = bijtellingBase * leaseInput.marginalTaxRate;
  }
  const totalBijtellingTax = annualBijtellingTax * years;

  const totalCostLease = leasePaymentsTotal + initialPayment + totalFuelLease + totalBijtellingTax;
  const netCostLease = totalCostLease;

  const difference = netCostLease - netCostKopen;
  const cheaperOption: 'kopen' | 'lease' | 'gelijk' =
    Math.abs(difference) < 100 ? 'gelijk' : difference > 0 ? 'kopen' : 'lease';

  return {
    totalCostKopen: Math.round(totalCostKopen * 100) / 100,
    totalCostLease: Math.round(totalCostLease * 100) / 100,
    residualValueKopen: Math.round(residualValue * 100) / 100,
    netCostKopen: Math.round(netCostKopen * 100) / 100,
    netCostLease: Math.round(netCostLease * 100) / 100,
    cheaperOption,
    differenceEuros: Math.round(Math.abs(difference) * 100) / 100,
    monthlyCostKopen: Math.round((netCostKopen / months) * 100) / 100,
    monthlyCostLease: Math.round((netCostLease / months) * 100) / 100,
    annualBijtellingTax: Math.round(annualBijtellingTax * 100) / 100,
    breakdown: {
      kopen: {
        purchasePrice,
        downPayment,
        financingCost: Math.round(financingCost * 100) / 100,
        maintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
        insuranceCost: Math.round(totalInsuranceCost * 100) / 100,
        roadTax: Math.round(totalRoadTax * 100) / 100,
        fuelCost: Math.round(totalFuelKopen * 100) / 100,
        residualValue: Math.round(residualValue * 100) / 100,
      },
      lease: {
        leasePayments: Math.round(leasePaymentsTotal * 100) / 100,
        initialPayment,
        fuelCost: Math.round(totalFuelLease * 100) / 100,
        bijtellingTax: Math.round(totalBijtellingTax * 100) / 100,
      },
    },
  };
}


// ============================================================
// SECTION 4: RENT VS BUY COMPARISON (HUUR VS KOOP)
// ============================================================

export interface HuurVsKoopInput {
  // --- Buying inputs ---
  /** Purchase price of the home in euros */
  koopprijs: number;
  /** Mortgage amount in euros */
  hypotheekBedrag: number;
  /** Mortgage interest rate as a decimal */
  hypotheekRente: number;
  /** Mortgage duration in years */
  hypotheekLooptijd?: number;
  /** Mortgage form: 'annuiteit' | 'lineair' */
  hypotheekVorm?: 'annuiteit' | 'lineair';
  /**
   * Eigenwoningforfait percentage (2026: 0.35% for homes €75k-€1.2M, 2.35% above).
   * Leave undefined to auto-calculate.
   */
  eigenwoningforfaitPercentage?: number;
  /** WOZ value (often equals purchase price initially) */
  wozWaarde?: number;
  /** Marginal income tax rate for mortgage interest deduction */
  marginalTaxRate?: number;
  /** Annual VvE costs (home owners association) in euros */
  vveKosten?: number;
  /** Annual maintenance as % of home value */
  maintenancePercentage?: number;
  /** Opstalverzekering (building insurance) annual cost */
  opstalverzekering?: number;
  /** Expected annual home value appreciation as decimal */
  homeAppreciation?: number;
  /** Kosten koper (transfer tax + notary etc.) as decimal (2026: 2% overdrachtsbelasting for owner-occupiers) */
  kostenKoperPercentage?: number;
  // --- Renting inputs ---
  /** Monthly rent in euros */
  maandelijkseHuur: number;
  /** Expected annual rent increase as decimal */
  huurstijging?: number;
  /** Monthly renters insurance in euros */
  huurdersverzekering?: number;
  // --- General ---
  /** Number of years to compare */
  years: number;
  /** Investment return on saved equity / down payment if renting (as decimal) */
  investmentReturn?: number;
}

export interface HuurVsKoopResult {
  /** Total net cost of buying over the period */
  totalNetCostKopen: number;
  /** Total net cost of renting over the period */
  totalNetCostHuren: number;
  /** Net equity built up through buying (home value minus mortgage) */
  netEquityAtEnd: number;
  /** Net worth difference: buying minus renting scenario */
  netWorthDifference: number;
  /** Which option builds more wealth */
  betterOption: 'kopen' | 'huren' | 'gelijk';
  /** Break-even year (year from which buying becomes cheaper) */
  breakEvenYear: number | null;
  /** Home value at end of period */
  homeValueAtEnd: number;
  /** Remaining mortgage at end of period */
  remainingMortgage: number;
  /** Initial purchase costs (kosten koper) */
  initialPurchaseCosts: number;
  /** Average monthly cost of buying */
  avgMonthlyCostKopen: number;
  /** Average monthly cost of renting */
  avgMonthlyCostHuren: number;
  /** Year-by-year comparison */
  schedule: Array<{
    year: number;
    // Buying
    mortgagePayment: number;
    interestDeduction: number;
    eigenwoningforfait: number;
    netMortgageCost: number;
    ownerCosts: number;
    homeValue: number;
    remainingMortgage: number;
    equity: number;
    cumulativeNetCostKopen: number;
    // Renting
    annualRent: number;
    cumulativeNetCostHuren: number;
    // Net worth comparison
    buyingNetWorth: number;
    rentingNetWorth: number;
  }>;
}

/**
 * Calculates eigenwoningforfait percentage based on 2026 WOZ value brackets.
 */
function getEigenwoningforfait(wozWaarde: number): number {
  if (wozWaarde <= 12_500) return 0;
  if (wozWaarde <= 25_000) return 0.001;
  if (wozWaarde <= 50_000) return 0.002;
  if (wozWaarde <= 75_000) return 0.0025;
  if (wozWaarde <= 1_200_000) return 0.0035;
  // Above €1.2M: 0.35% up to €1.2M + 2.35% on excess (Hillen abolished above this)
  return 0.0235;
}

/**
 * Compares the financial outcome of buying vs renting a Dutch home.
 * Accounts for hypotheekrenteaftrek, eigenwoningforfait, kosten koper,
 * opportunity cost of equity, and home appreciation.
 */
export function calculateHuurVsKoop(input: HuurVsKoopInput): HuurVsKoopResult {
  const {
    koopprijs,
    hypotheekBedrag,
    hypotheekRente,
    hypotheekLooptijd = 30,
    hypotheekVorm = 'annuiteit',
    wozWaarde = koopprijs,
    marginalTaxRate = 0.3693,
    vveKosten = 0,
    maintenancePercentage = 0.01,
    opstalverzekering = 600,
    homeAppreciation = 0.03,
    kostenKoperPercentage = 0.06,
    maandelijkseHuur,
    huurstijging = 0.03,
    huurdersverzekering = 10,
    years,
    investmentReturn = 0.05,
  } = input;

  const eigenwoningforfaitPct =
    input.eigenwoningforfaitPercentage ?? getEigenwoningforfait(wozWaarde);

  const initialPurchaseCosts = koopprijs * kostenKoperPercentage;
  const downPayment = koopprijs - hypotheekBedrag + initialPurchaseCosts;
  const monthlyRate = hypotheekRente / 12;
  const totalMonths = hypotheekLooptijd * 12;

  // Calculate annuity monthly payment
  let baseMonthlyPayment: number;
  if (monthlyRate === 0) {
    baseMonthlyPayment = hypotheekBedrag / totalMonths;
  } else {
    baseMonthlyPayment =
      (hypotheekBedrag * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  const schedule: HuurVsKoopResult['schedule'] = [];
  let remainingMortgage = hypotheekBedrag;
  let currentHomeValue = koopprijs;
  let currentWoz = wozWaarde;
  let currentRent = maandelijkseHuur * 12;
  let cumulativeNetCostKopen = initialPurchaseCosts;
  let cumulativeNetCostHuren = 0;
  // Opportunity cost: renter can invest the down payment
  let rentingInvestmentValue = downPayment;
  let breakEvenYear: number | null = null;

  for (let year = 1; year <= years; year++) {
    // --- Buying: calculate annual interest and principal ---
    let annualInterest = 0;
    let annualPrincipal = 0;
    const startBalance = remainingMortgage;

    if (remainingMortgage > 0) {
      for (let m = 0; m < 12; m++) {
        if (remainingMortgage <= 0) break;
        const monthlyInterest = remainingMortgage * monthlyRate;
        let monthlyPrincipal: number;
        if (hypotheekVorm === 'lineair') {
          monthlyPrincipal = hypotheekBedrag / totalMonths;
        } else {
          monthlyPrincipal = baseMonthlyPayment - monthlyInterest;
        }
        monthlyPrincipal = Math.max(0, Math.min(monthlyPrincipal, remainingMortgage));
        annualInterest += monthlyInterest;
        annualPrincipal += monthlyPrincipal;
        remainingMortgage -= monthlyPrincipal;
      }
    }
    remainingMortgage = Math.max(0, remainingMortgage);
    const annualMortgagePayment = annualInterest + annualPrincipal;

    // Eigenwoningforfait (imputed rental value, added to income)
    const ewfPct = currentWoz > 1_200_000
      ? getEigenwoningforfait(currentWoz)
      : eigenwoningforfaitPct;
    const eigenwoningforfait = currentWoz * ewfPct;

    // Mortgage interest deduction (hypotheekrenteaftrek)
    // Net benefit = interest * marginalTaxRate - eigenwoningforfait * marginalTaxRate
    const deductibleInterest = Math.max(0, annualInterest - eigenwoningforfait);
    const interestDeduction = deductibleInterest * marginalTaxRate;
    const netMortgageCost = annualMortgagePayment - interestDeduction;

    // Other ownership costs
    const ownerCosts =
      currentHomeValue * maintenancePercentage + opstalverzekering + vveKosten;

    const totalAnnualCostKopen = netMortgageCost + ownerCosts;
    cumulativeNetCostKopen += totalAnnualCostKopen;

    currentHomeValue *= 1 + homeAppreciation;
    currentWoz *= 1 + homeAppreciation;
    const equity = currentHomeValue - remainingMortgage;

    // --- Renting ---
    const annualRent = currentRent + huurdersverzekering * 12;
    cumulativeNetCostHuren += annualRent;
    currentRent *= 1 + huurstijging;

    // Renter's invested down payment grows at investment return
    rentingInvestmentValue *= 1 + investmentReturn;
    // Also invest the difference if renting is cheaper each year
    const annualCostDiff = totalAnnualCostKopen - annualRent;
    if (annualCostDiff > 0) {
      // Renting is cheaper, renter can invest the difference
      rentingInvestmentValue += annualCostDiff;
    }

    // Net worth: buyer has equity, renter has investment portfolio
    const buyingNetWorth = equity - cumulativeNetCostKopen;
    const rentingNetWorth = rentingInvestmentValue - cumulativeNetCostHuren;

    if (breakEvenYear === null && buyingNetWorth > rentingNetWorth) {
      breakEvenYear = year;
    }

    schedule.push({
      year,
      mortgagePayment: Math.round(annualMortgagePayment * 100) / 100,
      interestDeduction: Math.round(interestDeduction * 100) / 100,
      eigenwoningforfait: Math.round(eigenwoningforfait * 100) / 100,
      netMortgageCost: Math.round(netMortgageCost * 100) / 100,
      ownerCosts: Math.round(ownerCosts * 100) / 100,
      homeValue: Math.round(currentHomeValue * 100) / 100,
      remainingMortgage: Math.round(remainingMortgage * 100) / 100,
      equity: Math.round(equity * 100) / 100,
      cumulativeNetCostKopen: Math.round(cumulativeNetCostKopen * 100) / 100,
      annualRent: Math.round(annualRent * 100) / 100,
      cumulativeNetCostHuren: Math.round(cumulativeNetCostHuren * 100) / 100,
      buyingNetWorth: Math.round(buyingNetWorth * 100) / 100,
      rentingNetWorth: Math.round(rentingNetWorth * 100) / 100,
    });
  }

  const finalSchedule = schedule[schedule.length - 1];
  const homeValueAtEnd = finalSchedule?.homeValue ?? koopprijs;
  const remainingMortgageAtEnd = finalSchedule?.remainingMortgage ?? hypotheekBedrag;
  const netEquityAtEnd = homeValueAtEnd - remainingMortgageAtEnd;

  const netWorthDifference = (finalSchedule?.buyingNetWorth ?? 0) - (finalSchedule?.rentingNetWorth ?? 0);
  const betterOption: 'kopen' | 'huren' | 'gelijk' =
    Math.abs(netWorthDifference) < 1000 ? 'gelijk' : netWorthDifference > 0 ? 'kopen' : 'huren';

  const avgMonthlyCostKopen = cumulativeNetCostKopen / (years * 12);
  const avgMonthlyCostHuren = cumulativeNetCostHuren / (years * 12);

  return {
    totalNetCostKopen: Math.round(cumulativeNetCostKopen * 100) / 100,
    totalNetCostHuren: Math.round(cumulativeNetCostHuren * 100) / 100,
    netEquityAtEnd: Math.round(netEquityAtEnd * 100) / 100,
    netWorthDifference: Math.round(netWorthDifference * 100) / 100,
    betterOption,
    breakEvenYear,
    homeValueAtEnd: Math.round(homeValueAtEnd * 100) / 100,
    remainingMortgage: Math.round(remainingMortgageAtEnd * 100) / 100,
    initialPurchaseCosts: Math.round(initialPurchaseCosts * 100) / 100,
    avgMonthlyCostKopen: Math.round(avgMonthlyCostKopen * 100) / 100,
    avgMonthlyCostHuren: Math.round(avgMonthlyCostHuren * 100) / 100,
    schedule,
  };
}

// ============================================================
// SECTION 5: GIFT TAX / SCHENKBELASTING (2026)
// ============================================================

/**
 * Dutch gift tax (schenkbelasting) 2026 rules:
 *
 * Exemptions (vrijstellingen) 2026:
 * - From parent to child: €6,633/year
 * - One-time from parent to child (18-40): €31,813 (vrij te besteden)
 * - One-time from parent to child for own home: €28,947 (eigenwoningschenking)
 *   (The large one-time €106k+ eigenwoningschenking was abolished in 2024)
 * - From grandparent/third party to person: €2,658/year
 *
 * Tax rates (schenkbelasting):
 * Partner / children / foster children:
 *   0 - €152,368:   10%
 *   > €152,368:     20%
 *
 * Grandchildren / other descendants:
 *   0 - €152,368:   18%
 *   > €152,368:     36%
 *
 * Other recipients:
 *   0 - €152,368:   30%
 *   > €152,368:     40%
 */

export type SchenkingRelatie =
  | 'kind'
  | 'kleinkind'
  | 'overig';

export interface SchenkingInput {
  /** Gift amount in euros */
  schenkingsBedrag: number;
  /** Relationship to recipient */
  relatie: SchenkingRelatie;
  /**
   * Type of exemption to apply:
   * - 'jaarlijks': annual exemption
   * - 'eenmalig_verhoogd': one-time elevated exemption (parent to child 18-40, any purpose)
   * - 'eigenwoningschenking': one-time exemption for own home purchase
   * - 'geen': no exemption (or already used)
   */
  vrijstellingType?: 'jaarlijks' | 'eenmalig_verhoogd' | 'eigenwoningschenking' | 'geen';
  /**
   * Age of recipient (required for eenmalig_verhoogd and eigenwoningschenking,
   * which are only available for recipients aged 18-40)
   */
  leeftijdOntvanger?: number;
  /**
   * Previously received gifts from same donor this year.
   */
  eerderOntvangen?: number;
}

export interface SchenkingResult {
  schenkingsBedrag: number;
  vrijstelling: number;
  belastbaarBedrag: number;
  schenkbelasting: number;
  nettoOntvangen: number;
  effectiefTarief: number;
  bracketBreakdown: Array<{
    bracket: string;
    rate: number;
    taxableInBracket: number;
    taxInBracket: number;
  }>;
}

const SCHENK_BRACKET_THRESHOLD = 152_368;

function getSchenkingVrijstelling(
  relatie: SchenkingRelatie,
  vrijstellingType: SchenkingInput['vrijstellingType'],
  leeftijdOntvanger: number | undefined,
  eerderOntvangen: number
): number {
  const age = leeftijdOntvanger ?? 30;
  const inAgeRange = age >= 18 && age <= 40;

  switch (vrijstellingType) {
    case 'jaarlijks':
      if (relatie === 'kind') return Math.max(0, 6_633 - eerderOntvangen);
      return Math.max(0, 2_658 - eerderOntvangen);

    case 'eenmalig_verhoogd':
      if (relatie === 'kind' && inAgeRange) return Math.max(0, 31_813 - eerderOntvangen);
      return Math.max(0, 6_633 - eerderOntvangen);

    case 'eigenwoningschenking':
      if (inAgeRange) return Math.max(0, 28_947 - eerderOntvangen);
      return 0;

    case 'geen':
    default:
      return 0;
  }
}

function calculateSchenkbelasting(taxableAmount: number, relatie: SchenkingRelatie): {
  tax: number;
  breakdown: SchenkingResult['bracketBreakdown'];
} {
  if (taxableAmount <= 0) return { tax: 0, breakdown: [] };

  type BracketDef = { threshold: number; rate: number; label: string };
  let rates: BracketDef[];
  const thresholdLabel = 'EUR152.368';
  switch (relatie) {
    case 'kind':
      rates = [
        { threshold: SCHENK_BRACKET_THRESHOLD, rate: 0.10, label: '0 - ' + thresholdLabel },
        { threshold: Infinity, rate: 0.20, label: '> ' + thresholdLabel },
      ];
      break;
    case 'kleinkind':
      rates = [
        { threshold: SCHENK_BRACKET_THRESHOLD, rate: 0.18, label: '0 - ' + thresholdLabel },
        { threshold: Infinity, rate: 0.36, label: '> ' + thresholdLabel },
      ];
      break;
    default:
      rates = [
        { threshold: SCHENK_BRACKET_THRESHOLD, rate: 0.30, label: '0 - ' + thresholdLabel },
        { threshold: Infinity, rate: 0.40, label: '> ' + thresholdLabel },
      ];
  }

  let remaining = taxableAmount;
  let totalTax = 0;
  let previousThreshold = 0;
  const breakdown: SchenkingResult['bracketBreakdown'] = [];

  for (const bracket of rates) {
    if (remaining <= 0) break;
    const bracketSize = Math.min(remaining, Math.max(0, bracket.threshold - previousThreshold));
    const taxInBracket = bracketSize * bracket.rate;
    if (bracketSize > 0) {
      breakdown.push({
        bracket: bracket.label,
        rate: bracket.rate,
        taxableInBracket: Math.round(bracketSize * 100) / 100,
        taxInBracket: Math.round(taxInBracket * 100) / 100,
      });
    }
    totalTax += taxInBracket;
    remaining -= bracketSize;
    previousThreshold = bracket.threshold;
  }

  return { tax: Math.round(totalTax * 100) / 100, breakdown };
}

/**
 * Calculates Dutch gift tax (schenkbelasting) for a single gift in 2026.
 */
export function calculateSchenking(input: SchenkingInput): SchenkingResult {
  const {
    schenkingsBedrag,
    relatie,
    vrijstellingType = 'jaarlijks',
    leeftijdOntvanger,
    eerderOntvangen = 0,
  } = input;

  const vrijstelling = getSchenkingVrijstelling(relatie, vrijstellingType, leeftijdOntvanger, eerderOntvangen);
  const effectiveVrijstelling = Math.min(vrijstelling, schenkingsBedrag);
  const belastbaarBedrag = Math.max(0, schenkingsBedrag - effectiveVrijstelling);

  const { tax: schenkbelasting, breakdown } = calculateSchenkbelasting(belastbaarBedrag, relatie);
  const nettoOntvangen = schenkingsBedrag - schenkbelasting;
  const effectiefTarief = schenkingsBedrag > 0 ? schenkbelasting / schenkingsBedrag : 0;

  return {
    schenkingsBedrag,
    vrijstelling: effectiveVrijstelling,
    belastbaarBedrag: Math.round(belastbaarBedrag * 100) / 100,
    schenkbelasting,
    nettoOntvangen: Math.round(nettoOntvangen * 100) / 100,
    effectiefTarief: Math.round(effectiefTarief * 10000) / 10000,
    bracketBreakdown: breakdown,
  };
}

// ============================================================
// SECTION 6: INHERITANCE TAX / ERFBELASTING (2026)
// ============================================================

/**
 * Dutch inheritance tax (erfbelasting) 2026 rules:
 *
 * Exemptions (vrijstellingen) 2026:
 * - Partner / registered partner / cohabitant (min 5 years): €795,156
 * - Children / foster children: €23,432
 * - Ill/disabled children (receiving at least 3x exemption from parent): €70,294
 * - Grandchildren: €23,432
 * - Parents: €56,122
 * - Other heirs: €2,658
 *
 * Tax rates (erfbelasting) 2026:
 * Partner / children / foster children:
 *   0 - €152,368:   10%
 *   > €152,368:     20%
 *
 * Grandchildren / other descendants:
 *   0 - €152,368:   18%
 *   > €152,368:     36%
 *
 * Other heirs (siblings, parents, etc.):
 *   0 - €152,368:   30%
 *   > €152,368:     40%
 *
 * Note: Partners may also invoke the partner exemption for pension rights (IOAW etc.)
 */

export type ErfbelastingRelatie =
  | 'partner'
  | 'kind'
  | 'kind_invalide'
  | 'kleinkind'
  | 'ouder'
  | 'overig';

export interface ErfbelastingInput {
  /** Gross estate value (nalatenschap) in euros */
  nalatenschapWaarde: number;
  /** Heir's relationship to the deceased */
  relatie: ErfbelastingRelatie;
  /**
   * Share of the estate this heir receives (0-1).
   * E.g. 0.5 if two equal heirs.
   */
  erfdeel: number;
  /**
   * Whether to apply the standard exemption automatically.
   * Set to false if the heir has already used their exemption partially.
   */
  applyVrijstelling?: boolean;
  /**
   * Custom exemption override in euros (overrides automatic calculation).
   */
  customVrijstelling?: number;
  /**
   * Debts of the estate (schulden nalatenschap) deducted from gross value.
   */
  schulden?: number;
}

export interface ErfbelastingResult {
  /** Gross estate value */
  nalatenschapWaarde: number;
  /** Net estate value after debts */
  nettoNalatenschap: number;
  /** This heir's share amount */
  erfdeelBedrag: number;
  /** Applied exemption */
  vrijstelling: number;
  /** Taxable inheritance */
  belastbaarErfdeel: number;
  /** Calculated inheritance tax */
  erfbelasting: number;
  /** Net amount received after tax */
  nettoOntvangen: number;
  /** Effective tax rate on the gross share */
  effectiefTarief: number;
  /** Breakdown per tax bracket */
  bracketBreakdown: Array<{
    bracket: string;
    rate: number;
    taxableInBracket: number;
    taxInBracket: number;
  }>;
}

/** 2026 exemptions per relationship */
const ERF_VRIJSTELLINGEN_2026: Record<ErfbelastingRelatie, number> = {
  partner: 795_156,
  kind: 23_432,
  kind_invalide: 70_294,
  kleinkind: 23_432,
  ouder: 56_122,
  overig: 2_658,
};

/** 2026 tax bracket threshold */
const ERF_BRACKET_THRESHOLD = 152_368;

/**
 * Determines the applicable tax rate schedule based on relationship.
 */
function getErfbelastingRates(
  relatie: ErfbelastingRelatie
): Array<{ threshold: number; rate: number; label: string }> {
  const thresholdLabel = 'EUR152.368';
  switch (relatie) {
    case 'partner':
    case 'kind':
    case 'kind_invalide':
      return [
        { threshold: ERF_BRACKET_THRESHOLD, rate: 0.10, label: '0 - ' + thresholdLabel },
        { threshold: Infinity, rate: 0.20, label: '> ' + thresholdLabel },
      ];
    case 'kleinkind':
      return [
        { threshold: ERF_BRACKET_THRESHOLD, rate: 0.18, label: '0 - ' + thresholdLabel },
        { threshold: Infinity, rate: 0.36, label: '> ' + thresholdLabel },
      ];
    default: // ouder, overig
      return [
        { threshold: ERF_BRACKET_THRESHOLD, rate: 0.30, label: '0 - ' + thresholdLabel },
        { threshold: Infinity, rate: 0.40, label: '> ' + thresholdLabel },
      ];
  }
}

function computeErfbelasting(
  taxableAmount: number,
  relatie: ErfbelastingRelatie
): { tax: number; breakdown: ErfbelastingResult['bracketBreakdown'] } {
  if (taxableAmount <= 0) return { tax: 0, breakdown: [] };

  const rates = getErfbelastingRates(relatie);
  let remaining = taxableAmount;
  let totalTax = 0;
  let previousThreshold = 0;
  const breakdown: ErfbelastingResult['bracketBreakdown'] = [];

  for (const bracket of rates) {
    if (remaining <= 0) break;
    const bracketSize = Math.min(remaining, Math.max(0, bracket.threshold - previousThreshold));
    const taxInBracket = bracketSize * bracket.rate;
    if (bracketSize > 0) {
      breakdown.push({
        bracket: bracket.label,
        rate: bracket.rate,
        taxableInBracket: Math.round(bracketSize * 100) / 100,
        taxInBracket: Math.round(taxInBracket * 100) / 100,
      });
    }
    totalTax += taxInBracket;
    remaining -= bracketSize;
    previousThreshold = bracket.threshold;
  }

  return { tax: Math.round(totalTax * 100) / 100, breakdown };
}

/**
 * Calculates Dutch inheritance tax (erfbelasting) for one heir in 2026.
 *
 * Note: This calculates for a single heir. For multiple heirs, call this
 * function separately for each heir with their respective erfdeel.
 */
export function calculateErfbelasting(input: ErfbelastingInput): ErfbelastingResult {
  const {
    nalatenschapWaarde,
    relatie,
    erfdeel,
    applyVrijstelling = true,
    customVrijstelling,
    schulden = 0,
  } = input;

  const nettoNalatenschap = Math.max(0, nalatenschapWaarde - schulden);
  const erfdeelBedrag = nettoNalatenschap * erfdeel;

  let vrijstelling: number;
  if (customVrijstelling !== undefined) {
    vrijstelling = customVrijstelling;
  } else if (applyVrijstelling) {
    vrijstelling = ERF_VRIJSTELLINGEN_2026[relatie];
  } else {
    vrijstelling = 0;
  }

  const effectiveVrijstelling = Math.min(vrijstelling, erfdeelBedrag);
  const belastbaarErfdeel = Math.max(0, erfdeelBedrag - effectiveVrijstelling);

  const { tax: erfbelasting, breakdown } = computeErfbelasting(belastbaarErfdeel, relatie);
  const nettoOntvangen = erfdeelBedrag - erfbelasting;
  const effectiefTarief = erfdeelBedrag > 0 ? erfbelasting / erfdeelBedrag : 0;

  return {
    nalatenschapWaarde,
    nettoNalatenschap: Math.round(nettoNalatenschap * 100) / 100,
    erfdeelBedrag: Math.round(erfdeelBedrag * 100) / 100,
    vrijstelling: Math.round(effectiveVrijstelling * 100) / 100,
    belastbaarErfdeel: Math.round(belastbaarErfdeel * 100) / 100,
    erfbelasting,
    nettoOntvangen: Math.round(nettoOntvangen * 100) / 100,
    effectiefTarief: Math.round(effectiefTarief * 10000) / 10000,
    bracketBreakdown: breakdown,
  };
}
