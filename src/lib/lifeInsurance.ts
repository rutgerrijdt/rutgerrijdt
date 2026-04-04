// ============================================================
// Overlijdensrisicoverzekering (ORV) – Premie-indicatie
// ============================================================

export type Gender = 'man' | 'vrouw';
export type HealthStatus = 'goed' | 'normaal' | 'slecht';
export type CoverageType = 'gelijkblijvend' | 'annuïtair_dalend' | 'lineair_dalend';

export interface ORVInput {
  leeftijd: number;
  gender: Gender;
  rookt: boolean;
  health: HealthStatus;
  verzekerdBedrag: number;
  looptijdJaar: number;
  dekking: CoverageType;
}

export interface ORVResult {
  maandPremie: number;
  jaarPremie: number;
  totalePremie: number;
  risicoScore: number;          // 1–10 schaal
  aanbevolenDekking: number;
  toelichting: string[];
}

// ---- Actuariële basistabel (premie per €100.000 per jaar, gelijkblijvende dekking) ----
// Bron: marktgemiddelde indicaties
const BASE_RATE_PER_100K: Record<number, { man: number; vrouw: number }> = {
  20: { man: 50,  vrouw: 38  },
  25: { man: 60,  vrouw: 45  },
  30: { man: 78,  vrouw: 58  },
  35: { man: 108, vrouw: 80  },
  40: { man: 162, vrouw: 118 },
  45: { man: 252, vrouw: 182 },
  50: { man: 410, vrouw: 295 },
  55: { man: 680, vrouw: 490 },
  60: { man: 1150,vrouw: 820 },
  65: { man: 1950,vrouw: 1400},
};

function getBaseRate(leeftijd: number, gender: Gender): number {
  const clamped = Math.max(20, Math.min(65, Math.round(leeftijd / 5) * 5));
  return BASE_RATE_PER_100K[clamped]?.[gender] ?? BASE_RATE_PER_100K[65][gender];
}

// ---- Looptijdfactor ----
function getTermFactor(looptijd: number): number {
  // Langere looptijd = hogere gemiddelde leeftijd = iets hogere premie
  if (looptijd <= 5)  return 0.70;
  if (looptijd <= 10) return 0.85;
  if (looptijd <= 15) return 1.00;
  if (looptijd <= 20) return 1.18;
  if (looptijd <= 25) return 1.35;
  return 1.55;
}

// ---- Dekkingsfactor ----
function getCoverageFactor(dekking: CoverageType): number {
  switch (dekking) {
    case 'gelijkblijvend':   return 1.00;
    case 'annuïtair_dalend': return 0.58; // ~42% goedkoper
    case 'lineair_dalend':   return 0.52;
  }
}

// ---- Gezondheidsopslag ----
function getHealthFactor(health: HealthStatus): number {
  switch (health) {
    case 'goed':   return 0.90;
    case 'normaal':return 1.00;
    case 'slecht': return 1.50;
  }
}

// ---- Rooksopslag ----
function getSmokingFactor(rookt: boolean): number {
  return rookt ? 2.30 : 1.00;
}

// ---- Risicoklasse berekenen ----
function calcRisicoScore(input: ORVInput): number {
  let score = 3; // Basis score
  if (input.leeftijd >= 50) score += 2;
  else if (input.leeftijd >= 40) score += 1;
  if (input.rookt) score += 3;
  if (input.health === 'slecht') score += 2;
  else if (input.health === 'normaal') score += 1;
  if (input.gender === 'man') score += 1;
  return Math.min(10, score);
}

// ---- Aanbevolen dekking (op basis van hypotheek/inkomen) ----
export function calcAanbevolenORV(
  hypotheekBedrag: number,
  brutoJaarinkomen: number,
  kinderen: boolean
): number {
  // Minimaal: openstaande hypotheekschuld
  let aanbevolen = hypotheekBedrag;

  // Plus: 3–5x inkomen voor nabestaanden (bij kinderen: meer)
  const inkomensMultiplier = kinderen ? 5 : 3;
  aanbevolen += brutoJaarinkomen * inkomensMultiplier;

  // Afronden op €25.000
  return Math.ceil(aanbevolen / 25_000) * 25_000;
}

// ---- Hoofdberekening ----
export function calculateORV(input: ORVInput): ORVResult {
  const {
    leeftijd, gender, rookt, health,
    verzekerdBedrag, looptijdJaar, dekking,
  } = input;

  const baseRate = getBaseRate(leeftijd, gender);
  const termFactor = getTermFactor(looptijdJaar);
  const coverageFactor = getCoverageFactor(dekking);
  const healthFactor = getHealthFactor(health);
  const smokingFactor = getSmokingFactor(rookt);

  // Jaarpremie per €100.000 verzekerd bedrag
  const annualRatePer100k = baseRate * termFactor * coverageFactor * healthFactor * smokingFactor;

  // Totale jaarpremie
  const jaarPremie = Math.round((annualRatePer100k * verzekerdBedrag) / 100_000);
  const maandPremie = Math.round(jaarPremie / 12);
  const totalePremie = jaarPremie * looptijdJaar;

  const risicoScore = calcRisicoScore(input);

  const toelichting: string[] = [];
  if (rookt) toelichting.push('Roker: premie ca. 2,3× hoger dan niet-roker');
  if (health === 'slecht') toelichting.push('Verminderde gezondheid: medische acceptatie vereist');
  if (leeftijd >= 55) toelichting.push('Hogere leeftijd: premie neemt sterk toe boven 55 jaar');
  if (dekking === 'annuïtair_dalend') toelichting.push('Annuïtair dalende dekking: ideaal bij annuïtaire hypotheek');
  if (dekking === 'lineair_dalend') toelichting.push('Lineair dalende dekking: ideaal bij lineaire hypotheek');
  if (leeftijd + looptijdJaar > 65) toelichting.push('Eindleeftijd >65 jaar: beperkte beschikbaarheid bij verzekeraars');
  toelichting.push('Premies zijn indicatief — definitieve offerte via verzekeraar');

  return {
    maandPremie,
    jaarPremie,
    totalePremie,
    risicoScore,
    aanbevolenDekking: 0, // Wordt buiten berekend
    toelichting,
  };
}

// ---- Vergelijking meerdere scenario's ----
export interface ORVScenario {
  label: string;
  input: ORVInput;
  result: ORVResult;
}

export function compareORVScenarios(inputs: Array<{ label: string; input: ORVInput }>): ORVScenario[] {
  return inputs.map(({ label, input }) => ({
    label,
    input,
    result: calculateORV(input),
  }));
}
