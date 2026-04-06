/**
 * ZZP / Freelancer berekeningen 2026
 * - Netto inkomen ZZP (winst uit onderneming)
 * - Uurtarief calculator
 * - Vergelijking ZZP vs loondienst
 * - Kwartaalbelasting schatting
 */

// ─── Constanten 2026 ─────────────────────────────────────────────────────────

const ZELFSTANDIGENAFTREK = 2470;        // 2026 (afbouw van €5030 in 2020)
const STARTERSAFTREK = 2123;             // 3× in 5 jaar
const MKB_VRIJSTELLING_PCT = 0.127;      // 12.7% van winst na zelfstandigenaftrek
const SCHIJF1_GRENS = 38441;
const SCHIJF1_TARIEF = 0.3582;
const SCHIJF2_TARIEF = 0.495;
const AHK_MAX = 3362;
const AHK_AFBOUW_START = 24813;
const AHK_AFBOUW_EIND = 75518;
const ARBEIDSKORTING_MAX = 5158;
const ZVW_PCT = 0.0564;                  // Zorgverzekeringswet premie ZZP 2026
const ZVW_MAX_GRONDSLAG = 71628;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZZPInkomenInput {
  /** Bruto winst (omzet minus zakelijke kosten) */
  brutoWinst: number;
  /** Starter (eerste 3 jaar) */
  isStarter: boolean;
  /** Zakelijke kosten per jaar */
  zakelijkeKosten: number;
  /** Overige aftrekposten (bijv. hypotheekrenteaftrek) */
  overigeAftrekposten?: number;
}

export interface ZZPInkomenResult {
  brutoWinst: number;
  zakelijkeKosten: number;
  winstNaKosten: number;
  zelfstandigenaftrek: number;
  startersaftrek: number;
  mkbVrijstelling: number;
  belastbaarInkomen: number;
  inkomstenbelasting: number;
  zvwPremie: number;
  ahk: number;
  arbeidskorting: number;
  nettoInkomen: number;
  effectiefTarief: number;
  kwartaalVoorschot: number;
  maandNetto: number;
  stappen: { label: string; waarde: number; positief: boolean }[];
}

export function calculateZZPInkomen(input: ZZPInkomenInput): ZZPInkomenResult {
  const winstNaKosten = Math.max(0, input.brutoWinst - input.zakelijkeKosten);

  // Aftrekposten
  const zelfstandigenaftrek = Math.min(winstNaKosten, ZELFSTANDIGENAFTREK);
  const startersaftrek = input.isStarter ? Math.min(winstNaKosten - zelfstandigenaftrek, STARTERSAFTREK) : 0;
  const winstNaAftrek = Math.max(0, winstNaKosten - zelfstandigenaftrek - startersaftrek);

  // MKB-winstvrijstelling
  const mkbVrijstelling = winstNaAftrek * MKB_VRIJSTELLING_PCT;
  const belastbaarInkomen = Math.max(0, winstNaAftrek - mkbVrijstelling - (input.overigeAftrekposten ?? 0));

  // Inkomstenbelasting (Box 1)
  let ib: number;
  if (belastbaarInkomen <= SCHIJF1_GRENS) {
    ib = belastbaarInkomen * SCHIJF1_TARIEF;
  } else {
    ib = SCHIJF1_GRENS * SCHIJF1_TARIEF + (belastbaarInkomen - SCHIJF1_GRENS) * SCHIJF2_TARIEF;
  }

  // ZVW-premie (over winst na aftrek, max grondslag)
  const zvwGrondslag = Math.min(winstNaKosten, ZVW_MAX_GRONDSLAG);
  const zvwPremie = zvwGrondslag * ZVW_PCT;

  // Heffingskortingen
  let ahk: number;
  if (belastbaarInkomen <= AHK_AFBOUW_START) {
    ahk = AHK_MAX;
  } else if (belastbaarInkomen <= AHK_AFBOUW_EIND) {
    ahk = AHK_MAX - (belastbaarInkomen - AHK_AFBOUW_START) * (AHK_MAX / (AHK_AFBOUW_EIND - AHK_AFBOUW_START));
  } else {
    ahk = 0;
  }
  ahk = Math.max(0, ahk);

  // Arbeidskorting (ZZP'ers hebben recht op arbeidskorting)
  let arbeidskorting = 0;
  const ai = winstNaKosten; // arbeidsinkomen = winst na zakelijke kosten
  if (ai <= 11491) {
    arbeidskorting = ai * 0.08425;
  } else if (ai <= 24820) {
    arbeidskorting = 968 + (ai - 11491) * 0.31433;
  } else if (ai <= 39957) {
    arbeidskorting = ARBEIDSKORTING_MAX;
  } else if (ai <= 124935) {
    arbeidskorting = ARBEIDSKORTING_MAX - (ai - 39957) * 0.06510;
  }
  arbeidskorting = Math.max(0, Math.min(ARBEIDSKORTING_MAX, arbeidskorting));

  const nettoIB = Math.max(0, ib - ahk - arbeidskorting);
  const nettoInkomen = winstNaKosten - nettoIB - zvwPremie;
  const effectiefTarief = winstNaKosten > 0 ? (nettoIB + zvwPremie) / winstNaKosten : 0;
  const kwartaalVoorschot = (nettoIB + zvwPremie) / 4;
  const maandNetto = nettoInkomen / 12;

  const stappen: ZZPInkomenResult['stappen'] = [
    { label: 'Bruto winst (omzet)', waarde: input.brutoWinst, positief: true },
    { label: 'Zakelijke kosten', waarde: -input.zakelijkeKosten, positief: false },
    { label: 'Winst na kosten', waarde: winstNaKosten, positief: true },
    { label: 'Zelfstandigenaftrek', waarde: -zelfstandigenaftrek, positief: false },
    ...(startersaftrek > 0 ? [{ label: 'Startersaftrek', waarde: -startersaftrek, positief: false }] : []),
    { label: 'MKB-winstvrijstelling (12,7%)', waarde: -mkbVrijstelling, positief: false },
    { label: 'Belastbaar inkomen Box 1', waarde: belastbaarInkomen, positief: true },
    { label: 'Inkomstenbelasting (voor kortingen)', waarde: -ib, positief: false },
    { label: 'Algemene heffingskorting', waarde: ahk, positief: true },
    { label: 'Arbeidskorting', waarde: arbeidskorting, positief: true },
    { label: 'ZVW-premie (5,64%)', waarde: -zvwPremie, positief: false },
    { label: 'Netto inkomen per jaar', waarde: nettoInkomen, positief: true },
  ];

  return {
    brutoWinst: input.brutoWinst,
    zakelijkeKosten: input.zakelijkeKosten,
    winstNaKosten,
    zelfstandigenaftrek,
    startersaftrek,
    mkbVrijstelling,
    belastbaarInkomen,
    inkomstenbelasting: nettoIB,
    zvwPremie,
    ahk,
    arbeidskorting,
    nettoInkomen,
    effectiefTarief,
    kwartaalVoorschot,
    maandNetto,
    stappen,
  };
}

