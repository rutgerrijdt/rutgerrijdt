/**
 * Energie & Verduurzaming berekeningen 2026
 * - Zonnepanelen terugverdientijd
 * - Isolatie besparing
 * - Warmtepomp berekening
 * - Energielabel effect op woningwaarde
 */

// ─── Constanten 2026 ─────────────────────────────────────────────────────────

const STROOM_PRIJS_PER_KWH = 0.32;        // €/kWh gemiddeld 2026
const GAS_PRIJS_PER_M3 = 1.45;            // €/m³ gemiddeld 2026
const TERUGLEVER_TARIEF_PER_KWH = 0.09;   // salderingsvergoeding 2026 (afgebouwd)
const BTW_PANELEN = 0.00;                  // 0% BTW op zonnepanelen (particulieren) vanaf 2023
const ISDE_WARMTEPOMP_SUBSIDIE = 2200;     // ISDE subsidie warmtepomp 2026 (lucht-water)

// ─── ZONNEPANELEN ─────────────────────────────────────────────────────────────

export interface ZonnepanelenInput {
  /** Aantal panelen */
  aantalPanelen: number;
  /** Vermogen per paneel in Wp */
  vermogenPerPaneel: number;
  /** Jaarlijkse opbrengst per Wp (kWh/Wp, gemiddeld NL ~0.85) */
  opbrengstPerWp?: number;
  /** Huidige jaarlijkse stroomverbruik in kWh */
  jaarverbruikKwh: number;
  /** Kostprijs per paneel (geïnstalleerd incl. omvormer) */
  kostprijsPerPaneel: number;
  /** Eigen stroomverbruik overdag (%) */
  eigenVerbruikPct: number;
  /** Jaarlijkse stijging stroomprijs (%) */
  stroomprijsStijging: number;
  /** Levensduur panelen in jaren */
  levensduurJaren?: number;
  /** Eventuele subsidie */
  subsidie?: number;
}

export interface ZonnepanelenJaar {
  jaar: number;
  opbrengstKwh: number;
  eigenVerbruikKwh: number;
  teruggeleverdeKwh: number;
  besparingEigenVerbruik: number;
  vergoedingTeruglever: number;
  totaalBesparing: number;
  cumulatieveBesparing: number;
  stroomprijsDitJaar: number;
}

export interface ZonnepanelenResult {
  totaalVermogenWp: number;
  jaarOpbrengstKwh: number;
  investering: number;
  terugverdientijdJaar: number;
  terugverdientijdMaand: number;
  besparing25jaar: number;
  co2BesparingKgPerJaar: number;
  dektEigenVerbruikPct: number;
  schedule: ZonnepanelenJaar[];
}

export function calculateZonnepanelen(input: ZonnepanelenInput): ZonnepanelenResult {
  const opbrengstPerWp = input.opbrengstPerWp ?? 0.87;
  const levensduurJaren = input.levensduurJaren ?? 25;
  const totaalVermogenWp = input.aantalPanelen * input.vermogenPerPaneel;
  const jaarOpbrengstKwh = totaalVermogenWp * opbrengstPerWp;
  const investering = input.aantalPanelen * input.kostprijsPerPaneel - (input.subsidie ?? 0);

  const eigenVerbruikKwh = jaarOpbrengstKwh * (input.eigenVerbruikPct / 100);
  const teruggeleverdeKwh = jaarOpbrengstKwh - eigenVerbruikKwh;

  const schedule: ZonnepanelenJaar[] = [];
  let cumulatieveBesparing = -investering;
  let terugverdientijdJaar = levensduurJaren;
  let terugverdientijdMaand = levensduurJaren * 12;
  let gevonden = false;
  let stroomprijsDitJaar = STROOM_PRIJS_PER_KWH;

  for (let j = 1; j <= levensduurJaren; j++) {
    // Degradatie panelen: ~0.5% per jaar
    const degradatieFactor = Math.pow(0.995, j - 1);
    const opbrengstDitJaar = jaarOpbrengstKwh * degradatieFactor;
    const eigenVerbruikDitJaar = opbrengstDitJaar * (input.eigenVerbruikPct / 100);
    const teruggeleverDitJaar = opbrengstDitJaar - eigenVerbruikDitJaar;

    const besparingEigen = eigenVerbruikDitJaar * stroomprijsDitJaar;
    const vergoedingTerug = teruggeleverDitJaar * TERUGLEVER_TARIEF_PER_KWH;
    const totaalBesparing = besparingEigen + vergoedingTerug;

    cumulatieveBesparing += totaalBesparing;

    if (!gevonden && cumulatieveBesparing >= 0) {
      terugverdientijdJaar = j;
      // Interpoleer voor exacte maand
      const vorig = cumulatieveBesparing - totaalBesparing;
      const maandenInJaar = Math.ceil((-vorig / totaalBesparing) * 12);
      terugverdientijdMaand = (j - 1) * 12 + maandenInJaar;
      gevonden = true;
    }

    schedule.push({
      jaar: j,
      opbrengstKwh: opbrengstDitJaar,
      eigenVerbruikKwh: eigenVerbruikDitJaar,
      teruggeleverdeKwh: teruggeleverDitJaar,
      besparingEigenVerbruik: besparingEigen,
      vergoedingTeruglever: vergoedingTerug,
      totaalBesparing,
      cumulatieveBesparing,
      stroomprijsDitJaar,
    });

    stroomprijsDitJaar *= 1 + input.stroomprijsStijging / 100;
  }

  const besparing25jaar = schedule.reduce((s, r) => s + r.totaalBesparing, 0);
  const co2BesparingKgPerJaar = jaarOpbrengstKwh * 0.45; // 0.45 kg CO₂ per kWh NL
  const dektEigenVerbruikPct = Math.min(100, (jaarOpbrengstKwh / input.jaarverbruikKwh) * 100);

  return {
    totaalVermogenWp,
    jaarOpbrengstKwh,
    investering,
    terugverdientijdJaar,
    terugverdientijdMaand,
    besparing25jaar,
    co2BesparingKgPerJaar,
    dektEigenVerbruikPct,
    schedule,
  };
}

