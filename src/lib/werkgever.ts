// ============================================================
// Werkgever & Ondernemer Berekeningen 2026
// Werkgeverskosten, BV/DGA optimalisatie, Lijfrente jaarruimte
// ============================================================

// ============================================================
// WERKGEVERSKOSTEN 2026
// Wat kost een werknemer de werkgever?
// ============================================================

// Werkgeverspremies 2026 (indicatief)
export const WW_PREMIE_LAAG    = 0.0278;  // WW lage premie (vast contract)
export const WW_PREMIE_HOOG    = 0.0778;  // WW hoge premie (flex contract)
export const WAO_WIA_PREMIE    = 0.0681;  // Gedifferentieerde Aof-premie (gemiddeld)
export const ZVW_WERKGEVER     = 0.0651;  // ZVW werkgeversheffing
export const RISICOFONDS       = 0.005;   // Gemiddeld risicofonds / sectorfonds
export const VAKANTIEGELD_PCT  = 0.08;    // Vakantiegeld 8%
export const MAX_DAGLOON_2026  = 264.42;  // Max dagloon voor premies
export const MAX_SV_LOON_2026  = MAX_DAGLOON_2026 * 261; // ~69.014

export type ContractType = 'vast' | 'flex' | 'oproep';

export interface WerkgeverskosenInput {
  brutoMaandSalaris: number;
  contractType: ContractType;
  inclusiefVakantiegeld: boolean;
  reiskostenMaand: number;      // Onbelaste reiskosten
  pensioenBijdrageMaand: number; // Werkgeversdeel pensioen
  bonusMaand: number;           // Gemiddelde maandbonus
}

export interface WerkgeverskosenResult {
  brutoSalaris: number;
  vakantiegeld: number;
  wwPremie: number;
  wiaAofPremie: number;
  zvwHeffing: number;
  sectorFonds: number;
  pensioenbijdrage: number;
  reiskosten: number;
  bonus: number;
  totaalLoonkosten: number;
  totaalPremies: number;
  factor: number;    // Loonkosten / bruto salaris
  perUur: number;    // Bij 40u/wk, 52w/jr
  toelichting: string[];
}

export function calculateWerkgeverskosten(input: WerkgeverskosenInput): WerkgeverskosenResult {
  const { brutoMaandSalaris, contractType, inclusiefVakantiegeld, reiskostenMaand, pensioenBijdrageMaand, bonusMaand } = input;

  const brutoJaar = brutoMaandSalaris * 12;
  const vakantiegeld = inclusiefVakantiegeld ? 0 : Math.round(brutoJaar * VAKANTIEGELD_PCT);

  // Premies over SV-loon (gemaximeerd)
  const svLoon = Math.min(brutoJaar + vakantiegeld, MAX_SV_LOON_2026);
  const wwPct = contractType === 'vast' ? WW_PREMIE_LAAG : WW_PREMIE_HOOG;

  const wwPremie       = Math.round(svLoon * wwPct);
  const wiaAofPremie   = Math.round(svLoon * WAO_WIA_PREMIE);
  const zvwHeffing     = Math.round(svLoon * ZVW_WERKGEVER);
  const sectorFonds    = Math.round(svLoon * RISICOFONDS);
  const pensioenbijdrage = pensioenBijdrageMaand * 12;
  const reiskosten     = reiskostenMaand * 12;
  const bonus          = bonusMaand * 12;

  const totaalPremies = wwPremie + wiaAofPremie + zvwHeffing + sectorFonds;
  const totaalLoonkosten = brutoJaar + vakantiegeld + totaalPremies + pensioenbijdrage + reiskosten + bonus;
  const factor = Math.round((totaalLoonkosten / brutoJaar) * 100) / 100;
  const perUur = Math.round(totaalLoonkosten / (40 * 52 * 0.95)); // 5% verlof/ziekte

  const toelichting = [
    `WW-premie: ${(wwPct*100).toFixed(2)}% (${contractType === 'vast' ? 'laag – vast contract' : 'hoog – flex contract'})`,
    `ZVW werkgeversheffing: ${(ZVW_WERKGEVER*100).toFixed(2)}%`,
    `Premies gemaximeerd op SV-loon (€${MAX_SV_LOON_2026.toLocaleString('nl-NL')}/jr)`,
    'Exclusief: dertiende maand, auto van de zaak, opleidingskosten',
    `Loonkostenfactor: ${factor}× bruto salaris`,
  ];

  return {
    brutoSalaris: brutoJaar,
    vakantiegeld,
    wwPremie,
    wiaAofPremie,
    zvwHeffing,
    sectorFonds,
    pensioenbijdrage,
    reiskosten,
    bonus,
    totaalLoonkosten,
    totaalPremies,
    factor,
    perUur,
    toelichting,
  };
}