// ─── UURTARIEF ───────────────────────────────────────────────────────────────

export interface UurtariefInput {
  /** Gewenst netto jaarsalaris */
  gewenstNettoJaar: number;
  /** Beschikbare werkdagen per jaar (excl. vakantie, feestdagen, ziekte) */
  werkdagenPerJaar: number;
  /** Uur per dag */
  urenPerDag: number;
  /** Zakelijke kosten per jaar */
  zakelijkeKosten: number;
  /** Niet-declarabele uren als % van totale uren (acquisitie, admin) */
  nietDeclarabeelPct: number;
}

export interface UurtariefResult {
  gewenstBrutoJaar: number;
  totaleKosten: number;
  beschikbareUren: number;
  declarabeleUren: number;
  minimumUurtarief: number;
  aanbevolenUurtarief: number; // +20% buffer
  dagtarief: number;
  vergelijkingLoondienst: number; // equivalent bruto loon
}

export function calculateUurtarief(input: UurtariefInput): UurtariefResult {
  // Iteratief gewenst bruto bepalen (netto is bekend)
  // Vereenvoudigd: gebruik effectief tarief ~30-40% voor gemiddeld ZZP inkomen
  const geschatEffTarief = 0.33;
  const gewenstBrutoJaar = input.gewenstNettoJaar / (1 - geschatEffTarief);

  const totaleKosten = gewenstBrutoJaar + input.zakelijkeKosten;
  const totaleUren = input.werkdagenPerJaar * input.urenPerDag;
  const declarabeleUren = totaleUren * (1 - input.nietDeclarabeelPct / 100);

  const minimumUurtarief = declarabeleUren > 0 ? totaleKosten / declarabeleUren : 0;
  const aanbevolenUurtarief = minimumUurtarief * 1.20; // 20% buffer voor risico/leegloop
  const dagtarief = aanbevolenUurtarief * input.urenPerDag;

  // Equivalent bruto loon in loondienst (werkgever betaalt ~32% bovenop bruto)
  const vergelijkingLoondienst = gewenstBrutoJaar * 1.32;

  return {
    gewenstBrutoJaar,
    totaleKosten,
    beschikbareUren: totaleUren,
    declarabeleUren,
    minimumUurtarief,
    aanbevolenUurtarief,
    dagtarief,
    vergelijkingLoondienst,
  };
}