// ─── ISOLATIE ────────────────────────────────────────────────────────────────

export type IsolatieType = 'dakisolatie' | 'vloerisolatie' | 'gevelisolatie' | 'hrGlas' | 'spouwmuurisolatie';

export interface IsolatieInput {
  type: IsolatieType;
  oppervlakteM2: number;
  /** Huidige energierekening gas per jaar */
  gasverbruikM3: number;
}

export interface IsolatieResult {
  type: IsolatieType;
  label: string;
  investering: number;
  jaarlijkseBesparing: number;
  terugverdientijdJaar: number;
  co2BesparingKgPerJaar: number;
  subsidieISDE: number;
  nettoInvestering: number;
}

const ISOLATIE_CONFIG: Record<IsolatieType, {
  label: string;
  kostPerM2: number;
  besparingPctGas: number;
  subsidiePerM2: number;
}> = {
  dakisolatie:        { label: 'Dakisolatie',           kostPerM2: 40,  besparingPctGas: 0.20, subsidiePerM2: 30 },
  vloerisolatie:      { label: 'Vloerisolatie',         kostPerM2: 30,  besparingPctGas: 0.10, subsidiePerM2: 12 },
  gevelisolatie:      { label: 'Gevelisolatie (buiten)', kostPerM2: 120, besparingPctGas: 0.20, subsidiePerM2: 30 },
  hrGlas:             { label: 'HR++-glas',             kostPerM2: 350, besparingPctGas: 0.12, subsidiePerM2: 0  },
  spouwmuurisolatie:  { label: 'Spouwmuurisolatie',     kostPerM2: 25,  besparingPctGas: 0.15, subsidiePerM2: 15 },
};

export function calculateIsolatie(input: IsolatieInput): IsolatieResult {
  const config = ISOLATIE_CONFIG[input.type];
  const investering = config.kostPerM2 * input.oppervlakteM2;
  const subsidieISDE = config.subsidiePerM2 * input.oppervlakteM2;
  const nettoInvestering = Math.max(0, investering - subsidieISDE);

  const gasKostenPerJaar = input.gasverbruikM3 * GAS_PRIJS_PER_M3;
  const jaarlijkseBesparing = gasKostenPerJaar * config.besparingPctGas;
  const terugverdientijdJaar = jaarlijkseBesparing > 0 ? nettoInvestering / jaarlijkseBesparing : 99;
  const co2BesparingKgPerJaar = input.gasverbruikM3 * config.besparingPctGas * 1.89; // 1.89 kg CO₂/m³ gas

  return {
    type: input.type,
    label: config.label,
    investering,
    jaarlijkseBesparing,
    terugverdientijdJaar,
    co2BesparingKgPerJaar,
    subsidieISDE,
    nettoInvestering,
  };
}

// ─── WARMTEPOMP ───────────────────────────────────────────────────────────────

export type WarmtepompType = 'luchtWater' | 'bodemWater' | 'luchtLucht' | 'hybride';

export interface WarmtepompInput {
  type: WarmtepompType;
  /** Huidig gasverbruik voor verwarming + warm water (m³/jaar) */
  gasverbruikM3: number;
  /** Huidig stroomverbruik (kWh/jaar) */
  stroomverbruikKwh: number;
  /** Woningoppervlak (m²) */
  woningOppervlak: number;
  /** Bouwjaar woning */
  bouwjaar: number;
}

export interface WarmtepompResult {
  type: WarmtepompType;
  label: string;
  investering: number;
  subsidieISDE: number;
  nettoInvestering: number;
  huidigeEnergiekosten: number;
  nieuweEnergiekosten: number;
  jaarlijkseBesparing: number;
  terugverdientijdJaar: number;
  cop: number; // Coefficient of Performance
  co2BesparingKgPerJaar: number;
  toelichting: string;
}

