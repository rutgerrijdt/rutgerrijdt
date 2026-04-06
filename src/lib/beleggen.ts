/**
 * Beleggen & FIRE berekeningen
 * - Compound interest / ETF groei
 * - FIRE calculator (Financial Independence, Retire Early)
 * - DCA (Dollar Cost Averaging) simulatie
 * - Rendement na inflatie (reëel rendement)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ETFGroeiInput {
  /** Startkapitaal */
  startKapitaal: number;
  /** Maandelijkse inleg */
  maandelijkseBijdrage: number;
  /** Verwacht jaarrendement (als decimaal, bijv. 0.07 voor 7%) */
  jaarrendement: number;
  /** Beleggingshorizon in jaren */
  jaren: number;
  /** Jaarlijkse inflatie (als decimaal) */
  inflatie: number;
  /** Belasting op rendement (Box 3 heffing, als decimaal) */
  box3Tarief: number;
}

export interface ETFGroeiJaar {
  jaar: number;
  porteurValeur: number;        // nominale waarde
  reeleWaarde: number;          // gecorrigeerd voor inflatie
  totaalIngelegd: number;
  totaalRendement: number;
  box3Belasting: number;
}

export interface ETFGroeiResult {
  eindWaarde: number;
  eindWaardReeel: number;
  totaalIngelegd: number;
  totaalRendement: number;
  totaalBox3Belasting: number;
  effectiefJaarrendement: number;
  schedule: ETFGroeiJaar[];
}

export function calculateETFGroei(input: ETFGroeiInput): ETFGroeiResult {
  const { startKapitaal, maandelijkseBijdrage, jaarrendement, jaren, inflatie, box3Tarief } = input;
  const schedule: ETFGroeiJaar[] = [];

  let vermogen = startKapitaal;
  let totaalIngelegd = startKapitaal;
  let totaalBox3Belasting = 0;
  const maandRente = jaarrendement / 12;

  for (let j = 1; j <= jaren; j++) {
    // Maandelijkse groei met bijdragen
    for (let m = 0; m < 12; m++) {
      vermogen = vermogen * (1 + maandRente) + maandelijkseBijdrage;
    }
    totaalIngelegd += maandelijkseBijdrage * 12;

    // Box 3 heffing per jaar (vereenvoudigd: fictief rendement 5.88% × 36% op belegdeel)
    const box3Grondslag = Math.max(0, vermogen - 57684); // heffingsvrij per persoon
    const box3Heffing = box3Grondslag * 0.0588 * box3Tarief;
    vermogen = Math.max(0, vermogen - box3Heffing);
    totaalBox3Belasting += box3Heffing;

    const reeleWaarde = vermogen / Math.pow(1 + inflatie, j);

    schedule.push({
      jaar: j,
      porteurValeur: vermogen,
      reeleWaarde,
      totaalIngelegd,
      totaalRendement: vermogen - totaalIngelegd,
      box3Belasting: totaalBox3Belasting,
    });
  }

  const eindWaarde = vermogen;
  const eindWaardReeel = eindWaarde / Math.pow(1 + inflatie, jaren);
  const totaalRendement = eindWaarde - totaalIngelegd;

  // Effectief jaarrendement na belasting
  const effectiefJaarrendement =
    totaalIngelegd > 0
      ? Math.pow(eindWaarde / startKapitaal, 1 / jaren) - 1
      : 0;

  return { eindWaarde, eindWaardReeel, totaalIngelegd, totaalRendement, totaalBox3Belasting, effectiefJaarrendement, schedule };
}

// ─── FIRE CALCULATOR ──────────────────────────────────────────────────────────

export interface FIREInput {
  /** Huidig vermogen */
  huidigVermogen: number;
  /** Maandelijkse uitgaven in FIRE (gewenst) */
  maandelijkseUitgavenFIRE: number;
  /** Maandelijkse spaarinleg nu */
  maandelijkseSpaarbijdrage: number;
  /** Verwacht jaarrendement voor pensionering */
  jaarrendementOpbouw: number;
  /** Verwacht jaarrendement na pensionering */
  jaarrendementPensionering: number;
  /** Inflatie */
  inflatie: number;
  /** Verwachte leeftijd pensionering */
  leeftijdNu: number;
  /** Gewenste FIRE-leeftijd */
  gewensteFIRELeeftijd: number;
}

export interface FIREResult {
  /** Benodigde FIRE-pot (25× jaaruitgaven, 4% rule) */
  benodigdVermogen: number;
  /** Verwacht vermogen op FIRE-leeftijd */
  verwachtVermogenOpFIRE: number;
  /** Tekort of overschot */
  tekortOfOverschot: number;
  /** Haalbaar? */
  haalbaar: boolean;
  /** Jaren tot FIRE */
  jarenTotFIRE: number;
  /** Maandelijkse bijdrage nodig om doel te halen */
  benoddigdeMaandelijksBijdrage: number;
  /** Maandelijkse onttrekking in FIRE */
  maandelijkseOnttrekking: number;
  /** Jaren dat vermogen meegaat (na FIRE) */
  jarenVermogenMeegaat: number;
  schedule: { jaar: number; leeftijd: number; vermogen: number; fase: 'opbouw' | 'fire' }[];
}

