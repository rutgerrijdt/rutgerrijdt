// ============================================================
// NHG – Nationale Hypotheek Garantie – normen 2025
// ============================================================

import type { NHGResult, MortgageDetails } from './types';

// NHG kostengrens 2025
export const NHG_LIMIT_2025 = 435_000;
export const NHG_LIMIT_ENERGY_2025 = 461_100; // +6% voor energiebesparende maatregelen

// Borgtochtprovisie (eenmalig, onderdeel van de hypotheek)
export const NHG_FEE_PERCENTAGE = 0.006; // 0.6%

// Rente­voordeel met NHG (indicatief, verschilt per geldverstrekker)
export const NHG_INTEREST_DISCOUNT = 0.004; // ~0.4% lager

// ---- Startersvrijstelling ----
// Kopers < 35 jaar zijn vrijgesteld van overdrachtsbelasting (2%)
// bij woningwaarde <= €510.000 (2025)
export const STARTER_OVB_VRIJSTELLING_GRENS = 510_000;

// Overdrachtsbelasting
export const OVB_PERCENTAGE_NORMAAL = 0.02;    // 2% bij eigen bewoning
export const OVB_PERCENTAGE_INVESTEERDER = 0.1; // 10.4% bij belegging

// ---- NHG eligibility check ----
export function checkNHG(mortgage: MortgageDetails): NHGResult {
  const limit = mortgage.includeEnergyMeasures ? NHG_LIMIT_ENERGY_2025 : NHG_LIMIT_2025;

  const eligible =
    mortgage.nhgDesired &&
    mortgage.propertyValue <= limit &&
    mortgage.requestedAmount <= limit &&
    mortgage.loanTerm <= 30;

  const fee = mortgage.requestedAmount * NHG_FEE_PERCENTAGE;

  // Netto besparing over 30 jaar: rentevoordeel - eenmalige provisie
  const annualSaving = mortgage.requestedAmount * NHG_INTEREST_DISCOUNT;
  const netBenefit = Math.round(annualSaving * mortgage.loanTerm - fee);

  let reason: string | undefined;
  if (!mortgage.nhgDesired) {
    reason = 'NHG niet gewenst';
  } else if (mortgage.propertyValue > limit) {
    reason = `Woningwaarde (€${formatEuro(mortgage.propertyValue)}) overschrijdt NHG-grens van €${formatEuro(limit)}`;
  } else if (mortgage.requestedAmount > limit) {
    reason = `Hypotheekbedrag (€${formatEuro(mortgage.requestedAmount)}) overschrijdt NHG-grens van €${formatEuro(limit)}`;
  } else if (mortgage.loanTerm > 30) {
    reason = 'Looptijd mag maximaal 30 jaar zijn voor NHG';
  }

  return {
    eligible,
    reason,
    maxLimit: limit,
    fee: Math.round(fee),
    interestDiscount: NHG_INTEREST_DISCOUNT,
    netBenefit,
  };
}

// ---- Overdrachtsbelasting berekenen ----
export function calculateOVB(
  propertyValue: number,
  dateOfBirth: string,
  firstHome: boolean
): { percentage: number; amount: number; starterVrijstelling: boolean } {
  if (!firstHome) {
    return { percentage: OVB_PERCENTAGE_NORMAAL, amount: Math.round(propertyValue * OVB_PERCENTAGE_NORMAAL), starterVrijstelling: false };
  }

  // Startersvrijstelling: koper moet < 35 jaar zijn
  let age = 0;
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    age = now.getFullYear() - dob.getFullYear();
  }

  const starterVrijstelling = age > 0 && age < 35 && propertyValue <= STARTER_OVB_VRIJSTELLING_GRENS;

  if (starterVrijstelling) {
    return { percentage: 0, amount: 0, starterVrijstelling: true };
  }

  return {
    percentage: OVB_PERCENTAGE_NORMAAL,
    amount: Math.round(propertyValue * OVB_PERCENTAGE_NORMAAL),
    starterVrijstelling: false,
  };
}

// ---- Bijkomende kosten berekenen ----
export function calculateBijkomendeKosten(
  propertyValue: number,
  requestedAmount: number,
  nhgEligible: boolean,
  ovbAmount: number
): {
  ovb: number;
  notariskosten: number;
  taxatiekosten: number;
  nhgFee: number;
  total: number;
} {
  const notariskosten = 1200; // Indicatief
  const taxatiekosten = 600;  // Indicatief
  const nhgFee = nhgEligible ? Math.round(requestedAmount * NHG_FEE_PERCENTAGE) : 0;

  return {
    ovb: ovbAmount,
    notariskosten,
    taxatiekosten,
    nhgFee,
    total: ovbAmount + notariskosten + taxatiekosten + nhgFee,
  };
}

function formatEuro(amount: number): string {
  return amount.toLocaleString('nl-NL');
}
