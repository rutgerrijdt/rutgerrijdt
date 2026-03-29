// ============================================================
// Aflossingsschema berekening
// ============================================================

export interface AmortizationMonth {
  month: number;
  year: number;
  remainingBalance: number;
  interestPaid: number;
  principalPaid: number;
  monthlyPayment: number;
}

export interface AmortizationYear {
  year: number;          // Jaar 1..30
  calendarYear: number;  // Bijv. 2026
  openingBalance: number;
  interestPaid: number;
  principalPaid: number;
  closingBalance: number;
  monthlyPayment: number; // Representatief (1e maand van jaar)
}

// ---- Bereken volledig aflossingsschema ----
export function buildAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  type: 'annuiteit' | 'lineair',
  startYear: number = new Date().getFullYear()
): { months: AmortizationMonth[]; years: AmortizationYear[] } {
  const months: AmortizationMonth[] = [];
  const years: AmortizationYear[] = [];
  const n = termYears * 12;
  const r = annualRate / 12;

  // Annuïteitsfactor
  const annuityPayment =
    r === 0
      ? loanAmount / n
      : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const linearPrincipal = loanAmount / n;

  let balance = loanAmount;

  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    let principal: number;
    let payment: number;

    if (type === 'annuiteit') {
      payment = annuityPayment;
      principal = payment - interest;
    } else {
      principal = linearPrincipal;
      payment = principal + interest;
    }

    balance = Math.max(0, balance - principal);

    months.push({
      month: m,
      year: Math.ceil(m / 12),
      remainingBalance: Math.round(balance),
      interestPaid: Math.round(interest),
      principalPaid: Math.round(principal),
      monthlyPayment: Math.round(payment),
    });
  }

  // Aggregeer per jaar
  for (let y = 1; y <= termYears; y++) {
    const yearMonths = months.filter((m) => m.year === y);
    const openingBalance =
      y === 1 ? loanAmount : months[(y - 1) * 12 - 1].remainingBalance;
    const interestPaid = yearMonths.reduce((s, m) => s + m.interestPaid, 0);
    const principalPaid = yearMonths.reduce((s, m) => s + m.principalPaid, 0);
    const closingBalance = yearMonths[yearMonths.length - 1].remainingBalance;

    years.push({
      year: y,
      calendarYear: startYear + y - 1,
      openingBalance: Math.round(openingBalance),
      interestPaid: Math.round(interestPaid),
      principalPaid: Math.round(principalPaid),
      closingBalance: Math.round(closingBalance),
      monthlyPayment: yearMonths[0].monthlyPayment,
    });
  }

  return { months, years };
}

// ---- Bereken jaarlijkse rentelast voor belastingteruggave ----
export function getAnnualInterestByYear(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  type: 'annuiteit' | 'lineair'
): number[] {
  const { years } = buildAmortizationSchedule(loanAmount, annualRate, termYears, type);
  return years.map((y) => y.interestPaid);
}