// ============================================================
// BV vs DGA / SALARIS vs DIVIDEND OPTIMALISATIE 2026
// ============================================================

// Box 1 tarieven 2026
export const IB_SCHIJF1_TARIEF = 0.3582;
export const IB_SCHIJF1_GRENS  = 38_441;
export const IB_SCHIJF2_TARIEF = 0.495;

// Vennootschapsbelasting 2026
export const VPB_TARIEF_LAAG   = 0.19;   // t/m €200.000 winst
export const VPB_TARIEF_HOOG   = 0.258;  // boven €200.000
export const VPB_GRENS         = 200_000;

// Dividend (Box 2)
export const BOX2_TARIEF_1     = 0.2415; // t/m €67.000 dividend
export const BOX2_TARIEF_2     = 0.3315; // boven €67.000
export const BOX2_GRENS        = 67_000;

// Gebruikelijk loon DGA 2026
export const DGA_GEBRUIKELIJK_LOON_MIN = 56_000;

export interface BVOptimalisatieInput {
  bvWinstVoorBelasting: number;  // Winst BV voor aftrek DGA-loon en VPB
  dgaSalaris: number;            // Gewenst DGA-loon
  partnerHeeftSalaris: boolean;
  partnerSalaris: number;
}

export interface BVOptimalisatieResult {
  // DGA situatie
  dgaLoonNetto: number;
  dgaLoonBelasting: number;
  // BV situatie
  bvWinstNaDga: number;
  vpbBelasting: number;
  bvNettoWinst: number;
  // Dividend
  maxDividend: number;
  dividendBelasting: number;
  dividendNetto: number;
  // Totaal
  totaalNetto: number;
  totaalBelasting: number;
  effectiefTarief: number;
  optimaalSalaris: number;
  toelichting: string[];
}

function calcIB(inkomen: number): number {
  const s1 = Math.min(inkomen, IB_SCHIJF1_GRENS) * IB_SCHIJF1_TARIEF;
  const s2 = Math.max(0, inkomen - IB_SCHIJF1_GRENS) * IB_SCHIJF2_TARIEF;
  // Minus heffingskortingen (vereenvoudigd)
  const ahk = inkomen > 77_631 ? 0 : Math.max(0, 3362 - Math.max(0, inkomen - 24812) * 0.06295);
  const ak  = inkomen > 124_935 ? 0 : Math.max(0, Math.min(5158, inkomen * 0.3) - Math.max(0, inkomen - 39457) * 0.0651);
  return Math.max(0, s1 + s2 - ahk - ak);
}

function calcVPB(winst: number): number {
  const s1 = Math.min(winst, VPB_GRENS) * VPB_TARIEF_LAAG;
  const s2 = Math.max(0, winst - VPB_GRENS) * VPB_TARIEF_HOOG;
  return Math.round(s1 + s2);
}

function calcBox2(dividend: number): number {
  const s1 = Math.min(dividend, BOX2_GRENS) * BOX2_TARIEF_1;
  const s2 = Math.max(0, dividend - BOX2_GRENS) * BOX2_TARIEF_2;
  return Math.round(s1 + s2);
}

export function calculateBVOptimalisatie(input: BVOptimalisatieInput): BVOptimalisatieResult {
  const { bvWinstVoorBelasting, dgaSalaris } = input;

  const salaris = Math.max(dgaSalaris, DGA_GEBRUIKELIJK_LOON_MIN);
  const dgaLoonBelasting = calcIB(salaris);
  const dgaLoonNetto = salaris - dgaLoonBelasting;

  const bvWinstNaDga = Math.max(0, bvWinstVoorBelasting - salaris);
  const vpbBelasting = calcVPB(bvWinstNaDga);
  const bvNettoWinst = bvWinstNaDga - vpbBelasting;

  const maxDividend = bvNettoWinst;
  const dividendBelasting = calcBox2(maxDividend);
  const dividendNetto = maxDividend - dividendBelasting;

  const totaalNetto = dgaLoonNetto + dividendNetto;
  const totaalBelasting = dgaLoonBelasting + vpbBelasting + dividendBelasting;
  const effectiefTarief = bvWinstVoorBelasting > 0 ? totaalBelasting / bvWinstVoorBelasting : 0;

  // Optimaal salaris: punt waar grensbelasting IB = VPB + Box2
  const optimaalSalaris = Math.min(bvWinstVoorBelasting, Math.max(DGA_GEBRUIKELIJK_LOON_MIN, IB_SCHIJF1_GRENS));

  const toelichting = [
    `Gebruikelijk loon minimum 2026: €${DGA_GEBRUIKELIJK_LOON_MIN.toLocaleString('nl-NL')}`,
    `VPB: 19% t/m €200.000 | 25,8% daarboven`,
    `Box 2 dividend: 24,15% t/m €67.000 | 33,15% daarboven`,
    'Salaris is aftrekbaar van BV-winst; dividend wordt na VPB uitgekeerd',
    'Raadpleeg belastingadviseur voor persoonlijke optimalisatie',
  ];

  return {
    dgaLoonNetto, dgaLoonBelasting,
    bvWinstNaDga, vpbBelasting, bvNettoWinst,
    maxDividend, dividendBelasting, dividendNetto,
    totaalNetto, totaalBelasting, effectiefTarief,
    optimaalSalaris,
    toelichting,
  };
}