const WARMTEPOMP_CONFIG: Record<WarmtepompType, {
  label: string;
  investering: number;
  subsidieISDE: number;
  cop: number;
  gasReductie: number; // % reductie gasverbruik
}> = {
  luchtWater:  { label: 'Lucht-water warmtepomp',   investering: 12000, subsidieISDE: 2200, cop: 3.5, gasReductie: 0.85 },
  bodemWater:  { label: 'Bodem-water warmtepomp',   investering: 20000, subsidieISDE: 4400, cop: 4.5, gasReductie: 0.95 },
  luchtLucht:  { label: 'Lucht-lucht warmtepomp',   investering: 4000,  subsidieISDE: 0,    cop: 3.0, gasReductie: 0.50 },
  hybride:     { label: 'Hybride warmtepomp',        investering: 6500,  subsidieISDE: 1800, cop: 3.0, gasReductie: 0.60 },
};

export function calculateWarmtepomp(input: WarmtepompInput): WarmtepompResult {
  const config = WARMTEPOMP_CONFIG[input.type];

  const huidigeGasKosten = input.gasverbruikM3 * GAS_PRIJS_PER_M3;
  const huidigeStroomKosten = input.stroomverbruikKwh * STROOM_PRIJS_PER_KWH;
  const huidigeEnergiekosten = huidigeGasKosten + huidigeStroomKosten;

  // Gasbesparing en extra stroomverbruik
  const gasBespaard = input.gasverbruikM3 * config.gasReductie;
  const warmteBehoefteKwh = gasBespaard * 9.8; // 1 m³ gas ≈ 9.8 kWh
  const extraStroomKwh = warmteBehoefteKwh / config.cop;

  const nieuweGasKosten = (input.gasverbruikM3 - gasBespaard) * GAS_PRIJS_PER_M3;
  const nieuweStroomKosten = (input.stroomverbruikKwh + extraStroomKwh) * STROOM_PRIJS_PER_KWH;
  const nieuweEnergiekosten = nieuweGasKosten + nieuweStroomKosten;

  const jaarlijkseBesparing = huidigeEnergiekosten - nieuweEnergiekosten;
  const nettoInvestering = config.investering - config.subsidieISDE;
  const terugverdientijdJaar = jaarlijkseBesparing > 0 ? nettoInvestering / jaarlijkseBesparing : 99;

  const co2BesparingKgPerJaar = gasBespaard * 1.89 - extraStroomKwh * 0.45;

  const toelichting = input.bouwjaar < 1990
    ? 'Let op: voor woningen van voor 1990 is extra isolatie vaak nodig voor optimale werking.'
    : 'Woning is geschikt voor een warmtepomp.';

  return {
    type: input.type,
    label: config.label,
    investering: config.investering,
    subsidieISDE: config.subsidieISDE,
    nettoInvestering,
    huidigeEnergiekosten,
    nieuweEnergiekosten,
    jaarlijkseBesparing,
    terugverdientijdJaar,
    cop: config.cop,
    co2BesparingKgPerJaar: Math.max(0, co2BesparingKgPerJaar),
    toelichting,
  };
}

// ─── ENERGIELABEL EFFECT ──────────────────────────────────────────────────────

export type EnergieLabelType = 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface EnergieLabelInput {
  huidigLabel: EnergieLabelType;
  doelLabel: EnergieLabelType;
  woningWaarde: number;
}

export interface EnergieLabelResult {
  huidigLabel: EnergieLabelType;
  doelLabel: EnergieLabelType;
  waardeStijging: number;
  waardeNa: number;
  pctStijging: number;
}

// Gemiddelde WOZ-meerwaarde per labelstap (op basis van NVM onderzoek)
const LABEL_WAARDE: Record<EnergieLabelType, number> = {
  'A+++': 1.14,
  'A++':  1.12,
  'A+':   1.10,
  'A':    1.08,
  'B':    1.04,
  'C':    1.00, // referentie
  'D':    0.97,
  'E':    0.94,
  'F':    0.91,
  'G':    0.88,
};

export function calculateEnergieLabelEffect(input: EnergieLabelInput): EnergieLabelResult {
  const huidigFactor = LABEL_WAARDE[input.huidigLabel];
  const doelFactor = LABEL_WAARDE[input.doelLabel];
  const relatiefVerschil = doelFactor / huidigFactor;
  const waardeNa = input.woningWaarde * relatiefVerschil;
  const waardeStijging = waardeNa - input.woningWaarde;
  const pctStijging = (relatiefVerschil - 1) * 100;

  return {
    huidigLabel: input.huidigLabel,
    doelLabel: input.doelLabel,
    waardeStijging,
    waardeNa,
    pctStijging,
  };
}
