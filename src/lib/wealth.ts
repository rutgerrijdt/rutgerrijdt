// ============================================================
// Vermogensberekeningen 2026
// Box 3, Spaarcalculator, Beleggingsprognose, Pensioen
// ============================================================

// ---- Box 3 parameters 2026 ----
export const BOX3_HEFFINGSVRIJ_PER_PERSOON = 57_684; // Vrijgesteld vermogen per belastingplichtige
export const BOX3_TARIEF = 0.36;                     // 36% belasting over fictief rendement

// Fictieve rendementen 2026 (vastgesteld door Belastingdienst)
export const FICTIEF_RENDEMENT_SPAAR = 0.0144;        // 1,44% spaargeld
export const FICTIEF_RENDEMENT_BELEGGING = 0.0588;    // 5,88% beleggingen
export const FICTIEF_RENDEMENT_SCHULD = 0.0247;       // 2,47% schulden (aftrekbaar)

export interface Box3Input {
  spaargeld: number;
  beleggingen: number;
  andereVermogensbestanddelen: number; // Bijv. verhuurde woning, cryptovaluta
  schulden: number;                    // Schulden (vermindert grondslag)
  aantalPersonen: 1 | 2;              // 1 of 2 fiscale partners
}

export interface Box3Result {
  rendementsgrondslag: number;
  heffingsvrij: number;
  belastbaarVermogen: number;
  fictieveRendementSpaar: number;
  fictieveRendementBelegging: number;
  fictieveRendementAnders: number;
  fictieveRendementSchuld: number;
  totaalFictieveRendement: number;
  belasting: number;
  effectiefRendementTarief: number; // Effectief tarief over totaal vermogen
  toelichting: string[];
}

export function calculateBox3(input: Box3Input): Box3Result {
  const { spaargeld, beleggingen, andereVermogensbestanddelen, schulden, aantalPersonen } = input;
  const heffingsvrij = BOX3_HEFFINGSVRIJ_PER_PERSOON * aantalPersonen;

  // Rendementsgrondslag = alle bezittingen - schulden - heffingsvrij
  const bezittingen = spaargeld + beleggingen + andereVermogensbestanddelen;
  const rendementsgrondslag = Math.max(0, bezittingen - schulden);
  const belastbaarVermogen = Math.max(0, rendementsgrondslag - heffingsvrij);

  if (belastbaarVermogen === 0) {
    return {
      rendementsgrondslag,
      heffingsvrij,
      belastbaarVermogen: 0,
      fictieveRendementSpaar: 0,
      fictieveRendementBelegging: 0,
      fictieveRendementAnders: 0,
      fictieveRendementSchuld: 0,
      totaalFictieveRendement: 0,
      belasting: 0,
      effectiefRendementTarief: 0,
      toelichting: ['Vermogen valt binnen de heffingsvrije grens — geen Box 3 belasting'],
    };
  }

  // Fictieve rendementen over belastbaar vermogen
  // Verhouding berekenen op basis van samenstelling vermogen
  const totalBezit = Math.max(1, bezittingen);
  const spaarRatio = spaargeld / totalBezit;
  const beleggRatio = beleggingen / totalBezit;
  const andersRatio = andereVermogensbestanddelen / totalBezit;

  const fictieveRendementSpaar = Math.round(belastbaarVermogen * spaarRatio * FICTIEF_RENDEMENT_SPAAR);
  const fictieveRendementBelegging = Math.round(belastbaarVermogen * beleggRatio * FICTIEF_RENDEMENT_BELEGGING);
  const fictieveRendementAnders = Math.round(belastbaarVermogen * andersRatio * FICTIEF_RENDEMENT_BELEGGING);
  const fictieveRendementSchuld = Math.round(Math.min(schulden, belastbaarVermogen) * FICTIEF_RENDEMENT_SCHULD);

  const totaalFictieveRendement = fictieveRendementSpaar + fictieveRendementBelegging + fictieveRendementAnders - fictieveRendementSchuld;
  const belasting = Math.max(0, Math.round(totaalFictieveRendement * BOX3_TARIEF));

  const effectiefRendementTarief = rendementsgrondslag > 0 ? belasting / rendementsgrondslag : 0;

  const toelichting: string[] = [];
  if (spaargeld > 0 && beleggingen > 0) {
    toelichting.push(`Gemengd vermogen: spaar rendement 1,44% vs beleggingen 5,88%`);
  }
  if (schulden > 0) {
    toelichting.push(`Schulden verlagen de grondslag (aftrekbaar fictief rendement: 2,47%)`);
  }
  if (aantalPersonen === 2) {
    toelichting.push(`Fiscale partners: dubbele heffingsvrije grens (2 × €${BOX3_HEFFINGSVRIJ_PER_PERSOON.toLocaleString('nl-NL')})`);
  }
  toelichting.push('Box 3 wetgeving is in transitie — controleer actuele regels bij Belastingdienst');

  return {
    rendementsgrondslag,
    heffingsvrij,
    belastbaarVermogen,
    fictieveRendementSpaar,
    fictieveRendementBelegging,
    fictieveRendementAnders,
    fictieveRendementSchuld,
    totaalFictieveRendement,
    belasting,
    effectiefRendementTarief,
    toelichting,
  };
}

