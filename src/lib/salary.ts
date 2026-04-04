// ============================================================
// Nederlandse salarisberekening 2026
// Bruto ↔ Netto berekening inclusief heffingskortingen
// ============================================================

// Box 1 belastingtarieven 2026
export const SCHIJF1_GRENS = 38_441;
export const SCHIJF1_TARIEF = 0.3582; // 35,82% (incl. premies volksverzekeringen)
export const SCHIJF2_TARIEF = 0.495;  // 49,50%

// Heffingskortingen 2026
export const AHK_MAX = 3_362;
export const AHK_PHASEOUT_START = 24_812;
export const AHK_PHASEOUT_RATE = 0.06295;
export const AHK_PHASEOUT_END = 77_631;

export const ARBEIDSKORTING_MAX = 5_158;
// Phase 1: 0 – €10,741 @ 8.053%
const AK_P1_END = 10_741;
const AK_P1_RATE = 0.08053;
// Phase 2: €10,741 – €23,201: build up to max
const AK_P2_END = 23_201;
// Phase 3: €23,201 – €39,457: flat at max
const AK_P3_END = 39_457;
// Phase 4: €39,457 – €124,935: taper to zero
const AK_P4_END = 124_935;
const AK_PHASEOUT_RATE = 0.0651;

// Inkomensafhankelijke combinatiekorting (IACK) – partners met kinderen ≤12
export const IACK_MAX = 2_950;
export const IACK_START = 5_867;
export const IACK_PHASEOUT_START = 33_516;
export const IACK_PHASEOUT_RATE = 0.0454;
export const IACK_BUILD_RATE = 0.1145;

// Jonggehandicaptenkorting (Wajong)
export const JONGGEHANDICAPTENKORTING = 854;

// Ouderenkorting
export const OUDERENKORTING_MAX = 2_010;
export const OUDERENKORTING_PHASEOUT_START = 40_888;
export const OUDERENKORTING_PHASEOUT_RATE = 0.15;

// ZVW 2026 (werkgeverspremie, betaalt werkgever — niet zichtbaar op loonstrook werknemer)
// Aanvullende ZVW (inkomensafhankelijk) voor IB-aangifte:
export const ZVW_RATE = 0.0532;
export const ZVW_MAX_INCOME = 71_628;

export type TaxProfile = 'werknemer' | 'zzp' | 'aow';

export interface SalaryInput {
  brutoJaar: number;
  profile: TaxProfile;
  heeftPartner: boolean;
  heeftKinderenOnder12: boolean;
  leeftijd: number;       // Voor ouderenkorting check
  vakantiegeld: boolean;  // Vakantiegeld apart weergeven
}

export interface SalaryResult {
  brutoJaar: number;
  brutoMaand: number;
  vakantiegeldMaand: number;

  // Belasting vóór kortingen
  loonheffingVoorKortingen: number;

  // Heffingskortingen
  algemenHeffingskorting: number;
  arbeidskorting: number;
  iack: number;
  totalKortingen: number;

  // Netto loonheffing
  loonheffingNetto: number;

  // ZVW (indicatief, voor ZZP)
  zvwBijdrage: number;

  // Resultaten
  nettoJaar: number;
  nettoMaand: number;
  nettoMaandMetVakantiegeld: number;

  // Percentages
  effectiefTarief: number;
  marginaalTarief: number;

  // Details per schijf
  belastingSchijf1: number;
  belastingSchijf2: number;
}

// ---- Arbeidskorting berekenen ----
export function calcArbeidskorting(arbeidsinkomen: number): number {
  if (arbeidsinkomen <= 0) return 0;

  // Phase 1: build-up
  if (arbeidsinkomen <= AK_P1_END) {
    return Math.round(arbeidsinkomen * AK_P1_RATE);
  }

  const p1 = AK_P1_END * AK_P1_RATE; // ≈ 865

  // Phase 2: steiler build-up naar max
  if (arbeidsinkomen <= AK_P2_END) {
    const p2Rate = (ARBEIDSKORTING_MAX - p1) / (AK_P3_END - AK_P1_END);
    return Math.round(p1 + (arbeidsinkomen - AK_P1_END) * p2Rate);
  }

  // Phase 3: vlak op maximum
  if (arbeidsinkomen <= AK_P3_END) {
    return ARBEIDSKORTING_MAX;
  }

  // Phase 4: afbouw
  if (arbeidsinkomen <= AK_P4_END) {
    return Math.max(0, Math.round(ARBEIDSKORTING_MAX - (arbeidsinkomen - AK_P3_END) * AK_PHASEOUT_RATE));
  }

  return 0;
}

