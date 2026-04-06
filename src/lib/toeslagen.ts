// ============================================================
// Nederlandse Toeslagen 2026
// Zorgtoeslag, Huurtoeslag, Kinderopvangtoeslag, Kinderbijslag
// ============================================================

// ============================================================
// ZORGTOESLAG 2026
// ============================================================

export const ZORG_STANDAARD_PREMIE_JAAR = 1_962;          // Normaal zorgpremie per jaar
export const ZORG_MAX_TOESLAG_ENKEL = 1_636;              // Max zorgtoeslag alleenstaand/jaar
export const ZORG_MAX_TOESLAG_PARTNER = 3_145;            // Max zorgtoeslag partners/jaar (totaal)
export const ZORG_DREMPEL_ENKEL = 23_983;                 // Drempelinkomen alleenstaand
export const ZORG_DREMPEL_PARTNER = 30_209;               // Drempelinkomen partners
export const ZORG_AFBOUW_RATE = 0.13685;                  // Afbouwpercentage per euro
export const ZORG_INKOMENSGRENS_ENKEL = 35_941;           // Max inkomen alleenstaand
export const ZORG_INKOMENSGRENS_PARTNER = 53_130;         // Max inkomen partners (gezamenlijk)

export interface ZorgtoeslagInput {
  toetsingsinkomen: number;   // Individueel verzamelinkomen aanvrager
  partnerInkomen: number;     // 0 als geen partner
  heeftPartner: boolean;
}

export interface ZorgtoeslagResult {
  maandToeslag: number;
  jaarToeslag: number;
  recht: boolean;
  redenGeenRecht?: string;
  nettoPremie: number; // Premie na aftrek toeslag
  toelichting: string[];
}

export function calculateZorgtoeslag(input: ZorgtoeslagInput): ZorgtoeslagResult {
  const { toetsingsinkomen, partnerInkomen, heeftPartner } = input;
  const gecombineerdInkomen = toetsingsinkomen + (heeftPartner ? partnerInkomen : 0);
  const inkomensgrens = heeftPartner ? ZORG_INKOMENSGRENS_PARTNER : ZORG_INKOMENSGRENS_ENKEL;
  const drempel = heeftPartner ? ZORG_DREMPEL_PARTNER : ZORG_DREMPEL_ENKEL;
  const maxToeslag = heeftPartner ? ZORG_MAX_TOESLAG_PARTNER : ZORG_MAX_TOESLAG_ENKEL;

  if (gecombineerdInkomen > inkomensgrens) {
    return {
      maandToeslag: 0, jaarToeslag: 0, recht: false,
      redenGeenRecht: `Toetsingsinkomen (${gecombineerdInkomen.toLocaleString('nl-NL')} is boven de inkomensgrens van €${inkomensgrens.toLocaleString('nl-NL')}`,
      nettoPremie: Math.round(ZORG_STANDAARD_PREMIE_JAAR / 12),
      toelichting: [],
    };
  }

  const overschot = Math.max(0, gecombineerdInkomen - drempel);
  const jaarToeslag = Math.max(0, Math.round(maxToeslag - overschot * ZORG_AFBOUW_RATE));
  const maandToeslag = Math.round(jaarToeslag / 12);
  const nettoPremie = Math.round((ZORG_STANDAARD_PREMIE_JAAR - jaarToeslag) / 12);

  const toelichting: string[] = [
    `Standaard zorgpremie: €${Math.round(ZORG_STANDAARD_PREMIE_JAAR / 12)}/mnd`,
    heeftPartner
      ? `Gecombineerd toetsingsinkomen: €${gecombineerdInkomen.toLocaleString('nl-NL')}`
      : `Individueel toetsingsinkomen: €${toetsingsinkomen.toLocaleString('nl-NL')}`,
  ];
  if (jaarToeslag === maxToeslag) {
    toelichting.push('Maximale toeslag — inkomen onder de drempelgrens');
  }

  return { maandToeslag, jaarToeslag, recht: true, nettoPremie, toelichting };
}

