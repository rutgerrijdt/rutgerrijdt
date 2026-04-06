// ============================================================
// Extra Financiële Berekeningen 2026
// Hypotheek oversluiten, Inflatie & koopkracht, AOW-datum
// ============================================================

// ============================================================
// HYPOTHEEK OVERSLUITEN
// ============================================================

export interface OversluitenInput {
  huidigSaldo: number;           // Resterende hypotheekschuld
  huidigeRente: number;          // Huidige rente (decimal)
  nieuweRente: number;           // Nieuwe rente (decimal)
  resterendeLooptijdMaanden: number;
  boeterente: number;            // Boeterente (€, eenmalig)
  notariskosten: number;         // Notaris + taxatie (~€1.500–€2.500)
  advieskosten: number;          // Advies en bemiddeling
}

export interface OversluitenResult {
  huidigeMaandlast: number;
  nieuweMaandlast: number;
  maandelijksBesparing: number;
  eenmaligeTotalKosten: number;
  terugverdientijdMaanden: number;
  netBesparing5Jaar: number;
  netBesparing10Jaar: number;
  netBessparing30Jaar: number;
  breakEvenMaanden: number | null;
  toelichting: string[];
}

function annuity(saldo: number, rate: number, maanden: number): number {
  const r = rate / 12;
  if (r === 0) return saldo / maanden;
  return saldo * (r * Math.pow(1 + r, maanden)) / (Math.pow(1 + r, maanden) - 1);
}

export function calculateOversluiten(input: OversluitenInput): OversluitenResult {
  const {
    huidigSaldo, huidigeRente, nieuweRente,
    resterendeLooptijdMaanden, boeterente, notariskosten, advieskosten,
  } = input;

  const huidigeMaandlast = Math.round(annuity(huidigSaldo, huidigeRente, resterendeLooptijdMaanden));
  const nieuweMaandlast  = Math.round(annuity(huidigSaldo, nieuweRente, resterendeLooptijdMaanden));
  const maandelijksBesparing = huidigeMaandlast - nieuweMaandlast;

  const eenmaligeTotalKosten = boeterente + notariskosten + advieskosten;

  const breakEvenMaanden = maandelijksBesparing > 0
    ? Math.ceil(eenmaligeTotalKosten / maandelijksBesparing)
    : null;

  const net = (maanden: number) =>
    Math.round(maandelijksBesparing * maanden - eenmaligeTotalKosten);

  const toelichting: string[] = [];
  if (maandelijksBesparing <= 0) {
    toelichting.push('Nieuwe rente is niet lager — oversluiten is niet voordelig');
  } else if (breakEvenMaanden && breakEvenMaanden > 60) {
    toelichting.push(`Terugverdientijd ${breakEvenMaanden} mnd — pas voordelig bij lange restlooptijd`);
  } else {
    toelichting.push(`Terugverdientijd: ${breakEvenMaanden} maanden — relatief snel terugverdiend`);
  }
  toelichting.push('Boeterente: marktwaarde-methode of annuïtaire methode (vraag bij geldverstrekker op)');
  toelichting.push('Rentekorting meenemen: huidige rentevaste periode kan voordeel bieden bij oversluiten');
  toelichting.push('Indicatieve berekening — laat doorrekenen door onafhankelijk adviseur');

  return {
    huidigeMaandlast,
    nieuweMaandlast,
    maandelijksBesparing,
    eenmaligeTotalKosten,
    terugverdientijdMaanden: breakEvenMaanden ?? 0,
    netBesparing5Jaar: net(60),
    netBesparing10Jaar: net(120),
    netBessparing30Jaar: net(360),
    breakEvenMaanden,
    toelichting,
  };
}

// ============================================================
// INFLATIE & KOOPKRACHT
// ============================================================

export interface InflatieInput {
  bedrag: number;
  inflatiePercent: number;    // Gemiddelde jaarlijkse inflatie (%)
  aantalJaren: number;
  salarisstijgingPercent: number; // Jaarlijkse loonstijging (%)
}

export interface InflatieJaar {
  jaar: number;
  nominaalBedrag: number;    // Nominaal bedrag (bijv. salaris)
  koopkrachtWaarde: number;  // Reële waarde in huidige euro's
  koopkrachtVerlies: number; // Cumulatief verlies
  reeleStijging: number;     // Reële stijging vs. vorig jaar
}

export interface InflatieResult {
  waardeNuOver1Jaar: number;
  waardeNuOver5Jaar: number;
  waardeNuOver10Jaar: number;
  cumulatiefKoopkrachtVerliesPct: number;
  reeleJaarlijkseStijging: number;  // Netto koopkrachtontwikkeling
  jaarlijks: InflatieJaar[];
  toelichting: string[];
}