// ============================================================
// LIJFRENTE / JAARRUIMTE 2026
// Aftrekbare pensioenpremie voor IB-aangifte
// ============================================================

export const JAARRUIMTE_FACTOR = 0.30;       // 30% van premie-grondslag
export const JAARRUIMTE_MAX = 36_077;        // Maximum jaarruimte 2026
export const PREMIE_GRONDSLAG_AFTREK = 0.1284; // A-factor aftrek (AOW-franchise factor)
export const AOW_FRANCHISE = 15_028;         // AOW-franchise 2026

export interface LijfrenteInput {
  brutoJaarinkomen: number;
  pensioenaangroei: number;     // Factor A (jaaropgave pensioenfonds, bijv. 8000)
  ouderdomspensioenOpgebouwd: number; // Bestaand opgebouwd pensioen (kapitaal)
  leeftijd: number;
  reserveringsruimteJaren: number; // Jaren teruggaan voor reserveringsruimte (max 10)
}

export interface LijfrenteResult {
  premieGrondslag: number;
  jaarruimte: number;
  reserveringsruimte: number;  // Max 10 jaar terug onbenutte jaarruimte
  totaalAftrekbaar: number;
  belastingvoordeel: number;   // Bij 37% tarief
  nettoInleg: number;          // Na belastingvoordeel
  toelichting: string[];
}

export function calculateJaarruimte(input: LijfrenteInput): LijfrenteResult {
  const { brutoJaarinkomen, pensioenaangroei, leeftijd, reserveringsruimteJaren } = input;

  // Premie-grondslag = inkomen - AOW-franchise
  const premieGrondslag = Math.max(0, brutoJaarinkomen - AOW_FRANCHISE);

  // Jaarruimte = 30% × premie-grondslag - 6,27 × factor A
  const jaarruimteRauw = JAARRUIMTE_FACTOR * premieGrondslag - 6.27 * pensioenaangroei;
  const jaarruimte = Math.max(0, Math.min(JAARRUIMTE_MAX, Math.round(jaarruimteRauw)));

  // Reserveringsruimte (eenvoudige schatting: jaarruimte × jaren, max 40.000)
  const reserveringsruimte = Math.min(40_000, jaarruimte * Math.min(reserveringsruimteJaren, 10));

  const totaalAftrekbaar = jaarruimte + reserveringsruimte;

  // Belastingvoordeel bij Box 1 tarief (36,93% of 49,5% afhankelijk van inkomen)
  const tarief = brutoJaarinkomen > 38_441 ? 0.495 : 0.3693;
  const belastingvoordeel = Math.round(totaalAftrekbaar * tarief);
  const nettoInleg = totaalAftrekbaar - belastingvoordeel;

  const toelichting = [
    `Premie-grondslag: inkomen (${brutoJaarinkomen.toLocaleString('nl-NL')}) - AOW-franchise (${AOW_FRANCHISE.toLocaleString('nl-NL')})`,
    `Jaarruimte = 30% × ${premieGrondslag.toLocaleString('nl-NL')} - 6,27 × factor A`,
    `Factor A (pensioenaangroei) invullen vanuit jaaropgave pensioenfonds`,
    `Belastingvoordeel: ${(tarief*100).toFixed(2)}% van aftrekbaar bedrag`,
    'Lijfrente-uitkering is later belast in Box 1 (uitstel van belasting)',
    'Controleer bij de belastingdienst voor actuele jaarruimteberekening',
  ];

  return {
    premieGrondslag,
    jaarruimte,
    reserveringsruimte,
    totaalAftrekbaar,
    belastingvoordeel,
    nettoInleg,
    toelichting,
  };
}