// ============================================================
// HUURTOESLAG 2026
// ============================================================

// Huurgrens
export const HUUR_LIBERALISATIEGRENS = 880;   // Max huurprijs voor toeslag
// Aftopgrenzen (max basishuur voor berekening)
export const HUUR_AFTOPGRENS_12 = 648;        // 1–2 personen
export const HUUR_AFTOPGRENS_3PLUS = 694;     // 3+ personen
// Minimale eigen bijdrage (normhuur)
export const HUUR_NORMHUUR_ENKEL = 233;       // Normhuur alleenstaand
export const HUUR_NORMHUUR_MEER = 312;        // Normhuur meerpersoons
// Inkomensgrenzen
export const HUUR_INKOMENSGRENS_ENKEL_JONG = 24_043;   // < 23 jaar, alleenstaand
export const HUUR_INKOMENSGRENS_ENKEL_OUD  = 24_043;   // >= 23 jaar, alleenstaand
export const HUUR_INKOMENSGRENS_MEER        = 32_643;   // Meerpersoons

export type HuurtoeslagLeeftijd = 'jong' | 'oud';  // Jong = <23 jaar

export interface HuurtoeslagInput {
  maandHuur: number;
  toetsingsinkomen: number;  // Gezamenlijk inkomen huishouden
  aantalPersonen: number;    // Personen in huishouden
  leeftijdsCategorie: HuurtoeslagLeeftijd;
  heeftAow: boolean;         // AOW-gerechtigde
}

export interface HuurtoeslagResult {
  maandToeslag: number;
  jaarToeslag: number;
  recht: boolean;
  redenGeenRecht?: string;
  nettoHuur: number;
  toelichting: string[];
}

export function calculateHuurtoeslag(input: HuurtoeslagInput): HuurtoeslagResult {
  const { maandHuur, toetsingsinkomen, aantalPersonen, leeftijdsCategorie } = input;

  const inkomensgrens = aantalPersonen === 1
    ? HUUR_INKOMENSGRENS_ENKEL_OUD
    : HUUR_INKOMENSGRENS_MEER;

  const aftopgrens = aantalPersonen <= 2 ? HUUR_AFTOPGRENS_12 : HUUR_AFTOPGRENS_3PLUS;
  const normhuur = aantalPersonen === 1 ? HUUR_NORMHUUR_ENKEL : HUUR_NORMHUUR_MEER;

  if (maandHuur > HUUR_LIBERALISATIEGRENS) {
    return {
      maandToeslag: 0, jaarToeslag: 0, recht: false,
      redenGeenRecht: `Huur (€${maandHuur}) is boven de liberalisatiegrens van €${HUUR_LIBERALISATIEGRENS}`,
      nettoHuur: maandHuur,
      toelichting: [],
    };
  }

  if (toetsingsinkomen > inkomensgrens) {
    return {
      maandToeslag: 0, jaarToeslag: 0, recht: false,
      redenGeenRecht: `Toetsingsinkomen boven de inkomensgrens van €${inkomensgrens.toLocaleString('nl-NL')}`,
      nettoHuur: maandHuur,
      toelichting: [],
    };
  }

  // Berekening: subsidiabele huur = min(huur, aftopgrens)
  const subsidiabeleHuur = Math.min(maandHuur, aftopgrens);
  // Toeslag = subsidiabele huur - normhuur (eigen bijdrage)
  // Verfijnder: afbouw op basis van inkomen boven drempel
  const basistoeslag = Math.max(0, subsidiabeleHuur - normhuur);

  // Inkomensafbouw (indicatief: lineair naar 0 bij inkomensgrens)
  const drempelInkomen = 15_000;
  const afbouwFactor = toetsingsinkomen <= drempelInkomen ? 1
    : Math.max(0, 1 - (toetsingsinkomen - drempelInkomen) / (inkomensgrens - drempelInkomen));

  const maandToeslag = Math.round(basistoeslag * afbouwFactor);
  const jaarToeslag = maandToeslag * 12;
  const nettoHuur = maandHuur - maandToeslag;

  const toelichting = [
    `Subsidiabele huur: €${subsidiabeleHuur} (aftopgrens: €${aftopgrens})`,
    `Normhuur eigen bijdrage: €${normhuur}/mnd`,
    `Inkomensgegrens huishouden: €${inkomensgrens.toLocaleString('nl-NL')}`,
  ];

  return { maandToeslag, jaarToeslag, recht: true, nettoHuur, toelichting };
}