export function calculateInflatie(input: InflatieInput): InflatieResult {
  const { bedrag, inflatiePercent, aantalJaren, salarisstijgingPercent } = input;
  const r = inflatiePercent / 100;
  const s = salarisstijgingPercent / 100;

  const jaarlijks: InflatieJaar[] = [];
  let nominaal = bedrag;
  let koopkracht = bedrag;

  for (let j = 1; j <= aantalJaren; j++) {
    nominaal *= (1 + s);
    koopkracht = nominaal / Math.pow(1 + r, j);
    const verliesPct = ((koopkracht - bedrag) / bedrag) * 100;
    const reeleSt = ((1 + s) / (1 + r) - 1) * 100;
    jaarlijks.push({
      jaar: j,
      nominaalBedrag: Math.round(nominaal),
      koopkrachtWaarde: Math.round(koopkracht),
      koopkrachtVerlies: Math.round(koopkracht - bedrag),
      reeleStijging: Math.round(reeleSt * 10) / 10,
    });
  }

  const pv = (yr: number) => Math.round(bedrag / Math.pow(1 + r, yr));
  const cumulatief = jaarlijks.length > 0
    ? ((jaarlijks[jaarlijks.length - 1].koopkrachtWaarde - bedrag) / bedrag) * 100
    : 0;

  const toelichting = [
    `Reële koopkrachtontwikkeling: ${((1+s)/(1+r)-1*100).toFixed(2)}% per jaar`,
    `Inflatie ${inflatiePercent}% eet ${inflatiePercent > 0 ? 'in' : 'niet in'} op uw koopkracht`,
    'CBS streefwaarde inflatie ECB: 2% per jaar',
    `Na ${aantalJaren} jaar is €${bedrag.toLocaleString('nl-NL')} in reële waarde: €${(pv(aantalJaren)).toLocaleString('nl-NL')} (bij 0% loonstijging)`,
  ];

  return {
    waardeNuOver1Jaar: pv(1),
    waardeNuOver5Jaar: pv(5),
    waardeNuOver10Jaar: pv(Math.min(10, aantalJaren)),
    cumulatiefKoopkrachtVerliesPct: Math.round(cumulatief * 10) / 10,
    reeleJaarlijkseStijging: Math.round(((1+s)/(1+r)-1)*1000)/10,
    jaarlijks,
    toelichting,
  };
}

// ============================================================
// AOW-DATUM BEREKENING
// ============================================================

export interface AOWInput {
  geboortedatum: string;  // ISO format: YYYY-MM-DD
}

export interface AOWResult {
  aowLeeftijd: { jaren: number; maanden: number };
  aowDatum: Date;
  aowDatumString: string;
  aantalMaandenTot: number;
  aantalJarenTot: number;
  maandelijkseAOW: number;          // Schatting netto AOW
  aowOpgebouwdPct: number;          // Opgebouwd % (2% per jaar wonen in NL)
  toelichting: string[];
}

// AOW-leeftijdsschema (geboren jaar -> AOW-leeftijd)
const AOW_SCHEMA: { vanJaar: number; totJaar: number; jaren: number; maanden: number }[] = [
  { vanJaar: 1900, totJaar: 1954, jaren: 65, maanden: 0 },
  { vanJaar: 1955, totJaar: 1955, jaren: 66, maanden: 4 },
  { vanJaar: 1956, totJaar: 1956, jaren: 66, maanden: 7 },
  { vanJaar: 1957, totJaar: 1957, jaren: 66, maanden: 10 },
  { vanJaar: 1958, totJaar: 1958, jaren: 67, maanden: 0 },
  { vanJaar: 1959, totJaar: 1959, jaren: 67, maanden: 3 },  // Indicatief
  { vanJaar: 1960, totJaar: 2100, jaren: 67, maanden: 3 },  // Basis 2026+, kan stijgen met levensverwachting
];

export const AOW_NETTO_ALLEENSTAAND = 1_426;  // Netto per maand 2026
export const AOW_NETTO_PARTNERS     = 976;    // Per persoon bij partners 2026