// ============================================================
// Spaarcalculator – toekomstige waarde met maandelijkse inleg
// ============================================================

export interface SavingsInput {
  beginBedrag: number;
  maandelijksInleg: number;
  jaarrentePercent: number; // Als percentage (bijv. 3.0 = 3%)
  looptijdJaar: number;
  rekenmethode: 'enkelvoudig' | 'samengesteld';
}

export interface SavingsResult {
  eindwaarde: number;
  totaalIngelegd: number;
  totaalRente: number;
  jaarlijkseGroei: SavingsYear[];
}

export interface SavingsYear {
  jaar: number;
  beginSaldo: number;
  inleg: number;
  rente: number;
  eindSaldo: number;
}

export function calculateSavings(input: SavingsInput): SavingsResult {
  const { beginBedrag, maandelijksInleg, jaarrentePercent, looptijdJaar, rekenmethode } = input;
  const maandrente = jaarrentePercent / 100 / 12;
  const jaarlijkseGroei: SavingsYear[] = [];

  let saldo = beginBedrag;
  let totaalIngelegd = beginBedrag;

  for (let jaar = 1; jaar <= looptijdJaar; jaar++) {
    const beginSaldo = saldo;
    const inleg = maandelijksInleg * 12;
    let rente = 0;

    if (rekenmethode === 'samengesteld') {
      for (let m = 0; m < 12; m++) {
        saldo += maandelijksInleg;
        saldo *= (1 + maandrente);
      }
      rente = saldo - beginSaldo - inleg;
    } else {
      // Enkelvoudig
      saldo += inleg;
      rente = (beginSaldo + inleg / 2) * (jaarrentePercent / 100);
      saldo += rente;
    }

    totaalIngelegd += inleg;
    jaarlijkseGroei.push({
      jaar,
      beginSaldo: Math.round(beginSaldo),
      inleg: Math.round(inleg),
      rente: Math.round(rente),
      eindSaldo: Math.round(saldo),
    });
  }

  const totaalRente = saldo - totaalIngelegd;

  return {
    eindwaarde: Math.round(saldo),
    totaalIngelegd: Math.round(totaalIngelegd),
    totaalRente: Math.round(totaalRente),
    jaarlijkseGroei,
  };
}

// ============================================================
// Pensioenplanning
// ============================================================

export interface PensionInput {
  huidigLeeftijd: number;
  pensioenLeeftijd: number;
  huidigBrutoJaar: number;
  huidigPensioenVermogen: number;
  maandelijkseInleg: number;
  verwachtRendementPercent: number;
  gewenstNettoPensioenMaand: number;
  levensverwachting: number;
}

export interface PensionResult {
  aowMaand: number;                  // AOW schatting
  verwachtPensioenVermogen: number;  // Opgebouwd vermogen bij pensioen
  maandUitkering: number;            // Maandelijkse uitkering uit eigen vermogen
  totaalMaandelijksPensioen: number; // AOW + eigen pensioen
  dekkingsgraad: number;             // % van gewenst pensioen
  tekort: number;                    // Maandelijks tekort
  extraInlegNodig: number;           // Extra maandelijkse inleg nodig
  aantalPensioenJaren: number;
  toelichting: string[];
}