// ---- Algemene heffingskorting berekenen ----
export function calcAHK(inkomen: number, profile: TaxProfile): number {
  if (profile === 'aow') {
    // AOW-gerechtigden hebben lagere AHK (alleen IB-deel, niet premiedeel)
    const aowMax = Math.round(AHK_MAX * 0.4);
    if (inkomen <= AHK_PHASEOUT_START) return aowMax;
    return Math.max(0, Math.round(aowMax - (inkomen - AHK_PHASEOUT_START) * (AHK_PHASEOUT_RATE * 0.4)));
  }

  if (inkomen <= AHK_PHASEOUT_START) return AHK_MAX;
  if (inkomen >= AHK_PHASEOUT_END) return 0;
  return Math.max(0, Math.round(AHK_MAX - (inkomen - AHK_PHASEOUT_START) * AHK_PHASEOUT_RATE));
}

// ---- IACK berekenen ----
export function calcIACK(inkomen: number, heeftKinderenOnder12: boolean): number {
  if (!heeftKinderenOnder12) return 0;
  if (inkomen < IACK_START) return 0;

  let iack = 0;
  if (inkomen <= IACK_PHASEOUT_START) {
    iack = (inkomen - IACK_START) * IACK_BUILD_RATE;
  } else {
    const atPhaseoutStart = (IACK_PHASEOUT_START - IACK_START) * IACK_BUILD_RATE;
    iack = atPhaseoutStart - (inkomen - IACK_PHASEOUT_START) * IACK_PHASEOUT_RATE;
  }
  return Math.max(0, Math.min(IACK_MAX, Math.round(iack)));
}

// ---- Hoofdberekening ----
export function calculateSalary(input: SalaryInput): SalaryResult {
  const { brutoJaar, profile, heeftKinderenOnder12, vakantiegeld: inclVakantiegeld } = input;

  // Vakantiegeld (8% van basis = 8/108 van totaal bruto incl. vakantiegeld)
  const vakantiegeldFactor = inclVakantiegeld ? 8 / 108 : 0;
  const vakantiegeldJaar = Math.round(brutoJaar * vakantiegeldFactor);
  const vakantiegeldMaand = Math.round(vakantiegeldJaar / 12);
  const brutoMaand = Math.round((brutoJaar - vakantiegeldJaar) / 12);

  // Belasting per schijf
  const belastingSchijf1 = Math.round(Math.min(brutoJaar, SCHIJF1_GRENS) * SCHIJF1_TARIEF);
  const belastingSchijf2 = brutoJaar > SCHIJF1_GRENS
    ? Math.round((brutoJaar - SCHIJF1_GRENS) * SCHIJF2_TARIEF)
    : 0;
  const loonheffingVoorKortingen = belastingSchijf1 + belastingSchijf2;

  // Heffingskortingen
  const ahk = calcAHK(brutoJaar, profile);
  const ak = profile === 'aow' ? 0 : calcArbeidskorting(brutoJaar);
  const iack = calcIACK(brutoJaar, heeftKinderenOnder12);
  const totalKortingen = Math.min(loonheffingVoorKortingen, ahk + ak + iack);

  // Netto loonheffing
  const loonheffingNetto = Math.max(0, loonheffingVoorKortingen - totalKortingen);

  // ZVW (alleen relevant voor ZZP/ondernemers in IB-aangifte)
  const zvwBijdrage = profile === 'zzp'
    ? Math.round(Math.min(brutoJaar, ZVW_MAX_INCOME) * ZVW_RATE)
    : 0;

  // Netto jaarinkomen
  const nettoJaar = brutoJaar - loonheffingNetto - zvwBijdrage;
  const nettoMaand = Math.round(nettoJaar / 12);
  const nettoMaandMetVakantiegeld = Math.round((nettoJaar - vakantiegeldJaar) / 12);

  // Effectief tarief
  const effectiefTarief = brutoJaar > 0 ? (loonheffingNetto + zvwBijdrage) / brutoJaar : 0;
  const marginaalTarief = brutoJaar > SCHIJF1_GRENS ? SCHIJF2_TARIEF : SCHIJF1_TARIEF;

  return {
    brutoJaar,
    brutoMaand,
    vakantiegeldMaand,
    loonheffingVoorKortingen,
    algemenHeffingskorting: ahk,
    arbeidskorting: ak,
    iack,
    totalKortingen,
    loonheffingNetto,
    zvwBijdrage,
    nettoJaar,
    nettoMaand,
    nettoMaandMetVakantiegeld,
    effectiefTarief,
    marginaalTarief,
    belastingSchijf1,
    belastingSchijf2,
  };
}

// ---- Netto → Bruto omrekenen (iteratief) ----
export function nettoNaarBruto(nettoJaar: number, profile: TaxProfile, heeftKinderenOnder12: boolean): number {
  let bruto = nettoJaar * 1.5; // Startschatting
  for (let i = 0; i < 50; i++) {
    const result = calculateSalary({
      brutoJaar: bruto,
      profile,
      heeftPartner: false,
      heeftKinderenOnder12,
      leeftijd: 35,
      vakantiegeld: false,
    });
    const diff = result.nettoJaar - nettoJaar;
    if (Math.abs(diff) < 1) break;
    bruto -= diff * 0.5;
  }
  return Math.round(bruto);
}