// ============================================================
// KINDEROPVANGTOESLAG 2026
// ============================================================

export const KOT_MAX_UURPRIJS_DAGOPVANG = 10.25;   // Max uurprijs dagopvang (€/uur)
export const KOT_MAX_UURPRIJS_BSO       = 8.97;    // Max uurprijs BSO (€/uur)
export const KOT_MAX_UURPRIJS_GASTOUDER = 7.53;    // Max uurprijs gastouder (€/uur)
export const KOT_MAX_UREN_DAGOPVANG_PER_MAAND = 230 * 11 / 12; // ~211 uur/mnd (1e kind)
export const KOT_MAX_UREN_BSO_PER_MAAND = 140 * 11 / 12;       // ~128 uur/mnd

export type KinderopvangType = 'dagopvang' | 'bso' | 'gastouder';

// Inkomenstabel KOT 2026 – percentage vergoed (1e kind)
// Inkomen → % overheidsbijdrage (indicatief 2026)
const KOT_TABLE_KIND1 = [
  { max: 20_000,  pct: 96.0 },
  { max: 25_000,  pct: 95.0 },
  { max: 30_000,  pct: 93.0 },
  { max: 35_000,  pct: 89.0 },
  { max: 40_000,  pct: 84.0 },
  { max: 50_000,  pct: 77.0 },
  { max: 60_000,  pct: 71.0 },
  { max: 70_000,  pct: 66.0 },
  { max: 80_000,  pct: 61.0 },
  { max: 90_000,  pct: 57.0 },
  { max: 100_000, pct: 53.0 },
  { max: 120_000, pct: 46.0 },
  { max: Infinity, pct: 33.3 },
];

// 2e kind en verder: hogere vergoeding
const KOT_TABLE_KIND2 = [
  { max: 20_000,  pct: 96.0 },
  { max: 25_000,  pct: 96.0 },
  { max: 30_000,  pct: 96.0 },
  { max: 35_000,  pct: 95.0 },
  { max: 40_000,  pct: 93.0 },
  { max: 50_000,  pct: 90.0 },
  { max: 60_000,  pct: 87.0 },
  { max: 70_000,  pct: 84.0 },
  { max: 80_000,  pct: 81.0 },
  { max: 90_000,  pct: 79.0 },
  { max: 100_000, pct: 77.0 },
  { max: 120_000, pct: 72.0 },
  { max: Infinity, pct: 67.0 },
];

function getKOTpercentage(inkomen: number, isEersteKind: boolean): number {
  const table = isEersteKind ? KOT_TABLE_KIND1 : KOT_TABLE_KIND2;
  return table.find(r => inkomen <= r.max)?.pct ?? 33.3;
}

export interface KindOpvang {
  type: KinderopvangType;
  urenPerMaand: number;
  werkelijkeUurprijs: number;
  isEersteKind: boolean;
}

export interface KinderopvangInput {
  toetsingsinkomen: number;   // Hoogste inkomen van beide partners (bij partners: gecombineerd)
  kinderen: KindOpvang[];
}

export interface KinderopvangResultKind {
  type: KinderopvangType;
  urenPerMaand: number;
  maxUurprijs: number;
  werkelijkeUurprijs: number;
  vergoedinsgPercentage: number;
  maandKosten: number;        // Totale kosten
  maandToeslag: number;       // Overheidsbijdrage
  eigenBijdrage: number;      // Eigen aandeel
}

