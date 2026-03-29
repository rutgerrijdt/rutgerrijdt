// ============================================================
// Schulden & verplichtingen – impact op maximale hypotheek (GHF)
// ============================================================

export type DebtType =
  | 'studieschuld_oud'    // Oud stelsel (voor sept 2015): 0.75% p/m
  | 'studieschuld_nieuw'  // Nieuw stelsel (sept 2015+): 0.45% p/m
  | 'persoonlijke_lening' // Werkelijke maandlast
  | 'doorlopend_krediet'  // 2% van limiet p/m
  | 'roodstand'           // 2% van limiet p/m
  | 'huurkoop'            // Werkelijke maandlast
  | 'alimentatie'         // Werkelijke maandlast (vermindering inkomen)
  | 'andere_hypotheek'    // Werkelijke maandlast
  | 'overig';             // Werkelijke maandlast

export interface DebtItem {
  id: string;
  type: DebtType;
  description: string;
  originalAmount: number; // Origineel bedrag / kredietlimiet
  monthlyPayment: number; // Werkelijke maandlast (of berekend)
  remainingMonths?: number;
}

// ---- Maandelijkse last per schuld berekenen (GHF-methode) ----
export function calculateMonthlyObligation(debt: DebtItem): number {
  switch (debt.type) {
    case 'studieschuld_oud':
      // Oud stelsel: 0.75% van het oorspronkelijke leenbedrag (fictief)
      return Math.round(debt.originalAmount * 0.0075);
    case 'studieschuld_nieuw':
      // Nieuw stelsel: 0.45% van het oorspronkelijke leenbedrag (fictief)
      return Math.round(debt.originalAmount * 0.0045);
    case 'doorlopend_krediet':
    case 'roodstand':
      // 2% van de kredietlimiet per maand (ongeacht gebruik)
      return Math.round(debt.originalAmount * 0.02);
    case 'persoonlijke_lening':
    case 'huurkoop':
    case 'alimentatie':
    case 'andere_hypotheek':
    case 'overig':
      return debt.monthlyPayment;
    default:
      return debt.monthlyPayment;
  }
}

// ---- Totale maandelijkse lasten ----
export function totalMonthlyObligations(debts: DebtItem[]): number {
  return debts.reduce((sum, d) => sum + calculateMonthlyObligation(d), 0);
}

// ---- Impact op maximale hypotheek ----
// Elke euro aan maandlast verlaagt de max hypotheek met: 1 / annuityFactor
export function debtImpactOnMortgage(
  monthlyObligation: number,
  annualRate: number,
  termYears: number
): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  const factor =
    r === 0 ? 1 / n : (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(monthlyObligation / factor);
}

// ---- Factory ----
export function emptyDebt(): DebtItem {
  return {
    id: `debt-${Date.now()}`,
    type: 'persoonlijke_lening',
    description: '',
    originalAmount: 0,
    monthlyPayment: 0,
  };
}

export const DEBT_LABELS: Record<DebtType, string> = {
  studieschuld_oud: 'Studieschuld (oud stelsel – voor sept. 2015)',
  studieschuld_nieuw: 'Studieschuld (nieuw stelsel – sept. 2015 of later)',
  persoonlijke_lening: 'Persoonlijke lening',
  doorlopend_krediet: 'Doorlopend krediet',
  roodstand: 'Roodstand / creditcard limiet',
  huurkoop: 'Huurkoop / financial lease',
  alimentatie: 'Alimentatieverplichtingen',
  andere_hypotheek: 'Andere hypotheek',
  overig: 'Overige verplichtingen',
};
