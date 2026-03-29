// ============================================================
// Hypotheekrenteaftrek – Box 1 (2026)
// ============================================================

// Box 1 tarieven 2026
export const BOX1_SCHIJF1_GRENS = 38_441;   // 1e schijf t/m dit bedrag
export const BOX1_TARIEF_1 = 0.3582;         // 35,82% (1e schijf)
export const BOX1_TARIEF_2 = 0.495;          // 49,50% (2e schijf, 67-)

// Maximaal aftrekpercentage hypotheekrente (aftrekbeperking)
// Daalt jaarlijks; in 2026: gelijk aan 1e schijftarief
export const MAX_AFTREK_PERCENTAGE = 0.3697; // 36,97%

// Eigenwoningforfait 2026 (% van WOZ-waarde)
export const EWF_PERCENTAGE_NORMAAL = 0.0035; // 0,35% voor WOZ t/m €1.200.000
export const EWF_PERCENTAGE_HOOG = 0.0235;    // 2,35% voor deel boven €1.200.000

export interface TaxResult {
  grossMonthly: number;
  monthlyInterest: number;
  monthlyTaxSaving: number;
  netMonthly: number;
  eigenwoningforfaitMonthly: number;
  netMonthlyIncludingEWF: number;
  effectiveTaxRate: number;
  annualTaxSaving: number;
  totalTaxSavingLooptijd: number;
}

// ---- Bepaal belastingtarief o.b.v. inkomen ----
export function getTaxRate(grossAnnualIncome: number): number {
  return grossAnnualIncome > BOX1_SCHIJF1_GRENS ? BOX1_TARIEF_2 : BOX1_TARIEF_1;
}

// ---- Bereken renteaftrek en netto maandlast ----
export function calculateTaxDeduction(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  mortgageType: 'annuiteit' | 'lineair',
  grossAnnualIncome: number,
  wozValue: number = 0
): TaxResult {
  const r = annualRate / 12;
  const n = termYears * 12;

  // Annuïteitsfactor
  const annuityFactor =
    r === 0
      ? 1 / n
      : (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const grossMonthly =
    mortgageType === 'annuiteit'
      ? loanAmount * annuityFactor
      : loanAmount / n + loanAmount * r; // 1e maand lineair

  // Rentecomponent 1e maand
  const monthlyInterest = loanAmount * r;

  // Effectief aftrekpercentage (laagste van inkomenstarief en wettelijk max)
  const incomeTaxRate = getTaxRate(grossAnnualIncome);
  const effectiveTaxRate = Math.min(incomeTaxRate, MAX_AFTREK_PERCENTAGE);

  const monthlyTaxSaving = monthlyInterest * effectiveTaxRate;
  const netMonthly = grossMonthly - monthlyTaxSaving;

  // Eigenwoningforfait
  let ewfAnnual = 0;
  if (wozValue > 0) {
    if (wozValue <= 1_200_000) {
      ewfAnnual = wozValue * EWF_PERCENTAGE_NORMAAL;
    } else {
      ewfAnnual = 1_200_000 * EWF_PERCENTAGE_NORMAAL + (wozValue - 1_200_000) * EWF_PERCENTAGE_HOOG;
    }
  }
  const eigenwoningforfaitMonthly = ewfAnnual / 12;

  // Netto inclusief EWF-belasting (EWF is belast, geen voordeel maar extra last)
  const ewfTaxMonthly = eigenwoningforfaitMonthly * incomeTaxRate;
  const netMonthlyIncludingEWF = netMonthly + ewfTaxMonthly;

  const annualTaxSaving = monthlyTaxSaving * 12;
  const totalTaxSavingLooptijd = annualTaxSaving * termYears; // Indicatief (daalt elk jaar)

  return {
    grossMonthly: Math.round(grossMonthly),
    monthlyInterest: Math.round(monthlyInterest),
    monthlyTaxSaving: Math.round(monthlyTaxSaving),
    netMonthly: Math.round(netMonthly),
    eigenwoningforfaitMonthly: Math.round(eigenwoningforfaitMonthly),
    netMonthlyIncludingEWF: Math.round(netMonthlyIncludingEWF),
    effectiveTaxRate,
    annualTaxSaving: Math.round(annualTaxSaving),
    totalTaxSavingLooptijd: Math.round(totalTaxSavingLooptijd),
  };
}