export interface KinderopvangResult {
  kinderen: KinderopvangResultKind[];
  totaalMaandToeslag: number;
  totaalMaandKosten: number;
  totaalEigenBijdrage: number;
  toelichting: string[];
}

function getMaxUurprijs(type: KinderopvangType): number {
  switch (type) {
    case 'dagopvang': return KOT_MAX_UURPRIJS_DAGOPVANG;
    case 'bso':       return KOT_MAX_UURPRIJS_BSO;
    case 'gastouder': return KOT_MAX_UURPRIJS_GASTOUDER;
  }
}

export function calculateKinderopvangtoeslag(input: KinderopvangInput): KinderopvangResult {
  const { toetsingsinkomen, kinderen } = input;

  const kinderenResult: KinderopvangResultKind[] = kinderen.map((kind) => {
    const maxUurprijs = getMaxUurprijs(kind.type);
    const subsidiabeleUurprijs = Math.min(kind.werkelijkeUurprijs, maxUurprijs);
    const vergoedinsgPercentage = getKOTpercentage(toetsingsinkomen, kind.isEersteKind);

    const maandKosten = Math.round(kind.urenPerMaand * kind.werkelijkeUurprijs);
    const maandSubsidiabel = Math.round(kind.urenPerMaand * subsidiabeleUurprijs);
    const maandToeslag = Math.round(maandSubsidiabel * (vergoedinsgPercentage / 100));
    const eigenBijdrage = maandKosten - maandToeslag;

    return {
      type: kind.type,
      urenPerMaand: kind.urenPerMaand,
      maxUurprijs,
      werkelijkeUurprijs: kind.werkelijkeUurprijs,
      vergoedinsgPercentage,
      maandKosten,
      maandToeslag,
      eigenBijdrage,
    };
  });

  const totaalMaandToeslag = kinderenResult.reduce((s, k) => s + k.maandToeslag, 0);
  const totaalMaandKosten = kinderenResult.reduce((s, k) => s + k.maandKosten, 0);
  const totaalEigenBijdrage = totaalMaandKosten - totaalMaandToeslag;

  const toelichting = [
    'Percentage gebaseerd op gecombineerd toetsingsinkomen',
    'Max uurprijzen 2026: dagopvang €10,25 | BSO €8,97 | gastouder €7,53',
    '2e en volgende kinderen ontvangen hogere vergoeding',
    'Toeslag wordt automatisch verrekend — betaling via belastingdienst',
  ];

  return { kinderen: kinderenResult, totaalMaandToeslag, totaalMaandKosten, totaalEigenBijdrage, toelichting };
}

// ============================================================
// KINDERBIJSLAG 2026 (AKW)
// ============================================================
export interface KinderbijslagResult {
  kwartaalbedrag: number;
  maandbedrag: number;
  aantalKinderen: number;
}

const KINDERBIJSLAG_TABLE: Record<string, number> = {
  '0-5':   308.18,  // Per kwartaal
  '6-11':  373.36,
  '12-17': 438.55,
};

export function calculateKinderbijslag(kinderen: { leeftijd: number }[]): KinderbijslagResult {
  let kwartaalbedrag = 0;
  for (const kind of kinderen) {
    if (kind.leeftijd < 6) kwartaalbedrag += KINDERBIJSLAG_TABLE['0-5'];
    else if (kind.leeftijd < 12) kwartaalbedrag += KINDERBIJSLAG_TABLE['6-11'];
    else if (kind.leeftijd < 18) kwartaalbedrag += KINDERBIJSLAG_TABLE['12-17'];
  }
  return {
    kwartaalbedrag: Math.round(kwartaalbedrag * 100) / 100,
    maandbedrag: Math.round(kwartaalbedrag / 3 * 100) / 100,
    aantalKinderen: kinderen.length,
  };
}