// AOW 2026 schatting (netto, alleenstaand/partner)
export const AOW_ALLEENSTAAND_MAAND = 1_426; // Netto ca.
export const AOW_PARTNER_MAAND = 976;        // Per persoon bij partnership

export function calculatePension(input: PensionInput): PensionResult {
  const {
    huidigLeeftijd, pensioenLeeftijd, huidigBrutoJaar,
    huidigPensioenVermogen, maandelijkseInleg,
    verwachtRendementPercent, gewenstNettoPensioenMaand,
    levensverwachting,
  } = input;

  const aantalJaarOpbouw = Math.max(0, pensioenLeeftijd - huidigLeeftijd);
  const aantalPensioenJaren = Math.max(0, levensverwachting - pensioenLeeftijd);

  // Opbouw fase: samengesteld interest op huidig vermogen + maandelijkse inleg
  const savingsResult = calculateSavings({
    beginBedrag: huidigPensioenVermogen,
    maandelijksInleg: maandelijkseInleg,
    jaarrentePercent: verwachtRendementPercent,
    looptijdJaar: aantalJaarOpbouw,
    rekenmethode: 'samengesteld',
  });

  const verwachtPensioenVermogen = savingsResult.eindwaarde;

  // Maandelijkse uitkering gedurende pensioen (annuïteitsberekening)
  const maandrente = verwachtRendementPercent / 100 / 12;
  const n = aantalPensioenJaren * 12;
  let maandUitkering = 0;
  if (n > 0 && verwachtPensioenVermogen > 0) {
    if (maandrente === 0) {
      maandUitkering = verwachtPensioenVermogen / n;
    } else {
      maandUitkering = (verwachtPensioenVermogen * maandrente) /
        (1 - Math.pow(1 + maandrente, -n));
    }
  }

  // AOW schatting (netto, gaat uit van alleenstaand voor simpliciteit)
  const aowMaand = AOW_ALLEENSTAAND_MAAND;

  const totaalMaandelijksPensioen = Math.round(maandUitkering + aowMaand);
  const dekkingsgraad = gewenstNettoPensioenMaand > 0
    ? (totaalMaandelijksPensioen / gewenstNettoPensioenMaand) * 100
    : 100;
  const tekort = Math.max(0, gewenstNettoPensioenMaand - totaalMaandelijksPensioen);

  // Berekening extra inleg nodig om tekort op te lossen
  let extraInlegNodig = 0;
  if (tekort > 0 && aantalJaarOpbouw > 0) {
    const gewenstVermogen = gewenstNettoPensioenMaand * n /
      (maandrente > 0 ? (1 - Math.pow(1 + maandrente, -n)) / maandrente : 1);
    const huidigVermogenToekomst = huidigPensioenVermogen *
      Math.pow(1 + verwachtRendementPercent / 100, aantalJaarOpbouw);
    const extra = Math.max(0, gewenstVermogen - huidigVermogenToekomst);

    if (maandrente === 0) {
      extraInlegNodig = extra / (aantalJaarOpbouw * 12);
    } else {
      const factor = (Math.pow(1 + maandrente, aantalJaarOpbouw * 12) - 1) / maandrente;
      extraInlegNodig = extra / factor;
    }
  }

  const toelichting: string[] = [];
  if (dekkingsgraad >= 100) {
    toelichting.push('Op koers voor gewenst pensioen — goed bezig!');
  } else if (dekkingsgraad >= 75) {
    toelichting.push('Bijna op koers — overweeg inleg te verhogen');
  } else {
    toelichting.push('Aanzienlijk tekort — neem actie om pensioengat te dichten');
  }
  toelichting.push(`AOW-leeftijd in 2026: 67 jaar en 3 maanden`);
  toelichting.push('Schatting exclusief werkgeverspensioen — controleer bij pensioenfonds (mijnpensioenoverzicht.nl)');
  toelichting.push(`Aanname: ${verwachtRendementPercent}% rendement per jaar gedurende gehele opbouwfase`);

  return {
    aowMaand,
    verwachtPensioenVermogen: Math.round(verwachtPensioenVermogen),
    maandUitkering: Math.round(maandUitkering),
    totaalMaandelijksPensioen,
    dekkingsgraad: Math.round(dekkingsgraad),
    tekort,
    extraInlegNodig: Math.round(extraInlegNodig),
    aantalPensioenJaren,
    toelichting,
  };
}
