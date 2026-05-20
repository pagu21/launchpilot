export type Sustainability = "green" | "yellow" | "red";

export type ProjectInputs = {
  averageTicket: number;
  coversPerDay: number;
  openingDays: number;
  seats: number;
  foodCostPct: number;
  beverageCostPct: number;
  laborCostMonthly: number;
  fixedCostsMonthly: number;
  loanPaymentMonthly: number;
  initialCash: number;
  initialInvestment: number;
  lunchShare: number;
};

export type ProjectKpis = {
  revenueMonthly: number;
  revenueAnnual: number;
  variableCostsMonthly: number;
  grossMarginMonthly: number;
  ebitdaMonthly: number;
  ebitdaAnnual: number;
  ebitdaPct: number;
  laborPct: number;
  breakEvenCovers: number;
  breakEvenRevenue: number;
  occupancyPct: number;
  cashFlowMonthly: number;
  runwayMonths: number;
  dscr: number;
  roi: number;
  sustainability: Sustainability;
  score: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function netFromVat(value: number, vatRate: number, includesVat: boolean) {
  if (!includesVat) return value;
  return value / (1 + vatRate / 100);
}

export function grossFromVat(value: number, vatRate: number, includesVat: boolean) {
  if (includesVat) return value;
  return value * (1 + vatRate / 100);
}

export function calculateKpis(inputs: ProjectInputs): ProjectKpis {
  const coversMonthly = inputs.coversPerDay * inputs.openingDays;
  const revenueMonthly = coversMonthly * inputs.averageTicket;
  const revenueAnnual = revenueMonthly * 12;
  const variableRate = (inputs.foodCostPct + inputs.beverageCostPct) / 100;
  const variableCostsMonthly = revenueMonthly * variableRate;
  const grossMarginMonthly = revenueMonthly - variableCostsMonthly;
  const ebitdaMonthly =
    grossMarginMonthly - inputs.laborCostMonthly - inputs.fixedCostsMonthly;
  const ebitdaAnnual = ebitdaMonthly * 12;
  const ebitdaPct = revenueMonthly ? (ebitdaMonthly / revenueMonthly) * 100 : 0;
  const laborPct = revenueMonthly
    ? (inputs.laborCostMonthly / revenueMonthly) * 100
    : 0;
  const contributionPerCover = inputs.averageTicket * (1 - variableRate);
  const fixedPlusLabor = inputs.fixedCostsMonthly + inputs.laborCostMonthly;
  const breakEvenCovers = contributionPerCover
    ? fixedPlusLabor / contributionPerCover
    : 0;
  const breakEvenRevenue = breakEvenCovers * inputs.averageTicket;
  const occupancyPct =
    inputs.seats && inputs.openingDays
      ? (inputs.coversPerDay / (inputs.seats * 2)) * 100
      : 0;
  const cashFlowMonthly = ebitdaMonthly - inputs.loanPaymentMonthly;
  const runwayMonths =
    cashFlowMonthly < 0
      ? clamp(inputs.initialCash / Math.abs(cashFlowMonthly), 0, 60)
      : 60;
  const dscr = inputs.loanPaymentMonthly
    ? ebitdaMonthly / inputs.loanPaymentMonthly
    : 3;
  const roi = inputs.initialInvestment
    ? (ebitdaAnnual / inputs.initialInvestment) * 100
    : 0;

  const score = Math.round(
    clamp(
      56 +
        ebitdaPct * 1.15 +
        (dscr - 1) * 13 +
        (25 - inputs.foodCostPct) * 0.7 +
        (35 - laborPct) * 0.45 +
        (runwayMonths - 4) * 1.8,
      0,
      100,
    ),
  );

  const sustainability: Sustainability =
    score >= 72 && cashFlowMonthly > 0
      ? "green"
      : score >= 48 || cashFlowMonthly > -2500
        ? "yellow"
        : "red";

  return {
    revenueMonthly,
    revenueAnnual,
    variableCostsMonthly,
    grossMarginMonthly,
    ebitdaMonthly,
    ebitdaAnnual,
    ebitdaPct,
    laborPct,
    breakEvenCovers,
    breakEvenRevenue,
    occupancyPct,
    cashFlowMonthly,
    runwayMonths,
    dscr,
    roi,
    sustainability,
    score,
  };
}

export function calculateLoanPayment(
  principal: number,
  annualRate: number,
  months: number,
) {
  const monthlyRate = annualRate / 100 / 12;
  if (!monthlyRate) return principal / months;
  return (
    (principal * monthlyRate * (1 + monthlyRate) ** months) /
    ((1 + monthlyRate) ** months - 1)
  );
}

export function buildScenarioRows(inputs: ProjectInputs) {
  return [2000, 4000, 6000, 8000, 10000].map((customers) => {
    const revenue = customers * inputs.averageTicket;
    const variableCosts =
      revenue * ((inputs.foodCostPct + inputs.beverageCostPct) / 100);
    const labor = inputs.laborCostMonthly * 12;
    const fixed = inputs.fixedCostsMonthly * 12;
    return {
      customers,
      revenue,
      variableCosts,
      totalCosts: variableCosts + labor + fixed,
      profit: revenue - variableCosts - labor - fixed,
    };
  });
}