// ─── ZZP vs LOONDIENST ────────────────────────────────────────────────────────

export interface ZZPvsLoondienstInput {
  /** Bruto jaarsalaris in loondienst */
  brutoLoondienst: number;
  /** ZZP uurtarief */
  uurtarief: number;
  /** Declarabele uren per jaar */
  declarabeleUren: number;
  /** Zakelijke kosten ZZP per jaar */
  zakelijkeKostenZZP: number;
  /** Vakantiedagen loondienst */
  vakantiedagenLoondienst: number;
  /** Vakantietoeslag % loondienst */
  vakantietoeslagPct: number;
  /** Pensioenopbouw loondienst (werkgeversbijdrage %) */
  pensioenPctLoondienst: number;
}

export interface ZZPvsLoondienstResult {
  loondienst: {
    brutoSalaris: number;
    vakantiegeld: number;
    pensioenbijdrage: number;
    totaalPakket: number;
    geschatNetto: number;
  };
  zzp: {
    omzet: number;
    zakelijkeKosten: number;
    winstNaKosten: number;
    geschatNetto: number;
    uurtarief: number;
  };
  verschilNetto: number;
  breakEvenUurtarief: number;
}

export function calculateZZPvsLoondienst(input: ZZPvsLoondienstInput): ZZPvsLoondienstResult {
  // Loondienst
  const vakantiegeld = input.brutoLoondienst * (input.vakantietoeslagPct / 100);
  const pensioenBijdrage = input.brutoLoondienst * (input.pensioenPctLoondienst / 100);
  const totaalPakket = input.brutoLoondienst + vakantiegeld + pensioenBijdrage;

  // Netto loondienst (vereenvoudigd)
  const brutoTotaalLoondienst = input.brutoLoondienst + vakantiegeld;
  let ibLoondienst: number;
  if (brutoTotaalLoondienst <= SCHIJF1_GRENS) {
    ibLoondienst = brutoTotaalLoondienst * SCHIJF1_TARIEF;
  } else {
    ibLoondienst = SCHIJF1_GRENS * SCHIJF1_TARIEF + (brutoTotaalLoondienst - SCHIJF1_GRENS) * SCHIJF2_TARIEF;
  }
  let ahkL = brutoTotaalLoondienst <= AHK_AFBOUW_START ? AHK_MAX :
    brutoTotaalLoondienst <= AHK_AFBOUW_EIND ? AHK_MAX - (brutoTotaalLoondienst - AHK_AFBOUW_START) * (AHK_MAX / (AHK_AFBOUW_EIND - AHK_AFBOUW_START)) : 0;
  let arbL = 0;
  if (brutoTotaalLoondienst <= 11491) arbL = brutoTotaalLoondienst * 0.08425;
  else if (brutoTotaalLoondienst <= 24820) arbL = 968 + (brutoTotaalLoondienst - 11491) * 0.31433;
  else if (brutoTotaalLoondienst <= 39957) arbL = ARBEIDSKORTING_MAX;
  else if (brutoTotaalLoondienst <= 124935) arbL = ARBEIDSKORTING_MAX - (brutoTotaalLoondienst - 39957) * 0.06510;
  const nettoLoondienst = brutoTotaalLoondienst - Math.max(0, ibLoondienst - ahkL - arbL);

  // ZZP
  const omzet = input.uurtarief * input.declarabeleUren;
  const zzpResult = calculateZZPInkomen({
    brutoWinst: omzet,
    zakelijkeKosten: input.zakelijkeKostenZZP,
    isStarter: false,
  });

  const breakEvenOmzet = input.brutoLoondienst + vakantiegeld + input.zakelijkeKostenZZP + (zzpResult.zvwPremie / omzet * input.zakelijkeKostenZZP);
  const breakEvenUurtarief = input.declarabeleUren > 0 ? (nettoLoondienst / (1 - 0.33) + input.zakelijkeKostenZZP) / input.declarabeleUren : 0;

  return {
    loondienst: {
      brutoSalaris: input.brutoLoondienst,
      vakantiegeld,
      pensioenbijdrage: pensioenBijdrage,
      totaalPakket,
      geschatNetto: nettoLoondienst,
    },
    zzp: {
      omzet,
      zakelijkeKosten: input.zakelijkeKostenZZP,
      winstNaKosten: zzpResult.winstNaKosten,
      geschatNetto: zzpResult.nettoInkomen,
      uurtarief: input.uurtarief,
    },
    verschilNetto: zzpResult.nettoInkomen - nettoLoondienst,
    breakEvenUurtarief,
  };
}