export function calculateAOW(input: AOWInput): AOWResult {
  const geb = new Date(input.geboortedatum);
  const geboortejaar = geb.getFullYear();

  const schema = AOW_SCHEMA.find(s => geboortejaar >= s.vanJaar && geboortejaar <= s.totJaar)
    ?? { jaren: 67, maanden: 3 };

  const aowDatum = new Date(geb);
  aowDatum.setFullYear(geb.getFullYear() + schema.jaren);
  aowDatum.setMonth(geb.getMonth() + schema.maanden);

  const nu = new Date();
  const msPerMaand = 1000 * 60 * 60 * 24 * 30.44;
  const aantalMaandenTot = Math.max(0, Math.round((aowDatum.getTime() - nu.getTime()) / msPerMaand));
  const aantalJarenTot = Math.floor(aantalMaandenTot / 12);

  // Opbouw: 2% per volledig jaar wonen/werken in NL, max 50 jaar = 100%
  const aantalJarenWerkzaam = Math.max(0, (nu.getFullYear() - geboortejaar) - 15);
  const aowOpgebouwdPct = Math.min(100, aantalJarenWerkzaam * 2);

  const maandelijkseAOW = Math.round(AOW_NETTO_ALLEENSTAAND * (aowOpgebouwdPct / 100));

  const formatter = new Intl.DateTimeFormat('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  const aowDatumString = formatter.format(aowDatum);

  const toelichting = [
    `AOW-leeftijd: ${schema.jaren} jaar en ${schema.maanden} maanden`,
    'AOW-leeftijd kan stijgen bij hogere levensverwachting — check svb.nl',
    `Opbouw: 2% per jaar wonen/werken in Nederland (max 50 jaar = 100%)`,
    `Netto AOW 2026: €${AOW_NETTO_ALLEENSTAAND}/mnd (alleenstaand) | €${AOW_NETTO_PARTNERS}/mnd (per partner)`,
    aantalMaandenTot <= 0 ? 'U heeft al AOW-leeftijd bereikt' : `Nog ${aantalJarenTot} jaar en ${aantalMaandenTot % 12} maanden`,
  ];

  return {
    aowLeeftijd: { jaren: schema.jaren, maanden: schema.maanden },
    aowDatum,
    aowDatumString,
    aantalMaandenTot,
    aantalJarenTot,
    maandelijkseAOW,
    aowOpgebouwdPct,
    toelichting,
  };
}

// ============================================================
// REISKOSTEN AFTREK / VERGOEDING 2026
// ============================================================

export const REISKOSTEN_ONBELAST_AUTO  = 0.23;  // €0,23/km onbelast (2026)
export const REISKOSTEN_OV_MAX_MAAND   = 214;   // Max OV-vergoeding per maand onbelast
export const WOON_WERK_NS_AFTREK_MAX   = 2_354; // Max aftrek woon-werkverkeer IB (eigen auto)

export interface ReiskostenInput {
  kmAfstandEnkelWeg: number;
  aantalWerkdagenPerJaar: number;
  vervoersmiddel: 'auto' | 'ov' | 'fiets';
  werkgeversvergoedingMaand: number;
  brandstofKostenPerKm?: number;
}

export interface ReiskostenResult {
  jaarlijkseKm: number;
  onbeblasteVergoedingMax: number;
  werkgeversvergoedingJaar: number;
  eigenBijdrageJaar: number;
  belastbaarVoordeel: number;   // Als vergoeding > onbelast maximum
  nettoBesparing: number;
  toelichting: string[];
}

export function calculateReiskosten(input: ReiskostenInput): ReiskostenResult {
  const { kmAfstandEnkelWeg, aantalWerkdagenPerJaar, vervoersmiddel, werkgeversvergoedingMaand } = input;

  const jaarlijkseKm = kmAfstandEnkelWeg * 2 * aantalWerkdagenPerJaar;

  let onbeblasteVergoedingMax = 0;
  if (vervoersmiddel === 'auto') {
    onbeblasteVergoedingMax = Math.round(jaarlijkseKm * REISKOSTEN_ONBELAST_AUTO);
  } else if (vervoersmiddel === 'ov') {
    onbeblasteVergoedingMax = REISKOSTEN_OV_MAX_MAAND * 12;
  } else {
    onbeblasteVergoedingMax = Math.round(jaarlijkseKm * 0.23); // Fiets ook €0,23/km
  }

  const werkgeversvergoedingJaar = werkgeversvergoedingMaand * 12;
  const belastbaarVoordeel = Math.max(0, werkgeversvergoedingJaar - onbeblasteVergoedingMax);
  const eigenBijdrageJaar = Math.max(0, onbeblasteVergoedingMax - werkgeversvergoedingJaar);
  const nettoBesparing = Math.min(werkgeversvergoedingJaar, onbeblasteVergoedingMax);

  const toelichting = [
    `Onbelaste km-vergoeding 2026: €${REISKOSTEN_ONBELAST_AUTO}/km`,
    `${jaarlijkseKm.toLocaleString('nl-NL')} km/jaar (${kmAfstandEnkelWeg} km enkel × 2 × ${aantalWerkdagenPerJaar} dagen)`,
    belastbaarVoordeel > 0 ? `Bovenmatige vergoeding (belastbaar): €${belastbaarVoordeel.toLocaleString('nl-NL')}/jr` : 'Vergoeding binnen onbelaste grens',
    'OV: werkgever mag volledige OV-kosten onbelast vergoeden',
    'Fiets: ook €0,23/km onbelast vergoedbaar',
  ];

  return {
    jaarlijkseKm,
    onbeblasteVergoedingMax,
    werkgeversvergoedingJaar,
    eigenBijdrageJaar,
    belastbaarVoordeel,
    nettoBesparing,
    toelichting,
  };
}