export function calculateFIRE(input: FIREInput): FIREResult {
  const { huidigVermogen, maandelijkseUitgavenFIRE, maandelijkseSpaarbijdrage,
    jaarrendementOpbouw, jaarrendementPensionering, inflatie, leeftijdNu, gewensteFIRELeeftijd } = input;

  const jarenTotFIRE = Math.max(0, gewensteFIRELeeftijd - leeftijdNu);

  // Benodigde pot (4% safe withdrawal rule, gecorrigeerd voor inflatie)
  const jaaruitgavenFIRE = maandelijkseUitgavenFIRE * 12;
  const benodigdVermogen = jaaruitgavenFIRE / 0.04;

  // Vermogen op FIRE-datum
  const maandRente = jaarrendementOpbouw / 12;
  let vermogen = huidigVermogen;
  for (let m = 0; m < jarenTotFIRE * 12; m++) {
    vermogen = vermogen * (1 + maandRente) + maandelijkseSpaarbijdrage;
  }
  const verwachtVermogenOpFIRE = vermogen;
  const tekortOfOverschot = verwachtVermogenOpFIRE - benodigdVermogen;
  const haalbaar = verwachtVermogenOpFIRE >= benodigdVermogen;

  // Benodigde maandelijkse bijdrage om doel WEL te halen
  const FV = benodigdVermogen;
  const PV = huidigVermogen;
  const r = jaarrendementOpbouw / 12;
  const n = jarenTotFIRE * 12;
  const benoddigdeMaandelijksBijdrage = n > 0 && r > 0
    ? (FV - PV * Math.pow(1 + r, n)) / ((Math.pow(1 + r, n) - 1) / r)
    : (FV - PV) / Math.max(1, n);

  // Hoe lang gaat het vermogen mee na FIRE? (vereenvoudigd)
  const maandOnttrekking = maandelijkseUitgavenFIRE;
  const maandRenteFIRE = jaarrendementPensionering / 12;
  let restVermogen = verwachtVermogenOpFIRE;
  let maanden = 0;
  while (restVermogen > 0 && maanden < 1200) {
    restVermogen = restVermogen * (1 + maandRenteFIRE) - maandOnttrekking;
    maanden++;
  }
  const jarenVermogenMeegaat = restVermogen > 0 ? 100 : Math.floor(maanden / 12);

  // Schedule (opbouw + 30 jaar na FIRE)
  const schedule: FIREResult['schedule'] = [];
  let v2 = huidigVermogen;
  const totaalJaren = jarenTotFIRE + 30;
  for (let j = 0; j <= totaalJaren; j++) {
    schedule.push({ jaar: j, leeftijd: leeftijdNu + j, vermogen: v2, fase: j < jarenTotFIRE ? 'opbouw' : 'fire' });
    if (j < jarenTotFIRE) {
      for (let m = 0; m < 12; m++) v2 = v2 * (1 + maandRente) + maandelijkseSpaarbijdrage;
    } else {
      for (let m = 0; m < 12; m++) v2 = Math.max(0, v2 * (1 + maandRenteFIRE) - maandOnttrekking);
    }
  }

  return {
    benodigdVermogen,
    verwachtVermogenOpFIRE,
    tekortOfOverschot,
    haalbaar,
    jarenTotFIRE,
    benoddigdeMaandelijksBijdrage: Math.max(0, benoddigdeMaandelijksBijdrage),
    maandelijkseOnttrekking: maandOnttrekking,
    jarenVermogenMeegaat,
    schedule,
  };
}

// ─── DCA SIMULATIE ────────────────────────────────────────────────────────────

export interface DCAInput {
  /** Maandelijkse inleg */
  maandelijkseBijdrage: number;
  /** Aantal maanden */
  aantalMaanden: number;
  /** Verwacht jaarrendement */
  jaarrendement: number;
  /** Volatiliteit (standaardafwijking jaarrendement, voor simulatie) */
  volatiliteit: number;
  /** Eenmalige storting bovenop DCA */
  eenmaligeBedrag?: number;
}

export interface DCAResult {
  eindWaarde: number;
  totaalIngelegd: number;
  totaalRendement: number;
  rendementPct: number;
  gemiddeldeAankoopprijs: number; // illustratief
  schedule: { maand: number; vermogen: number; ingelegd: number }[];
}

export function calculateDCA(input: DCAInput): DCAResult {
  const { maandelijkseBijdrage, aantalMaanden, jaarrendement, eenmaligeBedrag = 0 } = input;
  const maandRente = jaarrendement / 12;
  const schedule: DCAResult['schedule'] = [];

  let vermogen = eenmaligeBedrag;
  let totaalIngelegd = eenmaligeBedrag;

  for (let m = 1; m <= aantalMaanden; m++) {
    vermogen = vermogen * (1 + maandRente) + maandelijkseBijdrage;
    totaalIngelegd += maandelijkseBijdrage;

    if (m % 12 === 0 || m === aantalMaanden || m <= 6) {
      schedule.push({ maand: m, vermogen, ingelegd: totaalIngelegd });
    }
  }

  const eindWaarde = vermogen;
  const totaalRendement = eindWaarde - totaalIngelegd;
  const rendementPct = totaalIngelegd > 0 ? totaalRendement / totaalIngelegd : 0;
  const gemiddeldeAankoopprijs = totaalIngelegd / aantalMaanden; // illustratief per maand

  return { eindWaarde, totaalIngelegd, totaalRendement, rendementPct, gemiddeldeAankoopprijs, schedule };
}
