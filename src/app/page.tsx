"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeEuro,
  Banknote,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Download,
  Gauge,
  LineChart,
  LogOut,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildScenarioRows,
  calculateKpis,
  calculateLoanPayment,
  type ProjectInputs,
} from "@/lib/calculations";
import {
  prudentialBenchmark,
  prudentialCostRows,
  defaultInvestments,
  variableCostPresets,
  workflowSteps,
} from "@/lib/presets";
import { supabase } from "@/lib/supabase";

type Investment = (typeof defaultInvestments)[number] & {
  depreciationRate: number;
  firstYearHalf: boolean;
  acquisitionMode: "purchase" | "leasing" | "rental";
  confirmed: boolean;
};
type BenchmarkCostRow = (typeof prudentialCostRows)[number];
type BenchmarkCostKind = BenchmarkCostRow["kind"];

type WorkflowCostKind = "fixed" | "variable" | "oneTime";
type ServiceBandKey = "breakfast" | "lunch" | "aperitif" | "dinner";
type AppPage = "dashboard" | "workflow" | "summary" | "personale" | "finance" | "whatif" | "advisor" | "esg" | "pratiche" | "report";
type AssetStrategy = "purchase" | "leasing" | "rental";
type FinancingSourceType = "own" | "bank" | "leasing" | "rental" | "grant" | "other";
type GrantProbability = "basso" | "medio" | "alto" | "confermato";
type WhatIfInput = {
  rentIncreasePct: number;
  revenueChangePct: number;
  energyIncreasePct: number;
  foodCostIncreasePoints: number;
  staffReductionPct: number;
  ticketIncreasePct: number;
};
type LegalForm = "Ditta individuale" | "Società di persone" | "SRL" | "SRLS" | "Franchising" | "Altra forma";
type ComplianceStatus = "completato" | "in corso" | "mancante";
type BureaucracyCostRow = {
  id: string;
  name: string;
  amount: number;
  recurring: boolean;
  mandatory: boolean;
  status: ComplianceStatus;
};
type AuthorizationItem = {
  id: string;
  name: string;
  status: ComplianceStatus;
  mandatory: boolean;
  timingDays: number;
  note: string;
};
type OpeningTimelineItem = {
  id: string;
  activity: string;
  days: number;
  status: ComplianceStatus;
};
type TaxRegime = "Forfettario" | "Ordinario" | "SRL";
type AiAlertTone = "green" | "yellow" | "red";
type AiPriority = "Alta" | "Media" | "Bassa";
type AiChatMessage = { role: "user" | "assistant"; text: string };
type UserProfileMode = "cliente" | "consulente" | "master";
type RevenueChannelKey = string;
type BusinessPlanAudience = "banca" | "investitore" | "consulente" | "franchisor";
type QuickSize = "piccolo" | "medio" | "grande";
type QuickPrice = "economico" | "medio" | "premium";
type RevenueChannel = {
  key: RevenueChannelKey;
  enabled: boolean;
  label: string;
  monthlyOrders: number;
  averageRevenue: number;
  minMarginPerPerson: number;
  platform: string;
  deliveryCostPerOrder: number;
  otherCostPerOrder: number;
  note: string;
};
type ReportBranding = { enabled: boolean; header: string; subHeader: string; logoUrl: string };
type EffectiveReportBranding = ReportBranding & { profileLabel: string; editable: boolean; helper: string };
type EsgProfile = {
  electricityKwhMonthly: number;
  gasCostMonthly: number;
  waterM3Monthly: number;
  foodWastePct: number;
  recyclingPct: number;
  sustainablePackagingPct: number;
  plasticUsePct: number;
  localSuppliersPct: number;
  seasonalProductsPct: number;
  renewableEnergyPct: number;
  efficientEquipmentPct: number;
  staffWellbeingScore: number;
};

type FinancingPlan = {
  enabled: boolean;
  financedAmount: number;
  annualRate: number;
  months: number;
  graceMonths: number;
};

type FinancingSource = {
  id: string;
  type: FinancingSourceType;
  name: string;
  amount: number;
  durationMonths: number;
  annualRate: number;
  taeg: number;
  monthlyPayment: number;
  paymentFrequency: "Mensile" | "Trimestrale" | "Annuale" | "Una tantum";
  gracePeriodMonths: number;
  guarantees: string;
  notes: string;
  downPayment: number;
  maxInstallment: number;
  redemptionValue: number;
  servicesIncluded: string;
  maintenanceIncluded: boolean;
  grantCoveragePct: number;
  grantFree: boolean;
  subsidizedLoan: boolean;
  expectedCollectionDate: string;
  probability: GrantProbability;
};

type RevenueScenarioInput = {
  key: string;
  label: string;
  tone: string;
  openingDaysAnnual: number;
  seats: number;
  breakfast: boolean;
  lunch: boolean;
  aperitif: boolean;
  dinner: boolean;
  occupancyPct: number;
  averageTicket: number;
  foodCostPct: number;
  otherVariablePct: number;
  personnelAnnual: number;
  otherFixedAnnual: number;
};

type WorkflowCostRow = {
  id: string;
  stepIndex: number;
  label: string;
  category: string;
  amount: number;
  vat: number;
  enabled: boolean;
  custom: boolean;
  note: string;
};

type VenueProfile = {
  city: string;
  postalCode: string;
  zone: string;
  address: string;
  squareMeters: number;
  footTraffic: string;
  target: string;
  cuisineType: string;
  restaurantFormat: string;
  openingMode: "Annuale" | "Stagionale";
  seasonStartDate: string;
  seasonEndDate: string;
  weeklyClosingDay: string;
  openingDaysAnnual: number;
  breakfast: boolean;
  lunch: boolean;
  aperitif: boolean;
  dinner: boolean;
};

type VenueRoom = {
  id: string;
  name: string;
  seats: number;
  season: "Tutto l'anno" | "Estate" | "Inverno";
  breakfast: boolean;
  lunch: boolean;
  aperitif: boolean;
  dinner: boolean;
  seasonStartDate: string;
  seasonEndDate: string;
  note: string;
};

type WorkflowCostPreset = Omit<WorkflowCostRow, "id" | "stepIndex" | "enabled" | "custom">;

const restaurantFormatPresets = ["Ristorante tradizionale", "Pizzeria", "Bistrot", "Trattoria", "Delivery + sala", "Take away", "Bar con cucina", "Locale stagionale"];
const zonePresets = ["Centro storico", "Zona turistica", "Zona uffici", "Quartiere residenziale", "Zona universitaria", "Centro commerciale", "Lungomare / area stagionale", "Periferia servita"];
const serviceBandDefinitions: { key: ServiceBandKey; label: string; hours: number }[] = [
  { key: "breakfast", label: "Colazione", hours: 2 },
  { key: "lunch", label: "Pranzo", hours: 3 },
  { key: "aperitif", label: "Aperitivo", hours: 2.5 },
  { key: "dinner", label: "Cena", hours: 3.5 },
];
const roomSeasonPresets: VenueRoom["season"][] = ["Tutto l'anno", "Estate", "Inverno"];
const footTrafficPresets = ["Basso", "Medio", "Alto", "Molto alto"];
const targetPresets = ["Residenti", "Uffici", "Turisti", "Famiglie", "Giovani", "Business", "Clientela premium", "Studenti", "Hotel e turismo", "Lavoratori pranzo"];
const additionalRevenueChannelPresets = [
  "Pranzo business",
  "Take away / Asporto",
  "Eventi privati",
  "Eventi aziendali",
  "Catering",
  "Banqueting",
  "Feste e cerimonie",
  "Matrimoni",
  "Coffee break aziendali",
  "Vendita prodotti propri",
  "Dark kitchen",
  "Food truck",
  "Temporary restaurant / Pop-up",
  "Brunch",
  "Vendita tramite hotel",
  "Vendita tramite stabilimenti balneari",
];
const weeklyClosingDays = ["Nessuno", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const closingDayIndex: Record<string, number> = { "Domenica": 0, "Lunedì": 1, "Martedì": 2, "Mercoledì": 3, "Giovedì": 4, "Venerdì": 5, "Sabato": 6 };

const calculateOpeningDays = (startDate: string, endDate: string, closingDay: string) => {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let days = 0;
  const closedIndex = closingDayIndex[closingDay];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    if (closingDay === "Nessuno" || day.getDay() !== closedIndex) days += 1;
  }
  return days;
};

const getRoomOpeningDays = (room: VenueRoom, fallbackDays: number, closingDay: string) => {
  if (room.season === "Tutto l'anno") return fallbackDays;
  return calculateOpeningDays(room.seasonStartDate, room.seasonEndDate, closingDay);
};

const amortizationCategoryPresets = [
  { category: "Cucina professionale", usefulLifeYears: 10, depreciationRate: 10, firstYearHalf: true },
  { category: "Arredi e sala", usefulLifeYears: 8, depreciationRate: 12.5, firstYearHalf: true },
  { category: "Attrezzature bar", usefulLifeYears: 7, depreciationRate: 14.3, firstYearHalf: true },
  { category: "Impianti", usefulLifeYears: 10, depreciationRate: 10, firstYearHalf: true },
  { category: "Cassa / POS", usefulLifeYears: 5, depreciationRate: 20, firstYearHalf: true },
  { category: "Software e web", usefulLifeYears: 3, depreciationRate: 33.3, firstYearHalf: true },
  { category: "Insegne e comunicazione", usefulLifeYears: 5, depreciationRate: 20, firstYearHalf: true },
  { category: "Marketing apertura", usefulLifeYears: 3, depreciationRate: 33.3, firstYearHalf: true },
  { category: "Divise e materiali", usefulLifeYears: 3, depreciationRate: 33.3, firstYearHalf: true },
  { category: "Opere e impianti", usefulLifeYears: 10, depreciationRate: 10, firstYearHalf: true },
  { category: "Consulenze", usefulLifeYears: 3, depreciationRate: 33.3, firstYearHalf: true },
  { category: "Capitale circolante", usefulLifeYears: 1, depreciationRate: 100, firstYearHalf: false },
  { category: "Altro", usefulLifeYears: 5, depreciationRate: 20, firstYearHalf: true },
];

const normalizeInvestmentCategory = (category: string) => {
  const value = category.toLowerCase();
  if (value.includes("cucina") || value.includes("pizzeria") || value.includes("lavaggio")) return "Cucina professionale";
  if (value.includes("bar")) return "Attrezzature bar";
  if (value.includes("sala") || value.includes("arredi") || value.includes("piatti") || value.includes("tavoli") || value.includes("sedie")) return "Arredi e sala";
  if (value.includes("cassa") || value.includes("pos") || value.includes("hardware") || value.includes("internet")) return "Cassa / POS";
  if (value.includes("software") || value.includes("web") || value.includes("logo")) return "Software e web";
  if (value.includes("insegne") || value.includes("insegna") || value.includes("comunicazione")) return "Insegne e comunicazione";
  if (value.includes("marketing") || value.includes("stampa") || value.includes("flyer") || value.includes("gadget")) return "Marketing apertura";
  if (value.includes("divise") || value.includes("abbigliamento")) return "Divise e materiali";
  if (value.includes("impianti") || value.includes("ristruttur") || value.includes("opere") || value.includes("tenda")) return "Opere e impianti";
  if (value.includes("consul")) return "Consulenze";
  if (value.includes("capitale") || value.includes("circolante") || value.includes("scorte")) return "Capitale circolante";
  return "Altro";
};

const enrichInvestment = (item: (typeof defaultInvestments)[number]): Investment => {
  const category = normalizeInvestmentCategory(item.category);
  return {
    ...item,
    category,
    amortizable: false,
    years: 5,
    depreciationRate: 20,
    firstYearHalf: false,
    acquisitionMode: "purchase",
    confirmed: false,
  };
};

const financingSourceLabels: Record<FinancingSourceType, string> = {
  own: "Mezzi propri",
  bank: "Finanziamento bancario",
  leasing: "Leasing",
  rental: "Noleggio operativo",
  grant: "Contributi pubblici",
  other: "Altri finanziamenti",
};

const grantProbabilityWeight: Record<GrantProbability, number> = {
  basso: 0.25,
  medio: 0.5,
  alto: 0.75,
  confermato: 1,
};

const buildLoanSchedule = (amount: number, annualRate: number, months: number, graceMonths: number) => {
  const monthlyRate = annualRate / 100 / 12;
  const repaymentMonths = Math.max(months - graceMonths, 1);
  const payment = calculateLoanPayment(amount, annualRate, repaymentMonths);
  let balance = amount;
  const monthly = Array.from({ length: months }, (_, index) => {
    const period = index + 1;
    const openingBalance = balance;
    const interestAmount = openingBalance * monthlyRate;
    const paymentAmount = period <= graceMonths ? interestAmount : payment;
    const principalAmount = period <= graceMonths ? 0 : Math.min(paymentAmount - interestAmount, openingBalance);
    balance = Math.max(openingBalance - principalAmount, 0);
    return { period, openingBalance, paymentAmount, principalAmount, interestAmount, closingBalance: balance };
  });

  const annual = Array.from({ length: Math.ceil(months / 12) }, (_, yearIndex) => {
    const rows = monthly.slice(yearIndex * 12, yearIndex * 12 + 12);
    return {
      year: "Anno " + (yearIndex + 1),
      openingBalance: rows.at(0)?.openingBalance ?? 0,
      principalAmount: rows.reduce((sum, row) => sum + row.principalAmount, 0),
      interestAmount: rows.reduce((sum, row) => sum + row.interestAmount, 0),
      paymentAmount: rows.reduce((sum, row) => sum + row.paymentAmount, 0),
      closingBalance: rows.at(-1)?.closingBalance ?? 0,
    };
  });

  return { monthly, annual, payment };
};

const calculateAssetDepreciation = (item: Investment, year: number) => {
  if (!item.amortizable) return 0;
  const total = item.quantity * item.unitPrice;
  const base = total / Math.max(item.years, 1);
  const factor = item.firstYearHalf && (year === 1 || year === item.years + 1) ? 0.5 : 1;
  if (year > item.years + (item.firstYearHalf ? 1 : 0)) return 0;
  return Math.min(base * factor, total);
};

const classifyWorkflowCost = (stepIndex: number, category: string, label: string): WorkflowCostKind => {
  const text = `${category} ${label}`.toLowerCase();
  if ([0, 1, 2, 7, 9].includes(stepIndex)) return "oneTime";
  if (stepIndex === 5 || text.includes("food") || text.includes("beverage") || text.includes("materie") || text.includes("commission")) return "variable";
  if (stepIndex === 8 && (text.includes("scorte") || text.includes("iva") || text.includes("tasse"))) return "oneTime";
  return "fixed";
};

const workflowCostKindCopy: Record<WorkflowCostKind, { label: string; className: string }> = {
  fixed: { label: "Fisso", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  variable: { label: "Variabile", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  oneTime: { label: "Una tantum", className: "bg-amber-50 text-amber-700 ring-amber-200" },
};

const appPages: { id: AppPage; label: string; description: string }[] = [
  { id: "dashboard", label: "Inizio", description: "Scegli cosa vuoi fare" },
  { id: "workflow", label: "Percorso guidato", description: "Compila pochi dati essenziali" },
  { id: "summary", label: "Risultato", description: "Il progetto sta in piedi?" },
  { id: "personale", label: "Personale", description: "Costo lavoro e produttività" },
  { id: "finance", label: "Investimenti e finanza", description: "Acquisti, ammortamenti e debito" },
  { id: "whatif", label: "Simulazioni", description: "Cambia i cursori e guarda l'effetto" },
  { id: "report", label: "Stampa report", description: "Anteprima, PDF e controlli finali" },
];

const advancedPages: { id: AppPage; label: string; description: string }[] = [
  { id: "advisor", label: "AI suggerisce", description: "Commenti automatici sui numeri" },
  { id: "esg", label: "ESG", description: "Sostenibilità e consumi" },
  { id: "pratiche", label: "Apertura", description: "Autorizzazioni e checklist" },
];

const allAppPages = [...appPages, ...advancedPages];
const EXPERIENCE_MODE_STORAGE_KEY = "launch-pilot:experience-mode";
type ExperienceMode = "simple" | "advanced";

const simpleAppPageIds: AppPage[] = ["dashboard", "workflow", "summary", "report"];
const advancedOnlyPageIds: AppPage[] = ["whatif", "advisor", "esg", "pratiche"];

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});


const workflowCostPresets: WorkflowCostPreset[][] = [
  [],
  [
    { label: "Attrezzature cucina", category: "Cucina", amount: 65000, vat: 22, note: "Preset medio per cucina professionale." },
    { label: "Arredi sala", category: "Sala", amount: 28000, vat: 22, note: "Tavoli, sedute, banco e mise en place." },
    { label: "Ristrutturazioni e impianti", category: "Lavori", amount: 85000, vat: 10, note: "Opere, adeguamenti e impiantistica." },
    { label: "Software e cassa", category: "Software", amount: 4500, vat: 22, note: "POS, gestionale, prenotazioni e comande." },
  ],
  [
    { label: "Istruttoria bancaria", category: "Banca", amount: 1200, vat: 22, note: "Costi iniziali pratica finanziamento." },
    { label: "Consulenza finanza agevolata", category: "Consulenza", amount: 1800, vat: 22, note: "Verifica bandi, garanzie e contributi." },
    { label: "Interessi preammortamento", category: "Finanziamento", amount: 2400, vat: 0, note: "Stima dei primi mesi prima delle rate piene." },
  ],
  [
    { label: "Chef / responsabile cucina", category: "Cucina", amount: 4300, vat: 0, note: "Costo mensile azienda indicativo da CCNL, modificabile." },
    { label: "Secondo chef", category: "Cucina", amount: 3400, vat: 0, note: "Figura di supporto cucina, costo azienda indicativo." },
    { label: "Cuoco", category: "Cucina", amount: 3000, vat: 0, note: "Costo mensile azienda indicativo." },
    { label: "Aiuto cuoco", category: "Cucina", amount: 2350, vat: 0, note: "Costo mensile azienda indicativo." },
    { label: "Pizzaiolo", category: "Pizzeria", amount: 3200, vat: 0, note: "Figura dedicata forno e impasti." },
    { label: "Aiuto pizzaiolo", category: "Pizzeria", amount: 2300, vat: 0, note: "Supporto pizzeria e preparazioni." },
    { label: "Pasticciere", category: "Cucina", amount: 3100, vat: 0, note: "Da usare se il format prevede dessert interni." },
    { label: "Responsabile sala", category: "Sala", amount: 3300, vat: 0, note: "Coordinamento sala e servizio." },
    { label: "Cameriere", category: "Sala", amount: 2300, vat: 0, note: "Costo mensile azienda indicativo." },
    { label: "Runner", category: "Sala", amount: 1700, vat: 0, note: "Supporto sala nei servizi pieni." },
    { label: "Barista", category: "Bar", amount: 2400, vat: 0, note: "Colazione, banco bar e aperitivo." },
    { label: "Lavapiatti", category: "Supporto", amount: 1900, vat: 0, note: "Lavaggio, riordino e supporto cucina." },
    { label: "Store manager", category: "Direzione", amount: 3800, vat: 0, note: "Gestione locale, turni, fornitori e cassa." },
    { label: "Extra weekend", category: "Stagionale / extra", amount: 1200, vat: 0, note: "Personale flessibile per picchi e fine settimana." },
    { label: "Cameriere stagionale", category: "Stagionale / extra", amount: 2100, vat: 0, note: "Da usare per estate, dehors o alta stagione." },
    { label: "Aiuto cucina stagionale", category: "Stagionale / extra", amount: 2200, vat: 0, note: "Supporto cucina nei mesi di maggiore lavoro." },
    { label: "Formazione iniziale", category: "Avvio", amount: 1800, vat: 22, note: "Procedure, standard servizio e onboarding." },
  ],
  [
    { label: "Energia elettrica", category: "Costi variabili", amount: 3200, vat: 22, note: "Preset locale medio, da aggiornare con bollette reali." },
    { label: "Gas cucina", category: "Costi variabili", amount: 1250, vat: 22, note: "Cotture, forno, acqua calda e cucina." },
    { label: "Acqua", category: "Costi variabili", amount: 520, vat: 22, note: "Lavaggio, cucina e servizi." },
    { label: "Commissioni POS", category: "Costi variabili", amount: 850, vat: 22, note: "Dipende da incassi con carta e commissioni banca." },
    { label: "Delivery e piattaforme", category: "Costi variabili", amount: 1400, vat: 22, note: "Commissioni delivery, packaging e gestione ordini." },
    { label: "Lavanderia", category: "Costi variabili", amount: 600, vat: 22, note: "Tovagliato, divise, panni e servizio lavanderia." },
    { label: "Detergenti e pulizie", category: "Costi variabili", amount: 750, vat: 22, note: "Prodotti pulizia, sanificazione e consumabili." },
    { label: "Manutenzioni ordinarie", category: "Costi variabili", amount: 900, vat: 22, note: "Piccole riparazioni e manutenzione attrezzature." },
    { label: "Food secco e dispense", category: "Food cost", amount: 4500, vat: 10, note: "Pasta, farine, riso, conserve, olio, spezie." },
    { label: "Food fresco", category: "Food cost", amount: 7800, vat: 10, note: "Carne, pesce, verdure, latticini e freschi." },
    { label: "Pane, pizza e impasti", category: "Food cost", amount: 2200, vat: 10, note: "Farine speciali, lieviti, pane e basi pizzeria." },
    { label: "Dolci e dessert", category: "Food cost", amount: 1500, vat: 10, note: "Ingredienti pasticceria, dessert pronti o semilavorati." },
    { label: "Pasti personale e assaggi", category: "Food cost", amount: 900, vat: 10, note: "Quota prudenziale per pasti dipendenti, assaggi, scarti e sprechi." },
    { label: "Sprechi e differenze inventario", category: "Food cost", amount: 1200, vat: 10, note: "Scarti, rotture, invenduto e cali fisiologici." },
    { label: "Acqua minerale", category: "Beverage", amount: 850, vat: 22, note: "Magazzino minimo acqua naturale e gasata." },
    { label: "Bibite e soft drink", category: "Beverage", amount: 1200, vat: 22, note: "Coca, aranciate, toniche, succhi e analcolici." },
    { label: "Birre", category: "Beverage", amount: 1800, vat: 22, note: "Birra alla spina, bottiglie e artigianali." },
    { label: "Vini al calice", category: "Beverage", amount: 2200, vat: 22, note: "Rotazione veloce per servizio al calice." },
    { label: "Cantina vini bottiglia", category: "Beverage", amount: 6500, vat: 22, note: "Investimento iniziale in carta vini." },
    { label: "Bollicine e champagne", category: "Beverage", amount: 2800, vat: 22, note: "Se coerente con format e target." },
    { label: "Superalcolici base", category: "Beverage", amount: 3200, vat: 22, note: "Gin, vodka, rum, whisky, amari e liquori." },
    { label: "Caffe e prodotti bar", category: "Beverage", amount: 950, vat: 22, note: "Caffe, deca, orzo, te, zuccheri e banco bar." },
  ],
  [
    { label: "Menu engineering", category: "Ricavi", amount: 1400, vat: 22, note: "Struttura prezzi, margini e mix vendita." },
    { label: "Foto, menu e materiali vendita", category: "Marketing", amount: 2200, vat: 22, note: "Asset per lancio e comunicazione." },
    { label: "Campagna lancio", category: "Marketing", amount: 3500, vat: 22, note: "Budget iniziale adv e promozioni." },
  ],
  [
    { label: "Revisione prezzi", category: "Controllo", amount: 750, vat: 22, note: "Allineamento spesa media per persona, margine e domanda." },
    { label: "Dashboard KPI", category: "Analisi", amount: 950, vat: 22, note: "Lettura costo materie prime, lavoro e margini." },
    { label: "Sessione punto di pareggio", category: "Consulenza", amount: 650, vat: 22, note: "Validazione coperti minimi e fatturato soglia." },
  ],
  [
    { label: "Scenario pessimistico", category: "Scenario", amount: 450, vat: 22, note: "Riduzione domanda e aumento costi." },
    { label: "Scenario realistico", category: "Scenario", amount: 450, vat: 22, note: "Scenario centrale di progetto." },
    { label: "Scenario ottimistico", category: "Scenario", amount: 450, vat: 22, note: "Upside su occupazione e spesa media per persona." },
  ],
  [
    { label: "Liquidità di sicurezza", category: "Cassa", amount: 30000, vat: 0, note: "Riserva minima operativa consigliata." },
    { label: "Scorte iniziali", category: "Capitale circolante", amount: 9000, vat: 10, note: "Food, beverage e consumabili di avvio." },
    { label: "IVA e tasse stimate", category: "Fiscale", amount: 8500, vat: 0, note: "Prima stima fabbisogno fiscale." },
  ],
  [
    { label: "Impaginazione report", category: "Report", amount: 600, vat: 22, note: "Layout professionale per banca o soci." },
    { label: "Revisione conclusioni", category: "Consulenza", amount: 500, vat: 22, note: "Sintesi rischi, sostenibilita e azioni." },
    { label: "Export e archivio PDF", category: "Documento", amount: 250, vat: 22, note: "Generazione e conservazione report finale." },
  ],
];

const createInitialWorkflowCosts = (): WorkflowCostRow[] =>
  workflowCostPresets.flatMap((rows, stepIndex) =>
    rows.map((row, rowIndex) => ({
      ...row,
      id: "step-" + stepIndex + "-preset-" + rowIndex,
      stepIndex,
      enabled: false,
      custom: false,
    })),
  );

const statusCopy = {
  green: {
    label: "Fattibile alle condizioni inserite",
    shortLabel: "Fattibile",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    explanation: "Il progetto appare economicamente fattibile solo se i parametri inseriti dal ristoratore vengono rispettati: ricavi, costi, personale, investimenti, rate e liquidità non devono peggiorare rispetto alle ipotesi considerate.",
  },
  yellow: {
    label: "Da ottimizzare",
    shortLabel: "Da ottimizzare",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    explanation: "Il progetto può diventare fattibile, ma alcune ipotesi richiedono correzioni o verifiche prima di considerarlo economicamente sostenibile.",
  },
  red: {
    label: "Non sostenibile",
    shortLabel: "Critico",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    explanation: "Con i parametri attuali il progetto non appare economicamente sostenibile. Occorre rivedere ricavi, costi, investimenti, debito o liquidità prima di procedere.",
  },
};

function NumberField({
  label,
  value,
  suffix,
  onChange,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="flex items-center rounded-md border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100">
        <input
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-950 outline-none"
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <span className="text-xs text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}

const formatEuroInput = (value: number) =>
  new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);

const parseEuroInput = (value: string) => {
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const investmentCategoryThemes = [
  { header: "border-teal-200 bg-teal-50", title: "text-teal-950", meta: "text-teal-700", thead: "bg-teal-600 text-white", footer: "bg-teal-50" },
  { header: "border-sky-200 bg-sky-50", title: "text-sky-950", meta: "text-sky-700", thead: "bg-sky-600 text-white", footer: "bg-sky-50" },
  { header: "border-indigo-200 bg-indigo-50", title: "text-indigo-950", meta: "text-indigo-700", thead: "bg-indigo-600 text-white", footer: "bg-indigo-50" },
  { header: "border-emerald-200 bg-emerald-50", title: "text-emerald-950", meta: "text-emerald-700", thead: "bg-emerald-600 text-white", footer: "bg-emerald-50" },
  { header: "border-amber-200 bg-amber-50", title: "text-amber-950", meta: "text-amber-700", thead: "bg-amber-500 text-white", footer: "bg-amber-50" },
  { header: "border-cyan-200 bg-cyan-50", title: "text-cyan-950", meta: "text-cyan-700", thead: "bg-cyan-600 text-white", footer: "bg-cyan-50" },
];

function MoneyInput({
  value,
  onChange,
  className = "",
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(formatEuroInput(value));


  return (
    <input
      type="text"
      inputMode="decimal"
      value={focused ? draft : formatEuroInput(value)}
      disabled={disabled}
      onFocus={() => {
        setFocused(true);
        setDraft(formatEuroInput(value));
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(parseEuroInput(event.target.value));
      }}
      onBlur={() => {
        setFocused(false);
        setDraft(formatEuroInput(parseEuroInput(draft)));
      }}
      className={className}
      aria-label="Importo euro"
    />
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "%",
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
          {value > 0 ? "+" : ""}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-teal-600"
      />
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </label>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone = "blue",
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "green" | "red" | "slate";
  icon: typeof BadgeEuro;
}) {
  const tones = {
    blue: "bg-teal-50 text-teal-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <section className="lp-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-2">
          <p className="lp-card-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <p className="lp-card-value text-slate-950">{value}</p>
        </div>
        <span className={`shrink-0 rounded-md p-2 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="lp-card-detail mt-3 text-sm leading-5 text-slate-500">{detail}</p>
    </section>
  );
}

function VenueRoomsEditor({
  venueRooms,
  effectiveOpeningDaysAnnual,
  weeklyClosingDay,
  onUpdate,
  onAdd,
}: {
  venueRooms: VenueRoom[];
  effectiveOpeningDaysAnnual: number;
  weeklyClosingDay: string;
  onUpdate: (id: string, key: keyof Omit<VenueRoom, "id">, value: string | number | boolean) => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-lg border border-teal-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Sale e coperti disponibili</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Capienza reale del locale</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Inserisci sale interne, dehors o sale stagionali: i giorni vengono calcolati considerando la chiusura settimanale.</p>
        </div>
        <button type="button" onClick={onAdd} className="inline-flex w-fit items-center gap-2 rounded-md border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50">
          <Plus className="h-4 w-4" />
          Aggiungi sala
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-teal-100 bg-white">
        <table className="w-full min-w-[1520px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-1.5">Sala</th>
              <th className="px-2 py-1.5 text-right">Coperti</th>
              <th className="px-2 py-1.5">Periodo</th>
              <th className="px-2 py-1.5">Apertura sala</th>
              <th className="px-2 py-1.5">Chiusura sala</th>
              <th className="px-2 py-1.5 text-right">Giorni</th>
              <th className="px-2 py-1.5">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {venueRooms.map((room) => {
              const roomDays = getRoomOpeningDays(room, effectiveOpeningDaysAnnual, weeklyClosingDay);
              return (
                <tr key={room.id}>
                  <td className="px-2 py-1.5"><input value={room.name} onChange={(event) => onUpdate(room.id, "name", event.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500" /></td>
                  <td className="px-2 py-1.5"><input type="number" min="0" value={room.seats} onChange={(event) => onUpdate(room.id, "seats", Number(event.target.value))} className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td>
                  <td className="px-2 py-1.5"><select value={room.season} onChange={(event) => onUpdate(room.id, "season", event.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500">{roomSeasonPresets.map((season) => <option key={season}>{season}</option>)}</select></td>
                  <td className="px-2 py-1.5"><input type="date" value={room.seasonStartDate} onChange={(event) => onUpdate(room.id, "seasonStartDate", event.target.value)} disabled={room.season === "Tutto l'anno"} className="rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400" /></td>
                  <td className="px-2 py-1.5"><input type="date" value={room.seasonEndDate} onChange={(event) => onUpdate(room.id, "seasonEndDate", event.target.value)} disabled={room.season === "Tutto l'anno"} className="rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400" /></td>
                  <td className="px-2 py-1.5 text-right font-semibold text-slate-950">{roomDays}</td>
                  <td className="px-2 py-1.5"><input value={room.note} onChange={(event) => onUpdate(room.id, "note", event.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartShell() {
  return (
    <div className="grid h-full min-h-[220px] place-items-center rounded-md bg-slate-100 text-sm font-medium text-slate-400">
      Grafico in caricamento
    </div>
  );
}

function buildDefaultReportBranding(profile: UserProfileMode, venue: VenueProfile): EffectiveReportBranding {
  if (profile === "master") {
    return {
      enabled: true,
      editable: true,
      profileLabel: "Profilo Master",
      header: "Master Admin Suite",
      subHeader: "Report generato per controllo interno e verifica progetto",
      logoUrl: "/launch-pilot-logo.png",
      helper: "Il profilo Master può predisporre report di controllo e verificare la coerenza dei documenti generati."
    };
  }

  if (profile === "consulente") {
    return {
      enabled: true,
      editable: true,
      profileLabel: "Profilo Consulente",
      header: "Studio consulenza ristorazione",
      subHeader: "Analisi di prefattibilità predisposta con LaunchPilot",
      logoUrl: "/launch-pilot-logo.png",
      helper: "Il profilo Consulente può personalizzare intestazione e logo per produrre report professionali per i propri clienti."
    };
  }

  return {
    enabled: true,
    editable: false,
    profileLabel: "Profilo Ristoratore",
    header: venue.restaurantFormat || "Progetto ristorante",
    subHeader: `${venue.city || "Località da definire"} · ${venue.zone || "Zona da definire"} · Report operativo LaunchPilot`,
    logoUrl: "/launch-pilot-logo.png",
    helper: "Il profilo Ristoratore genera un report intestato al proprio progetto. Logo e intestazione consulente non sono mostrati."
  };
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(() => {
    if (typeof window === "undefined") return "simple";
    return window.localStorage.getItem(EXPERIENCE_MODE_STORAGE_KEY) === "advanced" ? "advanced" : "simple";
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("utente@launchpilot.it");
  const [userProfileMode] = useState<UserProfileMode>("consulente");
  const [reportBranding, setReportBranding] = useState<ReportBranding>({ enabled: true, header: "Studio consulenza ristorazione", subHeader: "Analisi di prefattibilità predisposta con LaunchPilot", logoUrl: "/launch-pilot-logo.png" });
  const [businessPlanAudience, setBusinessPlanAudience] = useState<BusinessPlanAudience>("banca");
  const [quickSize, setQuickSize] = useState<QuickSize>("medio");
  const [quickPrice, setQuickPrice] = useState<QuickPrice>("medio");
  const [quickFormat, setQuickFormat] = useState("Ristorante tradizionale");
  const [newRevenueChannelLabel, setNewRevenueChannelLabel] = useState(additionalRevenueChannelPresets[0]);
  const [mainServiceBand, setMainServiceBand] = useState<ServiceBandKey>("lunch");
  const [businessPlanQuestion, setBusinessPlanQuestion] = useState("");
  const [businessPlanChatMessages, setBusinessPlanChatMessages] = useState<AiChatMessage[]>([
    { role: "assistant", text: "Ciao, sono AI suggerisce per il Business Plan. Posso aiutarti a capire se il documento è bancabile, credibile e presentabile." },
  ]);
  const [investmentPrintMode, setInvestmentPrintMode] = useState<"selected" | "all">("all");
  const [visibleInvestmentCategories, setVisibleInvestmentCategories] = useState<Record<string, boolean>>({});
  const [visibleWorkflowCostCategories, setVisibleWorkflowCostCategories] = useState<Record<string, boolean>>({});
  const [expandedAiAlertId, setExpandedAiAlertId] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>([
    { role: "assistant", text: "Ciao, sono AI suggerisce. Posso aiutarti a capire sostenibilità, costi, pareggio, cassa e finanziamenti usando i dati del progetto." },
  ]);
  const [expandedEsgAlertId, setExpandedEsgAlertId] = useState<string | null>(null);
  const [esgQuestion, setEsgQuestion] = useState("");
  const [esgChatMessages, setEsgChatMessages] = useState<AiChatMessage[]>([
    { role: "assistant", text: "Ciao, sono AI ESG. Posso aiutarti a ridurre consumi, sprechi e costi, migliorando anche immagine e rapporto con banche e bandi." },
  ]);
  const [esgProfile, setEsgProfile] = useState<EsgProfile>({
    electricityKwhMonthly: 8200,
    gasCostMonthly: 1850,
    waterM3Monthly: 92,
    foodWastePct: 7,
    recyclingPct: 62,
    sustainablePackagingPct: 45,
    plasticUsePct: 38,
    localSuppliersPct: 48,
    seasonalProductsPct: 58,
    renewableEnergyPct: 22,
    efficientEquipmentPct: 54,
    staffWellbeingScore: 68,
  });
  const [confirmedSteps, setConfirmedSteps] = useState<Record<number, boolean>>({});
  const [venueProfile, setVenueProfile] = useState<VenueProfile>({
    city: "Milano",
    postalCode: "20121",
    zone: "Centro / alta visibilità",
    address: "Zona centrale",
    squareMeters: 145,
    footTraffic: "Alto",
    target: "Business",
    cuisineType: "Italiana",
    restaurantFormat: "Ristorante tradizionale",
    openingMode: "Annuale",
    seasonStartDate: "2026-01-01",
    seasonEndDate: "2026-12-31",
    weeklyClosingDay: "Lunedì",
    openingDaysAnnual: prudentialBenchmark.openingDaysAnnual,
    breakfast: false,
    lunch: true,
    aperitif: true,
    dinner: true,
  });
  const [venueRooms, setVenueRooms] = useState<VenueRoom[]>([
    { id: "room-main", name: "Sala principale", seats: 42, season: "Tutto l'anno", breakfast: false, lunch: true, aperitif: true, dinner: true, seasonStartDate: "2026-01-01", seasonEndDate: "2026-12-31", note: "Sala interna stabile" },
    { id: "room-summer", name: "Dehors estivo", seats: 18, season: "Estate", breakfast: false, lunch: true, aperitif: true, dinner: true, seasonStartDate: "2026-05-15", seasonEndDate: "2026-09-30", note: "Attivo nei mesi caldi" },
  ]);
  const [inputs, setInputs] = useState<ProjectInputs>({
    averageTicket: 42,
    coversPerDay: 86,
    openingDays: 26,
    seats: 58,
    foodCostPct: 27,
    beverageCostPct: 8,
    laborCostMonthly: 24500,
    fixedCostsMonthly: 12500,
    loanPaymentMonthly: 3900,
    initialCash: 46000,
    initialInvestment: 180000,
    lunchShare: 38,
  });
  const [whatIf, setWhatIf] = useState<WhatIfInput>({
    rentIncreasePct: 10,
    revenueChangePct: -15,
    energyIncreasePct: 20,
    foodCostIncreasePoints: 5,
    staffReductionPct: 8,
    ticketIncreasePct: 5,
  });
  const [legalForm, setLegalForm] = useState<LegalForm>("SRL");
  const [taxRegime, setTaxRegime] = useState<TaxRegime>("SRL");
  const [bureaucracyCosts, setBureaucracyCosts] = useState<BureaucracyCostRow[]>([
    { id: "iva", name: "Apertura partita IVA", amount: 0, recurring: false, mandatory: true, status: "completato" },
    { id: "camera", name: "Diritti camerali e bolli", amount: 220, recurring: false, mandatory: true, status: "in corso" },
    { id: "suap", name: "Pratica SUAP / SCIA", amount: 450, recurring: false, mandatory: true, status: "mancante" },
    { id: "notary", name: "Notaio e costituzione società", amount: 1800, recurring: false, mandatory: legalForm === "SRL", status: "in corso" },
    { id: "haccp", name: "HACCP e formazione alimentare", amount: 650, recurring: true, mandatory: true, status: "mancante" },
    { id: "safety", name: "Sicurezza lavoro e DVR", amount: 900, recurring: true, mandatory: true, status: "in corso" },
    { id: "sign", name: "Insegna e autorizzazione", amount: 550, recurring: false, mandatory: false, status: "in corso" },
    { id: "dehors", name: "Occupazione suolo pubblico / dehors", amount: 1200, recurring: true, mandatory: false, status: "mancante" },
    { id: "accountant", name: "Commercialista", amount: 2400, recurring: true, mandatory: true, status: "in corso" },
    { id: "tari", name: "TARI", amount: 1800, recurring: true, mandatory: true, status: "mancante" },
    { id: "siae", name: "SIAE / musica", amount: 450, recurring: true, mandatory: false, status: "mancante" },
  ]);
  const [authorizations, setAuthorizations] = useState<AuthorizationItem[]>([
    { id: "scia", name: "SCIA somministrazione", status: "mancante", mandatory: true, timingDays: 5, note: "Pratica centrale per avviare la somministrazione." },
    { id: "sab", name: "Requisiti professionali SAB", status: "in corso", mandatory: true, timingDays: 10, note: "Necessario se non già posseduto dal titolare/preposto." },
    { id: "haccp-auth", name: "HACCP", status: "mancante", mandatory: true, timingDays: 2, note: "Formazione e manuale alimentare." },
    { id: "dvr", name: "DVR sicurezza", status: "in corso", mandatory: true, timingDays: 7, note: "Da predisporre prima dell'attività con personale." },
    { id: "asl", name: "Pratiche ASL", status: "in corso", mandatory: true, timingDays: 12, note: "Verifica requisiti igienico sanitari." },
    { id: "sign-auth", name: "Autorizzazione insegna", status: "in corso", mandatory: false, timingDays: 15, note: "Dipende dal Comune e dal regolamento insegne." },
    { id: "dehors-auth", name: "Autorizzazione dehors", status: "mancante", mandatory: false, timingDays: 30, note: "Possibile criticità sui tempi comunali." },
    { id: "fire", name: "Prevenzione incendi", status: "mancante", mandatory: false, timingDays: 20, note: "Da verificare in base a impianti, metrature e capienza." },
    { id: "music", name: "Autorizzazione musica", status: "mancante", mandatory: false, timingDays: 5, note: "Necessaria se prevista musica diffusa o eventi." },
  ]);
  const [openingTimeline, setOpeningTimeline] = useState<OpeningTimelineItem[]>([
    { id: "company", activity: "Costituzione società", days: 7, status: "in corso" },
    { id: "scia-time", activity: "SCIA e pratiche SUAP", days: 5, status: "mancante" },
    { id: "haccp-time", activity: "HACCP e sicurezza", days: 7, status: "mancante" },
    { id: "works", activity: "Allestimento locale", days: 30, status: "in corso" },
    { id: "permits", activity: "Permessi comunali eventuali", days: 20, status: "mancante" },
  ]);
  const [investments, setInvestments] =
    useState<Investment[]>(() => defaultInvestments.map(enrichInvestment));
  const [assetStrategy, setAssetStrategy] = useState<AssetStrategy>("purchase");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [energyPreset, setEnergyPreset] = useState<"small" | "medium" | "large">(
    "medium",
  );
  const [workflowCosts, setWorkflowCosts] = useState<WorkflowCostRow[]>(
    createInitialWorkflowCosts,
  );
  const [costRows, setCostRows] = useState<BenchmarkCostRow[]>(prudentialCostRows);
  const [financing, setFinancing] = useState<FinancingPlan>({
    enabled: true,
    financedAmount: 145000,
    annualRate: 5.4,
    months: 72,
    graceMonths: 0,
  });
  const [financingSources, setFinancingSources] = useState<FinancingSource[]>([
    { id: "own-1", type: "own", name: "Mezzi propri soci", amount: 85000, durationMonths: 0, annualRate: 0, taeg: 0, monthlyPayment: 0, paymentFrequency: "Una tantum", gracePeriodMonths: 0, guarantees: "", notes: "Capitale iniziale disponibile", downPayment: 0, maxInstallment: 0, redemptionValue: 0, servicesIncluded: "", maintenanceIncluded: false, grantCoveragePct: 0, grantFree: false, subsidizedLoan: false, expectedCollectionDate: "", probability: "confermato" },
    { id: "bank-1", type: "bank", name: "Mutuo chirografario banca", amount: 145000, durationMonths: 72, annualRate: 5.4, taeg: 6.1, monthlyPayment: 0, paymentFrequency: "Mensile", gracePeriodMonths: 0, guarantees: "Garanzia soci / MCC se disponibile", notes: "Rata alla francese", downPayment: 0, maxInstallment: 0, redemptionValue: 0, servicesIncluded: "", maintenanceIncluded: false, grantCoveragePct: 0, grantFree: false, subsidizedLoan: false, expectedCollectionDate: "", probability: "confermato" },
    { id: "leasing-1", type: "leasing", name: "Leasing attrezzature", amount: 32000, durationMonths: 60, annualRate: 6.2, taeg: 6.8, monthlyPayment: 0, paymentFrequency: "Mensile", gracePeriodMonths: 0, guarantees: "Bene in garanzia", notes: "Alternativa all'acquisto diretto", downPayment: 3750, maxInstallment: 3750, redemptionValue: 1250, servicesIncluded: "", maintenanceIncluded: false, grantCoveragePct: 0, grantFree: false, subsidizedLoan: false, expectedCollectionDate: "", probability: "confermato" },
    { id: "grant-1", type: "grant", name: "Contributo pubblico ipotizzato", amount: 26000, durationMonths: 0, annualRate: 0, taeg: 0, monthlyPayment: 0, paymentFrequency: "Una tantum", gracePeriodMonths: 0, guarantees: "", notes: "Non considerare certo finché non deliberato", downPayment: 0, maxInstallment: 0, redemptionValue: 0, servicesIncluded: "", maintenanceIncluded: false, grantCoveragePct: 10, grantFree: true, subsidizedLoan: false, expectedCollectionDate: "2026-12", probability: "alto" },
  ]);
  const [revenueChannels, setRevenueChannels] = useState<RevenueChannel[]>([
    { key: "ordinary", enabled: true, label: "Attività ordinaria sala", monthlyOrders: 0, averageRevenue: 42, minMarginPerPerson: 25, platform: "", deliveryCostPerOrder: 0, otherCostPerOrder: 15, note: "Incasso ordinario della struttura con spesa media per persona IVA esclusa." },
    { key: "banquetingIn", enabled: false, label: "Banqueting in loco", monthlyOrders: 8, averageRevenue: 68, minMarginPerPerson: 30, platform: "Eventi interni", deliveryCostPerOrder: 0, otherCostPerOrder: 28, note: "Eventi ospitati nel locale. Inserire margine minimo prudenziale per persona." },
    { key: "banquetingOut", enabled: false, label: "Banqueting esterno", monthlyOrders: 5, averageRevenue: 82, minMarginPerPerson: 34, platform: "Eventi esterni", deliveryCostPerOrder: 8, otherCostPerOrder: 38, note: "Catering fuori sede: includere trasporto, personale extra e attrezzature." },
    { key: "delivery", enabled: false, label: "Delivery piattaforme", monthlyOrders: 320, averageRevenue: 28, minMarginPerPerson: 9, platform: "Glovo / Deliveroo / Just Eat", deliveryCostPerOrder: 6, otherCostPerOrder: 11, note: "Spesa media ordine e incasso al netto di commissioni e costi consegna." },
    { key: "takeaway", enabled: false, label: "Asporto", monthlyOrders: 220, averageRevenue: 24, minMarginPerPerson: 10, platform: "Ritiro cliente", deliveryCostPerOrder: 0, otherCostPerOrder: 10, note: "Ordini con ritiro da parte del cliente, senza consegna." },
  ]);
  const [revenueScenarios, setRevenueScenarios] = useState<RevenueScenarioInput[]>([
    {
      key: "A",
      label: "Pessimista",
      tone: "Prudente",
      openingDaysAnnual: 280,
      seats: 54,
      breakfast: false,
      lunch: true,
      aperitif: true,
      dinner: true,
      occupancyPct: 55,
      averageTicket: prudentialBenchmark.averageTicketsNet.A,
      foodCostPct: 24,
      otherVariablePct: 10.3,
      personnelAnnual: prudentialBenchmark.personnelAnnual,
      otherFixedAnnual: prudentialBenchmark.fixedCostsAnnual - prudentialBenchmark.personnelAnnual,
    },
    {
      key: "B",
      label: "Realista",
      tone: "Base",
      openingDaysAnnual: prudentialBenchmark.openingDaysAnnual,
      seats: 58,
      breakfast: false,
      lunch: true,
      aperitif: true,
      dinner: true,
      occupancyPct: 75,
      averageTicket: prudentialBenchmark.averageTicketsNet.B,
      foodCostPct: prudentialBenchmark.foodCostPct,
      otherVariablePct: prudentialBenchmark.otherVariableCostsPct,
      personnelAnnual: prudentialBenchmark.personnelAnnual,
      otherFixedAnnual: prudentialBenchmark.fixedCostsAnnual - prudentialBenchmark.personnelAnnual,
    },
    {
      key: "C",
      label: "Ottimista",
      tone: "Controllato",
      openingDaysAnnual: 320,
      seats: 62,
      breakfast: false,
      lunch: true,
      aperitif: true,
      dinner: true,
      occupancyPct: 88,
      averageTicket: prudentialBenchmark.averageTicketsNet.C,
      foodCostPct: 21,
      otherVariablePct: 8.5,
      personnelAnnual: prudentialBenchmark.personnelAnnual,
      otherFixedAnnual: prudentialBenchmark.fixedCostsAnnual - prudentialBenchmark.personnelAnnual,
    },
  ]);

  const calculatedOpeningDaysAnnual = venueProfile.openingMode === "Stagionale"
    ? calculateOpeningDays(venueProfile.seasonStartDate, venueProfile.seasonEndDate, venueProfile.weeklyClosingDay)
    : calculateOpeningDays("2026-01-01", "2026-12-31", venueProfile.weeklyClosingDay);
  const effectiveOpeningDaysAnnual = Math.max(calculatedOpeningDaysAnnual || venueProfile.openingDaysAnnual, 1);
  const activeServiceBandsForVenue = serviceBandDefinitions.filter((band) => venueProfile[band.key]);
  const activeServiceCountForVenue = Math.max(activeServiceBandsForVenue.length, 1);

  const venueAnnualCapacity = venueRooms.reduce((sum, room) => {
    const activeServices = serviceBandDefinitions.filter((band) => Boolean(room[band.key]) && Boolean(venueProfile[band.key])).length;
    const roomOpeningDays = getRoomOpeningDays(room, effectiveOpeningDaysAnnual, venueProfile.weeklyClosingDay);
    return sum + room.seats * roomOpeningDays * activeServices;
  }, 0);
  const venuePeakSeats = venueRooms.reduce((sum, room) => sum + room.seats, 0);
  const venueActiveRooms = venueRooms.filter((room) => room.seats > 0).length;
  const footTrafficSignal = venueProfile.footTraffic.toLowerCase();
  const footTrafficScore = footTrafficSignal.includes("molto") ? 96 : footTrafficSignal.includes("alto") || footTrafficSignal.includes("buono") || footTrafficSignal.includes("uffici") ? 82 : footTrafficSignal.includes("medio") || footTrafficSignal.includes("discreto") || footTrafficSignal.includes("serale") ? 58 : 34;
  const sqmPerSeat = venuePeakSeats ? venueProfile.squareMeters / venuePeakSeats : 0;
  const spaceEfficiencyScore = sqmPerSeat >= 1.4 && sqmPerSeat <= 3.4 ? 82 : sqmPerSeat > 0 && sqmPerSeat < 1.2 ? 46 : 62;
  const targetFormatScore =
    (venueProfile.target === "Business" && (venueProfile.restaurantFormat.includes("Bistrot") || venueProfile.lunch || venueProfile.aperitif)) ||
    (venueProfile.target === "Turisti" && venueProfile.city.toLowerCase() !== "") ||
    (venueProfile.target === "Famiglie" && !venueProfile.restaurantFormat.includes("Fine")) ||
    (venueProfile.target === "Giovani" && (venueProfile.restaurantFormat.includes("Pizzeria") || venueProfile.restaurantFormat.includes("Fast"))) ||
    (venueProfile.target === "Residenti" && venueProfile.dinner) ||
    (venueProfile.target === "Uffici" && (venueProfile.lunch || venueProfile.breakfast))
      ? 84
      : 58;
  const locationPotentialScore = Math.round((footTrafficScore * 0.42) + (spaceEfficiencyScore * 0.22) + (targetFormatScore * 0.28) + (venueAnnualCapacity > 35000 ? 8 : 0));

  const confirmedInvestments = investments.filter((item) => item.confirmed);
  const investmentTotal = confirmedInvestments.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const suggestedInvestmentTotal = investments.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const amortizableTotal = confirmedInvestments.reduce(
    (sum, item) => sum + (item.amortizable ? item.quantity * item.unitPrice : 0),
    0,
  );
  const amortizationAnnual = confirmedInvestments.reduce(
    (sum, item) => sum + calculateAssetDepreciation(item, 1),
    0,
  );
  const standardAnnualDepreciation = confirmedInvestments.reduce(
    (sum, item) => sum + (item.amortizable ? (item.quantity * item.unitPrice) / Math.max(item.years, 1) : 0),
    0,
  );
  const amortizationMonthly = amortizationAnnual / 12;
  const amortizationRows = confirmedInvestments.map((item) => {
    const total = item.quantity * item.unitPrice;
    const standardAnnual = item.amortizable ? total / Math.max(item.years, 1) : 0;
    const annual = calculateAssetDepreciation(item, 1);
    const monthly = annual / 12;
    const residualAfterYear = item.amortizable ? Math.max(total - annual, 0) : total;
    return { ...item, total, standardAnnual, annual, monthly, residualAfterYear };
  });
  const depreciationHorizon = Math.max(10, ...confirmedInvestments.map((item) => item.years + (item.firstYearHalf ? 1 : 0)));
  const depreciationPlan = Array.from({ length: depreciationHorizon }, (_, index) => {
    const year = index + 1;
    const depreciation = confirmedInvestments.reduce((sum, item) => sum + calculateAssetDepreciation(item, year), 0);
    const accumulated = confirmedInvestments.reduce((sum, item) => {
      const amount = Array.from({ length: year }, (_, depIndex) => calculateAssetDepreciation(item, depIndex + 1))
        .reduce((total, value) => total + value, 0);
      return sum + Math.min(amount, item.quantity * item.unitPrice);
    }, 0);
    const residual = Math.max(amortizableTotal - accumulated, 0);
    return { year: "Anno " + year, depreciation, residual };
  });
  const cashVsEconomicData = [
    { name: "Investimento iniziale", value: investmentTotal },
    { name: "Costo economico anno 1", value: amortizationAnnual },
    { name: "Ammortamento a regime", value: standardAnnualDepreciation },
  ];
  const depreciationTaxSaving = amortizationAnnual * 0.28;
  const investmentCategories = amortizationCategoryPresets.map((preset) => preset.category);
  const investmentRowsByCategory = investmentCategories
    .map((category) => {
      const rows = investments
        .map((item, index) => ({ item, index, total: item.quantity * item.unitPrice }))
        .filter(({ item }) => item.category === category);
      const confirmedTotal = rows.reduce((sum, row) => sum + (row.item.confirmed ? row.total : 0), 0);
      return { category, rows, confirmedTotal };
    })
    .filter((group) => group.rows.length > 0 || group.category !== "Altro");
  const visibleInvestmentRowsByCategory = investmentRowsByCategory;
  const openInvestmentCategoriesCount = investmentRowsByCategory.filter((group) => visibleInvestmentCategories[group.category] !== false).length;
  const confirmedInvestmentCount = confirmedInvestments.length;
  const suggestedInvestmentCount = investments.length;
  const printInvestmentGroups = investmentRowsByCategory
    .map((group) => ({
      ...group,
      rows: investmentPrintMode === "selected" ? group.rows.filter((row) => row.item.confirmed) : group.rows,
    }))
    .filter((group) => group.rows.length > 0);
  const bankSource = financingSources.find((source) => source.type === "bank");
  const bankLoanSchedule = bankSource
    ? buildLoanSchedule(bankSource.amount, bankSource.annualRate, bankSource.durationMonths, bankSource.gracePeriodMonths)
    : { monthly: [], annual: [], payment: 0 };
  const calculatedFinancingSources = financingSources.map((source) => {
    if (source.type === "bank") return { ...source, monthlyPayment: bankLoanSchedule.payment };
    if (source.type === "leasing") {
      const financed = Math.max(source.amount - source.downPayment - source.maxInstallment, 0);
      return { ...source, monthlyPayment: calculateLoanPayment(financed, source.annualRate, Math.max(source.durationMonths, 1)) };
    }
    if (source.type === "rental") return source;
    if (source.type === "other" && source.durationMonths > 0) return { ...source, monthlyPayment: calculateLoanPayment(source.amount, source.annualRate, source.durationMonths) };
    return { ...source, monthlyPayment: 0 };
  });
  const ownCapital = calculatedFinancingSources.filter((source) => source.type === "own").reduce((sum, source) => sum + source.amount, 0);
  const confirmedGrants = calculatedFinancingSources.filter((source) => source.type === "grant" && source.probability === "confermato").reduce((sum, source) => sum + source.amount, 0);
  const weightedGrants = calculatedFinancingSources.filter((source) => source.type === "grant").reduce((sum, source) => sum + source.amount * grantProbabilityWeight[source.probability], 0);
  const uncertainGrants = calculatedFinancingSources.filter((source) => source.type === "grant" && source.probability !== "confermato").reduce((sum, source) => sum + source.amount, 0);
  const debtSources = calculatedFinancingSources.filter((source) => ["bank", "leasing", "rental", "other"].includes(source.type));
  const financingAmount = debtSources.reduce((sum, source) => sum + source.amount, 0);
  const totalMonthlyDebtService = debtSources.reduce((sum, source) => sum + source.monthlyPayment, 0);
  const loanPayment = totalMonthlyDebtService;
  const totalInterest = bankLoanSchedule.annual.reduce((sum, row) => sum + row.interestAmount, 0);
  const annualInterest = bankLoanSchedule.annual.at(0)?.interestAmount ?? 0;
  const debtResidualFinal = bankLoanSchedule.annual.at(-1)?.closingBalance ?? 0;
  const ownCapitalNeeded = Math.max(investmentTotal - ownCapital - financingAmount - confirmedGrants, 0);
  const fundingCoverageData = [
    { name: "Mezzi propri", value: ownCapital },
    { name: "Debito", value: financingAmount },
    { name: "Contributi certi", value: confirmedGrants },
    { name: "Fabbisogno", value: ownCapitalNeeded },
  ];
  const realisticRevenueScenario = revenueScenarios.find((scenario) => scenario.key === "B") ?? revenueScenarios[1] ?? revenueScenarios[0];
  const venueAverageDailyCapacity = venueAnnualCapacity / Math.max(effectiveOpeningDaysAnnual, 1);
  const calculatedCoversPerDay = Math.max(0, Math.round(venueAverageDailyCapacity * ((realisticRevenueScenario?.occupancyPct ?? 0) / 100)));
  const selectedLaborCostMonthly = workflowCosts.filter((row) => row.stepIndex === 3 && row.enabled).reduce((sum, row) => sum + row.amount, 0);
  const selectedFixedCostsMonthly = workflowCosts.filter((row) => row.enabled && row.stepIndex !== 3 && classifyWorkflowCost(row.stepIndex, row.category, row.label) === "fixed").reduce((sum, row) => sum + row.amount, 0);
  const calculatedLaborCostMonthly = selectedLaborCostMonthly || inputs.laborCostMonthly;
  const calculatedFixedCostsMonthly = selectedFixedCostsMonthly || inputs.fixedCostsMonthly;
  const effectiveInputs = {
    ...inputs,
    coversPerDay: calculatedCoversPerDay,
    laborCostMonthly: calculatedLaborCostMonthly,
    fixedCostsMonthly: calculatedFixedCostsMonthly,
    initialInvestment: investmentTotal,
    loanPaymentMonthly: loanPayment,
  };
  const kpis = calculateKpis(effectiveInputs);
  const estimatedRentMonthly = effectiveInputs.fixedCostsMonthly * 0.35;
  const rentSustainabilityPct = kpis.revenueMonthly ? (estimatedRentMonthly / kpis.revenueMonthly) * 100 : 0;
  const rentSustainabilityScore = rentSustainabilityPct <= 8 ? 90 : rentSustainabilityPct <= 12 ? 72 : rentSustainabilityPct <= 16 ? 48 : 28;
  const zoneSignal = (venueProfile.zone + " " + venueProfile.address).toLowerCase();
  const locationRiskPct = zoneSignal.includes("centr") || zoneSignal.includes("visibil") || zoneSignal.includes("turist") ? 24 : footTrafficScore <= 40 ? 62 : 42;
  const locationCompatibilityScore = Math.round((locationPotentialScore * 0.45) + (rentSustainabilityScore * 0.3) + (targetFormatScore * 0.25));
  const locationPotentialCopy = locationPotentialScore >= 76 ? "Potenziale alto" : locationPotentialScore >= 55 ? "Potenziale medio" : "Potenziale da verificare";
  const rentSustainabilityCopy = rentSustainabilityPct <= 10 ? "Affitto sostenibile" : rentSustainabilityPct <= 15 ? "Affitto da monitorare" : "Affitto pesante";
  const zoneRiskCopy = locationRiskPct <= 30 ? "Rischio zona basso" : locationRiskPct <= 50 ? "Rischio zona medio" : "Rischio zona alto";
  const formatCompatibilityCopy = locationCompatibilityScore >= 76 ? "Format compatibile" : locationCompatibilityScore >= 55 ? "Compatibilità da affinare" : "Format da ripensare";
  const investmentRevenueRatio = kpis.revenueAnnual ? (investmentTotal / kpis.revenueAnnual) * 100 : 0;
  const depreciationMarginRatio = kpis.ebitdaAnnual ? (amortizationAnnual / kpis.ebitdaAnnual) * 100 : 0;
  const assetStrategyOptions = [
    {
      key: "purchase" as const,
      label: "Acquisto diretto",
      initialCashOut: investmentTotal,
      annualCashOut: financing.enabled ? loanPayment * 12 : 0,
      annualEconomicCost: amortizationAnnual + annualInterest,
      note: "Massima proprietà dei beni, maggiore uscita iniziale."
    },
    {
      key: "leasing" as const,
      label: "Leasing",
      initialCashOut: investmentTotal * 0.15,
      annualCashOut: investmentTotal * 0.18,
      annualEconomicCost: investmentTotal * 0.18,
      note: "Riduce la cassa iniziale, aumenta il canone annuo."
    },
    {
      key: "rental" as const,
      label: "Noleggio operativo",
      initialCashOut: investmentTotal * 0.05,
      annualCashOut: investmentTotal * 0.22,
      annualEconomicCost: investmentTotal * 0.22,
      note: "Più leggero all'avvio, costo ricorrente più alto."
    },
  ];
  const selectedAssetStrategy = assetStrategyOptions.find((option) => option.key === assetStrategy) ?? assetStrategyOptions[0];
  const investmentAlerts = [
    investmentRevenueRatio > 65
      ? { tone: "red", text: "Gli investimenti iniziali sono elevati rispetto al fatturato previsto." }
      : investmentRevenueRatio > 45
        ? { tone: "yellow", text: "Gli investimenti sono importanti: verifica capienza, prezzi e copertura finanziaria." }
        : { tone: "green", text: "Struttura investimenti equilibrata rispetto al fatturato previsto." },
    depreciationMarginRatio > 35
      ? { tone: "red", text: "Gli ammortamenti incidono troppo sul margine operativo." }
      : depreciationMarginRatio > 22
        ? { tone: "yellow", text: "Il peso degli ammortamenti è da monitorare nei primi anni." }
        : { tone: "green", text: "Gli ammortamenti sono assorbiti dal margine operativo." },
    kpis.dscr < 1.2
      ? { tone: "red", text: "Copertura del debito sotto la soglia bancaria: riduci debito o allunga la durata." }
      : { tone: "green", text: "Copertura del debito coerente con una prima lettura bancaria." },
  ];
  const investmentAdvisor = [
    investmentRevenueRatio > 55
      ? "Potresti ridurre l'investimento iniziale noleggiando parte delle attrezzature."
      : "La dimensione dell'investimento appare coerente con il fatturato previsto.",
    depreciationMarginRatio > 25
      ? "Il peso degli ammortamenti è elevato nei primi anni: verifica vita utile e priorità degli acquisti."
      : "Gli ammortamenti non comprimono eccessivamente il margine operativo.",
    assetStrategy === "purchase"
      ? "Acquisto diretto: attenzione alla cassa iniziale, ma il costo economico viene distribuito nel tempo."
      : assetStrategy === "leasing"
        ? "Leasing: utile se vuoi proteggere liquidità iniziale, tenendo sotto controllo il canone annuo."
        : "Noleggio operativo: semplice e leggero all'avvio, ma aumenta i costi ricorrenti.",
  ];

  const operatingCashFlowAnnual = kpis.ebitdaAnnual;
  const dscrAnnualRows = bankLoanSchedule.annual.map((row, index) => {
    const stress = index === 0 ? 0.9 : index === 1 ? 0.95 : 1;
    const cashAvailable = operatingCashFlowAnnual * stress;
    const dscr = row.paymentAmount ? cashAvailable / row.paymentAmount : 99;
    return { ...row, cashAvailable, dscr: Number(dscr.toFixed(2)) };
  });
  const minDscrRow = dscrAnnualRows.reduce((min, row) => (row.dscr < min.dscr ? row : min), dscrAnnualRows[0] ?? { year: "Anno 1", dscr: kpis.dscr });
  const dscrCopy = (minDscrRow?.dscr ?? kpis.dscr) < 1
    ? { label: "Rischio alto", className: "bg-rose-50 text-rose-700 ring-rose-200", text: "Il cash flow non copre il servizio del debito." }
    : (minDscrRow?.dscr ?? kpis.dscr) < 1.2
      ? { label: "Debole", className: "bg-amber-50 text-amber-700 ring-amber-200", text: "Il margine di sicurezza è limitato." }
      : (minDscrRow?.dscr ?? kpis.dscr) < 1.5
        ? { label: "Accettabile", className: "bg-teal-50 text-teal-700 ring-teal-200", text: "Le rate sembrano sostenibili." }
        : { label: "Buona", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", text: "Le rate sembrano sostenibili con buon margine." };
  const financingScenarios = [
    { name: "Prudente", revenueFactor: 0.88, rateDelta: 1.25, extraLiquidity: investmentTotal * 0.08 },
    { name: "Base", revenueFactor: 1, rateDelta: 0, extraLiquidity: 0 },
    { name: "Ottimistico", revenueFactor: 1.12, rateDelta: -0.4, extraLiquidity: -investmentTotal * 0.04 },
  ].map((scenario) => {
    const payment = bankSource ? calculateLoanPayment(bankSource.amount, Math.max(bankSource.annualRate + scenario.rateDelta, 0), Math.max(bankSource.durationMonths - bankSource.gracePeriodMonths, 1)) : 0;
    const annualService = payment * 12;
    const cashAvailable = operatingCashFlowAnnual * scenario.revenueFactor;
    return { ...scenario, payment, annualService, cashAvailable, dscr: annualService ? cashAvailable / annualService : 99, liquidityNeed: Math.max(ownCapitalNeeded + scenario.extraLiquidity, 0) };
  });
  const financingAlerts = [
    uncertainGrants > investmentTotal * 0.15
      ? { tone: "red", text: "Il progetto dipende troppo da contributi non ancora confermati." }
      : { tone: "green", text: "I contributi incerti non sono determinanti per la copertura del progetto." },
    totalMonthlyDebtService > kpis.ebitdaMonthly * 0.45
      ? { tone: "yellow", text: "La rata mensile è elevata rispetto al margine operativo previsto." }
      : { tone: "green", text: "La combinazione tra capitale proprio e debito appare equilibrata." },
    (minDscrRow?.dscr ?? kpis.dscr) < 1
      ? { tone: "red", text: "La copertura del debito scende sotto 1 nel piano di rimborso." }
      : { tone: "green", text: "La copertura del debito resta sopra la soglia minima nel piano simulato." },
  ];
  const initialInventoryNeed = Math.max(kpis.variableCostsMonthly * 0.8, kpis.revenueMonthly * 0.06);
  const workingCapitalNeed = (effectiveInputs.fixedCostsMonthly + effectiveInputs.laborCostMonthly) * 1.5;
  const firstSixMonthCashPreview = Array.from({ length: 6 }, (_, index) => {
    const seasonality = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.09;
    const operating = kpis.ebitdaMonthly * seasonality;
    return { saldo: inputs.initialCash + (operating - loanPayment) * (index + 1), operativo: operating };
  });
  const startupLossReserve = Math.max(-Math.min(...firstSixMonthCashPreview.map((row) => row.operativo - loanPayment)), 0) * 6;
  const safetyReserve = Math.max(kpis.revenueMonthly * 0.08, (effectiveInputs.fixedCostsMonthly + effectiveInputs.laborCostMonthly + loanPayment) * 1.2);
  const legalOpeningCostPreview = legalForm === "Ditta individuale" ? 450 : legalForm === "Società di persone" ? 1200 : legalForm === "SRL" ? 2200 : legalForm === "SRLS" ? 900 : legalForm === "Franchising" ? 3500 : 1500;
  const oneTimeBureaucracyCostsPreview = bureaucracyCosts.filter((row) => !row.recurring).reduce((sum, row) => sum + row.amount, 0) + legalOpeningCostPreview;
  const initialFinancialNeed = investmentTotal + oneTimeBureaucracyCostsPreview + initialInventoryNeed + workingCapitalNeed + startupLossReserve + safetyReserve;
  const availableInitialFunding = ownCapital + financingAmount + confirmedGrants + inputs.initialCash;
  const initialFundingGap = Math.max(initialFinancialNeed - availableInitialFunding, 0);
  const sixMonthMinimumCash = Math.min(...firstSixMonthCashPreview.map((row) => row.saldo));
  const liquidityStressLevel = initialFundingGap > 0 || sixMonthMinimumCash < safetyReserve * 0.45
    ? { tone: "red", label: "Rischio liquidità alto", text: "Attenzione: il progetto rischia crisi di liquidità nei primi 6 mesi." }
    : sixMonthMinimumCash < safetyReserve
      ? { tone: "yellow", label: "Liquidità da rafforzare", text: "Il progetto regge, ma il margine di sicurezza nei primi mesi è limitato." }
      : { tone: "green", label: "Liquidità iniziale adeguata", text: "La dotazione iniziale copre investimenti, scorte, capitale circolante e liquidità di sicurezza." };
  const initialNeedRows = [
    { name: "Investimenti iniziali", value: investmentTotal, note: "Uscita reale per beni, lavori e attrezzature." },
    { name: "Tasse e burocrazia", value: oneTimeBureaucracyCostsPreview, note: "Pratiche, autorizzazioni e costi apertura." },
    { name: "Scorte iniziali", value: initialInventoryNeed, note: "Materie prime, beverage, packaging e consumabili." },
    { name: "Capitale circolante", value: workingCapitalNeed, note: "Cassa operativa per coprire costi prima dell'equilibrio." },
    { name: "Perdite iniziali", value: startupLossReserve, note: "Riserva prudenziale per eventuali primi mesi negativi." },
    { name: "Liquidità di sicurezza", value: safetyReserve, note: "Riserva prudenziale per imprevisti e ritardi." },
  ];
  const deliveryChannelEnabled = revenueChannels.some((channel) => channel.key === "delivery" && channel.enabled);
  const deliveryCostRow = costRows.find((row) => row.name.toLowerCase().includes("delivery"));
  const deliveryDependencyPct = deliveryChannelEnabled && kpis.revenueAnnual && deliveryCostRow ? (deliveryCostRow.annual / kpis.revenueAnnual) * 100 : 0;
  const seasonalSeats = venueRooms.reduce((sum, room) => sum + (room.season === "Tutto l'anno" ? 0 : room.seats), 0);
  const seasonalityRiskPct = venuePeakSeats ? (seasonalSeats / venuePeakSeats) * 100 : 0;
  const leveragePct = investmentTotal ? (financingAmount / investmentTotal) * 100 : 0;
  const concentrationRevenuePct = Math.max(inputs.lunchShare, 100 - inputs.lunchShare);
  const riskFactors = [
    {
      label: "Leva finanziaria",
      value: leveragePct,
      risk: leveragePct > 70 ? 82 : leveragePct > 50 ? 58 : 28,
      detail: leveragePct > 70 ? "Debito molto pesante rispetto agli investimenti." : leveragePct > 50 ? "Debito rilevante ma ancora gestibile se la cassa regge." : "Copertura finanziaria equilibrata.",
    },
    deliveryChannelEnabled ? {
      label: "Dipendenza delivery",
      value: deliveryDependencyPct,
      risk: deliveryDependencyPct > 8 ? 70 : deliveryDependencyPct > 4 ? 45 : 20,
      detail: deliveryDependencyPct > 8 ? "Commissioni e domanda delivery incidono molto." : deliveryDependencyPct > 4 ? "Delivery presente, da monitorare nei margini." : "Dipendenza delivery contenuta.",
    } : null,
    {
      label: "Costo lavoro",
      value: kpis.laborPct,
      risk: kpis.laborPct > 38 ? 82 : kpis.laborPct > 34 ? 58 : 26,
      detail: kpis.laborPct > 38 ? "Costo lavoro oltre soglia prudenziale." : kpis.laborPct > 34 ? "Costo lavoro da ottimizzare." : "Costo lavoro coerente con il fatturato.",
    },
    {
      label: "Stagionalità",
      value: seasonalityRiskPct,
      risk: seasonalityRiskPct > 35 ? 70 : seasonalityRiskPct > 18 ? 45 : 22,
      detail: seasonalityRiskPct > 35 ? "Molti coperti dipendono da sale stagionali." : seasonalityRiskPct > 18 ? "Stagionalità presente ma gestibile." : "Capacità poco dipendente dalla stagione.",
    },
    {
      label: "Margine operativo",
      value: kpis.ebitdaPct,
      risk: kpis.ebitdaPct < 8 ? 86 : kpis.ebitdaPct < 14 ? 60 : 24,
      detail: kpis.ebitdaPct < 8 ? "Margine operativo fragile." : kpis.ebitdaPct < 14 ? "Margine sufficiente ma con poco cuscinetto." : "Margine operativo sano.",
    },
    {
      label: "Location risk",
      value: locationRiskPct,
      risk: locationRiskPct,
      detail: locationRiskPct > 40 ? "Location da validare con bacino, flussi e concorrenza." : "Location impostata come centrale o commercialmente forte.",
    },
    {
      label: "Concentrazione fatturato",
      value: concentrationRevenuePct,
      risk: concentrationRevenuePct > 78 ? 72 : concentrationRevenuePct > 65 ? 48 : 25,
      detail: concentrationRevenuePct > 78 ? "Ricavi troppo concentrati su pranzo o cena." : concentrationRevenuePct > 65 ? "Mix pranzo/cena sbilanciato." : "Mix ricavi più distribuito.",
    },
  ].filter(Boolean) as Array<{ label: string; value: number; risk: number; detail: string }>;
  const averageRisk = riskFactors.reduce((sum, factor) => sum + factor.risk, 0) / Math.max(riskFactors.length, 1);
  const launchPilotRiskScore = Math.round(Math.max(0, Math.min(100, 100 - averageRisk)));
  const riskLevel = launchPilotRiskScore >= 72
    ? { label: "Rischio basso", tone: "green", text: "Il progetto mostra una struttura equilibrata e margini di sicurezza adeguati." }
    : launchPilotRiskScore >= 48
      ? { label: "Rischio medio", tone: "yellow", text: "Il progetto è leggibile, ma alcuni fattori vanno corretti prima della decisione finale." }
      : { label: "Rischio alto", tone: "red", text: "Il progetto presenta fragilità importanti su margini, debito o struttura dei ricavi." };
  const riskChartData = riskFactors.map((factor) => ({ name: factor.label, rischio: Math.round(factor.risk) }));
  const legalFormProfiles: Record<LegalForm, { openingCost: number; taxation: string; inps: string; complexity: string; patrimonialRisk: string; note: string }> = {
    "Ditta individuale": { openingCost: 450, taxation: "IRPEF personale", inps: "Gestione commercianti", complexity: "Bassa", patrimonialRisk: "Alto", note: "Semplice e poco costosa, ma con responsabilità personale elevata." },
    "Società di persone": { openingCost: 1200, taxation: "Trasparenza soci", inps: "Soci operativi", complexity: "Media", patrimonialRisk: "Medio/alto", note: "Adatta a più soci, ma richiede patti chiari e responsabilità da valutare." },
    SRL: { openingCost: 2200, taxation: "IRES + IRAP indicative", inps: "Amministratori/soci se operativi", complexity: "Alta", patrimonialRisk: "Basso", note: "Più protezione patrimoniale, costi e gestione più strutturati." },
    SRLS: { openingCost: 900, taxation: "IRES + IRAP indicative", inps: "Amministratori/soci se operativi", complexity: "Media", patrimonialRisk: "Basso", note: "Protezione simile alla SRL con avvio più leggero, ma minore flessibilità statutaria." },
    Franchising: { openingCost: 3500, taxation: "Dipende dalla forma scelta", inps: "In base al soggetto", complexity: "Media", patrimonialRisk: "Variabile", note: "Riduce alcuni rischi di format, ma introduce fee, vincoli e dipendenza dal marchio." },
    "Altra forma": { openingCost: 1500, taxation: "Da verificare", inps: "Da verificare", complexity: "Da valutare", patrimonialRisk: "Da valutare", note: "Richiede confronto con consulente prima della scelta definitiva." },
  };
  const legalFormProfile = legalFormProfiles[legalForm];
  const oneTimeBureaucracyCosts = bureaucracyCosts.filter((row) => !row.recurring).reduce((sum, row) => sum + row.amount, 0) + legalFormProfile.openingCost;
  const recurringBureaucracyCosts = bureaucracyCosts.filter((row) => row.recurring).reduce((sum, row) => sum + row.amount, 0);
  const completedAuthorizations = authorizations.filter((item) => item.status === "completato").length;
  const checklistProgress = Math.round((completedAuthorizations / Math.max(authorizations.length, 1)) * 100);
  const missingMandatoryAuthorizations = authorizations.filter((item) => item.mandatory && item.status === "mancante");
  const openingDaysEstimate = openingTimeline.reduce((sum, item) => sum + (item.status === "completato" ? 0 : item.days), 0);
  const municipalPermitRisk = authorizations.some((item) => item.name.toLowerCase().includes("dehors") && item.status !== "completato") ? 16 : 0;
  const buildingPermitRisk = authorizations.some((item) => item.name.toLowerCase().includes("incendi") && item.status === "mancante") ? 12 : 0;
  const praticheRisk = Math.min(100, missingMandatoryAuthorizations.length * 14 + authorizations.filter((item) => item.status === "mancante").length * 5 + (openingDaysEstimate > 45 ? 14 : 0) + municipalPermitRisk + buildingPermitRisk);
  const praticheScore = Math.max(0, 100 - praticheRisk);
  const praticheLevel = praticheScore >= 75
    ? { label: "Rischio burocratico basso", tone: "green", text: "La checklist è ben presidiata e le criticità principali sono sotto controllo." }
    : praticheScore >= 50
      ? { label: "Rischio burocratico medio", tone: "yellow", text: "Alcuni documenti o autorizzazioni vanno completati prima dell'apertura." }
      : { label: "Rischio burocratico alto", tone: "red", text: "Mancano autorizzazioni importanti o i tempi potrebbero rallentare l'apertura." };
  const grossProfitBeforeTax = Math.max(kpis.ebitdaAnnual - amortizationAnnual - annualInterest, 0);
  const taxRegimeRows = (["Forfettario", "Ordinario", "SRL"] as TaxRegime[]).map((regime) => {
    const taxRate = regime === "Forfettario" ? 0.15 : regime === "Ordinario" ? 0.32 : 0.28;
    const contributions = regime === "SRL" ? 5200 : 4800;
    const taxes = grossProfitBeforeTax * taxRate;
    return { regime, taxes, contributions, netProfit: grossProfitBeforeTax - taxes - contributions };
  });
  const selectedTaxRegime = taxRegimeRows.find((row) => row.regime === taxRegime) ?? taxRegimeRows[0];
  const praticheAlerts = [
    missingMandatoryAuthorizations.length > 0
      ? { tone: "red", text: "Mancano autorizzazioni obbligatorie: " + missingMandatoryAuthorizations.map((item) => item.name).join(", ") + "." }
      : { tone: "green", text: "Le autorizzazioni obbligatorie risultano presidiate." },
    oneTimeBureaucracyCosts < 2500
      ? { tone: "yellow", text: "I costi burocratici iniziali sembrano prudentemente bassi: verifica preventivi reali." }
      : { tone: "green", text: "I costi iniziali includono un margine adeguato per pratiche e consulenze." },
    authorizations.some((item) => item.name.toLowerCase().includes("dehors") && item.status !== "completato")
      ? { tone: "yellow", text: "Attenzione ai tempi autorizzativi del dehors e del suolo pubblico." }
      : { tone: "green", text: "Nessuna criticità evidente sui permessi comunali accessori." },
  ];
  const legislativeReferences = [
    { area: "SUAP e pratiche telematiche", reference: "D.P.R. 7 settembre 2010, n. 160", note: "Sportello Unico per le Attività Produttive e procedimento telematico.", href: "https://www.normattiva.it/eli/id/2010/09/30/010G0183/CONSOLIDATED/20160713" },
    { area: "SCIA e regimi amministrativi", reference: "D.Lgs. 25 novembre 2016, n. 222", note: "Individua regimi amministrativi, SCIA, silenzio assenso e autorizzazioni per attività private.", href: "https://www.normattiva.it/" },
    { area: "Igiene alimentare / HACCP", reference: "Reg. CE 852/2004", note: "Norme generali sull'igiene dei prodotti alimentari e principi HACCP.", href: "https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=celex%3A32004R0852" },
    { area: "Sicurezza lavoro", reference: "D.Lgs. 9 aprile 2008, n. 81", note: "Testo Unico salute e sicurezza sul lavoro, DVR e formazione.", href: "https://www.lavoro.gov.it/en/node/5658" },
    { area: "Prevenzione incendi", reference: "D.P.R. 1 agosto 2011, n. 151", note: "Attività soggette ai controlli dei Vigili del Fuoco e prevenzione incendi.", href: "https://www.normattiva.it/atto/caricaDettaglioAtto?atto.codiceRedazionale=011G0193&atto.dataPubblicazioneGazzetta=2011-09-22" },
    { area: "Musica e diritto d'autore", reference: "Legge 22 aprile 1941, n. 633", note: "Diritto d'autore e utilizzo pubblico di opere musicali.", href: "https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Alegge%3A1941-04-22%3B633=" },
    { area: "TARI", reference: "Legge 27 dicembre 2013, n. 147", note: "Istituzione e disciplina della tassa rifiuti, con regolamenti e tariffe comunali.", href: "https://www.lavoro.gov.it/documenti-e-norme/normative/Documents/2013/Legge_27_dicembre_2013_n147.pdf" },
    { area: "Suolo pubblico / dehors", reference: "Legge 27 dicembre 2019, n. 160", note: "Canone unico patrimoniale; autorizzazioni e importi dipendono dal Comune.", href: "https://www.normattiva.it/" },
  ];

  const canCustomizeReportBranding = userProfileMode === "consulente" || userProfileMode === "master" || userEmail.toLowerCase().includes("studio") || userEmail.toLowerCase().includes("consul");
  const defaultReportBranding = buildDefaultReportBranding(userProfileMode, venueProfile);
  const effectiveReportBranding: EffectiveReportBranding = {
    ...defaultReportBranding,
    ...(canCustomizeReportBranding
      ? {
          header: reportBranding.header || defaultReportBranding.header,
          subHeader: reportBranding.subHeader || defaultReportBranding.subHeader,
          logoUrl: reportBranding.logoUrl || defaultReportBranding.logoUrl,
          editable: true
        }
      : {})
  };
  const revenueChannelRows = revenueChannels.map((channel) => {
    const averageRevenueEffective = channel.key === "ordinary" ? inputs.averageTicket : channel.averageRevenue;
    const monthlyRevenue = channel.key === "ordinary" ? kpis.revenueMonthly : channel.monthlyOrders * averageRevenueEffective;
    const conservativeCosts = channel.key === "ordinary"
      ? monthlyRevenue * ((inputs.foodCostPct + inputs.beverageCostPct) / 100)
      : channel.monthlyOrders * (channel.deliveryCostPerOrder + channel.otherCostPerOrder);
    const netRevenueAfterCosts = Math.max(averageRevenueEffective - channel.deliveryCostPerOrder - channel.otherCostPerOrder, 0);
    const contribution = channel.key === "ordinary"
      ? Math.max(averageRevenueEffective * (1 - (inputs.foodCostPct + inputs.beverageCostPct) / 100), 1)
      : Math.max(channel.minMarginPerPerson, netRevenueAfterCosts, 1);
    const monthlyMargin = channel.key === "ordinary" ? monthlyRevenue - conservativeCosts : channel.monthlyOrders * contribution;
    const breakEvenUnits = contribution ? (effectiveInputs.fixedCostsMonthly + effectiveInputs.laborCostMonthly) / contribution : 0;
    return { ...channel, averageRevenueEffective, monthlyRevenue, conservativeCosts, netRevenueAfterCosts, contribution, monthlyMargin, breakEvenUnits };
  });
  const selectedRevenueChannelRows = revenueChannelRows.filter((channel) => channel.enabled);
  const selectedChannelMonthlyRevenue = selectedRevenueChannelRows.reduce((sum, channel) => sum + channel.monthlyRevenue, 0);
  const selectedChannelMonthlyMargin = selectedRevenueChannelRows.reduce((sum, channel) => sum + channel.monthlyMargin, 0);
  const blendedContributionPerUnit = selectedRevenueChannelRows.length
    ? selectedRevenueChannelRows.reduce((sum, channel) => sum + channel.contribution, 0) / selectedRevenueChannelRows.length
    : Math.max(inputs.averageTicket * (1 - (inputs.foodCostPct + inputs.beverageCostPct) / 100), 1);
  const combinedChannelBreakEvenUnits = blendedContributionPerUnit ? (effectiveInputs.fixedCostsMonthly + effectiveInputs.laborCostMonthly) / blendedContributionPerUnit : 0;
  const combinedChannelBreakEvenRevenue = selectedRevenueChannelRows.length
    ? selectedRevenueChannelRows.reduce((sum, channel) => sum + (channel.breakEvenUnits * channel.averageRevenueEffective), 0)
    : kpis.breakEvenRevenue;

  const scenarioRows = buildScenarioRows(effectiveInputs);
  const status = statusCopy[kpis.sustainability];
  const ebitMonthly = kpis.ebitdaMonthly - amortizationMonthly;
  const ebitAnnual = ebitMonthly * 12;
  const mainServiceLabel = serviceBandDefinitions.find((band) => band.key === mainServiceBand)?.label ?? "Pasto principale";
  const mainServiceRevenue = kpis.revenueMonthly * (inputs.lunchShare / 100);
  const otherServicesRevenue = kpis.revenueMonthly - mainServiceRevenue;
  const mainServiceCovers = effectiveInputs.coversPerDay * (inputs.lunchShare / 100);
  const otherServicesCovers = effectiveInputs.coversPerDay - mainServiceCovers;
  const activeServiceBands = serviceBandDefinitions.filter((band) => venueProfile[band.key]);
  const activeServiceCount = Math.max(activeServiceBands.length, 1);
  const contributionRate = 1 - (inputs.foodCostPct + inputs.beverageCostPct) / 100;
  const contributionPerReceipt = inputs.averageTicket * contributionRate;
  const breakEvenCoversMonthly = kpis.breakEvenCovers;
  const breakEvenCustomersDaily = inputs.openingDays ? breakEvenCoversMonthly / inputs.openingDays : 0;
  const breakEvenServiceRows = activeServiceBands.map((band) => ({ label: band.label, value: breakEvenCustomersDaily / activeServiceCount, note: "Clienti/giorno da generare nella fascia " + band.label.toLowerCase() + "." }));
  const deliveryCommissionRate = Math.max(deliveryDependencyPct, 4.5) / 100;
  const deliveryAverageTicket = inputs.averageTicket * 0.86;
  const deliveryContribution = deliveryAverageTicket * Math.max(contributionRate - deliveryCommissionRate, 0.08);
  const breakEvenDeliveryOrdersMonthly = deliveryContribution ? (effectiveInputs.fixedCostsMonthly + effectiveInputs.laborCostMonthly) / deliveryContribution : 0;
  const summerSeats = venueRooms.filter((room) => room.season === "Estate").reduce((sum, room) => sum + room.seats, 0);
  const winterSeats = venueRooms.filter((room) => room.season !== "Estate").reduce((sum, room) => sum + room.seats, 0);
  const summerCapacityDaily = Math.max((winterSeats + summerSeats) * 2, 1);
  const winterCapacityDaily = Math.max(winterSeats * 2, 1);
  const summerBreakEvenOccupancy = (breakEvenCustomersDaily / summerCapacityDaily) * 100;
  const winterBreakEvenOccupancy = (breakEvenCustomersDaily / winterCapacityDaily) * 100;
  const smartBepRows = [
    { label: "Coperti mese", value: Math.ceil(breakEvenCoversMonthly).toLocaleString("it-IT"), note: "Volume minimo mensile per coprire costi fissi e lavoro." },
    { label: "Clienti/giorno", value: Math.ceil(breakEvenCustomersDaily).toLocaleString("it-IT"), note: "Soglia giornaliera media con i giorni di apertura impostati." },
    { label: "Spesa media per persona", value: euro.format(inputs.averageTicket), note: "Valore IVA esclusa usato per calcolare ricavi e pareggio." },
    ...breakEvenServiceRows.map((row) => ({ label: row.label, value: Math.ceil(row.value).toLocaleString("it-IT"), note: row.note })),
    ...(deliveryChannelEnabled ? [{ label: "Delivery", value: Math.ceil(breakEvenDeliveryOrdersMonthly).toLocaleString("it-IT"), note: "Ordini/mese se il pareggio fosse coperto dal delivery." }] : []),
    { label: "BEP complessivo ricavi", value: Math.ceil(combinedChannelBreakEvenUnits).toLocaleString("it-IT"), note: "Unità/mese usando solo le tipologie ricavo selezionate." },
    ...selectedRevenueChannelRows.map((channel) => ({ label: channel.label, value: Math.ceil(channel.breakEvenUnits).toLocaleString("it-IT"), note: "Pareggio singolo del canale con margine prudenziale " + euro.format(channel.contribution) + "." })),
  ];
  const smartBepChartData = [
    { name: "Clienti/giorno", value: Math.ceil(breakEvenCustomersDaily) },
    ...breakEvenServiceRows.map((row) => ({ name: row.label, value: Math.ceil(row.value) })),
    ...(deliveryChannelEnabled ? [{ name: "Delivery mese", value: Math.ceil(breakEvenDeliveryOrdersMonthly) }] : []),
    ...selectedRevenueChannelRows.map((channel) => ({ name: channel.label, value: Math.ceil(channel.breakEvenUnits) })),
  ];
  const breakEvenCostChartData = [
    { name: "Costi fissi", value: calculatedFixedCostsMonthly },
    { name: "Costo lavoro", value: calculatedLaborCostMonthly },
    { name: "Margine richiesto", value: breakEvenCoversMonthly * contributionPerReceipt },
  ];
  const breakEvenSeasonChartData = [
    { name: "Estate", value: Math.max(0, Math.round(summerBreakEvenOccupancy)) },
    { name: "Inverno", value: Math.max(0, Math.round(winterBreakEvenOccupancy)) },
  ];
  const breakEvenVolumeChartData = [0.5, 0.75, 1, 1.25, 1.5].map((multiplier) => {
    const covers = breakEvenCoversMonthly * multiplier;
    return {
      name: Math.round(multiplier * 100) + "% BEP",
      Ricavi: covers * inputs.averageTicket,
      Margine: covers * contributionPerReceipt - (calculatedFixedCostsMonthly + calculatedLaborCostMonthly),
    };
  });
  const serviceHoursPerDay = Math.max(activeServiceBands.reduce((sum, band) => sum + band.hours, 0), 1);
  const revenuePerAvailableSeatHour = venuePeakSeats ? kpis.revenueMonthly / Math.max(venuePeakSeats * inputs.openingDays * serviceHoursPerDay, 1) : 0;
  const tableRotation = venuePeakSeats ? effectiveInputs.coversPerDay / Math.max(venuePeakSeats, 1) : 0;
  const estimatedStaffCount = Math.max(Math.round(effectiveInputs.laborCostMonthly / 2600), 1);
  const staffProductivity = kpis.revenueMonthly / estimatedStaffCount;
  const primeCostPct = inputs.foodCostPct + kpis.laborPct;
  const operatingMarginPct = kpis.revenueMonthly ? ((kpis.ebitdaMonthly - amortizationMonthly) / kpis.revenueMonthly) * 100 : 0;
  const restaurantKpiRows = [
    { label: "Costo materie prime", value: inputs.foodCostPct.toFixed(1) + "%", benchmark: inputs.foodCostPct <= 28 ? "ottimo" : inputs.foodCostPct <= 32 ? "medio" : "scarso", note: "Incidenza materie prime sul fatturato." },
    { label: "Costo personale", value: kpis.laborPct.toFixed(1) + "%", benchmark: kpis.laborPct <= 30 ? "ottimo" : kpis.laborPct <= 35 ? "medio" : "scarso", note: "Costo lavoro sul fatturato." },
    { label: "Materie + personale", value: primeCostPct.toFixed(1) + "%", benchmark: primeCostPct <= 58 ? "ottimo" : primeCostPct <= 65 ? "medio" : "scarso", note: "Somma tra materie prime e personale." },
    { label: "Ricavo posto/ora", value: euro.format(revenuePerAvailableSeatHour), benchmark: revenuePerAvailableSeatHour >= 18 ? "ottimo" : revenuePerAvailableSeatHour >= 11 ? "medio" : "scarso", note: "Quanto rende ogni posto per ora di servizio." },
    { label: "Spesa media per persona", value: euro.format(inputs.averageTicket), benchmark: inputs.averageTicket >= 42 ? "ottimo" : inputs.averageTicket >= 28 ? "medio" : "scarso", note: "Valore medio per pasto IVA esclusa." },
    { label: "Margine operativo", value: operatingMarginPct.toFixed(1) + "%", benchmark: operatingMarginPct >= 12 ? "ottimo" : operatingMarginPct >= 6 ? "medio" : "scarso", note: "Margine dopo ammortamenti, prima della finanza." },
    { label: "Margine lordo", value: kpis.ebitdaPct.toFixed(1) + "%", benchmark: kpis.ebitdaPct >= 16 ? "ottimo" : kpis.ebitdaPct >= 9 ? "medio" : "scarso", note: "Margine prima di ammortamenti, interessi e tasse." },
    { label: "Rotazione tavoli", value: tableRotation.toFixed(1) + "x", benchmark: tableRotation >= 1.8 ? "ottimo" : tableRotation >= 1.1 ? "medio" : "scarso", note: "Coperti giorno rispetto ai posti disponibili." },
    { label: "Produttività personale", value: euro.format(staffProductivity), benchmark: staffProductivity >= 15000 ? "ottimo" : staffProductivity >= 9500 ? "medio" : "scarso", note: "Fatturato mensile stimato per addetto." },
  ];
  const personnelRows = workflowCosts.filter((row) => row.stepIndex === 3);
  const activePersonnelRows = personnelRows.filter((row) => row.enabled);
  const estimatedPersonnelCount = Math.max(activePersonnelRows.length, estimatedStaffCount, 1);
  const personnelMonthlyCost = activePersonnelRows.reduce((sum, row) => sum + row.amount, 0) || effectiveInputs.laborCostMonthly;
  const personnelAnnualCost = personnelMonthlyCost * 12;
  const personnelHourlyCost = personnelMonthlyCost / Math.max(estimatedPersonnelCount * 172, 1);
  const personnelCostPerCover = personnelMonthlyCost / Math.max(effectiveInputs.coversPerDay * Math.max(effectiveInputs.openingDays, 1), 1);
  const personnelContributionMarginRatio = Math.max(1 - (inputs.foodCostPct + inputs.beverageCostPct) / 100, 0.08);
  const personnelBreakEvenRevenue = personnelMonthlyCost / personnelContributionMarginRatio;
  const personnelProductivityRows = [
    { name: "Fatturato/addetto", value: staffProductivity },
    { name: "Costo/addetto", value: personnelMonthlyCost / estimatedPersonnelCount },
    { name: "Costo/coperto", value: personnelCostPerCover },
  ];
  const personnelServiceRows = [
    { name: "Pranzo", people: Math.max(Math.round(estimatedPersonnelCount * 0.45), 1), revenue: kpis.revenueMonthly * 0.38, hours: 4 },
    { name: "Cena", people: Math.max(Math.round(estimatedPersonnelCount * 0.7), 1), revenue: kpis.revenueMonthly * 0.52, hours: 5 },
    ...(deliveryChannelEnabled ? [{ name: "Delivery", people: Math.max(Math.round(estimatedPersonnelCount * 0.16), 1), revenue: revenueChannelRows.find((item) => item.key === "delivery")?.monthlyRevenue ?? kpis.revenueMonthly * 0.08, hours: 3 }] : []),
  ].map((row) => {
    const monthlyCost = row.people * row.hours * personnelHourlyCost * Math.max(effectiveInputs.openingDays, 1);
    return { ...row, monthlyCost, laborPct: row.revenue > 0 ? (monthlyCost / row.revenue) * 100 : 0 };
  });
  const personnelScenarioRows = [
    { name: "5 giorni", revenue: kpis.revenueMonthly * 0.86, cost: personnelMonthlyCost * 0.88 },
    { name: "7 giorni", revenue: kpis.revenueMonthly * 1.12, cost: personnelMonthlyCost * 1.18 },
    { name: "Brigata ridotta", revenue: kpis.revenueMonthly * 0.94, cost: personnelMonthlyCost * 0.86 },
    { name: "Doppio turno", revenue: kpis.revenueMonthly * 1.2, cost: personnelMonthlyCost * 1.14 },
  ].map((row) => ({ ...row, margin: row.revenue - row.cost }));
  const personnelAlerts = [
    kpis.laborPct > 35 ? "Il costo lavoro supera una soglia prudente: prima di aumentare ricavi attesi, verifica turni, coperti reali e ore improduttive." : "Il costo lavoro appare coerente con il fatturato previsto, ma va monitorato per fascia di servizio.",
    personnelServiceRows.some((row) => row.laborPct > 32) ? "Una fascia di servizio assorbe troppo personale rispetto ai ricavi stimati. Valuta organico ridotto o spesa media piu alta." : "Le fasce di servizio risultano equilibrate rispetto ai ricavi stimati.",
    (personnelScenarioRows.find((row) => row.name === "Brigata ridotta")?.margin ?? 0) > personnelScenarioRows[0].margin ? "La brigata ridotta migliora il margine, ma va verificata con qualita del servizio e carico operativo." : "Gli scenari mostrano quanto il margine dipenda da apertura e copertura dei turni.",
  ];
  const aiAlerts = [
    inputs.foodCostPct > 35
      ? { id: "food", tone: "red" as AiAlertTone, priority: "Alta" as AiPriority, title: "Costo materie prime alto", metric: inputs.foodCostPct.toFixed(1) + "%", text: "Il costo materie prime previsto è elevato. Questo può ridurre molto il margine del ristorante.", explain: "Significa che per ogni 100 euro incassati troppi soldi vengono usati per comprare ingredienti e bevande. Se resta alto, il ristorante può vendere molto ma guadagnare poco.", suggestions: ["rivedere prezzi di vendita", "ridurre sprechi", "migliorare gli acquisti", "semplificare il menu", "controllare grammature"] }
      : inputs.foodCostPct > 32
        ? { id: "food", tone: "yellow" as AiAlertTone, priority: "Media" as AiPriority, title: "Costo materie prime da controllare", metric: inputs.foodCostPct.toFixed(1) + "%", text: "Il costo materie prime è sopra una soglia prudente. Conviene verificare menu e acquisti.", explain: "Il valore non è ancora critico, ma lascia meno spazio per pagare personale, affitto, utenze e rate.", suggestions: ["verificare ricette", "aggiornare listino", "negoziare fornitori", "controllare porzioni"] }
        : { id: "food", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Costo materie prime sotto controllo", metric: inputs.foodCostPct.toFixed(1) + "%", text: "Il costo materie prime è in una zona sostenibile.", explain: "Il margine sui prodotti sembra sufficiente, a condizione di controllare scarti, porzioni e acquisti.", suggestions: ["mantenere schede ricetta", "controllare scarti", "monitorare fornitori"] },
    rentSustainabilityPct > 12
      ? { id: "rent", tone: rentSustainabilityPct > 16 ? "red" as AiAlertTone : "yellow" as AiAlertTone, priority: rentSustainabilityPct > 16 ? "Alta" as AiPriority : "Media" as AiPriority, title: "Affitto pesante", metric: rentSustainabilityPct.toFixed(1) + "%", text: "L'affitto pesa troppo sul fatturato previsto. Questo può rendere difficile raggiungere l'utile.", explain: "Una parte importante degli incassi uscirebbe ogni mese prima ancora di pagare personale, materie prime, utenze e rate.", suggestions: ["rinegoziare il canone", "aumentare il fatturato minimo previsto", "ridurre altre spese fisse", "valutare una location alternativa"] }
      : { id: "rent", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Affitto sostenibile", metric: rentSustainabilityPct.toFixed(1) + "%", text: "Il peso stimato dell'affitto è coerente con il fatturato previsto.", explain: "Il canone non sembra assorbire troppo margine rispetto ai ricavi simulati.", suggestions: ["mantenere controllo su utenze", "validare il contratto", "verificare costi condominiali"] },
    kpis.laborPct > 35
      ? { id: "labor", tone: "red" as AiAlertTone, priority: "Alta" as AiPriority, title: "Costo personale alto", metric: kpis.laborPct.toFixed(1) + "%", text: "Il costo del personale è alto rispetto al fatturato previsto.", explain: "Troppi incassi vengono assorbiti dagli stipendi. Se i volumi non crescono, il margine operativo diventa fragile.", suggestions: ["rivedere turni", "migliorare produttività", "ridurre ore improduttive", "aumentare spesa media per persona", "aumentare coperti serviti"] }
      : kpis.laborPct > 30
        ? { id: "labor", tone: "yellow" as AiAlertTone, priority: "Media" as AiPriority, title: "Costo personale da monitorare", metric: kpis.laborPct.toFixed(1) + "%", text: "Il costo del personale è vicino alla soglia da controllare.", explain: "La struttura può reggere, ma serve attenzione ai turni e alla produttività nei servizi meno pieni.", suggestions: ["ottimizzare turni", "misurare coperti per addetto", "spingere fasce orarie forti"] }
        : { id: "labor", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Personale proporzionato", metric: kpis.laborPct.toFixed(1) + "%", text: "Il costo del personale appare coerente con il fatturato previsto.", explain: "La squadra sembra dimensionata in modo sostenibile rispetto ai ricavi simulati.", suggestions: ["mantenere standard servizio", "monitorare extra e stagionali", "controllare produttività"] },
    breakEvenCustomersDaily > Math.max(effectiveInputs.coversPerDay * 0.82, venuePeakSeats * 1.65)
      ? { id: "bep", tone: "red" as AiAlertTone, priority: "Alta" as AiPriority, title: "Pareggio troppo impegnativo", metric: Math.ceil(breakEvenCustomersDaily) + " clienti/giorno", text: "Il break even richiede troppi coperti. Il locale potrebbe dover lavorare sempre ad alti volumi per non perdere denaro.", explain: "Per stare in pari servono molti clienti ogni giorno. Se anche pochi giorni vanno sotto ritmo, il risultato può diventare negativo.", suggestions: ["aumentare spesa media per persona", "ridurre costi fissi", "ridurre costo personale", "migliorare margine prodotti", "ridurre investimento iniziale"] }
      : { id: "bep", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Punto di pareggio leggibile", metric: Math.ceil(breakEvenCustomersDaily) + " clienti/giorno", text: "Il numero di clienti necessari al pareggio sembra raggiungibile con le ipotesi inserite.", explain: "La soglia giornaliera non appare sproporzionata rispetto a coperti, giorni di apertura e spesa media.", suggestions: ["validare con dati zona", "monitorare occupazione", "tenere una riserva di cassa"] },
    totalMonthlyDebtService > kpis.ebitdaMonthly * 0.45 || (minDscrRow?.dscr ?? kpis.dscr) < 1.2
      ? { id: "debt", tone: (minDscrRow?.dscr ?? kpis.dscr) < 1 ? "red" as AiAlertTone : "yellow" as AiAlertTone, priority: "Alta" as AiPriority, title: "Finanziamento impegnativo", metric: (minDscrRow?.dscr ?? kpis.dscr).toFixed(2), text: "La struttura finanziaria è aggressiva. Le rate potrebbero creare problemi di liquidità nei primi mesi.", explain: "Il progetto genera cassa, ma una parte rilevante viene assorbita dalle rate. Se i ricavi partono lentamente, la liquidità può stringersi.", suggestions: ["aumentare capitale proprio", "allungare durata finanziamento", "ridurre investimento iniziale", "rinviare spese non essenziali", "creare riserva liquidità"] }
      : { id: "debt", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Debito sostenibile", metric: (minDscrRow?.dscr ?? kpis.dscr).toFixed(2), text: "Le rate sembrano sostenibili rispetto alla cassa operativa prevista.", explain: "Il margine operativo copre il servizio del debito con un livello di sicurezza accettabile.", suggestions: ["mantenere liquidità di sicurezza", "monitorare incassi", "verificare TAN e TAEG reali"] },
    liquidityStressLevel.tone === "red"
      ? { id: "cash", tone: "red" as AiAlertTone, priority: "Alta" as AiPriority, title: "Liquidità iniziale fragile", metric: euro.format(initialFundingGap), text: "Il progetto rischia tensioni di cassa nei primi mesi.", explain: "Oltre agli investimenti servono scorte, capitale circolante e una riserva operativa. Se manca liquidità, anche un progetto redditizio può andare in difficoltà.", suggestions: ["aumentare cassa iniziale", "ridurre acquisti non essenziali", "ottenere fido o liquidità di sicurezza", "posticipare alcuni investimenti"] }
      : { id: "cash", tone: liquidityStressLevel.tone as AiAlertTone, priority: liquidityStressLevel.tone === "yellow" ? "Media" as AiPriority : "Bassa" as AiPriority, title: liquidityStressLevel.label, metric: euro.format(sixMonthMinimumCash), text: liquidityStressLevel.text, explain: "La cassa iniziale deve coprire l'avvio, non solo gli acquisti. Serve margine per ritardi, scorte e mesi deboli.", suggestions: ["tenere una riserva", "monitorare primi 6 mesi", "verificare incasso contributi"] },
  ];

  const aiRiskPenalty = aiAlerts.reduce((sum, alert) => sum + (alert.tone === "red" ? 16 : alert.tone === "yellow" ? 8 : 0), 0);
  const aiConsultantScore = Math.max(0, Math.min(100, Math.round(92 - aiRiskPenalty + Math.min(kpis.ebitdaPct, 18) * 0.5 + Math.min((minDscrRow?.dscr ?? kpis.dscr), 2) * 2)));
  const aiScoreLevel = aiConsultantScore >= 80
    ? { label: "Progetto solido", tone: "green" as AiAlertTone, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
    : aiConsultantScore >= 60
      ? { label: "Interessante ma da controllare", tone: "yellow" as AiAlertTone, className: "bg-amber-50 text-amber-700 ring-amber-200" }
      : aiConsultantScore >= 40
        ? { label: "Progetto rischioso", tone: "red" as AiAlertTone, className: "bg-rose-50 text-rose-700 ring-rose-200" }
        : { label: "Progetto molto fragile", tone: "red" as AiAlertTone, className: "bg-rose-50 text-rose-700 ring-rose-200" };
  const aiWeakPoints = aiAlerts.filter((alert) => alert.tone !== "green");
  const aiStrengths = aiAlerts.filter((alert) => alert.tone === "green");
  const aiExecutiveSummary = aiWeakPoints.length
    ? "Il progetto presenta buone potenzialità, ma richiede attenzione su " + aiWeakPoints.slice(0, 3).map((alert) => alert.title.toLowerCase()).join(", ") + ". Prima di procedere conviene correggere questi valori e verificare che cassa, margine e pareggio restino sostenibili."
    : "Il progetto appare equilibrato nei principali indicatori. I costi sono leggibili, la cassa risulta presidiata e il punto di pareggio sembra raggiungibile con le ipotesi inserite.";
  const aiPriorities = (["Alta", "Media", "Bassa"] as AiPriority[]).map((priority) => ({
    priority,
    items: aiAlerts
      .filter((alert) => alert.priority === priority)
      .flatMap((alert) => alert.suggestions.slice(0, priority === "Alta" ? 2 : 1))
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 5),
  }));
  const aiScoreData = [
    { name: "Score", value: aiConsultantScore },
    { name: "Gap", value: 100 - aiConsultantScore },
  ];

  const cashFlowData = Array.from({ length: 12 }, (_, index) => {
    const seasonality = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.09;
    const operating = kpis.ebitdaMonthly * seasonality;
    return {
      month: `${index + 1}`,
      saldo: inputs.initialCash + (operating - loanPayment) * (index + 1),
      operativo: operating,
    };
  });
  const rentBaseMonthly = effectiveInputs.fixedCostsMonthly * 0.35;
  const energyBaseMonthly = effectiveInputs.fixedCostsMonthly * 0.16;
  const otherFixedBaseMonthly = Math.max(effectiveInputs.fixedCostsMonthly - rentBaseMonthly - energyBaseMonthly, 0);
  const updateEsgProfile = (key: keyof EsgProfile, value: number) => {
    setEsgProfile((current) => ({ ...current, [key]: value }));
  };
  const esgEnergyCostMonthly = energyBaseMonthly + esgProfile.gasCostMonthly;
  const esgEnergyCostPct = kpis.revenueMonthly ? (esgEnergyCostMonthly / kpis.revenueMonthly) * 100 : 0;
  const esgWaterPerCover = effectiveInputs.coversPerDay && inputs.openingDays ? esgProfile.waterM3Monthly / Math.max(effectiveInputs.coversPerDay * inputs.openingDays, 1) : 0;
  const esgEstimatedEmissions = Math.round(esgProfile.electricityKwhMonthly * 0.22 + esgProfile.gasCostMonthly * 0.9 + esgProfile.waterM3Monthly * 1.4);
  const esgPillarRows = [
    { label: "Consumi", value: Math.max(0, 100 - esgEnergyCostPct * 7 - Math.max(esgWaterPerCover - 0.08, 0) * 180), note: "Energia, gas, acqua e attrezzature." },
    { label: "Sprechi", value: Math.max(0, 100 - esgProfile.foodWastePct * 7 + esgProfile.recyclingPct * 0.18), note: "Scarti, invenduto e raccolta differenziata." },
    { label: "Packaging", value: Math.max(0, esgProfile.sustainablePackagingPct * 0.75 + (100 - esgProfile.plasticUsePct) * 0.25), note: "Materiali riciclabili, compostabili e plastica." },
    { label: "Filiera", value: esgProfile.localSuppliersPct * 0.55 + esgProfile.seasonalProductsPct * 0.45, note: "Fornitori locali, km zero e stagionalità." },
    { label: "Persone", value: esgProfile.staffWellbeingScore, note: "Benessere personale e pratiche sociali." },
  ].map((row) => ({ ...row, value: Math.round(Math.max(0, Math.min(100, row.value))) }));
  const esgScore = Math.round(esgPillarRows.reduce((sum, row) => sum + row.value, 0) / Math.max(esgPillarRows.length, 1));
  const esgLevel = esgScore >= 80
    ? { label: "Sostenibilità elevata", tone: "green" as AiAlertTone, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
    : esgScore >= 60
      ? { label: "Buon livello", tone: "green" as AiAlertTone, className: "bg-teal-50 text-teal-700 ring-teal-200" }
      : esgScore >= 40
        ? { label: "Sostenibilità migliorabile", tone: "yellow" as AiAlertTone, className: "bg-amber-50 text-amber-700 ring-amber-200" }
        : { label: "Livello insufficiente", tone: "red" as AiAlertTone, className: "bg-rose-50 text-rose-700 ring-rose-200" };
  const esgAlerts = [
    esgEnergyCostPct > 6
      ? { id: "energy", tone: "red" as AiAlertTone, priority: "Alta" as AiPriority, title: "Consumo energetico elevato", metric: esgEnergyCostPct.toFixed(1) + "%", text: "Il consumo energetico stimato appare elevato rispetto al fatturato del locale.", explain: "Energia e gas assorbono una quota importante degli incassi. Ridurli migliora sostenibilità e margine.", suggestions: ["utilizzare illuminazione LED", "sostituire attrezzature obsolete", "ottimizzare climatizzazione", "usare attrezzature efficienti"] }
      : { id: "energy", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Consumi sotto controllo", metric: esgEnergyCostPct.toFixed(1) + "%", text: "Il peso stimato di energia e gas è leggibile rispetto al fatturato.", explain: "I consumi non sembrano eccessivi, ma restano una leva importante per ridurre costi.", suggestions: ["monitorare bollette", "programmare manutenzione", "controllare picchi di consumo"] },
    esgProfile.foodWastePct > 6
      ? { id: "waste", tone: "yellow" as AiAlertTone, priority: esgProfile.foodWastePct > 9 ? "Alta" as AiPriority : "Media" as AiPriority, title: "Spreco alimentare importante", metric: esgProfile.foodWastePct.toFixed(1) + "%", text: "La quantità di spreco alimentare potrebbe incidere negativamente sia sui costi che sulla sostenibilità.", explain: "Ogni spreco è doppio danno: hai già pagato il prodotto e perdi anche margine sul piatto non venduto.", suggestions: ["migliorare gestione acquisti", "ridurre dimensione menu", "controllare grammature", "migliorare rotazione magazzino"] }
      : { id: "waste", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Sprechi contenuti", metric: esgProfile.foodWastePct.toFixed(1) + "%", text: "Il livello di spreco alimentare appare contenuto.", explain: "La gestione di acquisti e magazzino sembra già abbastanza ordinata.", suggestions: ["mantenere inventario", "tracciare scarti", "recuperare prodotti inutilizzati"] },
    esgProfile.sustainablePackagingPct < 60 || esgProfile.plasticUsePct > 35
      ? { id: "packaging", tone: "yellow" as AiAlertTone, priority: "Media" as AiPriority, title: "Packaging migliorabile", metric: esgProfile.sustainablePackagingPct + "% green", text: "L'utilizzo di packaging sostenibile è limitato e potrebbe essere migliorato.", explain: "Packaging e plastica incidono su costi, percezione del cliente e coerenza del brand.", suggestions: ["usare materiali compostabili", "ridurre plastica monouso", "usare packaging riciclabile", "comunicare meglio le scelte green"] }
      : { id: "packaging", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Packaging coerente", metric: esgProfile.sustainablePackagingPct + "% green", text: "Il packaging sostenibile è ben presente nel progetto.", explain: "Questa scelta può migliorare percezione del brand e fidelizzazione.", suggestions: ["valorizzare sui social", "indicare sul menu", "monitorare costo unitario"] },
    esgProfile.localSuppliersPct < 45
      ? { id: "supply", tone: "yellow" as AiAlertTone, priority: "Media" as AiPriority, title: "Fornitori locali da rafforzare", metric: esgProfile.localSuppliersPct + "%", text: "L'utilizzo di fornitori locali potrebbe migliorare sostenibilità e immagine del locale.", explain: "Più filiera locale significa racconto più forte, minori trasporti e maggiore legame con il territorio.", suggestions: ["cercare fornitori locali", "valorizzare km zero", "usare prodotti stagionali", "raccontare la filiera nel menu"] }
      : { id: "supply", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Filiera locale interessante", metric: esgProfile.localSuppliersPct + "%", text: "La quota di fornitori locali è utile per sostenibilità e marketing territoriale.", explain: "Il locale può comunicare meglio territorio, stagionalità e qualità percepita.", suggestions: ["creare storytelling", "evidenziare fornitori", "costruire menu stagionale"] },
    esgProfile.staffWellbeingScore < 55
      ? { id: "people", tone: "yellow" as AiAlertTone, priority: "Media" as AiPriority, title: "Benessere personale da migliorare", metric: esgProfile.staffWellbeingScore + "/100", text: "Il benessere del personale è migliorabile e può incidere su qualità del servizio e turnover.", explain: "Turni, formazione e stabilità della squadra sono parte della sostenibilità del locale.", suggestions: ["migliorare turni", "programmare formazione", "ridurre straordinari", "ascoltare il team"] }
      : { id: "people", tone: "green" as AiAlertTone, priority: "Bassa" as AiPriority, title: "Buona attenzione al personale", metric: esgProfile.staffWellbeingScore + "/100", text: "Le pratiche sociali e il benessere del personale sembrano ben presidiati.", explain: "Una squadra stabile migliora servizio, reputazione e produttività.", suggestions: ["mantenere formazione", "misurare clima interno", "valorizzare il team"] },
  ];
  const esgWeakPoints = esgAlerts.filter((alert) => alert.tone !== "green");
  const esgStrengths = esgAlerts.filter((alert) => alert.tone === "green");
  const esgSummary = esgWeakPoints.length
    ? "Il locale presenta un livello di sostenibilità leggibile, ma può migliorare su " + esgWeakPoints.slice(0, 3).map((alert) => alert.title.toLowerCase()).join(", ") + ". Intervenire su questi aspetti può ridurre costi, rafforzare immagine e migliorare il rapporto con banche e bandi."
    : "Il locale presenta un buon livello di sostenibilità generale. Le pratiche ambientali, operative e sociali possono diventare un vantaggio commerciale e finanziario.";
  const esgPriorities = (["Alta", "Media", "Bassa"] as AiPriority[]).map((priority) => ({
    priority,
    items: esgAlerts
      .filter((alert) => alert.priority === priority)
      .flatMap((alert) => alert.suggestions.slice(0, priority === "Alta" ? 2 : 1))
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 5),
  }));
  const esgScoreData = [
    { name: "Score", value: esgScore },
    { name: "Gap", value: 100 - esgScore },
  ];
  const esgConsumptionData = [
    { name: "Energia", value: esgProfile.electricityKwhMonthly },
    { name: "Acqua", value: esgProfile.waterM3Monthly * 60 },
    { name: "Emissioni", value: esgEstimatedEmissions },
  ];

  const whatIfAverageTicket = inputs.averageTicket * (1 + whatIf.ticketIncreasePct / 100);
  const whatIfInputs: ProjectInputs = {
    ...effectiveInputs,
    averageTicket: whatIfAverageTicket,
    coversPerDay: Math.max(effectiveInputs.coversPerDay * (1 + whatIf.revenueChangePct / 100), 0),
    foodCostPct: Math.max(inputs.foodCostPct + whatIf.foodCostIncreasePoints, 0),
    laborCostMonthly: Math.max(effectiveInputs.laborCostMonthly * (1 - whatIf.staffReductionPct / 100), 0),
    fixedCostsMonthly:
      otherFixedBaseMonthly +
      rentBaseMonthly * (1 + whatIf.rentIncreasePct / 100) +
      energyBaseMonthly * (1 + whatIf.energyIncreasePct / 100),
    loanPaymentMonthly: loanPayment,
  };
  const whatIfKpis = calculateKpis(whatIfInputs);
  const whatIfProfitAnnual = whatIfKpis.ebitdaAnnual - amortizationAnnual - annualInterest;
  const baseProfitAnnual = kpis.ebitdaAnnual - amortizationAnnual - annualInterest;
  const whatIfCashFlowAnnual = whatIfKpis.cashFlowMonthly * 12;
  const baseCashFlowAnnual = kpis.cashFlowMonthly * 12;
  const whatIfBreakEvenDelta = whatIfKpis.breakEvenCovers - kpis.breakEvenCovers;
  const whatIfDscrDelta = whatIfKpis.dscr - kpis.dscr;
  const whatIfResultData = [
    { name: "Utile", Base: baseProfitAnnual, WhatIf: whatIfProfitAnnual },
    { name: "Cash flow", Base: baseCashFlowAnnual, WhatIf: whatIfCashFlowAnnual },
    { name: "Punto di pareggio", Base: kpis.breakEvenCovers, WhatIf: whatIfKpis.breakEvenCovers },
  ];
  const whatIfAlerts = [
    whatIfKpis.cashFlowMonthly < 0
      ? { tone: "red", text: "Con queste ipotesi la cassa mensile diventa negativa." }
      : { tone: "green", text: "La cassa resta positiva anche nello stress test." },
    whatIfKpis.dscr < 1
      ? { tone: "red", text: "La copertura del debito scende sotto 1: il debito non è coperto dalla cassa operativa." }
      : whatIfKpis.dscr < 1.2
        ? { tone: "yellow", text: "La copertura del debito resta debole: serve margine di sicurezza maggiore." }
        : { tone: "green", text: "La copertura del debito resta in area sostenibile." },
    whatIfProfitAnnual < 0
      ? { tone: "red", text: "L'utile simulato diventa negativo: rivedere prezzi, costi o personale." }
      : { tone: "green", text: "L'utile simulato resta positivo." },
  ];

  const businessPlanAudienceCopy: Record<BusinessPlanAudience, { label: string; focus: string; className: string }> = {
    banca: { label: "Versione banca", focus: "DSCR, cash flow, garanzie, rimborso debito e liquidità.", className: "bg-teal-600 text-white ring-teal-600" },
    investitore: { label: "Versione investitore", focus: "Crescita, marginalità, ritorno investimento e scalabilità del format.", className: "bg-indigo-600 text-white ring-indigo-600" },
    consulente: { label: "Commercialista / consulente", focus: "Fattibilità economica, criticità, rischi, margini e giudizio professionale.", className: "bg-slate-800 text-white ring-slate-800" },
    franchisor: { label: "Versione franchisor", focus: "Replicabilità, standardizzazione, potenziale rete e controllo operativo.", className: "bg-sky-600 text-white ring-sky-600" },
  };
  const availableBusinessPlanAudiences: BusinessPlanAudience[] = userProfileMode === "cliente"
    ? ["banca"]
    : userProfileMode === "consulente"
      ? ["consulente", "banca", "investitore"]
      : ["consulente", "banca", "investitore", "franchisor"];
  const selectedBusinessPlanAudience = businessPlanAudienceCopy[businessPlanAudience];
  const investmentToRevenuePct = kpis.revenueAnnual ? (investmentTotal / kpis.revenueAnnual) * 100 : 0;
  const ownCapitalCoveragePct = investmentTotal ? ((ownCapital + confirmedGrants) / investmentTotal) * 100 : 0;
  const debtCoveragePct = investmentTotal ? (financingAmount / investmentTotal) * 100 : 0;
  const annualDebtService = totalMonthlyDebtService * 12;
  const debtServiceToRevenuePct = kpis.revenueAnnual ? (annualDebtService / kpis.revenueAnnual) * 100 : 0;
  const businessPlanScorePenalty =
    (investmentToRevenuePct > 55 ? 12 : investmentToRevenuePct > 38 ? 6 : 0) +
    (ownCapitalCoveragePct < 20 ? 10 : ownCapitalCoveragePct < 30 ? 5 : 0) +
    (minDscrRow.dscr < 1 ? 18 : minDscrRow.dscr < 1.2 ? 10 : minDscrRow.dscr < 1.5 ? 4 : 0) +
    (initialFundingGap > 0 ? 10 : 0) +
    (kpis.ebitdaPct < 8 ? 10 : kpis.ebitdaPct < 14 ? 4 : 0);
  const businessPlanScore = Math.max(0, Math.min(100, Math.round(aiConsultantScore + Math.min(kpis.ebitdaPct, 18) * 0.35 - businessPlanScorePenalty)));
  const businessPlanLevel = businessPlanScore >= 80
    ? { label: "Documento bancabile solido", tone: "green" as AiAlertTone, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
    : businessPlanScore >= 60
      ? { label: "Bancabile con verifiche", tone: "yellow" as AiAlertTone, className: "bg-amber-50 text-amber-700 ring-amber-200" }
      : { label: "Da rafforzare prima della presentazione", tone: "red" as AiAlertTone, className: "bg-rose-50 text-rose-700 ring-rose-200" };
  const businessPlanExecutiveSummary = businessPlanScore >= 80
    ? "Il progetto presenta un format ristorativo con buone potenzialità, sostenuto da un investimento coerente con i volumi previsti. L'analisi economico-finanziaria evidenzia una capacità di rimborso soddisfacente e una struttura complessivamente presentabile a interlocutori finanziari."
    : businessPlanScore >= 60
      ? "Il progetto presenta elementi interessanti e una struttura economica leggibile, ma richiede alcune verifiche prima della presentazione. In particolare vanno presidiati cassa iniziale, sostenibilità del debito e coerenza tra investimento e fatturato previsto."
      : "Il progetto necessita di un rafforzamento prima di essere presentato a banche o investitori. Le principali attenzioni riguardano equilibrio finanziario, copertura del debito, liquidità iniziale e sostenibilità del punto di pareggio.";
  const businessPlanInvestmentComment = investmentToRevenuePct > 55
    ? "L'investimento iniziale appare elevato rispetto ai volumi previsti e richiede una crescita rapida del fatturato per non appesantire il progetto."
    : investmentToRevenuePct > 38
      ? "L'investimento è significativo ma potenzialmente coerente, purché il piano ricavi venga validato con prudenza."
      : "L'investimento iniziale appare proporzionato rispetto al fatturato annuo stimato.";
  const businessPlanFinanceComment = minDscrRow.dscr >= 1.5
    ? "La struttura finanziaria risulta equilibrata e compatibile con i flussi di cassa previsti."
    : minDscrRow.dscr >= 1.2
      ? "La capacità di rimborso è accettabile, ma il margine di sicurezza va monitorato nei primi esercizi."
      : "La pressione finanziaria appare elevata e potrebbe generare tensioni di liquidità nei primi esercizi.";
  const businessPlanBreakEvenComment = breakEvenCustomersDaily <= effectiveInputs.coversPerDay * 0.65
    ? "Il break even richiede volumi di clientela sostenibili per la dimensione del locale."
    : breakEvenCustomersDaily <= effectiveInputs.coversPerDay * 0.85
      ? "Il break even è raggiungibile ma lascia un margine operativo non ampio: serve controllo costante dei costi."
      : "Il numero di coperti richiesto appare elevato e aumenta il rischio operativo.";
  const businessPlanRiskRows = [
    investmentToRevenuePct > 45 ? { level: investmentToRevenuePct > 60 ? "Alto" : "Medio", title: "Investimento iniziale impegnativo", text: businessPlanInvestmentComment, action: "Valutare noleggio, leasing o rinvio di spese non essenziali." } : null,
    minDscrRow.dscr < 1.5 ? { level: minDscrRow.dscr < 1.2 ? "Alto" : "Medio", title: "Copertura debito da presidiare", text: businessPlanFinanceComment, action: "Aumentare capitale proprio, allungare durata o ridurre importo finanziato." } : null,
    breakEvenCustomersDaily > effectiveInputs.coversPerDay * 0.75 ? { level: "Medio", title: "Pareggio operativo sfidante", text: businessPlanBreakEvenComment, action: "Lavorare su spesa media per persona, food cost e costi fissi." } : null,
    ...aiWeakPoints.slice(0, 3).map((alert) => ({ level: alert.tone === "red" ? "Alto" : "Medio", title: alert.title, text: alert.text, action: alert.suggestions[0] })),
  ].filter(Boolean) as { level: string; title: string; text: string; action: string }[];
  const businessPlanStrengthRows = [
    kpis.ebitdaPct >= 14 ? "Margine operativo lordo interessante rispetto al fatturato previsto." : null,
    minDscrRow.dscr >= 1.2 ? "Capacità di rimborso del debito in area presentabile." : null,
    ownCapitalCoveragePct >= 30 ? "Capitale proprio adeguato rispetto agli impieghi iniziali." : null,
    breakEvenCustomersDaily <= effectiveInputs.coversPerDay * 0.7 ? "Punto di pareggio coerente con i volumi del locale." : null,
    footTrafficScore >= 82 ? "Location con buon potenziale di passaggio." : null,
    aiStrengths[0]?.title ? "Indicatori gestionali positivi: " + aiStrengths[0].title.toLowerCase() + "." : null,
  ].filter(Boolean) as string[];
  const businessPlanIndex = [
    "Executive summary",
    "Descrizione del progetto",
    "Analisi del mercato e SWOT",
    "Analisi della location",
    "Piano investimenti e fonti di copertura",
    "Analisi economica previsionale",
    "Break even analysis",
    "Cash flow previsionale",
    "Analisi finanziaria bancaria",
    "Analisi rischi",
    "Piano rientro finanziamento",
    "Conclusioni professionali",
  ];
  const consultantReportIndex = [
    "Premessa professionale",
    "Descrizione del progetto",
    "Analisi investimenti iniziali",
    "Analisi fatturato previsionale",
    "Analisi costi",
    "Analisi marginalità",
    "Break even analysis",
    "Analisi finanziaria",
    "Analisi rischi",
    "Scenari",
    "Valutazione professionale finale",
  ];
  const activeReportIndex = businessPlanAudience === "consulente" ? consultantReportIndex : businessPlanIndex;
  const feasibilityClassification = businessPlanScore >= 80 && minDscrRow.dscr >= 1.2 && baseProfitAnnual > 0 && initialFundingGap === 0
    ? { label: "FATTIBILE", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", text: "Alla luce delle analisi effettuate, il progetto appare economicamente sostenibile, con marginalità positiva e capacità prospettica di rimborso coerente con le ipotesi formulate." }
    : businessPlanScore >= 60 && baseProfitAnnual > 0
      ? { label: "FATTIBILE CON CRITICITÀ", className: "bg-amber-50 text-amber-700 ring-amber-200", text: "Sulla base delle ipotesi formulate, il progetto appare potenzialmente fattibile, ma presenta criticità da presidiare prima dell'avvio e durante i primi mesi di gestione." }
      : businessPlanScore >= 40 || kpis.ebitdaAnnual > 0
        ? { label: "AD ELEVATO RISCHIO", className: "bg-orange-50 text-orange-700 ring-orange-200", text: "Si rilevano elementi di criticità rilevanti. La sostenibilità economico-finanziaria dipende dalla correzione delle ipotesi più sensibili e da un rafforzamento della liquidità disponibile." }
        : { label: "NON ECONOMICAMENTE SOSTENIBILE", className: "bg-rose-50 text-rose-700 ring-rose-200", text: "Dai dati disponibili il progetto non presenta, allo stato, condizioni sufficienti di sostenibilità economica e finanziaria. È necessario rivedere ricavi, costi, investimenti e struttura delle fonti." };
  const consultantProfessionalPremise = "La presente relazione ha finalità di valutazione preliminare della fattibilità economica e finanziaria del progetto. Le analisi sono elaborate sulla base dei dati inseriti nella piattaforma e di ipotesi ragionevolmente prudenziali; non sostituiscono verifiche documentali, fiscali, contrattuali e autorizzative da svolgere con professionisti abilitati.";
  const consultantRevenueOpinion = breakEvenCustomersDaily > effectiveInputs.coversPerDay * 0.85
    ? "Le stime di fatturato richiedono volumi elevati rispetto alla capacità operativa indicata; la loro credibilità deve essere validata con dati di mercato e analisi della location."
    : "Le stime di fatturato appaiono leggibili rispetto a capacità, giorni di apertura e spesa media per persona, ferma restando la necessità di validazione con dati reali di zona.";
  const consultantCostOpinion = kpis.ebitdaPct < 8 || kpis.laborPct > 35 || inputs.foodCostPct > 35
    ? "La struttura costi presenta incidenze da presidiare. In particolare, materie prime, personale e costi fissi possono comprimere la marginalità se i ricavi non raggiungono i livelli previsti."
    : "La struttura costi risulta complessivamente compatibile con il fatturato stimato, pur richiedendo monitoraggio periodico di food cost, personale e utenze.";
  const businessPlanChartData = [
    { name: "Fatturato", value: kpis.revenueAnnual },
    { name: "Margine lordo", value: kpis.ebitdaAnnual },
    { name: "Ammortamenti", value: amortizationAnnual },
    { name: "Debito annuo", value: annualDebtService },
  ];
  const businessPlanScenarioData = [
    { name: "Prudenziale", Fatturato: kpis.revenueAnnual * 0.85, Utile: baseProfitAnnual * 0.7, DSCR: Math.max(minDscrRow.dscr * 0.82, 0) },
    { name: "Realistico", Fatturato: kpis.revenueAnnual, Utile: baseProfitAnnual, DSCR: minDscrRow.dscr },
    { name: "Ottimistico", Fatturato: kpis.revenueAnnual * 1.12, Utile: baseProfitAnnual * 1.22, DSCR: minDscrRow.dscr * 1.16 },
  ];
  const businessPlanSwotRows = [
    { area: "Punti di forza", text: (businessPlanStrengthRows.length ? businessPlanStrengthRows.slice(0, 3) : ["Base numerica completa e monitorabile", "Approccio prudenziale sui principali indicatori"]).join(" ") },
    { area: "Debolezze", text: (businessPlanRiskRows.length ? businessPlanRiskRows.slice(0, 3).map((risk) => risk.title) : ["Dipendenza dalla corretta esecuzione del piano ricavi"]).join("; ") },
    { area: "Opportunità", text: "Domanda locale, valorizzazione del format, controllo del margine e possibile utilizzo di strumenti finanziari o agevolativi coerenti." },
    { area: "Minacce", text: "Inflazione dei costi, pressione su personale e materie prime, stagionalità, concorrenza e ritardi nell'avvio operativo." },
  ];
  const businessPlanInvestmentRows = investmentRowsByCategory
    .map((group) => ({ category: group.category, total: group.confirmedTotal }))
    .filter((row) => row.total > 0);
  const businessPlanEconomicRows = [
    { label: "Fatturato annuo previsto", value: kpis.revenueAnnual, note: "Ricavi stimati con le ipotesi operative inserite." },
    { label: "Costo materie prime", value: kpis.variableCostsMonthly * 12, note: inputs.foodCostPct.toFixed(1) + "% sul fatturato." },
    { label: "Costo personale", value: effectiveInputs.laborCostMonthly * 12, note: kpis.laborPct.toFixed(1) + "% sul fatturato." },
    { label: "Altri costi fissi", value: effectiveInputs.fixedCostsMonthly * 12, note: "Affitto, utenze, servizi e costi ricorrenti." },
    { label: "EBITDA", value: kpis.ebitdaAnnual, note: kpis.ebitdaPct.toFixed(1) + "% sul fatturato." },
    { label: "Ammortamenti", value: amortizationAnnual, note: "Costo economico annuo degli investimenti." },
    { label: "Interessi passivi stimati", value: annualInterest, note: "Costo economico del debito finanziario." },
    { label: "Risultato ante imposte stimato", value: baseProfitAnnual, note: "Indicatore previsionale da validare con consulente fiscale." },
  ];
  const businessPlanFinancialIndicatorRows = [
    { indicator: "DSCR minimo", value: minDscrRow.dscr.toFixed(2), comment: dscrCopy.text },
    { indicator: "ROI stimato", value: kpis.roi.toFixed(1) + "%", comment: "Ritorno indicativo rispetto all'investimento iniziale." },
    { indicator: "ROS stimato", value: (kpis.revenueAnnual ? (baseProfitAnnual / kpis.revenueAnnual) * 100 : 0).toFixed(1) + "%", comment: "Redditività netta stimata sulle vendite." },
    { indicator: "PFN / EBITDA", value: (financingAmount / Math.max(kpis.ebitdaAnnual, 1)).toFixed(2), comment: "Rapporto tra debito finanziario e margine operativo lordo." },
    { indicator: "Debito / impieghi", value: debtCoveragePct.toFixed(1) + "%", comment: "Quota degli investimenti coperta da debito o strumenti finanziari." },
  ];
  const businessPlanRiskMatrixRows = [
    { risk: "Domanda", probability: breakEvenCustomersDaily > effectiveInputs.coversPerDay * 0.75 ? "Media" : "Bassa", impact: "Medio", mitigation: "Monitorare coperti, spesa media per persona e conversione per fascia di servizio." },
    { risk: "Costi materie prime", probability: inputs.foodCostPct > 32 ? "Media" : "Bassa", impact: inputs.foodCostPct > 35 ? "Alto" : "Medio", mitigation: "Schede ricetta, controllo sprechi, listino aggiornato e negoziazione fornitori." },
    { risk: "Personale", probability: kpis.laborPct > 30 ? "Media" : "Bassa", impact: kpis.laborPct > 35 ? "Alto" : "Medio", mitigation: "Turni proporzionati, personale stagionale e produttività per addetto." },
    { risk: "Liquidità", probability: liquidityStressLevel.tone === "red" ? "Alta" : liquidityStressLevel.tone === "yellow" ? "Media" : "Bassa", impact: "Alto", mitigation: "Liquidità di sicurezza, capitale circolante e monitoraggio dei primi sei mesi." },
    { risk: "Finanziario", probability: minDscrRow.dscr < 1.2 ? "Alta" : minDscrRow.dscr < 1.5 ? "Media" : "Bassa", impact: "Alto", mitigation: "Ridurre debito, aumentare mezzi propri o allungare la durata del rimborso." },
    { risk: "Stagionalità", probability: venueProfile.openingMode === "Stagionale" ? "Media" : "Bassa", impact: "Medio", mitigation: "Pianificare scorte, personale e cassa sul periodo effettivo di apertura." },
  ];
  const businessPlanConclusion = businessPlanScore >= 80
    ? "Il progetto, con le ipotesi attuali, risulta presentabile a interlocutori finanziari qualificati. È comunque opportuno allegare preventivi, contratti, dettagli della location e conferme sulle fonti di copertura."
    : businessPlanScore >= 60
      ? "Il progetto può essere presentato, ma risulta consigliabile rafforzare i punti sensibili prima dell'invio: liquidità iniziale, rapporto investimento/fatturato e margine di sicurezza sul debito."
      : "Prima della presentazione è consigliabile rivedere struttura finanziaria, investimenti e ipotesi di ricavo. Il documento deve mostrare maggiore prudenza e una copertura più solida dei primi mesi.";
  const activeWorkflowRows = workflowCosts.filter((row) => row.stepIndex === activeStep);
  const activeWorkflowTotal = activeWorkflowRows.reduce(
    (sum, row) => sum + (row.enabled ? row.amount : 0),
    0,
  );
  const activeWorkflowSelected = activeWorkflowRows.filter((row) => row.enabled).length;
  const activeWorkflowGroups = Array.from(new Set(activeWorkflowRows.map((row) => row.category))).map((category) => ({
    category,
    rows: activeWorkflowRows.filter((row) => row.category === category),
    total: activeWorkflowRows.filter((row) => row.category === category && row.enabled).reduce((sum, row) => sum + row.amount, 0),
  }));
  const personnelWorkflowGroups = Array.from(new Set(activeWorkflowRows.map((row) => row.category))).map((category) => ({
    category,
    rows: activeWorkflowRows.filter((row) => row.category === category),
    total: activeWorkflowRows.filter((row) => row.category === category && row.enabled).reduce((sum, row) => sum + row.amount, 0),
  }));
  const variableWorkflowGroups = ["Costi variabili", "Food cost", "Beverage"].map((category) => ({
    category,
    rows: activeWorkflowRows.filter((row) => row.category === category),
    total: activeWorkflowRows.filter((row) => row.category === category && row.enabled).reduce((sum, row) => sum + row.amount, 0),
  })).filter((group) => group.rows.length > 0);
  const selectedFoodCostTotal = activeWorkflowRows.filter((row) => row.category === "Food cost" && row.enabled).reduce((sum, row) => sum + row.amount, 0);
  const selectedBeverageTotal = activeWorkflowRows.filter((row) => row.category === "Beverage" && row.enabled).reduce((sum, row) => sum + row.amount, 0);
  const selectedVariableGeneralTotal = activeWorkflowRows.filter((row) => row.category === "Costi variabili" && row.enabled).reduce((sum, row) => sum + row.amount, 0);
  const foodAndBeverageStockTotal = selectedFoodCostTotal + selectedBeverageTotal;
  const estimatedMonthlyRevenue = Math.max(kpis.revenueMonthly, 1);
  const beverageCostActualPct = (selectedBeverageTotal / estimatedMonthlyRevenue) * 100;
  const foodBeverageRevenuePct = (foodAndBeverageStockTotal / estimatedMonthlyRevenue) * 100;
  const beverageOnAllSelectedCostsPct = activeWorkflowTotal ? (selectedBeverageTotal / activeWorkflowTotal) * 100 : 0;
  const benchmarkCostTotals = costRows.reduce(
    (totals, row) => {
      totals.total += row.annual;
      if (row.kind === "Fisso") totals.fixed += row.annual;
      if (row.kind === "Variabile") totals.variable += row.annual;
      if (row.kind === "Una tantum") totals.oneTime += row.annual;
      return totals;
    },
    { total: 0, fixed: 0, variable: 0, oneTime: 0 },
  );
  const getSuggestedAverageTicket = (key: string) =>
    key === "A" ? prudentialBenchmark.averageTicketsNet.A : key === "C" ? prudentialBenchmark.averageTicketsNet.C : prudentialBenchmark.averageTicketsNet.B;
  const getSuggestedFoodCost = (key: string) =>
    key === "A" ? prudentialBenchmark.foodCostPct + 4 : key === "C" ? Math.max(prudentialBenchmark.foodCostPct - 3, 18) : prudentialBenchmark.foodCostPct;
  const revenueScenarioRows = revenueScenarios.map((scenario) => {
    const servicesPerDay = activeServiceCountForVenue;
    const annualCapacity = venueAnnualCapacity;
    const customers = annualCapacity * (scenario.occupancyPct / 100);
    const netTicket = scenario.averageTicket;
    const revenue = customers * netTicket;
    const foodCost = revenue * (scenario.foodCostPct / 100);
    const otherVariableCosts = revenue * (scenario.otherVariablePct / 100);
    const variableCosts = foodCost + otherVariableCosts;
    const personnelAnnual = calculatedLaborCostMonthly * 12;
    const otherFixedAnnual = calculatedFixedCostsMonthly * 12;
    const fixedCosts = personnelAnnual + otherFixedAnnual;
    const ebitda = revenue - variableCosts - fixedCosts;
    const ebit = ebitda - amortizationAnnual;
    const debtService = loanPayment * 12;
    const cashResult = ebitda - debtService;
    const coversPerDay = effectiveOpeningDaysAnnual ? customers / effectiveOpeningDaysAnnual : 0;
    const safetyMargin = revenue ? ((revenue - prudentialBenchmark.forecastRevenue) / revenue) * 100 : 0;

    return {
      ...scenario,
      servicesPerDay,
      annualCapacity,
      customers,
      netTicket,
      revenue,
      foodCost,
      otherVariableCosts,
      variableCosts,
      personnelAnnual,
      otherFixedAnnual,
      fixedCosts,
      ebitda,
      ebit,
      debtService,
      cashResult,
      coversPerDay,
      safetyMargin,
    };
  });

  const scenarioSummaryCards = revenueScenarioRows.map((scenario) => {
    const totalCosts = scenario.variableCosts + scenario.fixedCosts + amortizationAnnual + scenario.debtService;
    const totalCostsPct = scenario.revenue ? (totalCosts / scenario.revenue) * 100 : 0;
    const resultAfterFinance = scenario.ebit - scenario.debtService;

    return { ...scenario, totalCosts, totalCostsPct, resultAfterFinance };
  });

  function isWorkflowStepReady(stepIndex: number) {
    if (stepIndex === 0) {
      return Boolean(venueProfile.city && venueProfile.zone && venueProfile.squareMeters > 0 && venueProfile.cuisineType && venueProfile.restaurantFormat && effectiveOpeningDaysAnnual > 0 && venueRooms.some((room) => room.name && room.seats > 0));
    }
    if (stepIndex === 1) {
      return investments.length > 0 && investments.every((item) => item.description.trim() && item.quantity > 0 && item.unitPrice >= 0);
    }
    if (stepIndex === 7) {
      return revenueScenarios.length > 0 && revenueScenarios.every((scenario) =>
        scenario.label.trim() &&
        scenario.tone.trim() &&
        effectiveOpeningDaysAnnual > 0 &&
        venuePeakSeats > 0 &&
        scenario.occupancyPct >= 0 &&
        scenario.occupancyPct <= 100 &&
        scenario.averageTicket > 0 &&
        scenario.foodCostPct >= 0 &&
        scenario.otherVariablePct >= 0
      );
    }
    const stepRows = workflowCosts.filter((row) => row.stepIndex === stepIndex);
    return stepRows.some((row) => row.enabled) && stepRows.filter((row) => row.enabled).every((row) => row.label.trim() && row.category.trim());
  }

  const completedStepsCount = workflowSteps.filter((_, index) => Boolean(confirmedSteps[index]) && isWorkflowStepReady(index)).length;
  const visibleAppPages = experienceMode === "simple"
    ? allAppPages.filter((page) => simpleAppPageIds.includes(page.id))
    : allAppPages;
  const activePageCopy = allAppPages.find((page) => page.id === activePage) ?? appPages[0];

  const incomeStatement = (() => {
    const valueOfProduction = kpis.revenueAnnual;
    const materialsAndGoods = kpis.variableCostsMonthly * 12;
    const services = effectiveInputs.fixedCostsMonthly * 12;
    const thirdPartyAssets = costRows
      .filter((row) => row.category === "Locale" && row.kind !== "Una tantum")
      .reduce((sum, row) => sum + row.annual, 0);
    const personnel = effectiveInputs.laborCostMonthly * 12;
    const amortizations = amortizationAnnual;
    const otherManagement = costRows
      .filter((row) => row.kind === "Una tantum")
      .reduce((sum, row) => sum + row.annual, 0);
    const productionCosts = materialsAndGoods + services + thirdPartyAssets + personnel + amortizations + otherManagement;
    const productionDifference = valueOfProduction - productionCosts;
    const financialIncome = 0;
    const financialCharges = annualInterest;
    const financialResult = financialIncome - financialCharges;
    const valueAdjustments = 0;
    const preTaxResult = productionDifference + financialResult + valueAdjustments;
    const taxes = preTaxResult > 0 ? preTaxResult * 0.28 : 0;
    const netResult = preTaxResult - taxes;

    return {
      valueOfProduction,
      materialsAndGoods,
      services,
      thirdPartyAssets,
      personnel,
      amortizations,
      otherManagement,
      productionCosts,
      productionDifference,
      financialIncome,
      financialCharges,
      financialResult,
      valueAdjustments,
      preTaxResult,
      taxes,
      netResult,
    };
  })();


  const advisor = [
    inputs.foodCostPct > 30
      ? "Il costo materie prime supera la soglia consigliata: valuta menu engineering, porzioni e fornitori."
      : "Costo materie prime in area sana: mantieni controllo ricette e scarti.",
    kpis.laborPct > 34
      ? "Il costo lavoro è alto rispetto al fatturato: verifica turni, aperture e produttività per servizio."
      : "Il costo lavoro è coerente con una gestione sostenibile.",
    kpis.cashFlowMonthly < 0
      ? `Liquidità in tensione: servono almeno ${euro.format(Math.abs(kpis.cashFlowMonthly) * 4)} di riserva operativa aggiuntiva.`
      : "Cash flow mensile positivo: il progetto genera cassa dopo il servizio del debito.",
    !financing.enabled
      ? "Nessun finanziamento attivo: il progetto non ha servizio del debito, ma richiede più capitale proprio iniziale."
      : kpis.dscr < 1.2
        ? "La rata del finanziamento è impegnativa: migliora la copertura del debito riducendo debito o allungando durata."
        : "Capacità di rimborso adeguata per una prima lettura bancaria.",
    ebitMonthly < 0
      ? "Dopo gli ammortamenti il risultato economico diventa negativo: verifica durata utile, investimenti e marginalità."
      : "Gli ammortamenti sono assorbiti dal margine operativo: Risultato operativo positivo dopo il costo economico dei beni.",
  ];

  function buildAiAnswer(question: string) {
    const text = question.toLowerCase();
    const topAlert = aiWeakPoints[0] ?? aiAlerts[0];
    if (text.includes("food") || text.includes("materie") || text.includes("cibo")) {
      return "Il costo materie prime è al " + inputs.foodCostPct.toFixed(1) + "%. Per essere più tranquillo dovrebbe stare circa tra 28% e 34%. Azioni pratiche: " + (aiAlerts.find((alert) => alert.id === "food")?.suggestions.slice(0, 3).join(", ") ?? "controllare ricette e acquisti") + ".";
    }
    if (text.includes("affitto") || text.includes("canone") || text.includes("location")) {
      return "L'affitto stimato pesa il " + rentSustainabilityPct.toFixed(1) + "% del fatturato. Sopra il 10-12% diventa una voce delicata. In questo progetto: " + (aiAlerts.find((alert) => alert.id === "rent")?.text ?? "verifica il canone rispetto ai ricavi.");
    }
    if (text.includes("personale") || text.includes("lavoro") || text.includes("turni")) {
      return "Il costo personale pesa il " + kpis.laborPct.toFixed(1) + "% del fatturato. Sopra il 35% il progetto diventa più fragile. Consiglio: parti da turni, ore improduttive e produttività per fascia di servizio.";
    }
    if (text.includes("coperti") || text.includes("pareggio") || text.includes("break")) {
      return "Per il pareggio servono circa " + Math.ceil(breakEvenCustomersDaily) + " clienti al giorno, con spesa media per persona di " + euro.format(inputs.averageTicket) + ". Se questo numero sembra alto per la location, lavora su spesa media, costi fissi e costo personale.";
    }
    if (text.includes("debito") || text.includes("finanzi") || text.includes("rata") || text.includes("dscr")) {
      return "La rata mensile totale è " + euro.format(totalMonthlyDebtService) + " e la copertura debito minima è " + (minDscrRow?.dscr ?? kpis.dscr).toFixed(2) + ". Sotto 1,20 il margine di sicurezza è debole: valuta più capitale proprio, durata più lunga o investimenti più leggeri.";
    }
    if (text.includes("cassa") || text.includes("liquid") || text.includes("cash")) {
      return liquidityStressLevel.text + " Il fabbisogno iniziale stimato è " + euro.format(initialFinancialNeed) + " e l'eventuale gap è " + euro.format(initialFundingGap) + ". La cassa non serve solo per aprire: serve anche per superare i primi mesi.";
    }
    if (text.includes("sostenibile") || text.includes("rischio") || text.includes("decidere")) {
      return aiScoreLevel.label + ": score " + aiConsultantScore + "/100. " + aiExecutiveSummary;
    }
    return "La criticità principale ora è: " + topAlert.title + ". " + topAlert.text + " Il numero da guardare è " + topAlert.metric + ". Prima azione consigliata: " + topAlert.suggestions[0] + ".";
  }

  function submitAiQuestion(questionOverride?: string) {
    const question = (questionOverride ?? aiQuestion).trim();
    if (!question) return;
    const answer = buildAiAnswer(question);
    setAiChatMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: answer }]);
    setAiQuestion("");
  }

  function buildEsgAnswer(question: string) {
    const text = question.toLowerCase();
    const topAlert = esgWeakPoints[0] ?? esgAlerts[0];
    if (text.includes("consum") || text.includes("energia") || text.includes("bollett") || text.includes("gas")) {
      return "Il costo energia e gas pesa circa " + esgEnergyCostPct.toFixed(1) + "% del fatturato mensile. Se vuoi ridurlo, parti da LED, attrezzature efficienti, manutenzione e uso più controllato di climatizzazione e cucina.";
    }
    if (text.includes("spreco") || text.includes("scarti") || text.includes("magazzino")) {
      return "Lo spreco alimentare stimato è " + esgProfile.foodWastePct.toFixed(1) + "%. Ogni punto di spreco riduce margine e sostenibilità. Le prime azioni sono menu più corto, grammature controllate e rotazione magazzino.";
    }
    if (text.includes("packaging") || text.includes("plastica") || text.includes("delivery")) {
      return "Il packaging sostenibile è al " + esgProfile.sustainablePackagingPct + "% e l'uso plastica al " + esgProfile.plasticUsePct + "%. Puoi migliorare usando materiali compostabili o riciclabili e comunicandolo meglio ai clienti.";
    }
    if (text.includes("banca") || text.includes("bandi") || text.includes("credito") || text.includes("rating")) {
      return "Uno score ESG di " + esgScore + "/100 può aiutare nel racconto verso banche, bandi e investitori. Non garantisce finanziamenti, ma rende il progetto più credibile se dimostri riduzione consumi, meno sprechi e filiera locale.";
    }
    if (text.includes("comunic") || text.includes("marketing") || text.includes("social") || text.includes("brand")) {
      return "Le scelte sostenibili possono diventare marketing: racconta fornitori locali, prodotti stagionali, riduzione sprechi e packaging ecologico. Il punto forte oggi è: " + (esgStrengths[0]?.title ?? "costruire una storia sostenibile chiara") + ".";
    }
    if (text.includes("miglior") || text.includes("sostenibil") || text.includes("cosa")) {
      return esgLevel.label + ": score " + esgScore + "/100. La priorità ora è " + topAlert.title.toLowerCase() + ". Prima azione consigliata: " + topAlert.suggestions[0] + ".";
    }
    return "La lettura ESG principale è: " + topAlert.title + ". " + topAlert.text + " Il numero da guardare è " + topAlert.metric + ".";
  }

  function submitEsgQuestion(questionOverride?: string) {
    const question = (questionOverride ?? esgQuestion).trim();
    if (!question) return;
    const answer = buildEsgAnswer(question);
    setEsgChatMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: answer }]);
    setEsgQuestion("");
  }


  function buildBusinessPlanAnswer(question: string) {
    const text = question.toLowerCase();
    const firstRisk = businessPlanRiskRows[0];
    if (text.includes("banca") || text.includes("finanzi")) {
      return "Per una banca il punto centrale è la capacità di rimborso. Il DSCR minimo simulato è " + minDscrRow.dscr.toFixed(2) + " e il servizio del debito annuo è " + euro.format(annualDebtService) + ". " + businessPlanFinanceComment;
    }
    if (text.includes("dscr")) {
      return "Il DSCR misura quanta cassa operativa copre le rate. In questo progetto il valore minimo è " + minDscrRow.dscr.toFixed(2) + ". Sopra 1,20 è presentabile, sopra 1,50 è più solido. " + dscrCopy.text;
    }
    if (text.includes("investimento") || text.includes("troppo")) {
      return "L'investimento iniziale è " + euro.format(investmentTotal) + ", pari al " + investmentToRevenuePct.toFixed(1) + "% del fatturato annuo previsto. " + businessPlanInvestmentComment;
    }
    if (text.includes("cash") || text.includes("cassa") || text.includes("liquid")) {
      return "La liquidità è uno dei punti più importanti per rendere il piano credibile. Il fabbisogno iniziale stimato è " + euro.format(initialFinancialNeed) + " e il gap eventuale è " + euro.format(initialFundingGap) + ". " + liquidityStressLevel.text;
    }
    if (text.includes("investitore")) {
      return "Un investitore guarderebbe margine, crescita e ritorno. Il margine lordo è " + kpis.ebitdaPct.toFixed(1) + "% e il ROI stimato è " + kpis.roi.toFixed(1) + "%. " + (businessPlanStrengthRows[0] ?? businessPlanConclusion);
    }
    if (text.includes("franchisor") || text.includes("franchising")) {
      return "Per un franchisor sono importanti replicabilità, standard e controllo dei costi. Oggi i dati chiave sono: spesa media per persona " + euro.format(inputs.averageTicket) + ", costo materie prime " + inputs.foodCostPct.toFixed(1) + "% e costo personale " + kpis.laborPct.toFixed(1) + "%.";
    }
    if (text.includes("debole") || text.includes("risch")) {
      return firstRisk ? "Il punto debole principale è: " + firstRisk.title + ". " + firstRisk.text + " Azione consigliata: " + firstRisk.action : "I principali rischi risultano sotto controllo. Il documento resta da validare con preventivi e dati reali della location.";
    }
    if (text.includes("credibile") || text.includes("presentabile") || text.includes("bancabile")) {
      return businessPlanLevel.label + " con score " + businessPlanScore + "/100. " + businessPlanExecutiveSummary;
    }
    return businessPlanConclusion;
  }

  function submitBusinessPlanQuestion(questionOverride?: string) {
    const question = (questionOverride ?? businessPlanQuestion).trim();
    if (!question) return;
    const answer = buildBusinessPlanAnswer(question);
    setBusinessPlanChatMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: answer }]);
    setBusinessPlanQuestion("");
  }

  const isActiveStepReady = isWorkflowStepReady(activeStep);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function updateExperienceMode(mode: ExperienceMode) {
    setExperienceMode(mode);
    window.localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, mode);
    if (mode === "simple" && advancedOnlyPageIds.includes(activePage)) {
      setActivePage("dashboard");
    }
  }

  useEffect(() => {
    let active = true;
    async function checkSession() {
      if (!supabase) {
        setAuthChecked(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      setUserEmail(data.session.user.email ?? "utente@launchpilot.it");
      setAuthChecked(true);
    }
    checkSession();
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/login";
  }

  function markStepDirty(stepIndex: number) {
    setConfirmedSteps((current) => ({ ...current, [stepIndex]: false }));
  }

  function confirmActiveStep() {
    if (!isActiveStepReady) return;
    setConfirmedSteps((current) => ({ ...current, [activeStep]: true }));
  }

  function unconfirmActiveStep() {
    setConfirmedSteps((current) => ({ ...current, [activeStep]: false }));
  }

  function updateVenueProfile(key: keyof VenueProfile, value: string | number | boolean) {
    markStepDirty(0);
    setVenueProfile((current) => ({ ...current, [key]: value }));
  }

  function updateVenueRoom(id: string, key: keyof Omit<VenueRoom, "id">, value: string | number | boolean) {
    markStepDirty(0);
    setVenueRooms((current) => current.map((room) => (room.id === id ? { ...room, [key]: value } : room)));
  }

  function addVenueRoom() {
    markStepDirty(0);
    setVenueRooms((current) => [
      ...current,
      { id: "room-" + Date.now(), name: "Nuova sala", seats: 12, season: "Tutto l'anno", breakfast: false, lunch: true, aperitif: false, dinner: true, seasonStartDate: "2026-01-01", seasonEndDate: "2026-12-31", note: "Aggiunta dal cliente" },
    ]);
  }

  function updateInvestment(index: number, key: keyof Investment, value: string | number | boolean) {
    markStepDirty(1);
    setInvestments((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        if (key === "category" && typeof value === "string") {
          return {
            ...row,
            category: value,
            amortizable: false,
            years: 5,
            depreciationRate: 20,
            firstYearHalf: false,
          };
        }
        if (key === "years" && typeof value === "number") {
          return { ...row, years: value, depreciationRate: value ? Number((100 / value).toFixed(1)) : row.depreciationRate };
        }
        if (key === "depreciationRate" && typeof value === "number") {
          return { ...row, depreciationRate: value, years: value ? Math.max(Math.round(100 / value), 1) : row.years };
        }
        return { ...row, [key]: value };
      }),
    );
  }

  function addInvestmentToCategory(category = "Altro") {
    markStepDirty(1);
    setInvestments((current) => [
      ...current,
      {
        category,
        description: category === "Altro" ? "Nuovo costo da inserire" : "Nuova voce " + category.toLowerCase(),
        quantity: 1,
        unitPrice: 0,
        vat: 22,
        amortizable: false,
        years: 5,
        depreciationRate: 20,
        firstYearHalf: false,
        acquisitionMode: "purchase",
        confirmed: false,
      },
    ]);
  }

  function moveInvestment(index: number, direction: -1 | 1) {
    markStepDirty(1);
    setInvestments((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      const [row] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, row);
      return copy;
    });
  }

  function deleteInvestment(index: number) {
    markStepDirty(1);
    setInvestments((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function toggleInvestmentCategory(category: string) {
    setVisibleInvestmentCategories((current) => ({
      ...current,
      [category]: current[category] === false,
    }));
  }

  function showAllInvestmentCategories() {
    setVisibleInvestmentCategories({});
  }

  function hideUnselectedInvestmentCategories() {
    setVisibleInvestmentCategories(
      investmentRowsByCategory.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.category] = group.rows.some((row) => row.item.confirmed);
        return acc;
      }, {}),
    );
  }

  function getWorkflowCostCategoryKey(stepIndex: number, category: string) {
    return `${stepIndex}-${category}`;
  }

  function isWorkflowCostCategoryOpen(stepIndex: number, category: string) {
    return visibleWorkflowCostCategories[getWorkflowCostCategoryKey(stepIndex, category)] !== false;
  }

  function toggleWorkflowCostCategory(stepIndex: number, category: string) {
    const key = getWorkflowCostCategoryKey(stepIndex, category);
    setVisibleWorkflowCostCategories((current) => ({
      ...current,
      [key]: current[key] === false,
    }));
  }

  function showAllWorkflowCostCategories(groups: { category: string }[], stepIndex = activeStep) {
    setVisibleWorkflowCostCategories((current) => {
      const next = { ...current };
      groups.forEach((group) => {
        next[getWorkflowCostCategoryKey(stepIndex, group.category)] = true;
      });
      return next;
    });
  }

  function hideUnselectedWorkflowCostCategories(groups: { category: string; rows: WorkflowCostRow[] }[], stepIndex = activeStep) {
    setVisibleWorkflowCostCategories((current) => {
      const next = { ...current };
      groups.forEach((group) => {
        next[getWorkflowCostCategoryKey(stepIndex, group.category)] = group.rows.some((row) => row.enabled);
      });
      return next;
    });
  }

  function showInvestmentPreview(mode: "selected" | "all") {
    setInvestmentPrintMode(mode);
    window.setTimeout(() => {
      document.getElementById("investment-print-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function printInvestments(mode: "selected" | "all" = investmentPrintMode) {
    setInvestmentPrintMode(mode);
    window.setTimeout(() => window.print(), 80);
  }

  function updateInput(key: keyof ProjectInputs, value: number) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function updateFinancingSource(id: string, key: keyof FinancingSource, value: string | number | boolean) {
    setFinancingSources((current) =>
      current.map((source) => (source.id === id ? { ...source, [key]: value } : source)),
    );
  }

  function addFinancingSource(type: FinancingSourceType = "other") {
    setFinancingSources((current) => [
      ...current,
      {
        id: "source-" + Date.now(),
        type,
        name: financingSourceLabels[type],
        amount: 0,
        durationMonths: type === "own" || type === "grant" ? 0 : 60,
        annualRate: type === "own" || type === "grant" || type === "rental" ? 0 : 5.5,
        taeg: 0,
        monthlyPayment: 0,
        paymentFrequency: type === "own" || type === "grant" ? "Una tantum" : "Mensile",
        gracePeriodMonths: 0,
        guarantees: "",
        notes: "",
        downPayment: 0,
        maxInstallment: 0,
        redemptionValue: 0,
        servicesIncluded: "",
        maintenanceIncluded: false,
        grantCoveragePct: 0,
        grantFree: type === "grant",
        subsidizedLoan: false,
        expectedCollectionDate: "",
        probability: type === "grant" ? "medio" : "confermato",
      },
    ]);
  }

  function updateBenchmarkCostRow(index: number, key: keyof BenchmarkCostRow, value: string | number) {
    setCostRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    );
  }

  function addBenchmarkCostRow(category: string, kind: BenchmarkCostKind = "Fisso") {
    setCostRows((current) => [
      ...current,
      {
        category,
        name: "Nuova voce " + category.toLowerCase(),
        kind,
        monthly: kind === "Una tantum" ? 0 : 0,
        annual: 0,
        note: "Voce aggiunta manualmente.",
      },
    ]);
  }

  function updateRevenueChannel(key: RevenueChannelKey, field: keyof Omit<RevenueChannel, "key">, value: string | number | boolean) {
    setRevenueChannels((current) => current.map((channel) => (channel.key === key ? { ...channel, [field]: value } : channel)));
  }

  function addRevenueChannel(label = newRevenueChannelLabel) {
    markStepDirty(7);
    const cleanLabel = label.trim() || "Nuovo canale";
    setRevenueChannels((current) => [
      ...current,
      {
        key: "custom-" + Date.now(),
        enabled: true,
        label: cleanLabel,
        monthlyOrders: 80,
        averageRevenue: 35,
        minMarginPerPerson: 14,
        platform: cleanLabel,
        deliveryCostPerOrder: cleanLabel.toLowerCase().includes("delivery") || cleanLabel.toLowerCase().includes("catering") ? 6 : 0,
        otherCostPerOrder: 14,
        note: "Canale aggiunto dal cliente. Valori prudenziali modificabili.",
      },
    ]);
  }

  function updateRevenueScenario(
    key: string,
    field: keyof Omit<RevenueScenarioInput, "key">,
    value: string | number | boolean,
  ) {
    markStepDirty(7);
    setRevenueScenarios((current) =>
      current.map((scenario) =>
        scenario.key === key ? { ...scenario, [field]: value } : scenario,
      ),
    );
    if (key === "B" && typeof value === "number" && (field === "averageTicket" || field === "foodCostPct")) {
      setInputs((current) => ({
        ...current,
        ...(field === "averageTicket" ? { averageTicket: value } : {}),
        ...(field === "foodCostPct" ? { foodCostPct: value } : {}),
      }));
    }
  }

  function addRevenueScenario() {
    markStepDirty(7);
    setRevenueScenarios((current) => {
      const base = current.find((scenario) => scenario.key === "B") ?? current.at(-1);
      const nextNumber = current.filter((scenario) => scenario.key.startsWith("S")).length + 1;
      const nextKey = "S" + nextNumber;
      return [
        ...current,
        {
          key: nextKey,
          label: "Scenario personalizzato " + nextNumber,
          tone: "Personalizzato",
          openingDaysAnnual: base?.openingDaysAnnual ?? effectiveOpeningDaysAnnual,
          seats: base?.seats ?? venuePeakSeats,
          breakfast: base?.breakfast ?? venueProfile.breakfast,
          lunch: base?.lunch ?? venueProfile.lunch,
          aperitif: base?.aperitif ?? venueProfile.aperitif,
          dinner: base?.dinner ?? venueProfile.dinner,
          occupancyPct: Math.max((base?.occupancyPct ?? 70) - 5, 0),
          averageTicket: base?.averageTicket ?? inputs.averageTicket,
          foodCostPct: base?.foodCostPct ?? inputs.foodCostPct,
          otherVariablePct: base?.otherVariablePct ?? prudentialBenchmark.otherVariableCostsPct,
          personnelAnnual: base?.personnelAnnual ?? calculatedLaborCostMonthly * 12,
          otherFixedAnnual: base?.otherFixedAnnual ?? calculatedFixedCostsMonthly * 12,
        },
      ];
    });
  }

  function deleteRevenueScenario(key: string) {
    markStepDirty(7);
    setRevenueScenarios((current) => current.length > 1 ? current.filter((scenario) => scenario.key !== key) : current);
  }


  function updateWhatIf(field: keyof WhatIfInput, value: number) {
    setWhatIf((current) => ({ ...current, [field]: value }));
  }

  function updateBureaucracyCost(id: string, key: keyof Omit<BureaucracyCostRow, "id">, value: string | number | boolean) {
    setBureaucracyCosts((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addBureaucracyCost() {
    setBureaucracyCosts((current) => [
      ...current,
      { id: "bureaucracy-" + Date.now(), name: "Nuova voce", amount: 0, recurring: false, mandatory: false, status: "mancante" },
    ]);
  }

  function updateAuthorization(id: string, key: keyof Omit<AuthorizationItem, "id">, value: string | number | boolean) {
    setAuthorizations((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateTimeline(id: string, key: keyof Omit<OpeningTimelineItem, "id">, value: string | number) {
    setOpeningTimeline((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateWorkflowCost(
    id: string,
    key: keyof Pick<WorkflowCostRow, "label" | "category" | "amount" | "vat" | "note" | "enabled">,
    value: string | number | boolean,
  ) {
    markStepDirty(activeStep);
    setWorkflowCosts((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }

  function addWorkflowCost(category = "Altro", stepIndex = activeStep) {
    markStepDirty(stepIndex);
    setWorkflowCosts((current) => [
      ...current,
      {
        id: "step-" + stepIndex + "-custom-" + Date.now(),
        stepIndex,
        label: "Nuova voce",
        category,
        amount: 0,
        vat: 22,
        enabled: true,
        custom: true,
        note: "Voce aggiunta manualmente.",
      },
    ]);
  }

  function deleteWorkflowCost(id: string) {
    markStepDirty(activeStep);
    setWorkflowCosts((current) => current.filter((row) => row.id !== id));
  }

  function addInvestment() {
    addInvestmentToCategory("Altro");
  }

  function applyQuickDraft() {
    const sizePreset = {
      piccolo: { label: "Piccolo", seats: 34, sqm: 85, investment: 125000, staffMonthly: 13500, fixedMonthly: 8200, own: 45000, bank: 90000, occupancy: 62 },
      medio: { label: "Medio", seats: 58, sqm: 145, investment: 190000, staffMonthly: 24500, fixedMonthly: 12500, own: 85000, bank: 145000, occupancy: 72 },
      grande: { label: "Grande", seats: 92, sqm: 230, investment: 320000, staffMonthly: 38500, fixedMonthly: 19500, own: 130000, bank: 230000, occupancy: 68 },
    }[quickSize];
    const pricePreset = {
      economico: { ticket: 28, food: 33, otherVariable: 11.5 },
      medio: { ticket: 42, food: 28, otherVariable: 9.5 },
      premium: { ticket: 58, food: 25, otherVariable: 8.5 },
    }[quickPrice];
    const openingDaysAnnual = quickFormat.includes("Stagionale") ? 190 : 312;
    const services = quickFormat.includes("Bar")
      ? { breakfast: true, lunch: true, aperitif: true, dinner: false }
      : quickFormat.includes("Pizzeria")
        ? { breakfast: false, lunch: false, aperitif: true, dinner: true }
        : { breakfast: false, lunch: true, aperitif: true, dinner: true };
    const roomSeats = Math.max(sizePreset.seats - (quickSize === "piccolo" ? 0 : 18), 24);
    const dehorsSeats = quickSize === "piccolo" ? 0 : 18;
    const investmentScale = sizePreset.investment / 190000;

    setVenueProfile((current) => ({
      ...current,
      restaurantFormat: quickFormat,
      squareMeters: sizePreset.sqm,
      openingMode: quickFormat.includes("Stagionale") ? "Stagionale" : "Annuale",
      seasonStartDate: "2026-04-15",
      seasonEndDate: "2026-10-15",
      openingDaysAnnual,
      ...services,
    }));
    const quickRooms: VenueRoom[] = [
      { id: "room-main", name: "Sala principale", seats: roomSeats, season: "Tutto l'anno", ...services, seasonStartDate: "2026-01-01", seasonEndDate: "2026-12-31", note: "Bozza automatica" },
      ...(dehorsSeats > 0 ? [{ id: "room-summer", name: "Sala estiva / dehors", seats: dehorsSeats, season: "Estate" as const, ...services, seasonStartDate: "2026-05-15", seasonEndDate: "2026-09-30", note: "Da verificare con autorizzazioni" }] : []),
    ];
    setVenueRooms(quickRooms);
    setInputs((current) => ({
      ...current,
      averageTicket: pricePreset.ticket,
      openingDays: Math.round(openingDaysAnnual / 12),
      seats: sizePreset.seats,
      foodCostPct: pricePreset.food,
      beverageCostPct: pricePreset.otherVariable,
      laborCostMonthly: sizePreset.staffMonthly,
      fixedCostsMonthly: sizePreset.fixedMonthly,
      initialInvestment: sizePreset.investment,
      initialCash: Math.round(sizePreset.fixedMonthly * 3.2),
      loanPaymentMonthly: calculateLoanPayment(sizePreset.bank, 5.6, 72),
    }));
    setInvestments(defaultInvestments.map(enrichInvestment).map((item) => ({
      ...item,
      confirmed: ["Cucina professionale", "Arredi e sala", "Opere e impianti", "Cassa / POS", "Software e web", "Capitale circolante"].includes(item.category),
      unitPrice: Math.round(item.unitPrice * investmentScale),
    })));
    setWorkflowCosts(createInitialWorkflowCosts().map((row) => {
      const text = (row.category + " " + row.label).toLowerCase();
      const enabled =
        (row.stepIndex === 3 && (text.includes("chef") || text.includes("cuoco") || text.includes("cameriere") || text.includes("lavapiatti") || (quickSize !== "piccolo" && text.includes("runner")))) ||
        (row.stepIndex === 4 && (text.includes("energia") || text.includes("gas") || text.includes("acqua") || text.includes("pos") || text.includes("food") || text.includes("beverage") || text.includes("sprechi"))) ||
        (row.stepIndex === 8 && (text.includes("liquidita") || text.includes("scorte")));
      const scale = quickSize === "piccolo" ? 0.72 : quickSize === "grande" ? 1.45 : 1;
      return { ...row, enabled, amount: Math.round(row.amount * scale) };
    }));
    setFinancing((current) => ({ ...current, enabled: true, financedAmount: sizePreset.bank, annualRate: 5.6, months: 72 }));
    setFinancingSources((current) => current.map((source) =>
      source.type === "own" ? { ...source, amount: sizePreset.own } :
      source.type === "bank" ? { ...source, amount: sizePreset.bank, annualRate: 5.6, durationMonths: 72 } :
      source
    ));
    setRevenueScenarios([
      { key: "A", label: "Prudente", tone: "Ricavi bassi", openingDaysAnnual, seats: sizePreset.seats, ...services, occupancyPct: Math.max(sizePreset.occupancy - 16, 35), averageTicket: Math.max(pricePreset.ticket - 4, 18), foodCostPct: pricePreset.food + 3, otherVariablePct: pricePreset.otherVariable + 1.2, personnelAnnual: sizePreset.staffMonthly * 12, otherFixedAnnual: sizePreset.fixedMonthly * 12 },
      { key: "B", label: "Realistico", tone: "Scenario base", openingDaysAnnual, seats: sizePreset.seats, ...services, occupancyPct: sizePreset.occupancy, averageTicket: pricePreset.ticket, foodCostPct: pricePreset.food, otherVariablePct: pricePreset.otherVariable, personnelAnnual: sizePreset.staffMonthly * 12, otherFixedAnnual: sizePreset.fixedMonthly * 12 },
      { key: "C", label: "Migliorativo", tone: "Con prudenza", openingDaysAnnual, seats: sizePreset.seats, ...services, occupancyPct: Math.min(sizePreset.occupancy + 10, 90), averageTicket: pricePreset.ticket + 5, foodCostPct: Math.max(pricePreset.food - 2, 20), otherVariablePct: Math.max(pricePreset.otherVariable - 0.8, 6), personnelAnnual: sizePreset.staffMonthly * 12, otherFixedAnnual: sizePreset.fixedMonthly * 12 },
    ]);
    setConfirmedSteps({ 0: true, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false });
    setActivePage("workflow");
    setActiveStep(0);
  }

  function applyBdfPreset() {
    setInputs((current) => ({
      ...current,
      averageTicket: prudentialBenchmark.averageTicketsNet.B,
      coversPerDay: prudentialBenchmark.idealCoversDaily,
      openingDays: Math.round(prudentialBenchmark.openingDaysAnnual / 12),
      foodCostPct: prudentialBenchmark.foodCostPct,
      beverageCostPct: prudentialBenchmark.otherVariableCostsPct,
      laborCostMonthly: Math.round(prudentialBenchmark.personnelAnnual / 12),
      fixedCostsMonthly: Math.round((prudentialBenchmark.fixedCostsAnnual - prudentialBenchmark.personnelAnnual) / 12),
      initialInvestment: prudentialBenchmark.equipmentNet,
    }));
    setInvestments([
      {
        category: "Cucina professionale",
        description: "Attrezzature e beni strumentali",
        quantity: 1,
        unitPrice: prudentialBenchmark.equipmentNet,
        vat: 22,
        amortizable: false,
        years: 5,
        depreciationRate: 20,
        firstYearHalf: false,
        acquisitionMode: "purchase",
        confirmed: false,
      },
      {
        category: "Insegne",
        description: "Insegna primo anno",
        quantity: 1,
        unitPrice: 500,
        vat: 22,
        amortizable: false,
        years: 5,
        depreciationRate: 20,
        firstYearHalf: false,
        acquisitionMode: "purchase",
        confirmed: false,
      },
      {
        category: "Altro",
        description: "Abbigliamento personale primo anno",
        quantity: 1,
        unitPrice: 7500,
        vat: 22,
        amortizable: false,
        years: 1,
        depreciationRate: 100,
        firstYearHalf: false,
        acquisitionMode: "purchase",
        confirmed: false,
      },
    ]);
    setFinancing((current) => ({
      ...current,
      enabled: true,
      financedAmount: Math.round(prudentialBenchmark.equipmentNet * 0.7),
    }));
  }

  async function exportPdf() {
    const [{ default: jsPDF }, html2canvas] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const element = document.getElementById("business-plan-pdf-preview") ?? document.getElementById("report-area");
    if (!element) return;
    const canvas = await html2canvas.default(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileSuffix = businessPlanAudience === "consulente" ? "fattibilita-commercialista" : businessPlanAudience === "investitore" ? "business-plan-investitore" : "business-plan-banca";
    pdf.save("launch-pilot-" + fileSuffix + ".pdf");
  }

  if (!authChecked) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold shadow-sm">
          Verifica accesso in corso...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center">
            <Image
              src="/launch-pilot-logo.png"
              alt="Launch Pilot - Il futuro del tuo ristorante inizia qui"
              width={270}
              height={135}
              priority
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>
          <nav className="hidden h-14 max-w-[620px] items-center gap-1 overflow-hidden rounded-md bg-slate-100 p-1 xl:flex">
            {visibleAppPages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePage(page.id)}
                className={"h-11 shrink-0 whitespace-nowrap rounded px-4 text-sm font-semibold leading-none transition " + (activePage === page.id ? "bg-teal-600 text-white shadow-sm ring-1 ring-teal-700/10" : "text-slate-600 hover:bg-white hover:text-slate-950")}
              >
                {page.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-slate-200 bg-white p-1 text-xs font-bold shadow-sm lg:flex">
              {(["simple", "advanced"] as ExperienceMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateExperienceMode(mode)}
                  className={"rounded-xl px-3 py-2 transition " + (experienceMode === mode ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}
                  title={mode === "simple" ? "Mostra solo dati essenziali e percorso rapido." : "Mostra simulazioni, analisi e strumenti professionali."}
                >
                  {mode === "simple" ? "Semplice" : "Avanzata"}
                </button>
              ))}
            </div>
            <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right text-xs shadow-sm sm:block">
              <p className="font-semibold text-slate-950">{userEmail}</p>
              <p className="text-slate-500">{userProfileMode === "consulente" ? "Profilo consulente" : "Profilo ristoratore"}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        </div>
      </header>

      <div
        id="report-area"
        className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8"
      >
        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Workflow guidato</p>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                Step {activeStep + 1}/10
              </span>
            </div>
            <div className="grid gap-1">
              {workflowSteps.map((step, index) => {
                const completed = Boolean(confirmedSteps[index]) && isWorkflowStepReady(index);
                const current = activeStep === index;
                return (
                  <button
                    key={step}
                    onClick={() => {
                      setActiveStep(index);
                      setActivePage("workflow");
                    }}
                    className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                      current
                        ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-200"
                        : completed
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{step}</span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      {current ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Attivo</span> : null}
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Menu progetto</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {completedStepsCount}/10 ok
              </span>
            </div>
            <div className="mb-3 rounded-lg border border-teal-100 bg-teal-50 p-2">
              <div className="grid grid-cols-2 gap-1">
                {(["simple", "advanced"] as ExperienceMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateExperienceMode(mode)}
                    className={"rounded-md px-2 py-2 text-xs font-bold transition " + (experienceMode === mode ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:bg-white/70")}
                  >
                    {mode === "simple" ? "Semplice" : "Avanzata"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {experienceMode === "simple"
                  ? "Vedi solo percorso rapido, numeri chiave e report."
                  : "Vedi anche simulazioni, AI, ESG e pratiche."}
              </p>
            </div>
            <div className="grid gap-1">
              {visibleAppPages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setActivePage(page.id)}
                  className={"rounded-md px-3 py-2 text-left transition " + (activePage === page.id ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}
                  title={page.description}
                >
                  <span className="block text-sm font-semibold">{page.label}</span>
                  <span className={"mt-0.5 block text-xs " + (activePage === page.id ? "text-teal-100" : "text-slate-400")}>
                    {page.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Semaforo</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`h-4 w-4 rounded-full ${status.dot}`} />
              <span
                className={`max-w-full rounded-full px-3 py-1 text-sm font-semibold leading-5 ring-1 ${status.className}`}
                title={status.explanation}
              >
                {status.shortLabel}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {status.explanation}
            </p>
            <div className="mt-4">
              <div className="flex items-end justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Lettura banca
                </span>
                <span className="lp-card-value">{kpis.score}/100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-teal-600"
                  style={{ width: `${kpis.score}%` }}
                />
              </div>
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">
                  {activePageCopy.label}
                </p>
                <h2 className="mt-1 lp-card-value text-slate-950">
                  {activePageCopy.description}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {activePage === "workflow"
                    ? "Procedi per passi brevi: ogni sezione diventa verde solo quando viene confermata. I dati restano modificabili in ogni momento."
                    : activePage === "summary"
                      ? "Questa pagina confronta gli scenari facendo emergere fatturato, costi totali, incidenza percentuale e risultato dopo finanza e ammortamenti."
                      : activePage === "personale"
                        ? "Qui capisci se il costo del personale e proporzionato ai ricavi, ai coperti e alle fasce di servizio previste."
                        : activePage === "finance"
                          ? "Qui si leggono investimenti, ammortamenti economici, uscite di cassa reali e l'effetto di eventuali finanziamenti."
                          : activePage === "whatif"
                            ? "Simula subito scenari alternativi: fatturato, costi, personale, energia, spesa media e impatto su cassa, utile e punto di pareggio."
                          : activePage === "advisor"
                            ? "Qui LaunchPilot interpreta i numeri e ti dice cosa non funziona, perché e cosa migliorare subito."
                            : activePage === "esg"
                              ? "Qui valuti consumi, sprechi, packaging, fornitori e vantaggi sostenibili in modo semplice e operativo."
                              : activePage === "pratiche"
                            ? "Qui trovi pratiche, autorizzazioni, costi di apertura e tempi da controllare prima di partire."
                            : activePage === "report"
                              ? "Ultimo controllo prima dell'esportazione PDF: il report riprende dati, scenari, cassa, investimenti e conclusioni."
                              : "Vista sintetica per capire subito se il progetto sta in piedi, prima di entrare nel dettaglio."}
                </p>
              </div>
              {activePage !== "workflow" ? (
                <span className={"max-w-full rounded-full px-3 py-1.5 text-sm font-semibold leading-5 ring-1 " + status.className} title={status.explanation}>
                  {status.shortLabel}
                </span>
              ) : null}
            </div>
          </section>

          <section className={(activePage === "dashboard" ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Da dove vuoi partire?</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Scegli l&apos;obiettivo, poi ti guida LaunchPilot</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Non devi conoscere tutti i moduli: scegli cosa vuoi ottenere e il sistema apre solo le parti utili.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                {
                  title: "Creo una prefattibilità rapida",
                  text: "Parti da locale, investimenti, costi e ricavi. È il percorso più semplice.",
                  action: "Apri percorso",
                  icon: Sparkles,
                  page: "workflow" as AppPage,
                  className: "border-teal-200 bg-teal-50 text-teal-700",
                },
                {
                  title: "Controllo se il progetto regge",
                  text: "Vedi subito fatturato minimo, clienti necessari, rischi e liquidità.",
                  action: "Vedi risultato",
                  icon: Gauge,
                  page: "summary" as AppPage,
                  className: "border-sky-200 bg-sky-50 text-sky-700",
                },
                {
                  title: "Preparo il report da stampare",
                  text: "Controlla anteprima, intestazione, versione report e stampa PDF.",
                  action: "Apri report",
                  icon: Download,
                  page: "report" as AppPage,
                  className: "border-amber-200 bg-amber-50 text-amber-700",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActivePage(item.page)}
                    className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                  >
                    <span className={"inline-flex h-10 w-10 items-center justify-center rounded-md border " + item.className}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="mt-4 block text-lg font-semibold text-slate-950">{item.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-slate-500">{item.text}</span>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                      {item.action}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={(activePage === "dashboard" ? "" : "hidden ") + "rounded-lg border border-teal-200 bg-white p-5 shadow-sm"}>
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Percorso rapido</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Crea una prima bozza automatica</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Inserisci solo tre scelte: LaunchPilot prepara anagrafica, sale, investimenti, personale, costi, scenari, liquidità e finanziamento con criteri prudenziali. Poi puoi correggere solo ciò che non torna.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700">Format
                    <input
                      list="quick-format-presets"
                      value={quickFormat}
                      onChange={(event) => setQuickFormat(event.target.value)}
                      placeholder="Es. bistrot di pesce, cocktail bar con cucina..."
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500"
                    />
                    <datalist id="quick-format-presets">
                      {restaurantFormatPresets.map((preset) => <option key={preset} value={preset} />)}
                    </datalist>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">Puoi scegliere un preset o scrivere il format reale del locale.</span>
                  </label>
                  <label className="text-sm font-medium text-slate-700">Dimensione
                    <select value={quickSize} onChange={(event) => setQuickSize(event.target.value as QuickSize)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500">
                      <option value="piccolo">Piccolo</option>
                      <option value="medio">Medio</option>
                      <option value="grande">Grande</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">Fascia prezzo
                    <select value={quickPrice} onChange={(event) => setQuickPrice(event.target.value as QuickPrice)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500">
                      <option value="economico">Economica</option>
                      <option value="medio">Media</option>
                      <option value="premium">Premium</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="rounded-lg bg-teal-50 p-4 ring-1 ring-teal-100">
                <p className="text-sm font-semibold text-teal-950">Cosa compila automaticamente</p>
                <ul className="mt-3 space-y-2 text-sm text-teal-800">
                  {['anagrafica e sale', 'investimenti essenziali', 'personale minimo', 'costi food e beverage', 'scenari prudente/base/migliorativo', 'liquidità e finanziamento'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}
                </ul>
                <button type="button" onClick={applyQuickDraft} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700">
                  <Sparkles className="h-4 w-4" />
                  Crea bozza automatica
                </button>
              </div>
            </div>
          </section>

          <section className={(activePage === "dashboard" && experienceMode === "advanced" ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Strumenti avanzati</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Aprili solo quando servono</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Usa questi moduli solo quando vuoi approfondire sostenibilità, autorizzazioni o lettura dei numeri. Il flusso principale resta semplice e guidato.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {advancedPages.map((page) => (
                  <button key={page.id} type="button" onClick={() => setActivePage(page.id)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700">
                    {page.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className={(activePage === "dashboard" ? "" : "hidden ") + "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"}>
            <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
              <div className="flex flex-col justify-between gap-6">
                <div>
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl lg:text-4xl xl:text-5xl">
                    Prefattibilità economica chiara, visuale e pronta da
                    presentare.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                    Inserisci pochi dati guidati: Launch Pilot calcola KPI,
                    punto di pareggio, liquidità, scenari e report professionale.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KpiCard
                    icon={BadgeEuro}
                    label="Fatturato annuo"
                    value={euro.format(kpis.revenueAnnual)}
                    detail="Stima da coperti, spesa media per persona e giorni apertura"
                  />
                  <KpiCard
                    icon={Users}
                    label="Spesa media per persona"
                    value={euro.format(inputs.averageTicket)}
                    detail="Valore medio per pasto, IVA esclusa"
                    tone="blue"
                  />
                  <KpiCard
                    icon={TrendingUp}
                    label="Margine lordo"
                    value={euro.format(kpis.ebitdaAnnual)}
                    detail={`${kpis.ebitdaPct.toFixed(1)}% sul fatturato`}
                    tone={kpis.ebitdaAnnual >= 0 ? "green" : "red"}
                  />
                  <KpiCard
                    icon={Gauge}
                    label="Punto di pareggio"
                    value={`${Math.ceil(kpis.breakEvenCovers)} coperti`}
                    detail={`${euro.format(kpis.breakEvenRevenue)} mese`}
                    tone="slate"
                  />
                </div>
              </div>
              <div className="min-h-[320px] rounded-lg border border-teal-100 bg-gradient-to-br from-white via-teal-50 to-sky-50 p-4 text-slate-950 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Cash flow 12 mesi</p>
                    <p className="lp-card-value">
                      {euro.format(cashFlowData.at(-1)?.saldo ?? 0)}
                    </p>
                  </div>
                  <Activity className="h-6 w-6 text-teal-600" />
                </div>
                <div className="mt-6 h-64">
                  {mounted && activePage === "dashboard" ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                      <AreaChart data={cashFlowData}>
                        <defs>
                          <linearGradient id="cash" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} width={44} />
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "0",
                            borderRadius: 8,
                            color: "#0f172a",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="saldo"
                          stroke="#2dd4bf"
                          fill="url(#cash)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartShell />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={(activePage === "dashboard" || activePage === "summary" ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo KPI ristorazione</p>
                <h2 className="mt-1 lp-card-value-sm text-slate-950">Indici di performance</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Lettura rapida dei principali indicatori operativi del ristorante con benchmark scarso, medio e ottimo.</p>
              </div>
              <span title="Indici di performance" className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">Indici di performance</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-3">
              {restaurantKpiRows.map((row) => (
                <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                      <p className="mt-1 lp-card-value text-slate-950">{row.value}</p>
                    </div>
                    <span className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + (row.benchmark === "ottimo" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : row.benchmark === "medio" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-rose-50 text-rose-700 ring-rose-200")}>
                      {row.benchmark}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">{row.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={(activePage === "personale" ? "" : "hidden ") + "space-y-6"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo personale</p>
                  <h2 className="mt-1 lp-card-value-sm text-slate-950">Costo lavoro e produttivita</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                    Legge le voci confermate nello step Personale e le trasforma in indicatori semplici: costo reale, produttivita, costo per coperto e fasce da controllare.
                  </p>
                </div>
                <span className={(kpis.laborPct <= 30 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : kpis.laborPct <= 35 ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-rose-50 text-rose-700 ring-rose-200") + " rounded-full px-3 py-1.5 text-xs font-semibold ring-1"}>
                  {kpis.laborPct <= 30 ? "Equilibrato" : kpis.laborPct <= 35 ? "Da monitorare" : "Attenzione"}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <KpiCard icon={Users} label="Costo mensile" value={euro.format(personnelMonthlyCost)} detail={`${euro.format(personnelAnnualCost)} annui`} tone={kpis.laborPct <= 35 ? "green" : "red"} />
                <KpiCard icon={Gauge} label="Costo lavoro" value={kpis.laborPct.toFixed(1) + "%"} detail="Sul fatturato previsto" tone={kpis.laborPct <= 30 ? "green" : kpis.laborPct <= 35 ? "slate" : "red"} />
                <KpiCard icon={Activity} label="Costo per coperto" value={euro.format(personnelCostPerCover)} detail="Personale / coperti mese" tone="blue" />
                <KpiCard icon={TrendingUp} label="Fatturato/addetto" value={euro.format(staffProductivity)} detail={`${estimatedPersonnelCount} persone stimate`} tone="green" />
                <KpiCard icon={BadgeEuro} label="BEP personale" value={euro.format(personnelBreakEvenRevenue)} detail="Ricavi minimi per coprire lavoro" tone="slate" />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">Produttivita essenziale</p>
                <p className="mt-1 text-sm text-slate-500">Tre numeri per capire se il personale sta generando valore.</p>
                <div className="mt-4 h-72">
                  {mounted && activePage === "personale" ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                      <BarChart data={personnelProductivityRows}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                        <Tooltip formatter={(value) => euro.format(Number(value))} />
                        <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartShell />
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">Fasce di servizio</p>
                <p className="mt-1 text-sm text-slate-500">Stima del peso del personale per pranzo, cena e delivery.</p>
                <div className="mt-4 grid gap-3">
                  {personnelServiceRows.map((row) => (
                    <div key={row.name} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">{row.name}</p>
                        <span className={(row.laborPct > 32 ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200") + " rounded-full px-2.5 py-1 text-xs font-semibold ring-1"}>
                          {row.laborPct.toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{row.people} persone · costo stimato {euro.format(row.monthlyCost)} · ricavi {euro.format(row.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">Scenari organizzativi</p>
                <p className="mt-1 text-sm text-slate-500">Confronto rapido tra aperture, brigata ridotta e doppio turno.</p>
                <div className="mt-4 h-72">
                  {mounted && activePage === "personale" ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                      <BarChart data={personnelScenarioRows}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                        <Tooltip formatter={(value) => euro.format(Number(value))} />
                        <Bar dataKey="margin" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartShell />
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">AI suggerisce</p>
                <div className="mt-4 grid gap-3">
                  {personnelAlerts.map((alert) => (
                    <div key={alert} className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                      {alert}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => window.print()} className="mt-4 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                  Stampa analisi personale
                </button>
              </div>
            </div>
          </section>



          <section className={(activePage === "dashboard" ? "" : "hidden ") + "rounded-lg border border-teal-100 bg-white p-5 shadow-sm"}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">
                  Benchmark importato
                </p>
                <h2 className="mt-1 lp-card-value-sm text-slate-950">
                  Benchmark prudenziale
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Preset guidato con spesa media per persona A/B/C, costo materie prime, costi fissi, personale, attrezzature e punto di pareggio.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Il tipo costo è modificabile: se una voce va trattata diversamente, cambiala dalla tabella e i totali si aggiornano.
                </p>
              </div>
              <button
                type="button"
                onClick={applyBdfPreset}
                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700"
              >
                Applica preset prudenziale
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 rounded-md bg-teal-50 p-4 ring-1 ring-teal-100">
                <p className="text-sm text-teal-700">Spesa media per persona B</p>
                <p className="lp-card-value text-teal-950">{euro.format(prudentialBenchmark.averageTicketsNet.B)}</p>
                <p className="mt-1 text-xs text-teal-700">A {euro.format(prudentialBenchmark.averageTicketsNet.A)} · C {euro.format(prudentialBenchmark.averageTicketsNet.C)} IVA esclusa</p>
              </div>
              <div className="min-w-0 rounded-md bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-sm text-emerald-700">Costo materie prime</p>
                <p className="lp-card-value text-emerald-950">{prudentialBenchmark.foodCostPct}%</p>
                <p className="mt-1 text-xs text-emerald-700">Altri variabili {prudentialBenchmark.otherVariableCostsPct}%</p>
              </div>
              <div className="min-w-0 rounded-md bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Costi fissi annui</p>
                <p className="lp-card-value">{euro.format(prudentialBenchmark.fixedCostsAnnual)}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Personale {euro.format(prudentialBenchmark.personnelAnnual)}</p>
              </div>
              <div className="min-w-0 rounded-md bg-amber-50 p-4 ring-1 ring-amber-100">
                <p className="text-sm text-amber-700">BEP scenario B</p>
                <p className="lp-card-value text-amber-950">{prudentialBenchmark.breakEvenCustomersDaily.B} coperti/giorno</p>
                <p className="mt-1 text-xs text-amber-700">{prudentialBenchmark.breakEvenCustomers.B.toLocaleString("it-IT")} clienti anno</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-md border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-950">Punto di pareggio A/B/C</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {(["A", "B", "C"] as const).map((scenario) => (
                    <div key={scenario} className="rounded-md bg-slate-50 p-3">
                      <p className="font-semibold text-slate-950">Scenario {scenario}</p>
                      <p className="mt-1 text-slate-600">{prudentialBenchmark.breakEvenCustomers[scenario].toLocaleString("it-IT")} clienti</p>
                      <p className="text-xs text-slate-500">{Math.round(prudentialBenchmark.breakEvenCustomersDaily[scenario])} al giorno</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Costi fissi e variabili</p>
                    <p className="text-xs text-slate-500">Aggiungi nuove voci nei comparti principali e poi classificale come fisso, variabile o una tantum.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => addBenchmarkCostRow("Locale", "Fisso")} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700"><Plus className="h-3.5 w-3.5" />Aggiungi fisso</button>
                    <button type="button" onClick={() => addBenchmarkCostRow("Utenze", "Variabile")} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-white"><Plus className="h-3.5 w-3.5" />Aggiungi variabile</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-1.5">Categoria</th>
                      <th className="px-2 py-1.5">Voce costo</th>
                      <th className="px-2 py-1.5">Tipo</th>
                      <th className="px-2 py-1.5 text-right">Mese</th>
                      <th className="px-2 py-1.5 text-right">Anno</th>
                      <th className="px-2 py-1.5 text-right">Incidenza</th>
                      <th className="px-2 py-1.5">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {costRows.map((row, rowIndex) => {
                      const incidence = prudentialBenchmark.forecastRevenue ? (row.annual / prudentialBenchmark.forecastRevenue) * 100 : 0;

                      return (
                        <tr key={row.name + rowIndex}>
                          <td className="px-3 py-2"><input value={row.category} onChange={(event) => updateBenchmarkCostRow(rowIndex, "category", event.target.value)} className="w-32 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 outline-none focus:border-teal-500" /></td>
                          <td className="px-3 py-2"><input value={row.name} onChange={(event) => updateBenchmarkCostRow(rowIndex, "name", event.target.value)} className="w-56 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-900 outline-none focus:border-teal-500" /></td>
                          <td className="px-2 py-1.5">
                            <select
                              value={row.kind}
                              onChange={(event) => updateBenchmarkCostRow(rowIndex, "kind", event.target.value as BenchmarkCostKind)}
                              className={`rounded-md border px-2.5 py-1 text-xs font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${
                                row.kind === "Fisso"
                                  ? "border-slate-200 bg-slate-100 text-slate-700"
                                  : row.kind === "Variabile"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                              aria-label={"Tipo costo " + row.name}
                            >
                              <option value="Fisso">Fisso</option>
                              <option value="Variabile">Variabile</option>
                              <option value="Una tantum">Una tantum</option>
                            </select>
                          </td>
                          <td className="px-3 py-2"><MoneyInput value={row.monthly} onChange={(value) => updateBenchmarkCostRow(rowIndex, "monthly", value)} className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 outline-none focus:border-teal-500" /></td>
                          <td className="px-3 py-2"><MoneyInput value={row.annual} onChange={(value) => updateBenchmarkCostRow(rowIndex, "annual", value)} className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-900 outline-none focus:border-teal-500" /></td>
                          <td className="px-3 py-2 text-right text-slate-600">{incidence.toFixed(1)}%</td>
                          <td className="px-3 py-2"><input value={row.note} onChange={(event) => updateBenchmarkCostRow(rowIndex, "note", event.target.value)} className="w-72 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-500 outline-none focus:border-teal-500" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                    <tr>
                      <td className="px-3 py-2" colSpan={3}>Totale costi</td>
                      <td className="px-2 py-1.5 text-right">{euro.format(benchmarkCostTotals.total / 12)}</td>
                      <td className="px-2 py-1.5 text-right">{euro.format(benchmarkCostTotals.total)}</td>
                      <td className="px-2 py-1.5 text-right">
                        {((benchmarkCostTotals.total / prudentialBenchmark.forecastRevenue) * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        Fissi {euro.format(benchmarkCostTotals.fixed)} · Variabili {euro.format(benchmarkCostTotals.variable)} · Una tantum {euro.format(benchmarkCostTotals.oneTime)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              </div>
            </div>
          </section>

          <section className={(activePage === "dashboard" || activePage === "summary" ? "" : "hidden ") + "grid gap-4 md:grid-cols-2 xl:grid-cols-5"}>
            <KpiCard
              icon={BarChart3}
              label="Costo materie prime"
              value={`${inputs.foodCostPct.toFixed(1)}%`}
              detail="Target consigliato: 24-30%"
              tone={inputs.foodCostPct > 30 ? "red" : "green"}
            />
            <KpiCard
              icon={Users}
              label="Costo lavoro"
              value={`${kpis.laborPct.toFixed(1)}%`}
              detail="Target consigliato: sotto 34%"
              tone={kpis.laborPct > 34 ? "red" : "green"}
            />
            <KpiCard
              icon={Banknote}
              label="Copertura debito"
              value={kpis.dscr.toFixed(2)}
              detail="Quanto margine copre le rate"
              tone={kpis.dscr < 1.2 ? "red" : "green"}
            />
            <KpiCard
              icon={BarChart3}
              label="Risultato operativo"
              value={euro.format(ebitAnnual)}
              detail={"Dopo ammortamenti: " + euro.format(amortizationAnnual) + " annui"}
              tone={ebitAnnual >= 0 ? "green" : "red"}
            />
            <KpiCard
              icon={LineChart}
              label="Occupazione"
              value={`${kpis.occupancyPct.toFixed(0)}%`}
              detail="Fasce servizio attive su posti disponibili"
              tone="blue"
            />
          </section>


          <section className={(activePage === "workflow" && activeStep !== 6 ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">
                  Step {activeStep + 1} · {workflowSteps[activeStep]}
                </p>
                <h2 className="mt-1 lp-card-value-sm text-slate-950">
                  {activeStep === 0 ? "Anagrafica locale" : activeStep === 1 ? "Investimenti guidati" : activeStep === 5 ? "Ricavi guidati" : "Costi guidati dello step"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {activeStep === 0
                    ? "Definisci il locale: luogo, format, giorni di apertura, servizi e sale disponibili. I valori partono da preset modificabili e il cliente può aggiungere nuove sale."
                    : activeStep === 1
                      ? "Compila le tabelle degli investimenti per categoria: nome suggerito, quantità, prezzo netto, IVA e ammortamento restano sempre modificabili."
                      : activeStep === 5
                        ? "Imposta la spesa media per persona IVA esclusa, costo materie prime e variabili operative: il sistema traduce i dati in clienti, fatturato, costi e margine."
                        : activeStep === 7
                          ? "Crea scenari alternativi modificando solo le ipotesi commerciali. Clienti, fatturato, margini, costi calcolati e cassa dopo rate vengono aggiornati dal programma."
                          : "Seleziona le voci utili, modifica importi e IVA, oppure aggiungi costi specifici del progetto. La divisione tra costi fissi, variabili e una tantum viene calcolata automaticamente."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={confirmActiveStep}
                  disabled={!isActiveStepReady}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Conferma step
                </button>
                {confirmedSteps[activeStep] ? (
                  <button
                    type="button"
                    onClick={unconfirmActiveStep}
                    className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Togli conferma
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={activeStep === 1 ? () => addInvestmentToCategory("Altro") : activeStep === 7 ? addRevenueScenario : () => addWorkflowCost("Altro")}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
                >
                  <Plus className="h-4 w-4" />
                  {activeStep === 1 ? "Aggiungi investimento" : activeStep === 7 ? "Aggiungi scenario" : "Aggiungi voce"}
                </button>
              </div>
            </div>
            {activeStep === 0 ? (
              <div className="mb-5 grid gap-4 rounded-lg border border-teal-100 bg-teal-50/60 p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="text-sm font-medium text-slate-700">Città<input value={venueProfile.city} onChange={(event) => updateVenueProfile("city", event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /></label>
                  <label className="text-sm font-medium text-slate-700">CAP<input inputMode="numeric" maxLength={5} value={venueProfile.postalCode} onChange={(event) => updateVenueProfile("postalCode", event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Es. 20121" className={"mt-1 w-full rounded-md border bg-white px-3 py-2 outline-none transition focus:border-teal-500 " + (/^\d{5}$/.test(venueProfile.postalCode) ? "border-slate-200" : "border-amber-300")} /><span className="mt-1 block text-xs leading-5 text-slate-500">{/^\d{5}$/.test(venueProfile.postalCode) ? "CAP formalmente corretto." : "Inserisci 5 cifre per un controllo base."}</span></label>
                  <label className="text-sm font-medium text-slate-700">Zona<input list="zone-presets" value={venueProfile.zone} onChange={(event) => updateVenueProfile("zone", event.target.value)} placeholder="Es. centro storico, zona uffici, quartiere residenziale..." className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /><datalist id="zone-presets">{zonePresets.map((preset) => <option key={preset} value={preset} />)}</datalist><span className="mt-1 block text-xs leading-5 text-slate-500">Scegli un valore preimpostato o scrivi liberamente la zona reale.</span></label>
                  <label className="text-sm font-medium text-slate-700">Indirizzo / riferimento<input value={venueProfile.address} onChange={(event) => updateVenueProfile("address", event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /></label>
                  <label className="text-sm font-medium text-slate-700">Mq locale<input type="number" min="1" value={venueProfile.squareMeters} onChange={(event) => updateVenueProfile("squareMeters", Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-right outline-none transition focus:border-teal-500" /></label>
                  <label className="text-sm font-medium text-slate-700">Passaggio clienti<input list="foot-traffic-presets" value={venueProfile.footTraffic} onChange={(event) => updateVenueProfile("footTraffic", event.target.value)} placeholder="Basso, medio, alto..." className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /><datalist id="foot-traffic-presets">{footTrafficPresets.map((preset) => <option key={preset} value={preset} />)}</datalist><span className="mt-1 block text-xs leading-5 text-slate-500">Stima prudenziale del passaggio o della domanda intercettabile.</span></label>
                  <label className="text-sm font-medium text-slate-700">Target prevalente<input list="target-presets" value={venueProfile.target} onChange={(event) => updateVenueProfile("target", event.target.value)} placeholder="Es. business, famiglie, turisti..." className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /><datalist id="target-presets">{targetPresets.map((preset) => <option key={preset} value={preset} />)}</datalist><span className="mt-1 block text-xs leading-5 text-slate-500">Scegli un preset o scrivi un target personalizzato.</span></label>
                  <label className="text-sm font-medium text-slate-700">Cucina<input value={venueProfile.cuisineType} onChange={(event) => updateVenueProfile("cuisineType", event.target.value)} placeholder="Es. cucina romana, pesce, pizzeria gourmet..." className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /><span className="mt-1 block text-xs leading-5 text-slate-500">Campo libero: scrivi la cucina reale del locale.</span></label>
                  <label className="text-sm font-medium text-slate-700">Forma / format locale<input list="restaurant-format-presets" value={venueProfile.restaurantFormat} onChange={(event) => updateVenueProfile("restaurantFormat", event.target.value)} placeholder="Es. osteria moderna, pizzeria gourmet, bar pranzo veloce..." className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /><datalist id="restaurant-format-presets">{restaurantFormatPresets.map((preset) => <option key={preset} value={preset} />)}</datalist><span className="mt-1 block text-xs leading-5 text-slate-500">Scegli un suggerimento o scrivi liberamente il format: verrà usato in analisi, scenari e report.</span></label>
                  <label className="text-sm font-medium text-slate-700">Tipo apertura<select value={venueProfile.openingMode} onChange={(event) => updateVenueProfile("openingMode", event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500"><option>Annuale</option><option>Stagionale</option></select></label><label className="text-sm font-medium text-slate-700">Chiusura settimanale<select value={venueProfile.weeklyClosingDay} onChange={(event) => updateVenueProfile("weeklyClosingDay", event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500">{weeklyClosingDays.map((day) => <option key={day}>{day}</option>)}</select></label>{venueProfile.openingMode === "Stagionale" ? (<><label className="text-sm font-medium text-slate-700">Inizio stagione<input type="date" value={venueProfile.seasonStartDate} onChange={(event) => updateVenueProfile("seasonStartDate", event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /></label><label className="text-sm font-medium text-slate-700">Fine stagione<input type="date" value={venueProfile.seasonEndDate} onChange={(event) => updateVenueProfile("seasonEndDate", event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-teal-500" /></label></>) : null}<div className="rounded-md bg-teal-50 p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Giorni apertura calcolati</p><p className="mt-1 lp-card-value-sm text-teal-950">{effectiveOpeningDaysAnnual}</p><p className="text-xs text-teal-700">Tiene conto di periodo e chiusura settimanale.</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Capienza annua</p><p className="mt-1 lp-card-value-sm text-teal-950">{Math.round(venueAnnualCapacity).toLocaleString("it-IT")}</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Coperti massimi</p><p className="mt-1 lp-card-value-sm text-teal-950">{venuePeakSeats}</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Sale attive</p><p className="mt-1 lp-card-value-sm text-teal-950">{venueActiveRooms}</p></div>
                </div>
                <VenueRoomsEditor
                  venueRooms={venueRooms}
                  effectiveOpeningDaysAnnual={effectiveOpeningDaysAnnual}
                  weeklyClosingDay={venueProfile.weeklyClosingDay}
                  onUpdate={updateVenueRoom}
                  onAdd={addVenueRoom}
                />
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo analisi location</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Potenziale commerciale del locale</h3></div>
                    <span className={"rounded-full px-3 py-1.5 text-xs font-semibold ring-1 " + (locationCompatibilityScore >= 76 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : locationCompatibilityScore >= 55 ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-rose-50 text-rose-700 ring-rose-200")}>{formatCompatibilityCopy}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-md bg-teal-50 p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Potenziale</p><p className="mt-1 lp-card-value text-teal-950">{locationPotentialScore}/100</p><p className="mt-1 text-xs text-teal-700">{locationPotentialCopy}</p></div>
                    <div className="rounded-md bg-emerald-50 p-3 ring-1 ring-emerald-100"><p className="text-xs font-semibold uppercase text-emerald-600">Affitto</p><p className="mt-1 lp-card-value text-emerald-950">{rentSustainabilityPct.toFixed(1)}%</p><p className="mt-1 text-xs text-emerald-700">{rentSustainabilityCopy}</p></div>
                    <div className="rounded-md bg-amber-50 p-3 ring-1 ring-amber-100"><p className="text-xs font-semibold uppercase text-amber-600">Rischio zona</p><p className="mt-1 lp-card-value text-amber-950">{locationRiskPct.toFixed(0)}/100</p><p className="mt-1 text-xs text-amber-700">{zoneRiskCopy}</p></div>
                    <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-500">Compatibilità</p><p className="mt-1 lp-card-value text-slate-950">{locationCompatibilityScore}/100</p><p className="mt-1 text-xs text-slate-500">Target {venueProfile.target}</p></div>
                  </div>
                  <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">In futuro questo modulo potrà collegarsi a mappe, flussi pedonali, concorrenza e bacino d&apos;utenza. Oggi fornisce una prima lettura commerciale prudenziale usando zona, mq, passaggio, target, format e peso stimato dell&apos;affitto.</p>
                </div>
                <div id="fasce-servizio-settings" className="scroll-mt-28 rounded-xl border-2 border-teal-300 bg-teal-50/70 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">Scelta servizi e canali di ricavo</p>
                      <h3 className="text-lg font-semibold text-slate-950">Qui decidi cosa farà davvero il locale</h3>
                      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                        Seleziona solo i servizi realmente previsti. Queste scelte valgono per tutto il progetto e influenzano capacità, occupazione, ricavi, punto di pareggio e report. Il delivery, l&apos;asporto o il banqueting possono restare disattivati se non verranno svolti.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200" title="Le fasce selezionate qui sono valide per tutto il progetto, salvo sale stagionali configurate nella tabella sale.">Impostazione principale</span>
                  </div>
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-lg bg-white p-4 ring-1 ring-teal-100">
                      <p className="text-sm font-semibold text-slate-950">Fasce di servizio</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Scegli quando il locale serve clienti in sede: colazione, pranzo, aperitivo e cena.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {serviceBandDefinitions.map((band) => (
                          <label key={band.key} className={"flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ring-1 transition " + (venueProfile[band.key] ? "bg-teal-600 text-white ring-teal-600" : "bg-slate-50 text-slate-600 ring-slate-200")}>
                            <input type="checkbox" checked={Boolean(venueProfile[band.key])} onChange={(event) => updateVenueProfile(band.key, event.target.checked)} className="h-4 w-4 accent-teal-600" />
                            {band.label}
                            <span className={venueProfile[band.key] ? "text-teal-100" : "text-slate-400"}>{band.hours}h</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-4 ring-1 ring-teal-100">
                      <p className="text-sm font-semibold text-slate-950">Canali di vendita</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Attiva solo i ricavi che esisteranno davvero. Delivery e banqueting non sono obbligatori.</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {revenueChannels.map((channel) => (
                          <label key={channel.key} className={"flex items-start gap-2 rounded-lg p-3 text-sm ring-1 transition " + (channel.enabled ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200")}>
                            <input
                              type="checkbox"
                              checked={channel.enabled}
                              onChange={(event) => updateRevenueChannel(channel.key, "enabled", event.target.checked)}
                              className="mt-0.5 h-4 w-4 accent-emerald-600"
                            />
                            <span>
                              <span className="block font-semibold">{channel.label}</span>
                              <span className="mt-0.5 block text-xs leading-5 opacity-80">
                                {channel.key === "delivery" ? "Attivalo solo se userai piattaforme o consegne." : channel.key === "takeaway" ? "Ordini ritirati dal cliente." : channel.key === "ordinary" ? "Ricavi ordinari in sede." : "Ricavi aggiuntivi da eventi."}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 rounded-lg border border-dashed border-teal-200 bg-teal-50/50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">Aggiungi canale</p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <input
                            list="additional-revenue-channel-presets"
                            value={newRevenueChannelLabel}
                            onChange={(event) => setNewRevenueChannelLabel(event.target.value)}
                            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                            placeholder="Scegli dalla tendina o scrivi un canale personalizzato"
                          />
                          <datalist id="additional-revenue-channel-presets">
                            {additionalRevenueChannelPresets.map((preset) => <option key={preset} value={preset} />)}
                          </datalist>
                          <button type="button" onClick={() => addRevenueChannel()} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
                            <Plus className="h-4 w-4" />
                            Aggiungi canale
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {activeStep === 1 ? (
              <div className="grid gap-5">
                <div className="grid gap-3 rounded-lg border border-teal-100 bg-teal-50/70 p-4 md:grid-cols-4">
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100">
                    <p className="text-xs font-semibold uppercase text-teal-600">Voci confermate</p>
                    <p className="mt-1 lp-card-value text-teal-950">{confirmedInvestmentCount}/{suggestedInvestmentCount}</p>
                    <p className="mt-1 text-xs text-teal-700">Solo queste entrano nei calcoli.</p>
                  </div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100">
                    <p className="text-xs font-semibold uppercase text-teal-600">Totale confermato</p>
                    <p className="mt-1 lp-card-value text-teal-950">{euro.format(investmentTotal)}</p>
                    <p className="mt-1 text-xs text-teal-700">Costo reale di partenza.</p>
                  </div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase text-slate-500">Totale suggerito</p>
                    <p className="mt-1 lp-card-value text-slate-950">{euro.format(suggestedInvestmentTotal)}</p>
                    <p className="mt-1 text-xs text-slate-500">Prima di togliere voci.</p>
                  </div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-amber-100">
                    <p className="text-xs font-semibold uppercase text-amber-600">Ammortamento anno 1</p>
                    <p className="mt-1 lp-card-value text-amber-950">{euro.format(amortizationAnnual)}</p>
                    <p className="mt-1 text-xs text-amber-700">Costo economico, non uscita di cassa.</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">Come si usa</p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                    <p className="rounded-md bg-slate-50 p-3"><strong>1. Leggi</strong><br />Le voci sono già pronte per aiutarti a non dimenticare costi importanti. Puoi anche inserire costi personalizzati non presenti nelle categorie predefinite.</p>
                    <p className="rounded-md bg-slate-50 p-3"><strong>2. Conferma</strong><br />Spunta solo le cose che comprerai davvero e correggi gli importi.</p>
                    <p className="rounded-md bg-slate-50 p-3"><strong>3. Stampa</strong><br />Puoi stampare i costi scelti o tutto il promemoria completo.</p>
                  </div>
                  <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/70 p-3 no-print">
                    <p className="text-sm font-semibold text-slate-950">Anteprima stampa A4</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Prima scegli cosa vuoi visualizzare: sotto vedi una pagina A4 grande, leggibile e già impaginata. La stampa si apre solo con il pulsante dedicato.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => showInvestmentPreview("selected")} className={"rounded-md px-3 py-2 text-sm font-semibold transition " + (investmentPrintMode === "selected" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-700")}>Anteprima costi scelti</button>
                      <button type="button" onClick={() => showInvestmentPreview("all")} className={"rounded-md px-3 py-2 text-sm font-semibold transition " + (investmentPrintMode === "all" ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-700")}>Anteprima promemoria completo</button>
                      <button type="button" onClick={() => printInvestments()} className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700">Stampa documento A4</button>
                    </div>
                  </div>
                </div>

                <div className="sticky top-[76px] z-10 rounded-lg border border-teal-100 bg-white/95 p-3 shadow-sm backdrop-blur no-print">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-tight text-slate-950">Categorie<br />costi</p>
                      <p className="text-xs leading-5 text-slate-500">Apri solo la tabella che ti serve. Quando una tabella è chiusa resta visibile la riga del titolo.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">{confirmedInvestmentCount} voci confermate</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{openInvestmentCategoriesCount}/{investmentRowsByCategory.length} tabelle aperte</span>
                      <button type="button" onClick={showAllInvestmentCategories} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700">Apri tutte</button>
                      <button type="button" onClick={hideUnselectedInvestmentCategories} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700">Apri solo scelte</button>
                    </div>
                  </div>
                  <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-label="Categorie investimenti">
                    {investmentRowsByCategory.map((group, groupIndex) => {
                      const confirmedRows = group.rows.filter((row) => row.item.confirmed).length;
                      const completionPct = group.rows.length ? (confirmedRows / group.rows.length) * 100 : 0;
                      const theme = investmentCategoryThemes[groupIndex % investmentCategoryThemes.length];
                      const isVisible = visibleInvestmentCategories[group.category] !== false;
                      return (
                        <button
                          key={group.category}
                          type="button"
                          onClick={() => toggleInvestmentCategory(group.category)}
                          className={"group rounded-lg border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md " + (isVisible ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70")}
                          title={isVisible ? "Clicca per chiudere la tabella. Il titolo resterà visibile." : "Clicca per aprire la tabella."}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className={(theme.title + " block truncate text-sm font-semibold")}>{group.category}</span>
                              <span className="mt-1 block text-xs text-slate-500">{confirmedRows} su {group.rows.length} voci selezionate</span>
                            </div>
                            <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + (isVisible ? "bg-teal-50 text-teal-700 ring-teal-100" : "bg-slate-100 text-slate-500 ring-slate-200")}>{isVisible ? "Aperta" : "Chiusa"}</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${completionPct}%` }} />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-slate-500">Totale categoria</span>
                            <span className="font-semibold text-slate-950">{euro.format(group.confirmedTotal)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {visibleInvestmentRowsByCategory.map((group) => {
                  const categoryTotalAll = group.rows.reduce((sum, row) => sum + row.total, 0);
                  const theme = investmentCategoryThemes[investmentRowsByCategory.findIndex((item) => item.category === group.category) % investmentCategoryThemes.length];
                  const isTableOpen = visibleInvestmentCategories[group.category] !== false;
                  return (
                    <div id={"investimenti-" + slugify(group.category)} key={group.category} className="scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                      <div className={"flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 " + theme.header}>
                        <div>
                          <h3 className={"text-base font-semibold " + theme.title}>{group.category}</h3>
                          <p className={"text-sm " + theme.meta}>{isTableOpen ? "Tabella aperta: conferma le voci utili e correggi gli importi." : "Tabella chiusa: il titolo resta visibile, puoi riaprirla quando serve."}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200">Categoria {euro.format(group.confirmedTotal)}</span>
                          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-700 ring-1 ring-teal-100">{investmentTotal ? ((group.confirmedTotal / investmentTotal) * 100).toFixed(1) : "0.0"}% del totale</span>
                          <button type="button" onClick={() => addInvestmentToCategory(group.category)} className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-white px-3 py-1.5 text-teal-700 transition hover:bg-teal-50"><Plus className="h-3.5 w-3.5" />Aggiungi costo</button>
                          <button type="button" onClick={() => toggleInvestmentCategory(group.category)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:border-teal-200 hover:text-teal-700">{isTableOpen ? "Nascondi tabella" : "Mostra tabella"}</button>
                        </div>
                      </div>
                      {isTableOpen ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1500px] text-left text-xs">
                          <thead className={"text-[11px] uppercase tracking-wide " + theme.thead}>
                            <tr>
                              <th className="px-2 py-1.5" title="Spunta questa voce solo se vuoi inserirla nei costi del progetto.">Conferma</th>
                              <th className="px-2 py-1.5" title="Spunta solo se il bene deve essere distribuito negli anni come costo economico.">Ammortizza</th>
                              <th className="w-[460px] px-2 py-1.5" title="Nome del costo. Scrivi parole normali e concrete: es. forno, sedie, insegna, frigo. Deve essere chiaro anche a chi non conosce la contabilità.">Voce</th>
                              <th className="px-2 py-1.5 text-right" title="Quanti pezzi o quante unità servono.">Quantità</th>
                              <th className="px-2 py-1.5 text-right" title="Prezzo senza IVA. Scrivi sempre con virgola e due decimali, esempio 1.250,00.">Prezzo netto</th>
                              <th className="px-2 py-1.5 text-right" title="Quantità moltiplicata per prezzo netto.">Totale</th>
                              <th className="px-2 py-1.5 text-right" title="Peso della voce rispetto alla sua categoria.">% categoria</th>
                              <th className="px-2 py-1.5 text-right" title="Peso della voce rispetto al totale degli investimenti confermati.">% totale</th>
                              <th className="px-2 py-1.5" title="Aliquota IVA applicata alla voce.">IVA</th>
                              <th className="px-2 py-1.5 text-right" title="Ammortamento lineare: il costo del bene viene diviso in parti uguali negli anni indicati. Valore base: 5 anni. Se spunti 50% anno 1, il primo anno pesa la metà.">Ammortamento<br />(anni)</th>
                              <th className="px-2 py-1.5">Ordina</th>
                              <th className="px-2 py-1.5">Elimina</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.rows.map(({ item, index, total }) => {
                              const categoryPct = categoryTotalAll ? (total / categoryTotalAll) * 100 : 0;
                              const totalPct = investmentTotal && item.confirmed ? (total / investmentTotal) * 100 : 0;
                              return (
                                <tr key={index} className={item.confirmed ? "bg-white" : "bg-slate-50 text-slate-700"}>
                                  <td className="px-2 py-1.5 align-top">
                                    <label className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                      <input type="checkbox" checked={item.confirmed} onChange={(event) => updateInvestment(index, "confirmed", event.target.checked)} className="h-4 w-4 accent-teal-600" />
                                      Usa
                                    </label>
                                  </td>
                                  <td className="px-2 py-1.5 align-top"><label className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"><input type="checkbox" checked={item.amortizable} onChange={(event) => updateInvestment(index, "amortizable", event.target.checked)} className="h-4 w-4 accent-teal-600" />Sì</label></td>
                                  <td className="px-2 py-1.5 align-top">
                                    <input value={item.description} onChange={(event) => updateInvestment(index, "description", event.target.value)} className="w-[460px] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-950 outline-none focus:border-teal-500" />
                                  </td>
                                  <td className="px-2 py-1.5 align-top"><input type="number" min="0" value={item.quantity} onChange={(event) => updateInvestment(index, "quantity", Number(event.target.value))} className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-teal-500" /></td>
                                  <td className="px-2 py-1.5 align-top"><MoneyInput value={item.unitPrice} onChange={(value) => updateInvestment(index, "unitPrice", value)} className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-teal-500" /></td>
                                  <td className="px-2 py-1.5 text-right align-top font-semibold text-slate-950">{euro.format(total)}</td>
                                  <td className="px-2 py-1.5 text-right align-top text-slate-600">{categoryPct.toFixed(1)}%</td>
                                  <td className="px-2 py-1.5 text-right align-top text-slate-600">{totalPct.toFixed(1)}%</td>
                                  <td className="px-2 py-1.5 align-top"><select value={item.vat} onChange={(event) => updateInvestment(index, "vat", Number(event.target.value))} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-teal-500">{[0, 4, 10, 22].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}</select></td>
                                  <td className="px-2 py-1.5 align-top"><input type="number" min="1" value={item.years} onChange={(event) => updateInvestment(index, "years", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td>
                                  <td className="px-2 py-1.5 align-top">
                                    <div className="flex gap-1">
                                      <button type="button" onClick={() => moveInvestment(index, -1)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Su</button>
                                      <button type="button" onClick={() => moveInvestment(index, 1)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Giù</button>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5 align-top">
                                    <button type="button" onClick={() => deleteInvestment(index)} className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Elimina</button>
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className={theme.footer + " font-semibold text-slate-950"}>
                              <td className="px-3 py-3" colSpan={4}>Totale categoria confermato</td>
                              <td className="px-3 py-3 text-right">{euro.format(group.confirmedTotal)}</td>
                              <td className="px-3 py-3 text-right">100%</td>
                              <td className="px-3 py-3 text-right">{investmentTotal ? ((group.confirmedTotal / investmentTotal) * 100).toFixed(1) : "0.0"}%</td>
                              <td className="px-3 py-3" colSpan={5}></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      ) : null}
                    </div>
                  );
                })}
                <div id="investment-print-preview" className="lp-print-preview-wrap scroll-mt-28">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 no-print">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Anteprima documento A4 reale</p>
                      <p className="text-xs text-slate-500">Questa è l’anteprima grande dentro l’app: puoi scorrerla e leggerla senza aprire la finestra della stampante.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{investmentPrintMode === "selected" ? "Costi scelti" : "Promemoria completo"}</span>
                  </div>
                  <div className="lp-print-area">
                  <h1>LaunchPilot - Costi investimento</h1>
                  <p>{investmentPrintMode === "selected" ? "Solo costi confermati dal cliente" : "Promemoria completo: tutte le voci disponibili"}</p>
                  {printInvestmentGroups.length === 0 ? (
                    <section className="print-section">
                      <h2>Nessuna voce confermata</h2>
                      <p>Per vedere l&apos;anteprima dei costi scelti, spunta prima la colonna Usa nelle righe di investimento. In alternativa usa Promemoria completo per vedere tutte le voci disponibili.</p>
                    </section>
                  ) : null}
                  {printInvestmentGroups.map((group) => {
                    const printTotal = group.rows.reduce((sum, row) => sum + (investmentPrintMode === "selected" ? row.total : row.item.confirmed ? row.total : 0), 0);
                    return (
                      <section key={group.category} className="print-section">
                        <h2>{group.category}</h2>
                        <table>
                          <thead><tr><th>Confermato</th><th>Voce</th><th>Quantità</th><th>Prezzo</th><th>Totale</th><th>IVA</th></tr></thead>
                          <tbody>
                            {group.rows.map(({ item, total }, rowIndex) => (
                              <tr key={rowIndex}><td>{item.confirmed ? "Sì" : "No"}</td><td>{item.description}</td><td>{item.quantity}</td><td>{euro.format(item.unitPrice)}</td><td>{item.confirmed || investmentPrintMode === "selected" ? euro.format(total) : "Da valutare"}</td><td>{item.vat}%</td></tr>
                            ))}
                            <tr><td colSpan={4}><strong>Totale categoria confermato</strong></td><td><strong>{euro.format(printTotal)}</strong></td><td></td></tr>
                          </tbody>
                        </table>
                      </section>
                    );
                  })}
                  </div>
                </div>
              </div>
            ) : activeStep === 4 ? (
              <div className="grid gap-5">
                <div className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 md:grid-cols-4">
                  <div className="rounded-md bg-white p-3 ring-1 ring-emerald-100"><p className="text-xs font-semibold uppercase text-emerald-600">Costi variabili</p><p className="lp-card-value-sm mt-1">{euro.format(selectedVariableGeneralTotal)}</p><p className="text-xs text-emerald-700">Energia, gas, POS, delivery e servizi.</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-emerald-100"><p className="text-xs font-semibold uppercase text-emerald-600">Food cost minimo</p><p className="lp-card-value-sm mt-1">{euro.format(selectedFoodCostTotal)}</p><p className="text-xs text-emerald-700">Magazzino food selezionato.</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-emerald-100"><p className="text-xs font-semibold uppercase text-emerald-600">Beverage</p><p className="lp-card-value-sm mt-1">{euro.format(selectedBeverageTotal)}</p><p className="text-xs text-emerald-700">{beverageOnAllSelectedCostsPct.toFixed(1)}% dei costi, {beverageCostActualPct.toFixed(1)}% del fatturato.</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-amber-100"><p className="text-xs font-semibold uppercase text-amber-600">Food + beverage / fatturato</p><p className="lp-card-value-sm mt-1">{foodBeverageRevenuePct.toFixed(1)}%</p><p className="text-xs text-amber-700">Sul fatturato mensile stimato.</p></div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Nota food cost.</strong> Nel food cost vanno considerati anche pasti del personale, assaggi, scarti, invenduto, differenze inventario e sprechi fisiologici. Per questo trovi righe dedicate da confermare o modificare.</div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Tabelle costi per categoria</p>
                    <p className="text-xs text-slate-500">Le categorie restano sempre visibili. Apri solo la tabella che vuoi compilare.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => showAllWorkflowCostCategories(variableWorkflowGroups, activeStep)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">Apri tutte</button>
                    <button type="button" onClick={() => hideUnselectedWorkflowCostCategories(variableWorkflowGroups, activeStep)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">Apri solo scelte</button>
                  </div>
                </div>
                {variableWorkflowGroups.map((group) => {
                  const isTableOpen = isWorkflowCostCategoryOpen(activeStep, group.category);
                  return (
                    <div key={group.category} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-emerald-50 px-4 py-3">
                        <div>
                          <h3 className="font-semibold text-emerald-950">{group.category}</h3>
                          <p className="text-sm text-emerald-700">Spunta le voci da includere, modifica importi e note. Le voci non selezionate restano come promemoria.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => toggleWorkflowCostCategory(activeStep, group.category)} className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">{isTableOpen ? "Nascondi tabella" : "Mostra tabella"}</button>
                          <button type="button" onClick={() => addWorkflowCost(group.category)} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"><Plus className="h-3.5 w-3.5" />Aggiungi voce</button>
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">Totale {euro.format(group.total)}</span>
                        </div>
                      </div>
                      {isTableOpen ? (
                        <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-emerald-600 text-xs uppercase tracking-wide text-white"><tr><th className="px-2 py-1.5">Usa</th><th className="px-2 py-1.5">Voce</th><th className="px-2 py-1.5 text-right">Importo</th><th className="px-2 py-1.5">IVA</th><th className="px-2 py-1.5 text-right">% fatturato</th><th className="px-2 py-1.5">Nota</th><th className="px-2 py-1.5">Tipo</th><th className="px-2 py-1.5">Elimina</th></tr></thead><tbody className="divide-y divide-slate-100">{group.rows.map((row) => { const kind = classifyWorkflowCost(row.stepIndex, row.category, row.label); const kindCopy = workflowCostKindCopy[kind]; const revenuePct = estimatedMonthlyRevenue ? (row.amount / estimatedMonthlyRevenue) * 100 : 0; return (<tr key={row.id} className={row.enabled ? "bg-white" : "bg-slate-50 text-slate-500"}><td className="px-2 py-1.5"><input type="checkbox" checked={row.enabled} onChange={(event) => updateWorkflowCost(row.id, "enabled", event.target.checked)} className="h-4 w-4 accent-emerald-600" /></td><td className="px-2 py-1.5"><input value={row.label} onChange={(event) => updateWorkflowCost(row.id, "label", event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-900 outline-none focus:border-emerald-500" /></td><td className="px-2 py-1.5"><MoneyInput value={row.amount} onChange={(value) => updateWorkflowCost(row.id, "amount", value)} className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 outline-none focus:border-emerald-500" /></td><td className="px-2 py-1.5"><select value={row.vat} onChange={(event) => updateWorkflowCost(row.id, "vat", Number(event.target.value))} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-emerald-500">{[0,4,10,22].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}</select></td><td className="px-2 py-1.5 text-right font-semibold text-slate-700">{revenuePct.toFixed(1)}%</td><td className="px-2 py-1.5"><input value={row.note} onChange={(event) => updateWorkflowCost(row.id, "note", event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 outline-none focus:border-emerald-500" /></td><td className="px-2 py-1.5"><span className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + kindCopy.className}>{kindCopy.label}</span></td><td className="px-2 py-1.5"><button type="button" onClick={() => deleteWorkflowCost(row.id)} className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Elimina</button></td></tr>); })}</tbody></table></div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : activeStep === 3 ? (
              <div className="grid gap-5">
                <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-950">Ruoli suggeriti per il locale</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Spunta solo le persone che pensi di utilizzare. Gli importi sono costi mensili azienda indicativi da contratti nazionali e pratica di mercato: il cliente può modificarli sempre.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Ruoli scelti</p><p className="lp-card-value-sm mt-1">{activeWorkflowSelected}</p></div><div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Costo mese</p><p className="lp-card-value-sm mt-1">{euro.format(activeWorkflowTotal)}</p></div><div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Costo anno stimato</p><p className="lp-card-value-sm mt-1">{euro.format(activeWorkflowTotal * 12)}</p></div></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Tabelle personale per categoria</p>
                    <p className="text-xs text-slate-500">Apri una categoria alla volta se vuoi lavorare in modo più ordinato.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => showAllWorkflowCostCategories(personnelWorkflowGroups, activeStep)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">Apri tutte</button>
                    <button type="button" onClick={() => hideUnselectedWorkflowCostCategories(personnelWorkflowGroups, activeStep)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">Apri solo scelte</button>
                  </div>
                </div>
                {personnelWorkflowGroups.map((group) => {
                  const isTableOpen = isWorkflowCostCategoryOpen(activeStep, group.category);
                  return (
                    <div key={group.category} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-sky-50 px-4 py-3">
                        <div>
                          <h3 className="font-semibold text-sky-950">{group.category}</h3>
                          <p className="text-sm text-sky-700">Conferma i ruoli utili e modifica costo mensile e descrizione.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => toggleWorkflowCostCategory(activeStep, group.category)} className="rounded-md border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50">{isTableOpen ? "Nascondi tabella" : "Mostra tabella"}</button>
                          <button type="button" onClick={() => addWorkflowCost(group.category)} className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"><Plus className="h-3.5 w-3.5" />Aggiungi voce</button>
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">Totale {euro.format(group.total)}</span>
                        </div>
                      </div>
                      {isTableOpen ? (
                        <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-sky-600 text-xs uppercase tracking-wide text-white"><tr><th className="px-2 py-1.5">Usa</th><th className="px-2 py-1.5">Ruolo</th><th className="px-2 py-1.5 text-right">Costo mese</th><th className="px-2 py-1.5">Periodo</th><th className="px-2 py-1.5">Nota</th><th className="px-2 py-1.5">Tipo</th><th className="px-2 py-1.5">Elimina</th></tr></thead><tbody className="divide-y divide-slate-100">{group.rows.map((row) => { const kind = classifyWorkflowCost(row.stepIndex, row.category, row.label); const kindCopy = workflowCostKindCopy[kind]; return (<tr key={row.id} className={row.enabled ? "bg-white" : "bg-slate-50 text-slate-500"}><td className="px-2 py-1.5"><input type="checkbox" checked={row.enabled} onChange={(event) => updateWorkflowCost(row.id, "enabled", event.target.checked)} className="h-4 w-4 accent-teal-600" /></td><td className="px-2 py-1.5"><input value={row.label} onChange={(event) => updateWorkflowCost(row.id, "label", event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-900 outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><MoneyInput value={row.amount} onChange={(value) => updateWorkflowCost(row.id, "amount", value)} className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><span className={(row.category.includes("Stagionale") ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-slate-100 text-slate-700 ring-slate-200") + " rounded-full px-2.5 py-1 text-xs font-semibold ring-1"}>{row.category.includes("Stagionale") ? "Stagionale / extra" : "Continuativo"}</span></td><td className="px-2 py-1.5"><input value={row.note} onChange={(event) => updateWorkflowCost(row.id, "note", event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><span className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + kindCopy.className}>{kindCopy.label}</span></td><td className="px-2 py-1.5"><button type="button" onClick={() => deleteWorkflowCost(row.id)} className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Elimina</button></td></tr>); })}</tbody></table></div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : activeStep === 7 ? (
              <div className="grid gap-5">
                <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-950">Scenari previsionali</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Aggiungi tutti gli scenari che vuoi: prudenziale, realistico, ottimistico, stagionale o personalizzato. Puoi modificare solo le ipotesi commerciali; clienti, fatturato, personale, costi fissi, margini e cassa vengono calcolati dal programma.</p>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[1520px] text-left text-sm">
                    <thead className="bg-teal-600 text-xs uppercase tracking-wide text-white">
                      <tr>
                        <th className="px-2 py-1.5" title="Nome dello scenario. È un campo libero: esempio Prudenziale, Realistico, Estate, Bassa stagione.">Scenario</th>
                        <th className="px-2 py-1.5" title="Descrizione breve dello scenario. Serve a ricordare la logica usata: prudente, base, ottimista o personalizzata.">Tipo</th>
                        <th className="px-2 py-1.5 text-right" title="Percentuale prudenziale di utilizzo della capacità annua disponibile. È un dato inserito dal cliente e modifica clienti, fatturato e margini.">Occup.</th>
                        <th className="px-2 py-1.5 text-right" title="Quanto spende mediamente una persona, IVA esclusa. È un'ipotesi inserita dal cliente; il valore suggerito è solo un aiuto.">Spesa media</th>
                        <th className="px-2 py-1.5 text-right" title="Costo materie prime sul fatturato. È un'ipotesi modificabile: include food, sprechi fisiologici e pasti personale se non separati.">Food cost</th>
                        <th className="px-2 py-1.5 text-right" title="Calcolato dalle voci confermate nello step Personale. Per cambiarlo devi modificare la tabella del personale, non lo scenario.">Personale annuo</th>
                        <th className="px-2 py-1.5 text-right" title="Calcolato dalle voci fisse confermate nelle tabelle costi. Per cambiarlo devi modificare le tabelle costi, non lo scenario.">Altri fissi</th>
                        <th className="px-2 py-1.5 text-right" title="Altri costi variabili in percentuale sul fatturato, oltre al food cost. Esempio POS, delivery, consumabili, packaging.">Altri var.</th>
                        <th className="px-2 py-1.5 text-right" title="Calcolato automaticamente: capacità annua disponibile moltiplicata per l'occupazione scelta. Non è modificabile qui.">Clienti annui</th>
                        <th className="px-2 py-1.5 text-right" title="Calcolato automaticamente: clienti annui moltiplicati per spesa media per persona. Non è modificabile direttamente.">Fatturato</th>
                        <th className="px-2 py-1.5 text-right" title="Calcolato automaticamente: fatturato meno food cost, altri variabili, personale e altri fissi. Non è modificabile direttamente.">Margine lordo</th>
                        <th className="px-2 py-1.5 text-right" title="Calcolato automaticamente: margine lordo meno rate annue dei finanziamenti. Non è modificabile direttamente.">Cassa dopo rate</th>
                        <th className="px-2 py-1.5" title="Elimina solo lo scenario selezionato. Deve restarne almeno uno.">Elimina</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenueScenarioRows.map((scenario) => (
                        <tr key={scenario.key}>
                          <td className="px-2 py-1.5 align-top">
                            <input value={scenario.label} onChange={(event) => updateRevenueScenario(scenario.key, "label", event.target.value)} className="w-52 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-900 outline-none focus:border-teal-500" />
                            <span className="mt-1 block text-xs text-slate-400">{scenario.key} · capacità {Math.round(scenario.annualCapacity).toLocaleString("it-IT")}</span>
                          </td>
                          <td className="px-2 py-1.5 align-top"><input value={scenario.tone} onChange={(event) => updateRevenueScenario(scenario.key, "tone", event.target.value)} className="w-40 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 outline-none focus:border-teal-500" /></td>
                          <td className="px-2 py-1.5 align-top"><input type="number" min="0" max="100" value={scenario.occupancyPct} onChange={(event) => updateRevenueScenario(scenario.key, "occupancyPct", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td>
                          <td className="px-2 py-1.5 align-top"><MoneyInput value={scenario.averageTicket} onChange={(value) => updateRevenueScenario(scenario.key, "averageTicket", value)} className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs outline-none focus:border-teal-500" /><span className="mt-1 block text-right text-[11px] text-slate-400">Sug. {euro.format(getSuggestedAverageTicket(scenario.key))}</span></td>
                          <td className="px-2 py-1.5 align-top"><div className="flex items-center justify-end gap-1"><input type="number" min="0" max="100" step="0.1" value={scenario.foodCostPct} onChange={(event) => updateRevenueScenario(scenario.key, "foodCostPct", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right outline-none focus:border-teal-500" /><span className="text-xs font-semibold text-slate-500">%</span></div><span className="mt-1 block text-right text-[11px] text-slate-400">Sug. {getSuggestedFoodCost(scenario.key).toFixed(1)}%</span></td>
                          <td className="px-2 py-1.5 align-top text-right font-semibold text-slate-700" title="Calcolato dalle voci confermate nello step Personale. Per modificarlo, torna alla tabella del personale.">{euro.format(scenario.personnelAnnual)}<span className="block text-[11px] font-normal text-slate-400">calcolato</span></td>
                          <td className="px-2 py-1.5 align-top text-right font-semibold text-slate-700" title="Calcolato dalle voci fisse confermate nelle tabelle costi. Per modificarlo, torna agli step costi/investimenti.">{euro.format(scenario.otherFixedAnnual)}<span className="block text-[11px] font-normal text-slate-400">calcolato</span></td>
                          <td className="px-2 py-1.5 align-top"><input type="number" min="0" max="100" step="0.1" value={scenario.otherVariablePct} onChange={(event) => updateRevenueScenario(scenario.key, "otherVariablePct", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td>
                          <td className="px-2 py-1.5 text-right align-top font-medium text-slate-700">{Math.round(scenario.customers).toLocaleString("it-IT")}<span className="block text-xs text-slate-400">{scenario.coversPerDay.toFixed(0)} giorno</span></td>
                          <td className="px-2 py-1.5 text-right align-top font-semibold">{euro.format(scenario.revenue)}</td>
                          <td className={`px-2 py-1.5 text-right align-top font-semibold ${scenario.ebitda >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{euro.format(scenario.ebitda)}</td>
                          <td className={`px-2 py-1.5 text-right align-top font-semibold ${scenario.cashResult >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{euro.format(scenario.cashResult)}</td>
                          <td className="px-2 py-1.5 align-top"><button type="button" onClick={() => deleteRevenueScenario(scenario.key)} disabled={revenueScenarios.length <= 1} className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">Elimina</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {revenueScenarioRows.map((scenario) => (
                    <div key={scenario.key} className="rounded-md bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                      <p className="font-semibold text-slate-950">{scenario.label}</p>
                      <p className="mt-1">Con {effectiveOpeningDaysAnnual} giorni, {venuePeakSeats} posti e {scenario.servicesPerDay} servizi, servono {scenario.occupancyPct.toFixed(0)}% di occupazione per arrivare a {Math.round(scenario.customers).toLocaleString("it-IT")} clienti annui.</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeStep === 6 ? null : (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {activeWorkflowGroups.map((group) => (
                    <button
                      key={group.category}
                      type="button"
                      onClick={() => addWorkflowCost(group.category)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Aggiungi in {group.category}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-1.5">Usa</th>
                      <th className="px-2 py-1.5">Voce</th>
                      <th className="px-2 py-1.5">Categoria</th>
                      <th className="px-2 py-1.5">Importo</th>
                      <th className="px-2 py-1.5">IVA</th>
                      <th className="px-2 py-1.5">Classificazione</th>
                      <th className="px-2 py-1.5">Tipo</th>
                      <th className="px-2 py-1.5">Suggerimento</th>
                      <th className="px-2 py-1.5">Elimina</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeWorkflowRows.map((row) => {
                      const kind = classifyWorkflowCost(row.stepIndex, row.category, row.label);
                      const kindCopy = workflowCostKindCopy[kind];

                      return (
                      <tr key={row.id} className={row.enabled ? "bg-white" : "bg-slate-50/70 text-slate-400"}>
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(event) => updateWorkflowCost(row.id, "enabled", event.target.checked)}
                            className="h-4 w-4 accent-teal-600"
                            aria-label={"Usa " + row.label}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={row.label}
                            onChange={(event) => updateWorkflowCost(row.id, "label", event.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-900 outline-none transition focus:border-teal-500 disabled:bg-slate-50"
                            disabled={!row.enabled}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={row.category}
                            onChange={(event) => updateWorkflowCost(row.id, "category", event.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 outline-none transition focus:border-teal-500 disabled:bg-slate-50"
                            disabled={!row.enabled}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <MoneyInput
                            value={row.amount}
                            onChange={(value) => updateWorkflowCost(row.id, "amount", value)}
                            className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 outline-none transition focus:border-teal-500 disabled:bg-slate-50"
                            disabled={!row.enabled}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={row.vat}
                            onChange={(event) => updateWorkflowCost(row.id, "vat", Number(event.target.value))}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 outline-none transition focus:border-teal-500 disabled:bg-slate-50"
                            disabled={!row.enabled}
                          >
                            {[0, 4, 10, 22].map((rate) => (
                              <option key={rate} value={rate}>{rate}%</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + kindCopy.className}>
                            {kindCopy.label}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (row.custom ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-teal-50 text-teal-700 ring-1 ring-teal-200")}>
                            {row.custom ? "Manuale" : "Preset"}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={row.note}
                            onChange={(event) => updateWorkflowCost(row.id, "note", event.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-600 outline-none transition focus:border-teal-500 disabled:bg-slate-50"
                            disabled={!row.enabled}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => deleteWorkflowCost(row.id)} className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                            Elimina
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </section>

          <section className={(activePage === "workflow" && activeStep === 6 ? "" : "hidden ") + "grid gap-6 xl:grid-cols-[1fr_360px]"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Smart Break Even Point</p>
                  <p className="text-sm text-slate-500">
                    La scheda calcola il punto di pareggio in modo pratico: clienti/giorno, spesa media per persona, fasce orarie, delivery e stagionalità si aggiornano in tempo reale.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={confirmActiveStep}
                    disabled={!isActiveStepReady}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Conferma step
                  </button>
                  {confirmedSteps[activeStep] ? (
                    <button
                      type="button"
                      onClick={unconfirmActiveStep}
                      className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      Togli conferma
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => addWorkflowCost("Altro")}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
                  >
                    <Plus className="h-4 w-4" />
                    Aggiungi voce
                  </button>
                </div>
              </div>
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Inserisci qui solo le leve di ricavo e margine: spesa media per persona, giorni apertura mese usati per il BEP e costo materie prime. Coperti medi, costo lavoro e costi fissi vengono calcolati dal programma usando anagrafica, scenario realistico e tabelle già compilate.
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField
                  label="Spesa media per persona"
                  value={inputs.averageTicket}
                  suffix="EUR"
                  onChange={(value) => updateInput("averageTicket", value)}
                />
                <NumberField
                  label="Giorni apertura mese"
                  value={inputs.openingDays}
                  max={31}
                  onChange={(value) => updateInput("openingDays", value)}
                />
                <NumberField
                  label="Costo materie prime"
                  value={inputs.foodCostPct}
                  suffix="%"
                  max={100}
                  onChange={(value) => updateInput("foodCostPct", value)}
                />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" title="Calcolato dalle tabelle personale confermate nello step Personale.">
                  <p className="text-sm font-medium text-slate-600">Costo lavoro mese</p>
                  <p className="lp-card-value mt-2 text-slate-950">{euro.format(calculatedLaborCostMonthly)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Da tabella personale. Non si modifica qui.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" title="Calcolato dalle voci fisse confermate nelle tabelle costi.">
                  <p className="text-sm font-medium text-slate-600">Costi fissi mese</p>
                  <p className="lp-card-value mt-2 text-slate-950">{euro.format(calculatedFixedCostsMonthly)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Da tabelle costi. Non si modifica qui.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-950">Pasto principale</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">Scegli la fascia che pesa di più sui ricavi. Il flag è singolo: colazione, pranzo, aperitivo o cena.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {serviceBandDefinitions.map((band) => (
                      <label key={band.key} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input type="radio" name="main-service-band" checked={mainServiceBand === band.key} onChange={() => setMainServiceBand(band.key)} className="h-4 w-4 accent-teal-600" />
                        {band.label}
                      </label>
                    ))}
                  </div>
                  <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                    Peso {mainServiceLabel.toLowerCase()}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={inputs.lunchShare}
                      onChange={(event) =>
                        updateInput("lunchShare", Number(event.target.value))
                      }
                      className="accent-teal-600"
                    />
                    <span className="text-xs text-slate-500">
                      {mainServiceLabel} {inputs.lunchShare}%: {Math.round(mainServiceCovers)} coperti,
                      {` ${euro.format(mainServiceRevenue)}`}
                    </span>
                  </label>
                </div>
                <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                  Altre fasce {100 - inputs.lunchShare}%: {Math.round(otherServicesCovers)} coperti,
                  {` ${euro.format(otherServicesRevenue)}`} al mese.
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-teal-100 bg-teal-50/60 p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Smart Break Even Point</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">Punto di pareggio letto da più angoli</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">Margine per persona {euro.format(contributionPerReceipt)}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {smartBepRows.map((row) => (
                    <div key={row.label} className="rounded-md bg-white p-3 ring-1 ring-teal-100">
                      <p className="text-xs font-semibold uppercase text-slate-400">{row.label}</p>
                      <p className="mt-1 lp-card-value text-slate-950">{row.value}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100">
                    <p className="mb-3 text-sm font-semibold text-slate-950">Pareggio per fasce e canali</p>
                    <div className="h-64">
                      {mounted && activePage === "workflow" ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={200}>
                          <BarChart data={smartBepChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartShell />
                      )}
                    </div>
                  </div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100">
                    <p className="mb-3 text-sm font-semibold text-slate-950">Costi da coprire</p>
                    <div className="h-64">
                      {mounted && activePage === "workflow" ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={200}>
                          <BarChart data={breakEvenCostChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                            <Tooltip formatter={(value) => euro.format(Number(value))} />
                            <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartShell />
                      )}
                    </div>
                  </div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100">
                    <p className="mb-3 text-sm font-semibold text-slate-950">Occupazione minima stagionale</p>
                    <div className="h-64">
                      {mounted && activePage === "workflow" ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={200}>
                          <BarChart data={breakEvenSeasonChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis unit="%" />
                            <Tooltip formatter={(value) => `${Number(value).toFixed(0)}%`} />
                            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartShell />
                      )}
                    </div>
                  </div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100">
                    <p className="mb-3 text-sm font-semibold text-slate-950">Risultato al variare dei coperti</p>
                    <div className="h-64">
                      {mounted && activePage === "workflow" ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={200}>
                          <AreaChart data={breakEvenVolumeChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                            <Tooltip formatter={(value) => euro.format(Number(value))} />
                            <Area type="monotone" dataKey="Ricavi" stroke="#0f766e" fill="#ccfbf1" strokeWidth={2} />
                            <Area type="monotone" dataKey="Margine" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartShell />
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm lg:grid-cols-3">
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="font-semibold text-slate-950">BEP stagionale</p><p className="mt-1 text-slate-600">Estate: occupazione minima {summerBreakEvenOccupancy.toFixed(0)}%</p><p className="text-slate-600">Inverno: occupazione minima {winterBreakEvenOccupancy.toFixed(0)}%</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="font-semibold text-slate-950">Delivery</p><p className="mt-1 text-slate-600">Gli ordini delivery partono da una spesa media di {euro.format(deliveryAverageTicket)}. Le commissioni stimate al {Math.round(deliveryCommissionRate * 100)}% riducono il margine: per questo il programma calcola l&apos;incasso netto, non solo il valore dell&apos;ordine.</p></div>
                  <div className="rounded-md bg-white p-3 ring-1 ring-teal-100"><p className="font-semibold text-slate-950">Lettura semplice</p><p className="mt-1 text-slate-600">Se i clienti/giorno richiesti superano la capacità reale, il problema non è solo il prezzo: serve rivedere costi, personale o format.</p></div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600" />
                <p className="font-semibold">AI suggerisce</p>
              </div>
              <div className="space-y-3">
                {advisor.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>



          <section className={(activePage === "finance" ? "" : "hidden ") + "space-y-6"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Fonti di finanziamento</p>
                  <h2 className="mt-1 lp-card-value-sm text-slate-950">Il progetto genera abbastanza cassa per pagare il debito?</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Mezzi propri, banca, leasing, noleggio e contributi vengono letti insieme per calcolare rata, debito residuo, interessi e Copertura debito.</p>
                </div>
                <button type="button" onClick={() => addFinancingSource("other")} className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"><Plus className="h-4 w-4" />Aggiungi fonte</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard icon={BadgeEuro} label="Investimento totale" value={euro.format(investmentTotal)} detail="Impieghi da coprire" tone="blue" />
                <KpiCard icon={Users} label="Capitale proprio" value={euro.format(ownCapital)} detail="Mezzi dei soci" tone="green" />
                <KpiCard icon={Banknote} label="Debito richiesto" value={euro.format(financingAmount)} detail="Banca, leasing, noleggio o terzi" tone="slate" />
                <KpiCard icon={Gauge} label="Copertura debito minima" value={(minDscrRow?.dscr ?? kpis.dscr).toFixed(2)} detail={dscrCopy.text} tone={(minDscrRow?.dscr ?? kpis.dscr) < 1.2 ? "red" : "green"} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="min-w-0 rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Rata mensile</p><p className="lp-card-value">{euro.format(totalMonthlyDebtService)}</p></div>
                <div className="min-w-0 rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Interessi totali banca</p><p className="lp-card-value">{euro.format(totalInterest)}</p></div>
                <div className="min-w-0 rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Fabbisogno liquidità</p><p className="lp-card-value">{euro.format(ownCapitalNeeded)}</p></div>
                <div className="min-w-0 rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Debito residuo fine piano</p><p className="lp-card-value">{euro.format(debtResidualFinal)}</p></div>
              </div>
              <div className="mt-4 rounded-md border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-900">Una rata di finanziamento non è tutta un costo. Solo gli interessi vanno nel conto economico. La quota capitale riduce il debito ma pesa sulla liquidità.</div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo fabbisogno finanziario iniziale</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">Quanta cassa serve davvero per partire?</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Include liquidità iniziale, scorte, capitale circolante, perdite dei primi mesi e liquidità di sicurezza.</p>
                </div>
                <span className={"rounded-full px-3 py-1.5 text-xs font-semibold ring-1 " + (liquidityStressLevel.tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-200" : liquidityStressLevel.tone === "yellow" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{liquidityStressLevel.label}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard icon={BadgeEuro} label="Fabbisogno reale" value={euro.format(initialFinancialNeed)} detail="Investimenti + avvio + liquidità di sicurezza" tone="blue" />
                <KpiCard icon={Banknote} label="Copertura disponibile" value={euro.format(availableInitialFunding)} detail="Mezzi propri, debito, contributi certi e cassa" tone="green" />
                <KpiCard icon={AlertTriangle} label="Gap iniziale" value={euro.format(initialFundingGap)} detail="Da coprire prima dell'apertura" tone={initialFundingGap > 0 ? "red" : "green"} />
                <KpiCard icon={Activity} label="Cassa minima 6 mesi" value={euro.format(sixMonthMinimumCash)} detail="Punto più basso simulato" tone={sixMonthMinimumCash < safetyReserve ? "red" : "green"} />
              </div>
              <div className={"mt-5 rounded-md p-4 text-sm font-medium ring-1 " + (liquidityStressLevel.tone === "red" ? "bg-rose-50 text-rose-800 ring-rose-100" : liquidityStressLevel.tone === "yellow" ? "bg-amber-50 text-amber-800 ring-amber-100" : "bg-emerald-50 text-emerald-800 ring-emerald-100")}>
                {liquidityStressLevel.text}
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.95fr]">
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-1.5">Voce</th><th className="px-2 py-1.5 text-right">Importo</th><th className="px-2 py-1.5">Perché serve</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{initialNeedRows.map((row) => (<tr key={row.name}><td className="px-3 py-2 font-medium text-slate-950">{row.name}</td><td className="px-3 py-2 text-right font-semibold">{euro.format(row.value)}</td><td className="px-3 py-2 text-slate-500">{row.note}</td></tr>))}</tbody>
                  </table>
                </div>
                <div className="h-72 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {mounted && activePage === "finance" ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                      <BarChart data={initialNeedRows} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartShell />
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">1. Fonti e coperture</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Modifica le fonti del progetto</h3></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600" title="I contributi non confermati sono ponderati per probabilità e non trattati come cassa certa.">Contributi ponderati: {euro.format(weightedGrants)}</span></div>
              <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1280px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-1.5">Tipo</th><th className="px-2 py-1.5">Nome fonte</th><th className="px-2 py-1.5 text-right">Importo</th><th className="px-2 py-1.5 text-right">Durata</th><th className="px-2 py-1.5 text-right">TAN</th><th className="px-2 py-1.5 text-right">TAEG</th><th className="px-2 py-1.5 text-right">Rata</th><th className="px-2 py-1.5">Periodicità</th><th className="px-2 py-1.5 text-right">Preamm.</th><th className="px-2 py-1.5">Garanzie / Probabilità</th><th className="px-2 py-1.5">Note</th></tr></thead><tbody className="divide-y divide-slate-100">{calculatedFinancingSources.map((source) => (<tr key={source.id}><td className="px-2 py-1.5"><select value={source.type} onChange={(event) => updateFinancingSource(source.id, "type", event.target.value)} className="w-40 rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500">{Object.entries(financingSourceLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></td><td className="px-2 py-1.5"><input value={source.name} onChange={(event) => updateFinancingSource(source.id, "name", event.target.value)} className="w-52 rounded-md border border-slate-200 px-2 py-1.5 font-medium outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><MoneyInput value={source.amount} onChange={(value) => updateFinancingSource(source.id, "amount", value)} className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><input type="number" min="0" value={source.durationMonths} onChange={(event) => updateFinancingSource(source.id, "durationMonths", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><input type="number" min="0" value={source.annualRate} onChange={(event) => updateFinancingSource(source.id, "annualRate", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><input type="number" min="0" value={source.taeg} onChange={(event) => updateFinancingSource(source.id, "taeg", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td><td className="px-3 py-2 text-right font-semibold">{euro.format(source.monthlyPayment)}</td><td className="px-2 py-1.5"><select value={source.paymentFrequency} onChange={(event) => updateFinancingSource(source.id, "paymentFrequency", event.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500"><option>Mensile</option><option>Trimestrale</option><option>Annuale</option><option>Una tantum</option></select></td><td className="px-2 py-1.5"><input type="number" min="0" value={source.gracePeriodMonths} onChange={(event) => updateFinancingSource(source.id, "gracePeriodMonths", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5">{source.type === "grant" ? (<select value={source.probability} onChange={(event) => updateFinancingSource(source.id, "probability", event.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500"><option>basso</option><option>medio</option><option>alto</option><option>confermato</option></select>) : (<input value={source.guarantees} onChange={(event) => updateFinancingSource(source.id, "guarantees", event.target.value)} className="w-56 rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500" />)}</td><td className="px-2 py-1.5"><input value={source.notes} onChange={(event) => updateFinancingSource(source.id, "notes", event.target.value)} className="w-64 rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500" /></td></tr>))}</tbody></table></div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">2. Piano ammortamento finanziario</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Sintesi anno per anno</h3><div className="mt-4 overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-1.5">Anno</th><th className="px-2 py-1.5 text-right">Capitale iniziale</th><th className="px-2 py-1.5 text-right">Quote capitale</th><th className="px-2 py-1.5 text-right">Quote interessi</th><th className="px-2 py-1.5 text-right">Rate pagate</th><th className="px-2 py-1.5 text-right">Debito residuo</th></tr></thead><tbody className="divide-y divide-slate-100">{bankLoanSchedule.annual.map((row) => (<tr key={row.year}><td className="px-3 py-2 font-medium">{row.year}</td><td className="px-2 py-1.5 text-right">{euro.format(row.openingBalance)}</td><td className="px-2 py-1.5 text-right">{euro.format(row.principalAmount)}</td><td className="px-2 py-1.5 text-right">{euro.format(row.interestAmount)}</td><td className="px-3 py-2 text-right font-semibold">{euro.format(row.paymentAmount)}</td><td className="px-2 py-1.5 text-right">{euro.format(row.closingBalance)}</td></tr>))}</tbody></table></div></div><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Alert intelligenti</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Sostenibilità finanziaria</h3><div className="mt-4 space-y-3">{financingAlerts.map((alert) => (<div key={alert.text} className={"rounded-md p-3 text-sm font-medium ring-1 " + (alert.tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-200" : alert.tone === "yellow" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{alert.text}</div>))}</div></div></div>

            <div className="grid gap-6 xl:grid-cols-2"><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold">Andamento debito residuo</p><div className="mt-4 h-64">{mounted && activePage === "finance" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}><AreaChart data={bankLoanSchedule.annual}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" /><YAxis /><Tooltip /><Area type="monotone" dataKey="closingBalance" stroke="#0f766e" fill="#ccfbf1" strokeWidth={2} /></AreaChart></ResponsiveContainer>) : (<ChartShell />)}</div></div><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold">Quota capitale vs quota interessi</p><div className="mt-4 h-64">{mounted && activePage === "finance" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}><BarChart data={bankLoanSchedule.annual}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" /><YAxis /><Tooltip /><Bar dataKey="principalAmount" fill="#0f766e" radius={[4,4,0,0]} /><Bar dataKey="interestAmount" fill="#f59e0b" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>) : (<ChartShell />)}</div></div><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold">Copertura debito anno per anno</p><div className="mt-4 h-64">{mounted && activePage === "finance" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}><BarChart data={dscrAnnualRows}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" /><YAxis /><Tooltip /><Bar dataKey="dscr" fill="#10b981" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>) : (<ChartShell />)}</div></div><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold">Fonti copertura investimenti</p><div className="mt-4 h-64">{mounted && activePage === "finance" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}><BarChart data={fundingCoverageData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0d9488" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>) : (<ChartShell />)}</div></div></div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">3. Scenari finanziari</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Prudente, base, ottimistico</h3><div className="mt-4 grid gap-3 md:grid-cols-3">{financingScenarios.map((scenario) => (<div key={scenario.name} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"><p className="font-semibold text-slate-950">{scenario.name}</p><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Rata</span><strong className="lp-inline-value">{euro.format(scenario.payment)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Copertura debito</span><strong className={scenario.dscr < 1.2 ? "text-rose-700" : "text-emerald-700"}>{scenario.dscr.toFixed(2)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Liquidità richiesta</span><strong className="lp-inline-value">{euro.format(scenario.liquidityNeed)}</strong></div></div></div>))}</div></div>
          </section>

          <section className={(activePage === "finance" ? "" : "hidden ") + "space-y-6"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Investimenti e ammortamenti</p>
                  <h2 className="mt-1 lp-card-value-sm text-slate-950">Capire cosa esce di cassa e cosa pesa sul conto economico</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                    L&apos;investimento iniziale è denaro che esce subito. L&apos;ammortamento invece distribuisce nel tempo il costo economico del bene.
                  </p>
                </div>
                <button
                  onClick={addInvestment}
                  className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
                  title="Aggiungi un nuovo bene ammortizzabile o una voce personalizzata"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi bene
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="min-w-0 rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Investimento iniziale</p><p className="lp-card-value">{euro.format(investmentTotal)}</p><p className="mt-1 text-xs text-slate-500">Cash out iniziale</p></div>
                <div className="min-w-0 rounded-md bg-teal-50 p-4 ring-1 ring-teal-100"><p className="text-sm text-teal-700">Ammortamento anno 1</p><p className="lp-card-value text-teal-950">{euro.format(amortizationAnnual)}</p><p className="mt-1 text-xs text-teal-700">Costo economico annuo</p></div>
                <div className="min-w-0 rounded-md bg-emerald-50 p-4 ring-1 ring-emerald-100"><p className="text-sm text-emerald-700">Risparmio fiscale stimato</p><p className="lp-card-value text-emerald-950">{euro.format(depreciationTaxSaving)}</p><p className="mt-1 text-xs text-emerald-700">Ipotesi aliquota 28%</p></div>
                <div className="min-w-0 rounded-md bg-amber-50 p-4 ring-1 ring-amber-100"><p className="text-sm text-amber-700">Investimenti / fatturato</p><p className="lp-card-value text-amber-950">{investmentRevenueRatio.toFixed(1)}%</p><p className="mt-1 text-xs text-amber-700">Lettura bancaria</p></div>
                <div className="min-w-0 rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Copertura debito simulata</p><p className="lp-card-value">{kpis.dscr.toFixed(2)}</p><p className="mt-1 text-xs text-slate-500">Dopo le rate</p></div>
              </div>
              <div className="mt-4 rounded-md border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-900">
                Gli ammortamenti influenzano l&apos;utile ma non generano un&apos;uscita di cassa annuale. La cassa esce quando compri il bene; il costo economico viene distribuito negli anni.
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">1. Investimenti iniziali</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">Beni, vita utile e aliquota</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600" title="Il primo anno al 50% è una semplificazione prudenziale usata spesso nei business plan.">Primo anno 50% suggerito</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[1520px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="w-72 px-2 py-1.5">Categoria</th><th className="w-[500px] px-2 py-1.5">Descrizione</th><th className="px-2 py-1.5 text-right">Importo</th><th className="px-2 py-1.5 text-right" title="Ammortamento lineare: il costo del bene viene distribuito in parti uguali negli anni indicati. Valore base: 5 anni.">Ammortamento<br />(anni)</th><th className="px-2 py-1.5 text-right" title="Percentuale annua collegata agli anni di ammortamento. Esempio: 5 anni = 20% annuo.">Aliquota</th><th className="px-3 py-2 text-center" title="Opzione prudenziale: nel primo anno il costo economico viene considerato al 50%.">50% anno 1</th><th className="px-2 py-1.5 text-right">Amm. annuo</th><th className="px-2 py-1.5 text-right">Valore residuo</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {amortizationRows.map((item, index) => (
                      <tr key={item.description + index}>
                        <td className="px-2 py-1.5"><select value={item.category} onChange={(event) => updateInvestment(index, "category", event.target.value)} className="w-72 rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-teal-500">{amortizationCategoryPresets.map((preset) => <option key={preset.category}>{preset.category}</option>)}</select></td>
                        <td className="px-2 py-1.5"><input value={item.description} onChange={(event) => updateInvestment(index, "description", event.target.value)} className="w-[500px] rounded-md border border-slate-200 px-2 py-1.5 font-medium text-slate-900 outline-none focus:border-teal-500" /></td>
                        <td className="px-2 py-1.5"><MoneyInput value={item.unitPrice} onChange={(value) => updateInvestment(index, "unitPrice", value)} className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-teal-500" /></td>
                        <td className="px-2 py-1.5"><input type="number" min="1" value={item.years} onChange={(event) => updateInvestment(index, "years", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td>
                        <td className="px-2 py-1.5"><input type="number" min="0" value={item.depreciationRate} onChange={(event) => updateInvestment(index, "depreciationRate", Number(event.target.value))} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-right outline-none focus:border-teal-500" /></td>
                        <td className="px-3 py-2 text-center"><input type="checkbox" checked={item.firstYearHalf} onChange={(event) => updateInvestment(index, "firstYearHalf", event.target.checked)} className="h-4 w-4 accent-teal-600" title="Riduce l'ammortamento del primo anno al 50%" /></td>
                        <td className="px-3 py-2 text-right font-semibold">{euro.format(item.annual)}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{euro.format(item.residualAfterYear)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">2. Piano ammortamenti</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Valore residuo e costo annuo</h3>
                <p className="mt-1 text-sm text-slate-500">Il piano mostra quanto costo economico entra ogni anno e quanto valore rimane nei beni.</p>
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-1.5">Anno</th><th className="px-2 py-1.5 text-right">Ammortamenti</th><th className="px-2 py-1.5 text-right">Valore residuo</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{depreciationPlan.slice(0, 10).map((row) => (<tr key={row.year}><td className="px-3 py-2 font-medium">{row.year}</td><td className="px-2 py-1.5 text-right">{euro.format(row.depreciation)}</td><td className="px-2 py-1.5 text-right">{euro.format(row.residual)}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold">Evoluzione valore residuo beni</p><div className="mt-4 h-56">{mounted && activePage === "finance" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={180}><AreaChart data={depreciationPlan}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Area type="monotone" dataKey="residual" stroke="#0f766e" fill="#ccfbf1" strokeWidth={2} /></AreaChart></ResponsiveContainer>) : (<ChartShell />)}</div></div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold">Impatto ammortamenti negli anni</p><div className="mt-4 h-56">{mounted && activePage === "finance" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={180}><BarChart data={depreciationPlan}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="depreciation" fill="#10b981" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>) : (<ChartShell />)}</div></div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">3. Impatto economico</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Cash out iniziale vs costo economico</h3>
                <div className="mt-4 h-72">{mounted && activePage === "finance" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}><BarChart data={cashVsEconomicData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0f766e" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>) : (<ChartShell />)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">AI suggerisce</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Suggerimenti automatici</h3>
                <div className="mt-4 space-y-3">{investmentAdvisor.map((tip) => (<div key={tip} className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">{tip}</div>))}</div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">4. Impatto finanziario</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Acquisto, leasing o noleggio operativo</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">{assetStrategyOptions.map((option) => (<button key={option.key} type="button" onClick={() => setAssetStrategy(option.key)} className={"rounded-lg border p-4 text-left transition " + (assetStrategy === option.key ? "border-teal-300 bg-teal-50 text-teal-950" : "border-slate-200 bg-white text-slate-700 hover:border-teal-200")}><p className="font-semibold">{option.label}</p><p className="mt-2 text-sm">Uscita iniziale {euro.format(option.initialCashOut)}</p><p className="text-sm">Costo/cassa annua {euro.format(option.annualCashOut)}</p><p className="mt-2 text-xs text-slate-500">{option.note}</p></button>))}</div>
              <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">Scenario selezionato: <strong className="text-slate-950">{selectedAssetStrategy.label}</strong>. Impatto economico annuo stimato {euro.format(selectedAssetStrategy.annualEconomicCost)}.</div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Valutazione sostenibilità investimenti</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Lettura bancaria semplificata</h3>
                <div className="mt-4 grid gap-3">{investmentAlerts.map((alert) => (<div key={alert.text} className={"rounded-md p-3 text-sm font-medium ring-1 " + (alert.tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-200" : alert.tone === "yellow" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{alert.text}</div>))}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">5. Scenario fiscale</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Effetto fiscale stimato</h3>
                <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Ammortamento deducibile</span><strong className="lp-inline-value">{euro.format(amortizationAnnual)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Risparmio fiscale stimato</span><strong className="lp-inline-value">{euro.format(depreciationTaxSaving)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Risultato operativo dopo ammortamenti</span><strong className={ebitAnnual >= 0 ? "text-emerald-700" : "text-rose-700"}>{euro.format(ebitAnnual)}</strong></div></div>
                <p className="mt-4 rounded-md bg-teal-50 p-3 text-xs leading-5 text-teal-900">Stima semplificata per business plan: non sostituisce il calcolo fiscale del commercialista, ma aiuta a leggere sostenibilità e utile operativo.</p>
              </div>
            </div>
          </section>

          <section className={(activePage === "whatif" ? "" : "hidden ") + "space-y-6"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo simulazioni What If</p>
                  <h2 className="mt-1 lp-card-value-sm text-slate-950">Muovi i cursori e guarda l&apos;effetto in tempo reale</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Simula subito variazioni su fatturato, affitto, energia, materie prime, personale e spesa media. Il sistema aggiorna utile, copertura debito, cash flow e punto di pareggio.
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">Realtime</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <RangeField label="Affitto" value={whatIf.rentIncreasePct} min={0} max={30} onChange={(value) => updateWhatIf("rentIncreasePct", value)} hint="Simula un aumento del canone o dei costi legati al locale." />
                <RangeField label="Fatturato" value={whatIf.revenueChangePct} min={-40} max={20} onChange={(value) => updateWhatIf("revenueChangePct", value)} hint="Valore negativo = meno clienti o domanda più debole." />
                <RangeField label="Energia" value={whatIf.energyIncreasePct} min={0} max={60} onChange={(value) => updateWhatIf("energyIncreasePct", value)} hint="Stress su elettricità, gas e utenze operative." />
                <RangeField label="Costo materie prime" value={whatIf.foodCostIncreasePoints} min={0} max={12} suffix=" pt" onChange={(value) => updateWhatIf("foodCostIncreasePoints", value)} hint="Aumenta i punti percentuali del costo materie prime sul fatturato." />
                <RangeField label="Riduzione personale" value={whatIf.staffReductionPct} min={0} max={25} onChange={(value) => updateWhatIf("staffReductionPct", value)} hint="Simula una riduzione del costo del personale senza cambiare gli altri costi." />
                <RangeField label="Aumento spesa media" value={whatIf.ticketIncreasePct} min={0} max={25} onChange={(value) => updateWhatIf("ticketIncreasePct", value)} hint="Simula menu engineering, pricing o maggiore spesa media per persona." />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <KpiCard icon={BadgeEuro} label="Utile simulato" value={euro.format(whatIfProfitAnnual)} detail={`Differenza ${euro.format(whatIfProfitAnnual - baseProfitAnnual)} vs base`} tone={whatIfProfitAnnual >= 0 ? "green" : "red"} />
                <KpiCard icon={Gauge} label="Copertura debito simulata" value={whatIfKpis.dscr.toFixed(2)} detail={`${whatIfDscrDelta >= 0 ? "+" : ""}${whatIfDscrDelta.toFixed(2)} vs piano base`} tone={whatIfKpis.dscr >= 1.2 ? "green" : "red"} />
                <KpiCard icon={Activity} label="Cash flow annuo" value={euro.format(whatIfCashFlowAnnual)} detail={`Differenza ${euro.format(whatIfCashFlowAnnual - baseCashFlowAnnual)}`} tone={whatIfCashFlowAnnual >= 0 ? "green" : "red"} />
                <KpiCard icon={TrendingUp} label="Punto di pareggio" value={`${Math.ceil(whatIfKpis.breakEvenCovers)} coperti`} detail={`${whatIfBreakEvenDelta >= 0 ? "+" : ""}${Math.ceil(whatIfBreakEvenDelta)} coperti vs base`} tone={whatIfKpis.breakEvenCovers <= kpis.breakEvenCovers ? "green" : "slate"} />
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-950">Base vs What If</p>
                  <p className="mt-1 text-sm text-slate-500">Utile e cash flow sono in euro annui; punto di pareggio è espresso in coperti medi giorno.</p>
                  <div className="mt-4 h-72">
                    {mounted && activePage === "whatif" ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                        <BarChart data={whatIfResultData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="Base" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="WhatIf" fill="#0f766e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ChartShell />
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="font-semibold text-slate-950">Lettura automatica</p>
                  <div className="mt-4 grid gap-3">
                    {whatIfAlerts.map((alert) => (
                      <div key={alert.text} className={"rounded-md p-3 text-sm ring-1 " + (alert.tone === "red" ? "bg-rose-50 text-rose-800 ring-rose-100" : alert.tone === "yellow" ? "bg-amber-50 text-amber-800 ring-amber-100" : "bg-emerald-50 text-emerald-800 ring-emerald-100")}>
                        {alert.text}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-md bg-teal-50 p-3 text-xs leading-5 text-teal-900">
                    Stima prudenziale: affitto ed energia sono isolati dai costi fissi con quote guida, modificabili in seguito quando avremo una scheda costi ancora più dettagliata.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Ricavi multi-canale</p><h2 className="mt-1 lp-card-value-sm text-slate-950">Tipologie di ricavo selezionabili</h2><p className="mt-1 text-sm leading-6 text-slate-500">Approccio prudenziale: il ricavo ordinario è quanto incassa la struttura; banqueting, delivery e asporto usano un margine minimo netto per persona o ordine.</p></div></div>
              <div className="grid gap-3 md:grid-cols-3"><div className="rounded-md bg-teal-50 p-3 ring-1 ring-teal-100"><p className="text-xs font-semibold uppercase text-teal-600">Ricavi selezionati/mese</p><p className="lp-card-value-sm mt-1">{euro.format(selectedChannelMonthlyRevenue)}</p></div><div className="rounded-md bg-emerald-50 p-3 ring-1 ring-emerald-100"><p className="text-xs font-semibold uppercase text-emerald-600">Margine netto/mese</p><p className="lp-card-value-sm mt-1">{euro.format(selectedChannelMonthlyMargin)}</p></div><div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-500">BEP complessivo</p><p className="lp-card-value-sm mt-1">{Math.ceil(combinedChannelBreakEvenUnits).toLocaleString("it-IT")}</p><p className="text-xs text-slate-500">Ricavo BEP {euro.format(combinedChannelBreakEvenRevenue)}</p></div></div>
              <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1500px] text-left text-sm"><thead className="bg-teal-600 text-xs uppercase tracking-wide text-white"><tr><th className="px-2 py-1.5">Usa nel BEP</th><th className="px-2 py-1.5">Attività</th><th className="px-2 py-1.5 text-right">Ordini/persone mese</th><th className="px-2 py-1.5 text-right">Spesa media</th><th className="px-2 py-1.5 text-right">Costi per ordine</th><th className="px-2 py-1.5 text-right">Netto dopo costi</th><th className="px-2 py-1.5 text-right">Margine minimo</th><th className="px-2 py-1.5">Piattaforma / canale</th><th className="px-2 py-1.5 text-right">Ricavo mese</th><th className="px-2 py-1.5 text-right">Margine mese</th><th className="px-2 py-1.5 text-right">BEP singolo</th><th className="px-2 py-1.5">Nota</th></tr></thead><tbody className="divide-y divide-slate-100">{revenueChannelRows.map((channel) => (<tr key={channel.key} className={channel.enabled ? "bg-white" : "bg-slate-50 text-slate-500"}><td className="px-2 py-1.5"><input type="checkbox" checked={channel.enabled} onChange={(event) => updateRevenueChannel(channel.key, "enabled", event.target.checked)} className="h-4 w-4 accent-teal-600" /></td><td className="px-2 py-1.5"><input value={channel.label} onChange={(event) => updateRevenueChannel(channel.key, "label", event.target.value)} className="w-44 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-900 outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><input type="number" min="0" value={channel.monthlyOrders} onChange={(event) => updateRevenueChannel(channel.key, "monthlyOrders", Number(event.target.value))} disabled={channel.key === "ordinary"} className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right outline-none focus:border-teal-500 disabled:bg-slate-50" /></td><td className="px-2 py-1.5">{channel.key === "ordinary" ? (<div className="w-28 rounded-md bg-slate-50 px-2 py-1.5 text-right text-sm font-semibold text-slate-700 ring-1 ring-slate-200" title="Per l'attività ordinaria usa la spesa media dello scenario realistico.">{euro.format(channel.averageRevenueEffective)}</div>) : (<MoneyInput value={channel.averageRevenue} onChange={(value) => updateRevenueChannel(channel.key, "averageRevenue", value)} className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-teal-500" />)}</td><td className="px-2 py-1.5"><div className="text-right text-xs text-slate-500"><span className="block">Consegna {euro.format(channel.deliveryCostPerOrder)}</span><span className="block">Altri {euro.format(channel.otherCostPerOrder)}</span></div></td><td className="px-3 py-2 text-right font-semibold text-slate-700">{channel.key === "ordinary" ? "-" : euro.format(channel.netRevenueAfterCosts)}</td><td className="px-2 py-1.5"><MoneyInput value={channel.minMarginPerPerson} onChange={(value) => updateRevenueChannel(channel.key, "minMarginPerPerson", value)} disabled={channel.key === "ordinary"} className="w-24 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-teal-500 disabled:bg-slate-50" /></td><td className="px-2 py-1.5"><input value={channel.platform} onChange={(event) => updateRevenueChannel(channel.key, "platform", event.target.value)} disabled={channel.key === "ordinary"} className="w-44 rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-teal-500 disabled:bg-slate-50" /></td><td className="px-3 py-2 text-right font-semibold">{euro.format(channel.monthlyRevenue)}</td><td className="px-3 py-2 text-right font-semibold text-emerald-700">{euro.format(channel.monthlyMargin)}</td><td className="px-3 py-2 text-right font-semibold">{Math.ceil(channel.breakEvenUnits).toLocaleString("it-IT")}</td><td className="px-2 py-1.5"><input value={channel.note} onChange={(event) => updateRevenueChannel(channel.key, "note", event.target.value)} className="w-72 rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-none focus:border-teal-500" /></td></tr>))}</tbody></table></div>
            </div>
          </section>

          <section className={((activePage === "workflow" && activeStep === 7) ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo simulazioni What If</p>
                <h2 className="mt-1 lp-card-value-sm text-slate-950">Stress test guidato</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Muovi gli slider e verifica subito cosa succede a utile, Copertura debito, cash flow e punto di pareggio. È pensato per rispondere alla domanda: se qualcosa va peggio del previsto, il progetto resta in piedi?
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">Realtime</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <RangeField label="Affitto" value={whatIf.rentIncreasePct} min={0} max={30} onChange={(value) => updateWhatIf("rentIncreasePct", value)} hint="Simula un aumento del canone o dei costi legati al locale." />
              <RangeField label="Fatturato" value={whatIf.revenueChangePct} min={-40} max={20} onChange={(value) => updateWhatIf("revenueChangePct", value)} hint="Valore negativo = meno clienti o domanda più debole." />
              <RangeField label="Energia" value={whatIf.energyIncreasePct} min={0} max={60} onChange={(value) => updateWhatIf("energyIncreasePct", value)} hint="Stress su elettricità, gas e utenze operative." />
              <RangeField label="Costo materie prime" value={whatIf.foodCostIncreasePoints} min={0} max={12} suffix=" pt" onChange={(value) => updateWhatIf("foodCostIncreasePoints", value)} hint="Aumenta i punti percentuali del costo materie prime sul fatturato." />
              <RangeField label="Riduzione personale" value={whatIf.staffReductionPct} min={0} max={25} onChange={(value) => updateWhatIf("staffReductionPct", value)} hint="Simula una riduzione del costo del personale senza cambiare gli altri costi." />
              <RangeField label="Aumento spesa media" value={whatIf.ticketIncreasePct} min={0} max={25} onChange={(value) => updateWhatIf("ticketIncreasePct", value)} hint="Simula menu engineering, pricing o maggiore spesa media per persona." />
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-950">Intestazione report</p><p className="mt-1 text-xs leading-5 text-slate-500">{effectiveReportBranding.helper}</p></div><span className={"rounded-full px-3 py-1.5 text-xs font-semibold ring-1 " + (effectiveReportBranding.editable ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-sky-50 text-sky-700 ring-sky-200")}>{effectiveReportBranding.profileLabel}</span></div>
              {effectiveReportBranding.editable ? (<><div className="mt-4 grid gap-3 md:grid-cols-4"><label className="text-sm font-medium text-slate-700 md:col-span-2">Logo URL<input value={reportBranding.logoUrl} onChange={(event) => setReportBranding((current) => ({ ...current, logoUrl: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500" /></label><label className="text-sm font-medium text-slate-700 md:col-span-2">Intestazione<input value={reportBranding.header} onChange={(event) => setReportBranding((current) => ({ ...current, header: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500" /></label><label className="text-sm font-medium text-slate-700 md:col-span-4">Sottotitolo<input value={reportBranding.subHeader} onChange={(event) => setReportBranding((current) => ({ ...current, subHeader: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500" /></label></div><div className="mt-4 rounded-lg bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Anteprima intestazione</p><div className="mt-3 flex items-center gap-4"><Image src={effectiveReportBranding.logoUrl || "/launch-pilot-logo.png"} alt="Logo report" width={150} height={70} className="h-12 w-auto object-contain" /><div><p className="font-semibold text-slate-950">{effectiveReportBranding.header}</p><p className="text-sm text-slate-500">{effectiveReportBranding.subHeader}</p></div></div></div></>) : (<div className="mt-4 rounded-lg bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Anteprima intestazione</p><div className="mt-3 flex items-center gap-4"><Image src={effectiveReportBranding.logoUrl || "/launch-pilot-logo.png"} alt="Logo report" width={150} height={70} className="h-12 w-auto object-contain" /><div><p className="font-semibold text-slate-950">{effectiveReportBranding.header}</p><p className="text-sm text-slate-500">{effectiveReportBranding.subHeader}</p></div></div></div>)}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <KpiCard icon={BadgeEuro} label="Utile simulato" value={euro.format(whatIfProfitAnnual)} detail={`Differenza ${euro.format(whatIfProfitAnnual - baseProfitAnnual)} vs base`} tone={whatIfProfitAnnual >= 0 ? "green" : "red"} />
              <KpiCard icon={Gauge} label="Copertura debito simulata" value={whatIfKpis.dscr.toFixed(2)} detail={`${whatIfDscrDelta >= 0 ? "+" : ""}${whatIfDscrDelta.toFixed(2)} vs piano base`} tone={whatIfKpis.dscr >= 1.2 ? "green" : "red"} />
              <KpiCard icon={Activity} label="Cash flow annuo" value={euro.format(whatIfCashFlowAnnual)} detail={`Differenza ${euro.format(whatIfCashFlowAnnual - baseCashFlowAnnual)}`} tone={whatIfCashFlowAnnual >= 0 ? "green" : "red"} />
              <KpiCard icon={TrendingUp} label="Punto di pareggio" value={`${Math.ceil(whatIfKpis.breakEvenCovers)} coperti`} detail={`${whatIfBreakEvenDelta >= 0 ? "+" : ""}${Math.ceil(whatIfBreakEvenDelta)} coperti vs base`} tone={whatIfKpis.breakEvenCovers <= kpis.breakEvenCovers ? "green" : "slate"} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-950">Base vs What If</p>
                <p className="mt-1 text-sm text-slate-500">Utile e cash flow sono in euro annui; punto di pareggio è espresso in coperti medi giorno.</p>
                <div className="mt-4 h-72">
                  {mounted && activePage === "whatif" ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                      <BarChart data={whatIfResultData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Base" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="WhatIf" fill="#0f766e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartShell />
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-950">Lettura automatica</p>
                <div className="mt-4 grid gap-3">
                  {whatIfAlerts.map((alert) => (
                    <div key={alert.text} className={"rounded-md p-3 text-sm ring-1 " + (alert.tone === "red" ? "bg-rose-50 text-rose-800 ring-rose-100" : alert.tone === "yellow" ? "bg-amber-50 text-amber-800 ring-amber-100" : "bg-emerald-50 text-emerald-800 ring-emerald-100")}>
                      {alert.text}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md bg-teal-50 p-3 text-xs leading-5 text-teal-900">
                  Stima prudenziale: affitto ed energia sono isolati dai costi fissi con quote guida, modificabili in seguito quando avremo una scheda costi ancora più dettagliata.
                </div>
              </div>
            </div>
          </section>

          <section className={(activePage === "summary" ? "" : "hidden ") + "rounded-lg border border-teal-200 bg-white p-5 shadow-sm"}>
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Risultato immediato</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Il progetto sta in piedi?</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Questa è la lettura più semplice: quanto devi incassare, quanti clienti servono e dove intervenire prima di presentare il progetto.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg bg-teal-50 p-4 ring-1 ring-teal-100">
                    <p className="text-xs font-semibold uppercase text-teal-600">Stato progetto</p>
                    <p className="mt-2 text-lg font-semibold leading-tight text-teal-950">{status.shortLabel}</p>
                    <p className="mt-1 text-xs leading-5 text-teal-700">{status.explanation}</p>
                  </div>
                  <div className="rounded-lg bg-sky-50 p-4 ring-1 ring-sky-100">
                    <p className="text-xs font-semibold uppercase text-sky-600">Incasso minimo</p>
                    <p className="mt-2 lp-card-value-sm text-sky-950">{euro.format(kpis.breakEvenRevenue)}</p>
                    <p className="mt-1 text-xs leading-5 text-sky-700">Fatturato mensile indicativo per non perdere denaro.</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
                    <p className="text-xs font-semibold uppercase text-amber-600">Clienti necessari</p>
                    <p className="mt-2 lp-card-value-sm text-amber-950">{Math.ceil(breakEvenCustomersDaily).toLocaleString("it-IT")}/giorno</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">Calcolati dalla spesa media per persona.</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-4 ring-1 ring-indigo-100">
                    <p className="text-xs font-semibold uppercase text-indigo-600">Liquidità prevista</p>
                    <p className="mt-2 lp-card-value-sm text-indigo-950">{euro.format(kpis.cashFlowMonthly * 12)}</p>
                    <p className="mt-1 text-xs leading-5 text-indigo-700">Cassa stimata nei primi 12 mesi.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="font-semibold text-slate-950">Cosa migliorare subito</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {inputs.foodCostPct > 30 ? <p><strong className="text-amber-700">Costo materie prime:</strong> prova a ridurlo verso il 24-30%.</p> : <p><strong className="text-emerald-700">Costo materie prime:</strong> il valore è coerente con una gestione prudente.</p>}
                  {kpis.laborPct > 34 ? <p><strong className="text-amber-700">Personale:</strong> il costo lavoro assorbe troppo fatturato.</p> : <p><strong className="text-emerald-700">Personale:</strong> incidenza sotto la soglia critica.</p>}
                  {kpis.dscr < 1.2 ? <p><strong className="text-rose-700">Debito:</strong> la copertura delle rate è debole.</p> : <p><strong className="text-emerald-700">Debito:</strong> la copertura delle rate appare sostenibile.</p>}
                </div>
                <button type="button" onClick={() => setActivePage("report")} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">
                  Vai al report
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <section className={(activePage === "summary" ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">LaunchPilot Indice Rischio™</p>
                <h2 className="mt-1 lp-card-value-sm text-slate-950">Valutazione rischio progetto</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Score automatico da 0 a 100: più alto è il punteggio, più basso è il rischio. La lettura combina leva finanziaria, costo lavoro, stagionalità, margine, location, concentrazione dei ricavi e solo i canali selezionati.
                </p>
              </div>
              <span className={"rounded-full px-3 py-1.5 text-xs font-semibold ring-1 " + (riskLevel.tone === "green" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : riskLevel.tone === "yellow" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-rose-50 text-rose-700 ring-rose-200")}>
                {riskLevel.label}
              </span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="grid place-items-center">
                  {mounted && activePage === "summary" ? (
                    <PieChart width={220} height={220}>
                      <Pie
                        data={[{ name: "Score", value: launchPilotRiskScore }, { name: "Rischio", value: 100 - launchPilotRiskScore }]}
                        innerRadius={70}
                        outerRadius={94}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill={launchPilotRiskScore >= 72 ? "#10b981" : launchPilotRiskScore >= 48 ? "#f59e0b" : "#e11d48"} />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  ) : (
                    <div className="h-[220px] w-[220px] rounded-full bg-slate-100" />
                  )}
                  <div className="-mt-36 mb-14 text-center">
                    <p className="text-5xl font-semibold text-slate-950">{launchPilotRiskScore}</p>
                    <p className="text-sm text-slate-500">risk score</p>
                  </div>
                </div>
                <p className="rounded-md bg-white p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{riskLevel.text}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="font-semibold text-slate-950">Fattori valutati</p>
                  <div className="mt-4 grid gap-3">
                    {riskFactors.map((factor) => (
                      <div key={factor.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-800">{factor.label}</span>
                          <span className={"rounded-full px-2 py-1 text-xs font-semibold " + (factor.risk > 65 ? "bg-rose-50 text-rose-700" : factor.risk > 42 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                            {factor.risk > 65 ? "alto" : factor.risk > 42 ? "medio" : "basso"}
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white">
                          <div className={"h-2 rounded-full " + (factor.risk > 65 ? "bg-rose-500" : factor.risk > 42 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: Math.min(100, factor.risk) + "%" }} />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{factor.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-950">Mappa rischio</p>
                  <div className="mt-4 h-80">
                    {mounted && activePage === "summary" ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={260}>
                        <BarChart data={riskChartData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="rischio" fill="#0f766e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ChartShell />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={(activePage === "summary" ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Riassunto scenari</p>
                <h2 className="mt-1 lp-card-value-sm text-slate-950">Confronto A/B/C</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Fatturato, totale costi e incidenza percentuale sul fatturato. L&apos;obiettivo è capire subito quale scenario regge con prudenza.
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                Ammortamenti e rate inclusi
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {scenarioSummaryCards.map((scenario) => (
                <div key={scenario.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{scenario.key} · {scenario.label}</p>
                      <p className="text-xs text-slate-500">{scenario.tone}</p>
                    </div>
                    <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (scenario.resultAfterFinance >= 0 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200")}>
                      {scenario.resultAfterFinance >= 0 ? "Sostenibile" : "Critico"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Fatturato</span><strong className="lp-inline-value">{euro.format(scenario.revenue)}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Costi totali</span><strong className="lp-inline-value">{euro.format(scenario.totalCosts)}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Costi su fatturato</span><strong>{scenario.totalCostsPct.toFixed(1)}%</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Clienti annui</span><strong>{Math.round(scenario.customers).toLocaleString("it-IT")}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Risultato dopo finanza</span><strong className={scenario.resultAfterFinance >= 0 ? "text-emerald-700" : "text-rose-700"}>{euro.format(scenario.resultAfterFinance)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={(activePage === "summary" ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">
                  Bilancino
                </p>
                <h2 className="mt-1 lp-card-value-sm text-slate-950">
                  Conto economico abbreviato
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Schema ispirato al conto economico civilistico, semplificato per una prefattibilità: valore produzione, costi produzione, gestione finanziaria, imposte e risultato.
                </p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                incomeStatement.netResult >= 0
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-rose-50 text-rose-700 ring-rose-200"
              }`}>
                Risultato {euro.format(incomeStatement.netResult)}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-100 font-semibold text-slate-950">
                    <td className="px-3 py-2" colSpan={2}>A) Valore della produzione</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.valueOfProduction)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">1)</td>
                    <td className="px-2 py-1.5">Ricavi delle vendite e delle prestazioni</td>
                    <td className="px-3 py-2 text-right font-medium">{euro.format(incomeStatement.valueOfProduction)}</td>
                  </tr>
                  <tr className="bg-slate-100 font-semibold text-slate-950">
                    <td className="px-3 py-2" colSpan={2}>B) Costi della produzione</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.productionCosts)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">6)</td>
                    <td className="px-2 py-1.5">Materie prime, merci e consumi</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.materialsAndGoods)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">7)</td>
                    <td className="px-2 py-1.5">Servizi e costi operativi</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.services)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">8)</td>
                    <td className="px-2 py-1.5">Godimento beni di terzi</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.thirdPartyAssets)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">9)</td>
                    <td className="px-2 py-1.5">Personale</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.personnel)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">10)</td>
                    <td className="px-2 py-1.5">Ammortamenti e svalutazioni</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.amortizations)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">14)</td>
                    <td className="px-2 py-1.5">Oneri diversi di gestione</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.otherManagement)}</td>
                  </tr>
                  <tr className="bg-teal-50 font-semibold text-teal-950">
                    <td className="px-3 py-2" colSpan={2}>Differenza A - B</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.productionDifference)}</td>
                  </tr>
                  <tr className="bg-slate-100 font-semibold text-slate-950">
                    <td className="px-3 py-2" colSpan={2}>C) Proventi e oneri finanziari</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.financialResult)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">17)</td>
                    <td className="px-2 py-1.5">Interessi e altri oneri finanziari</td>
                    <td className="px-2 py-1.5 text-right">-{euro.format(incomeStatement.financialCharges)}</td>
                  </tr>
                  <tr className="bg-slate-100 font-semibold text-slate-950">
                    <td className="px-3 py-2" colSpan={2}>D) Rettifiche di valore attività finanziarie</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.valueAdjustments)}</td>
                  </tr>
                  <tr className="font-semibold text-slate-950">
                    <td className="px-3 py-2" colSpan={2}>Risultato prima delle imposte</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.preTaxResult)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">20)</td>
                    <td className="px-2 py-1.5">Imposte stimate con criterio prudenziale</td>
                    <td className="px-2 py-1.5 text-right">{euro.format(incomeStatement.taxes)}</td>
                  </tr>
                  <tr className={`font-semibold ${incomeStatement.netResult >= 0 ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950"}`}>
                    <td className="px-3 py-3" colSpan={2}>21) Utile / perdita dell&apos;esercizio</td>
                    <td className="px-3 py-3 text-right">{euro.format(incomeStatement.netResult)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={(activePage === "summary" ? "" : "hidden ") + "grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Costi variabili guidati</p>
                  <p className="text-sm text-slate-500">
                    Preset per dimensione locale e toggle IVA.
                  </p>
                </div>
                <button
                  onClick={() => setVatIncluded((current) => !current)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
                    vatIncluded
                      ? "bg-teal-50 text-teal-700 ring-teal-200"
                      : "bg-slate-100 text-slate-600 ring-slate-200"
                  }`}
                >
                  IVA {vatIncluded ? "inclusa" : "esclusa"}
                </button>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2 rounded-md bg-slate-100 p-1">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setEnergyPreset(size)}
                    className={`rounded px-3 py-2 text-sm font-semibold ${
                      energyPreset === size
                        ? "bg-white text-teal-700 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {size === "small"
                      ? "Piccolo"
                      : size === "medium"
                        ? "Medio"
                        : "Grande"}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {variableCostPresets.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.hint}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        {euro.format(item[energyPreset])}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold">Tabella dinamica redditività</p>
              <p className="mb-5 text-sm text-slate-500">
                Simulazioni progressive per clienti annui.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="pb-3">Clienti</th>
                      <th className="pb-3">Fatturato</th>
                      <th className="pb-3">Costi variabili</th>
                      <th className="pb-3">Costi totali</th>
                      <th className="pb-3">Ammortamenti</th>
                      <th className="pb-3 text-right">Utile/perdita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scenarioRows.map((row) => (
                      <tr key={row.customers}>
                        <td className="py-3 font-medium">
                          {row.customers.toLocaleString("it-IT")}
                        </td>
                        <td className="py-3">{euro.format(row.revenue)}</td>
                        <td className="py-3">{euro.format(row.variableCosts)}</td>
                        <td className="py-3">{euro.format(row.totalCosts)}</td>
                        <td className="py-3">{euro.format(amortizationAnnual)}</td>
                        <td
                          className={`py-3 text-right font-semibold ${
                            row.profit - amortizationAnnual >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {euro.format(row.profit - amortizationAnnual)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className={(activePage === "summary" ? "" : "hidden ") + "grid gap-6 xl:grid-cols-3"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <p className="font-semibold">Scenario analysis</p>
              <p className="mb-5 text-sm text-slate-500">
                Pessimistico, realistico e ottimistico con margini diversi.
              </p>
              <div className="h-72">
                {mounted && activePage === "summary" ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                    <BarChart
                      data={[
                        {
                          name: "Pessimistico",
                          revenue: kpis.revenueMonthly * 0.78,
                          ebitda: kpis.ebitdaMonthly * 0.45,
                        },
                        {
                          name: "Realistico",
                          revenue: kpis.revenueMonthly,
                          ebitda: kpis.ebitdaMonthly,
                        },
                        {
                          name: "Ottimistico",
                          revenue: kpis.revenueMonthly * 1.22,
                          ebitda: kpis.ebitdaMonthly * 1.55,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ebitda" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartShell />
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold">Simulatore bancario</p>
              <p className="mb-5 text-sm text-slate-500">
                Lettura sintetica per credito e sostenibilità rata.
              </p>
              <div className="grid place-items-center">
                {mounted && activePage === "summary" ? (
                  <PieChart width={220} height={220}>
                    <Pie
                      data={[
                        { name: "Score", value: kpis.score },
                        { name: "Gap", value: 100 - kpis.score },
                      ]}
                      innerRadius={68}
                      outerRadius={92}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#0f766e" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                ) : (
                  <div className="h-[220px] w-[220px] rounded-full bg-slate-100" />
                )}
                <div className="-mt-36 mb-14 text-center">
                  <p className="text-4xl font-semibold">{kpis.score}</p>
                  <p className="text-sm text-slate-500">score</p>
                </div>
              </div>
              <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                {financing.enabled ? "Rata mensile calcolata: " : "Nessuna rata finanziaria attiva: "}
                <span className="font-semibold text-slate-950">
                  {financing.enabled ? euro.format(loanPayment) : "capitale proprio"}
                </span>
                . Copertura debito minima consigliato: 1,20.
              </div>
            </div>
          </section>

          <section className={(activePage === "advisor" ? "" : "hidden ") + "space-y-6"}>
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo 12</p><h3 className="mt-1 text-2xl font-semibold text-slate-950">AI suggerisce</h3><p className="mt-2 text-sm leading-6 text-slate-500">Interpreta i numeri del progetto e li trasforma in consigli pratici, chiari e comprensibili.</p></div>
                  <span className={"rounded-full px-3 py-1.5 text-sm font-semibold ring-1 " + aiScoreLevel.className}>{aiScoreLevel.label}</span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="grid place-items-center rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                    {mounted && activePage === "advisor" ? (<PieChart width={150} height={150}><Pie data={aiScoreData} innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} dataKey="value"><Cell fill={aiScoreLevel.tone === "green" ? "#10b981" : aiScoreLevel.tone === "yellow" ? "#f59e0b" : "#e11d48"} /><Cell fill="#e2e8f0" /></Pie></PieChart>) : (<div className="h-[150px] w-[150px] rounded-full bg-slate-100" />)}
                    <p className="-mt-24 text-3xl font-semibold text-slate-950">{aiConsultantScore}</p><p className="mt-16 text-xs font-semibold uppercase text-slate-400">su 100</p>
                  </div>
                  <div className="grid gap-3"><div className="rounded-lg bg-teal-50 p-4 ring-1 ring-teal-100"><p className="text-sm font-semibold text-teal-950">Executive summary</p><p className="mt-2 text-sm leading-6 text-teal-800">{aiExecutiveSummary}</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Fatturato</p><p className="lp-card-value mt-1">{euro.format(kpis.revenueAnnual)}</p></div><div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Margine lordo</p><p className="lp-card-value mt-1">{kpis.ebitdaPct.toFixed(1)}%</p></div><div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Pareggio</p><p className="lp-card-value mt-1">{Math.ceil(breakEvenCustomersDaily)} clienti/giorno</p></div></div></div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-950">Cosa migliorare subito</p><div className="mt-4 grid gap-3">{aiPriorities.map((group) => (<div key={group.priority} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Priorità {group.priority}</p><span className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + (group.priority === "Alta" ? "bg-rose-50 text-rose-700 ring-rose-200" : group.priority === "Media" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{group.items.length} azioni</span></div><ul className="mt-3 space-y-2 text-sm text-slate-700">{(group.items.length ? group.items : ["Continuare il monitoraggio dei numeri principali"]).map((item) => (<li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /><span>{item}</span></li>))}</ul></div>))}</div></div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">{aiAlerts.map((alert) => (<div key={alert.id} className={"rounded-lg border bg-white p-4 shadow-sm " + (alert.tone === "red" ? "border-rose-200" : alert.tone === "yellow" ? "border-amber-200" : "border-emerald-200")}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className={"text-xs font-semibold uppercase tracking-[0.12em] " + (alert.tone === "red" ? "text-rose-600" : alert.tone === "yellow" ? "text-amber-600" : "text-emerald-600")}>{alert.priority}</p><h4 className="mt-1 font-semibold text-slate-950">{alert.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{alert.text}</p></div><span className={"shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 " + (alert.tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-200" : alert.tone === "yellow" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{alert.metric}</span></div><div className="mt-3 flex flex-wrap gap-2">{alert.suggestions.slice(0, 4).map((suggestion) => (<span key={suggestion} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">{suggestion}</span>))}</div><button type="button" onClick={() => setExpandedAiAlertId(expandedAiAlertId === alert.id ? null : alert.id)} className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700">Spiega meglio</button>{expandedAiAlertId === alert.id ? (<p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{alert.explain}</p>) : null}</div>))}</div>
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold text-slate-950">Punti forti e punti deboli</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100"><p className="text-sm font-semibold text-emerald-900">Punti forti</p><ul className="mt-3 space-y-2 text-sm text-emerald-800">{(aiStrengths.length ? aiStrengths : [{ title: "Nessun punto forte netto" }]).slice(0, 4).map((item) => <li key={item.title}>{item.title}</li>)}</ul></div><div className="rounded-lg bg-rose-50 p-4 ring-1 ring-rose-100"><p className="text-sm font-semibold text-rose-900">Punti deboli</p><ul className="mt-3 space-y-2 text-sm text-rose-800">{(aiWeakPoints.length ? aiWeakPoints : [{ title: "Nessuna criticità forte" }]).slice(0, 4).map((item) => <li key={item.title}>{item.title}</li>)}</ul></div></div></div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">Chat AI suggerisce</p><p className="mt-1 text-sm text-slate-500">Fai una domanda: la risposta usa i numeri inseriti nel progetto.</p></div><Sparkles className="h-5 w-5 text-teal-600" /></div><div className="mt-4 flex flex-wrap gap-2">{["Questo progetto è sostenibile?", "Come posso ridurre il food cost?", "L'affitto è troppo alto?", "Quanti coperti devo fare al giorno?", "Dove rischio di perdere soldi?"].map((question) => (<button key={question} type="button" onClick={() => submitAiQuestion(question)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-teal-50 hover:text-teal-700">{question}</button>))}</div><div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">{aiChatMessages.map((message, index) => (<div key={index} className={"max-w-[92%] rounded-lg px-3 py-2 text-sm leading-6 " + (message.role === "assistant" ? "bg-white text-slate-700 ring-1 ring-slate-200" : "ml-auto bg-teal-600 text-white")}>{message.text}</div>))}</div><form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); submitAiQuestion(); }}><input value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="Scrivi una domanda sul progetto..." className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500" /><button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">Invia</button></form></div>
            </div>
          </section>

          <section className={(activePage === "esg" ? "" : "hidden ") + "space-y-6"}>
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">Modulo ESG / Sostenibilità</p>
                      <span title="ESG significa Ambiente, Sociale e Governance. In parole semplici: misura quanto il locale è attento a consumi, sprechi, fornitori, personale, regole e gestione. Non è solo immagine: può ridurre costi, migliorare reputazione e rendere il progetto più credibile verso banche, bandi e investitori." className="cursor-help rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Cos&apos;è ESG?</span>
                    </div>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-950">Sostenibilità semplice e misurabile</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Valuta consumi, sprechi, packaging, fornitori e pratiche sociali. L&apos;obiettivo è ridurre costi, migliorare immagine e rendere il progetto più forte verso banche e bandi.</p>
                  </div>
                  <span className={"rounded-full px-3 py-1.5 text-sm font-semibold ring-1 " + esgLevel.className}>{esgLevel.label}</span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="grid place-items-center rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    {mounted && activePage === "esg" ? (<PieChart width={150} height={150}><Pie data={esgScoreData} innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} dataKey="value"><Cell fill={esgLevel.tone === "green" ? "#10b981" : esgLevel.tone === "yellow" ? "#f59e0b" : "#e11d48"} /><Cell fill="#d1fae5" /></Pie></PieChart>) : (<div className="h-[150px] w-[150px] rounded-full bg-emerald-100" />)}
                    <p className="-mt-24 text-3xl font-semibold text-slate-950">{esgScore}</p><p className="mt-16 text-xs font-semibold uppercase text-emerald-700">ESG score</p>
                  </div>
                  <div className="grid gap-3"><div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100"><p className="text-sm font-semibold text-emerald-950">Executive summary ESG</p><p className="mt-2 text-sm leading-6 text-emerald-800">{esgSummary}</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Energia/fatturato</p><p className="lp-card-value mt-1">{esgEnergyCostPct.toFixed(1)}%</p></div><div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Spreco</p><p className="lp-card-value mt-1">{esgProfile.foodWastePct.toFixed(1)}%</p></div><div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-400">Emissioni stimate</p><p className="lp-card-value mt-1">{esgEstimatedEmissions} kg</p></div></div></div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold text-slate-950">Indicatori ESG</p><p className="mt-1 text-sm text-slate-500">Ogni area è letta con un punteggio semplice da 0 a 100.</p><div className="mt-4 grid gap-3">{esgPillarRows.map((row) => (<div key={row.label} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">{row.label}</p><p className="text-xs text-slate-500">{row.note}</p></div><strong className="text-slate-950">{row.value}/100</strong></div><div className="mt-3 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-emerald-500" style={{ width: row.value + "%" }} /></div></div>))}</div></div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold text-slate-950">Dati sostenibilità</p><p className="mt-1 text-sm text-slate-500">Sono valori stimati e modificabili. Servono per capire dove intervenire prima.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["electricityKwhMonthly", "Energia elettrica", 2000, 18000, " kWh/mese"], ["gasCostMonthly", "Gas", 300, 5000, " €/mese"], ["waterM3Monthly", "Acqua", 20, 220, " m³/mese"], ["foodWastePct", "Spreco alimentare", 0, 18, "%"], ["recyclingPct", "Raccolta differenziata", 0, 100, "%"], ["sustainablePackagingPct", "Packaging sostenibile", 0, 100, "%"], ["plasticUsePct", "Plastica monouso", 0, 100, "%"], ["localSuppliersPct", "Fornitori locali", 0, 100, "%"], ["seasonalProductsPct", "Prodotti stagionali", 0, 100, "%"], ["renewableEnergyPct", "Energia rinnovabile", 0, 100, "%"], ["efficientEquipmentPct", "Attrezzature efficienti", 0, 100, "%"], ["staffWellbeingScore", "Benessere personale", 0, 100, "/100"],
                ].map(([key, label, min, max, suffix]) => (<label key={String(key)} className="grid gap-2 text-sm font-medium text-slate-700"><span className="flex justify-between gap-3"><span>{String(label)}</span><strong>{esgProfile[key as keyof EsgProfile]}{String(suffix)}</strong></span><input type="range" min={Number(min)} max={Number(max)} value={esgProfile[key as keyof EsgProfile]} onChange={(event) => updateEsgProfile(key as keyof EsgProfile, Number(event.target.value))} className="accent-emerald-600" /></label>))}
              </div></div>
              <div className="grid gap-6"><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold text-slate-950">Consumi e impatto</p><div className="mt-4 h-64">{mounted && activePage === "esg" ? (<ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}><BarChart data={esgConsumptionData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>) : (<ChartShell />)}</div></div><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><p className="font-semibold text-emerald-950">Potenziali vantaggi ESG</p><div className="mt-3 grid gap-2 text-sm text-emerald-800"><p>Accesso più credibile a bandi e finanziamenti agevolati.</p><p>Rapporto più forte con banche, investitori e partner.</p><p>Riduzione costi operativi grazie a meno sprechi e consumi.</p><p>Vantaggio marketing su territorio, filiera e reputazione.</p></div></div></div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">{esgAlerts.map((alert) => (<div key={alert.id} className={"rounded-lg border bg-white p-4 shadow-sm " + (alert.tone === "red" ? "border-rose-200" : alert.tone === "yellow" ? "border-amber-200" : "border-emerald-200")}><div className="flex items-start justify-between gap-3"><div><p className={"text-xs font-semibold uppercase tracking-[0.12em] " + (alert.tone === "red" ? "text-rose-600" : alert.tone === "yellow" ? "text-amber-600" : "text-emerald-600")}>Priorità {alert.priority}</p><h4 className="mt-1 font-semibold text-slate-950">{alert.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{alert.text}</p></div><span className={"shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 " + (alert.tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-200" : alert.tone === "yellow" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{alert.metric}</span></div><div className="mt-3 flex flex-wrap gap-2">{alert.suggestions.slice(0, 4).map((suggestion) => (<span key={suggestion} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">{suggestion}</span>))}</div><button type="button" onClick={() => setExpandedEsgAlertId(expandedEsgAlertId === alert.id ? null : alert.id)} className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">Spiega meglio</button>{expandedEsgAlertId === alert.id ? (<p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{alert.explain}</p>) : null}</div>))}</div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold text-slate-950">Cosa migliorare subito</p><div className="mt-4 grid gap-3">{esgPriorities.map((group) => (<div key={group.priority} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Priorità {group.priority}</p><ul className="mt-3 space-y-2 text-sm text-slate-700">{(group.items.length ? group.items : ["Continuare il monitoraggio ESG"]).map((item) => (<li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{item}</span></li>))}</ul></div>))}</div><div className="mt-4 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"><p className="text-sm font-semibold text-slate-950">Marketing green</p><p className="mt-2 text-sm leading-6 text-slate-600">Le pratiche sostenibili possono migliorare percezione del brand e fidelizzazione clienti. Racconta km zero, prodotti stagionali, riduzione sprechi, packaging ecologico e attenzione al personale.</p></div></div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">Chat AI ESG</p><p className="mt-1 text-sm text-slate-500">Fai domande su consumi, sprechi, packaging, banche e marketing.</p></div><Sparkles className="h-5 w-5 text-emerald-600" /></div><div className="mt-4 flex flex-wrap gap-2">{["Come posso ridurre i consumi?", "Sto sprecando troppo?", "Il mio packaging è sostenibile?", "Posso ottenere vantaggi con le banche?", "Come posso comunicare meglio la sostenibilità?"].map((question) => (<button key={question} type="button" onClick={() => submitEsgQuestion(question)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-700">{question}</button>))}</div><div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">{esgChatMessages.map((message, index) => (<div key={index} className={"max-w-[92%] rounded-lg px-3 py-2 text-sm leading-6 " + (message.role === "assistant" ? "bg-white text-slate-700 ring-1 ring-slate-200" : "ml-auto bg-emerald-600 text-white")}>{message.text}</div>))}</div><form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); submitEsgQuestion(); }}><input value={esgQuestion} onChange={(event) => setEsgQuestion(event.target.value)} placeholder="Scrivi una domanda ESG..." className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500" /><button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Invia</button></form></div>
            </div>
          </section>

          <section className={(activePage === "pratiche" ? "" : "hidden ") + "space-y-6"}>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Apertura e autorizzazioni</p>
                  <h2 className="mt-1 lp-card-value-sm text-slate-950">Guida pratica all&apos;apertura</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Una lettura guidata per stimare costi, pratiche, documenti mancanti, tempi e rischi burocratici. Non sostituisce professionisti abilitati, ma aiuta a non dimenticare pezzi importanti.</p>
                </div>
                <span className={"rounded-full px-3 py-1.5 text-xs font-semibold ring-1 " + (praticheLevel.tone === "green" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : praticheLevel.tone === "yellow" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-rose-50 text-rose-700 ring-rose-200")}>{praticheLevel.label}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard icon={BadgeEuro} label="Tasse iniziali" value={euro.format(oneTimeBureaucracyCosts)} detail="Una tantum apertura" tone="blue" />
                <KpiCard icon={Activity} label="Costi ricorrenti" value={euro.format(recurringBureaucracyCosts)} detail="Stima annua pratiche e adempimenti" tone="slate" />
                <KpiCard icon={CheckCircle2} label="Checklist" value={String(checklistProgress) + "%"} detail={completedAuthorizations + "/" + authorizations.length + " autorizzazioni completate"} tone={checklistProgress >= 70 ? "green" : "red"} />
                <KpiCard icon={Gauge} label="Controllo pratiche" value={String(praticheScore) + "/100"} detail={praticheLevel.text} tone={praticheScore >= 75 ? "green" : praticheScore >= 50 ? "slate" : "red"} />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">1. Forma giuridica</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Struttura dell&apos;attività</h3>
                <select value={legalForm} onChange={(event) => setLegalForm(event.target.value as LegalForm)} className="mt-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-500">
                  {Object.keys(legalFormProfiles).map((form) => <option key={form}>{form}</option>)}
                </select>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="rounded-md bg-teal-50 p-3 text-teal-950 ring-1 ring-teal-100"><strong>Costi apertura stimati:</strong> {euro.format(legalFormProfile.openingCost)}</div>
                  <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><strong>Tassazione indicativa:</strong> {legalFormProfile.taxation}</div>
                  <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><strong>INPS:</strong> {legalFormProfile.inps}</div>
                  <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><strong>Complessità:</strong> {legalFormProfile.complexity} · <strong>Rischio patrimoniale:</strong> {legalFormProfile.patrimonialRisk}</div>
                </div>
                <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">{legalFormProfile.note}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">2. Tasse e costi burocratici</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Tabella configurabile</h3></div>
                  <button type="button" onClick={addBureaucracyCost} className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"><Plus className="h-4 w-4" />Aggiungi</button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-1.5">Voce</th><th className="px-2 py-1.5 text-right">Costo</th><th className="px-2 py-1.5">Tipo</th><th className="px-2 py-1.5">Obbl.</th><th className="px-2 py-1.5">Stato</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{bureaucracyCosts.map((row) => (<tr key={row.id}><td className="px-2 py-1.5"><input value={row.name} onChange={(event) => updateBureaucracyCost(row.id, "name", event.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><MoneyInput value={row.amount} onChange={(value) => updateBureaucracyCost(row.id, "amount", value)} className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-teal-500" /></td><td className="px-2 py-1.5"><select value={row.recurring ? "ricorrente" : "una tantum"} onChange={(event) => updateBureaucracyCost(row.id, "recurring", event.target.value === "ricorrente")} className="rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500"><option>una tantum</option><option>ricorrente</option></select></td><td className="px-2 py-1.5"><input type="checkbox" checked={row.mandatory} onChange={(event) => updateBureaucracyCost(row.id, "mandatory", event.target.checked)} className="h-4 w-4 accent-teal-600" /></td><td className="px-2 py-1.5"><select value={row.status} onChange={(event) => updateBureaucracyCost(row.id, "status", event.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-teal-500"><option>completato</option><option>in corso</option><option>mancante</option></select></td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">3. Autorizzazioni obbligatorie</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Checklist apertura</h3><p className="mt-1 text-sm text-slate-500">Il tuo progetto è completo al {checklistProgress}%.</p></div>
                <div className="h-3 w-44 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-teal-600" style={{ width: String(checklistProgress) + "%" }} /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {authorizations.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3"><input value={item.name} onChange={(event) => updateAuthorization(item.id, "name", event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold outline-none focus:border-teal-500" /><select value={item.status} onChange={(event) => updateAuthorization(item.id, "status", event.target.value)} className={"rounded-md px-2 py-1.5 text-xs font-semibold outline-none ring-1 " + (item.status === "completato" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : item.status === "in corso" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-rose-50 text-rose-700 ring-rose-200")}><option>completato</option><option>in corso</option><option>mancante</option></select></div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><label className="flex items-center gap-2"><input type="checkbox" checked={item.mandatory} onChange={(event) => updateAuthorization(item.id, "mandatory", event.target.checked)} className="h-4 w-4 accent-teal-600" />Obbligatorio</label><span>{item.timingDays} giorni</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">4. Tempistiche</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Timeline apertura</h3>
                <div className="mt-5 space-y-3">{openingTimeline.map((item, index) => (<div key={item.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3"><div className={"grid h-8 w-8 place-items-center rounded-full text-xs font-semibold " + (item.status === "completato" ? "bg-emerald-100 text-emerald-700" : item.status === "in corso" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>{index + 1}</div><input value={item.activity} onChange={(event) => updateTimeline(item.id, "activity", event.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500" /><div className="flex items-center gap-2"><input type="number" min="0" value={item.days} onChange={(event) => updateTimeline(item.id, "days", Number(event.target.value))} className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-teal-500" /><span className="text-xs text-slate-500">gg</span></div></div>))}</div>
                <p className="mt-4 rounded-md bg-teal-50 p-3 text-sm text-teal-900 ring-1 ring-teal-100">Tempo stimato residuo: <strong>{openingDaysEstimate} giorni</strong>.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">5. Fisco semplificato</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Simulazione indicativa regime</h3>
                <select value={taxRegime} onChange={(event) => setTaxRegime(event.target.value as TaxRegime)} className="mt-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500">{taxRegimeRows.map((row) => <option key={row.regime}>{row.regime}</option>)}</select>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex justify-between rounded-md bg-slate-50 p-3"><span>Utile lordo</span><strong className="lp-inline-value">{euro.format(grossProfitBeforeTax)}</strong></div>
                  <div className="flex justify-between rounded-md bg-slate-50 p-3"><span>Imposte indicative</span><strong className="lp-inline-value">{euro.format(selectedTaxRegime.taxes)}</strong></div>
                  <div className="flex justify-between rounded-md bg-slate-50 p-3"><span>Contributi</span><strong className="lp-inline-value">{euro.format(selectedTaxRegime.contributions)}</strong></div>
                  <div className="flex justify-between rounded-md bg-emerald-50 p-3 text-emerald-900"><span>Utile netto stimato</span><strong className="lp-inline-value">{euro.format(selectedTaxRegime.netProfit)}</strong></div>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-slate-500">{taxRegimeRows.map((row) => (<div key={row.regime} className="flex justify-between"><span>{row.regime}</span><strong className="lp-inline-value">{euro.format(row.netProfit)}</strong></div>))}</div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">LaunchPilot Controllo Pratiche™</p>
                <div className="mt-4 grid place-items-center">
                  {mounted && activePage === "pratiche" ? (<PieChart width={220} height={220}><Pie data={[{ name: "Score", value: praticheScore }, { name: "Gap", value: 100 - praticheScore }]} innerRadius={70} outerRadius={94} startAngle={90} endAngle={-270} dataKey="value"><Cell fill={praticheScore >= 75 ? "#10b981" : praticheScore >= 50 ? "#f59e0b" : "#e11d48"} /><Cell fill="#e2e8f0" /></Pie></PieChart>) : (<div className="h-[220px] w-[220px] rounded-full bg-slate-100" />)}
                  <div className="-mt-36 mb-14 text-center"><p className="text-5xl font-semibold text-slate-950">{praticheScore}</p><p className="text-sm text-slate-500">pratiche</p></div>
                </div>
                <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">{praticheLevel.text}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">Alert e criticità</p>
                <div className="mt-4 grid gap-3">{praticheAlerts.map((alert) => (<div key={alert.text} className={"rounded-md p-3 text-sm ring-1 " + (alert.tone === "red" ? "bg-rose-50 text-rose-800 ring-rose-100" : alert.tone === "yellow" ? "bg-amber-50 text-amber-800 ring-amber-100" : "bg-emerald-50 text-emerald-800 ring-emerald-100")}>{alert.text}</div>))}</div>
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">Riferimenti legislativi orientativi</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Base nazionale da verificare sempre con Comune, Regione e professionisti abilitati.</p>
                  <div className="mt-4 grid gap-3">
                    {legislativeReferences.map((item) => (
                      <a key={item.area} href={item.href} target="_blank" rel="noreferrer" className="block rounded-md bg-white p-3 text-sm ring-1 ring-slate-200 transition hover:ring-teal-200">
                        <span className="block font-semibold text-slate-950">{item.area}</span>
                        <span className="mt-1 block text-teal-700">{item.reference}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{item.note}</span>
                      </a>
                    ))}
                  </div>
                </div>
                <p className="mt-4 rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-900 ring-1 ring-amber-100">Le informazioni fornite sono indicative e non sostituiscono il supporto di commercialisti, consulenti o professionisti abilitati.</p>
                <p className="mt-3 rounded-md bg-teal-50 p-3 text-xs leading-5 text-teal-900 ring-1 ring-teal-100">Predisposto per evoluzioni future: normative regionali, checklist per Comune, integrazione consulenti, archivio documenti, upload autorizzazioni e reminder scadenze.</p>
              </div>
            </div>
          </section>

          <section className={(activePage === "report" ? "" : "hidden ") + "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Report PDF professionale</p>
                <p className="text-sm text-slate-500">
                  Copertina, KPI, investimenti, finanziamenti, cash flow,
                  scenari e conclusioni.
                </p>
              </div>
              <button
                onClick={exportPdf}
                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                <Download className="h-4 w-4" />
                Esporta PDF
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <KpiCard icon={BadgeEuro} label="Investimento iniziale" value={euro.format(investmentTotal)} detail="Impieghi complessivi da coprire" tone="blue" />
              <KpiCard icon={Users} label="Mezzi propri" value={euro.format(ownCapital)} detail="Capitale conferito dai soci" tone="green" />
              <KpiCard icon={Banknote} label="Debito finanziario" value={euro.format(financingAmount)} detail="Banca, leasing, noleggio o terzi" tone="slate" />
              <KpiCard icon={Gauge} label="Copertura debito minima" value={minDscrRow.dscr.toFixed(2)} detail={dscrCopy.text} tone={minDscrRow.dscr >= 1.2 ? "green" : "red"} />
            </div>


            <div className="mt-6 rounded-lg border border-teal-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Anteprima PDF report</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">{businessPlanAudience === "consulente" ? "Anteprima A4 reale del report di fattibilità" : "Anteprima A4 reale del business plan"}</h3>
                  <p className="mt-1 text-sm text-slate-500">Questa è l’anteprima grande dentro l’app. Puoi controllarla prima di esportare il PDF.</p>
                </div>
                <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
                  <Download className="h-4 w-4" />
                  Esporta questa anteprima
                </button>
              </div>
              <div className="lp-print-preview-wrap">
                <div id="business-plan-pdf-preview" className="lp-print-area">
                  <div className="print-section" style={{ borderBottom: "2px solid #0f766e", paddingBottom: 14, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                      <div>
                        <p style={{ margin: 0, color: "#0f766e", fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>{selectedBusinessPlanAudience.label}</p>
                        <h1>{businessPlanAudience === "consulente" ? "Report di fattibilità economica" : "Business plan bancabile"}</h1>
                        <p style={{ margin: 0, color: "#334155", fontSize: 14 }}>{venueProfile.restaurantFormat} · {venueProfile.city} · {venueProfile.zone}</p>
                      </div>
                      <Image src={effectiveReportBranding.logoUrl || "/launch-pilot-logo.png"} alt="Logo report" width={150} height={70} style={{ height: 48, width: "auto", objectFit: "contain" }} />
                    </div>
                    <p style={{ marginTop: 10, marginBottom: 0, color: "#64748b", fontSize: 12 }}>{effectiveReportBranding.header} · {effectiveReportBranding.subHeader}</p>
                    <p style={{ marginTop: 12, marginBottom: 0, color: "#64748b", fontSize: 11 }}>{businessPlanAudience === "consulente" ? "Documento predisposto con taglio professionale per commercialisti, consulenti, revisori e advisor." : "Documento predisposto con taglio prudenziale per istituti di credito, investitori e partner finanziari."}</p>
                  </div>

                  {businessPlanAudience === "consulente" ? (<>
                  <div className="print-section">
                    <h2>Indice del documento</h2>
                    <table><tbody>{consultantReportIndex.map((item, index) => (<tr key={item}><td style={{ width: 38, fontWeight: 700 }}>{index + 1}</td><td>{item}</td></tr>))}</tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>1. Premessa professionale</h2>
                    <p>{consultantProfessionalPremise}</p>
                    <table><tbody>
                      <tr><th>Finalità</th><td>Valutazione indipendente della sostenibilità economica e finanziaria.</td><th>Metodo</th><td>Analisi di ricavi, costi, margini, cash flow e rischi.</td></tr>
                      <tr><th>Dati utilizzati</th><td>Dati progettuali inseriti, investimenti confermati, ipotesi ricavi e costi.</td><th>Limiti</th><td>Previsioni soggette a validazione con preventivi, contratti e dati effettivi.</td></tr>
                    </tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>2. Descrizione del progetto</h2>
                    <p>Il progetto riguarda un&apos;attività ristorativa con format {venueProfile.restaurantFormat.toLowerCase()}, cucina {venueProfile.cuisineType.toLowerCase()}, target prevalente {venueProfile.target.toLowerCase()} e ubicazione in {venueProfile.city}, zona {venueProfile.zone}. La capacità operativa indicata è pari a {venuePeakSeats} coperti, con {effectiveOpeningDaysAnnual} giorni annui di apertura stimati.</p>
                    <table><tbody>
                      <tr><th>Format</th><td>{venueProfile.restaurantFormat}</td><th>Target</th><td>{venueProfile.target}</td></tr>
                      <tr><th>Passaggio</th><td>{venueProfile.footTraffic}</td><th>Servizi</th><td>{activeServiceBandsForVenue.map((band) => band.label).join(", ") || "Da definire"}</td></tr>
                      <tr><th>Sale operative</th><td>{venueActiveRooms}</td><th>Capacità annua stimata</th><td>{venueAnnualCapacity.toLocaleString("it-IT")} coperti teorici</td></tr>
                    </tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>3. Analisi investimenti iniziali</h2>
                    <p>{businessPlanInvestmentComment} La valutazione tiene conto della congruità degli impieghi, del rapporto investimento/fatturato e della copertura tramite mezzi propri, contributi e debito.</p>
                    <table><thead><tr><th>Categoria</th><th>Importo confermato</th><th>Incidenza</th></tr></thead><tbody>
                      {(businessPlanInvestmentRows.length ? businessPlanInvestmentRows : [{ category: "Investimenti da completare", total: 0 }]).map((row) => (<tr key={row.category}><td>{row.category}</td><td>{euro.format(row.total)}</td><td>{investmentTotal ? ((row.total / investmentTotal) * 100).toFixed(1) : "0.0"}%</td></tr>))}
                      <tr><th>Totale impieghi</th><th>{euro.format(investmentTotal)}</th><th>100%</th></tr>
                    </tbody></table>
                    <table><tbody><tr><th>Mezzi propri e contributi certi</th><td>{euro.format(ownCapital + confirmedGrants)}</td><th>Debito finanziario</th><td>{euro.format(financingAmount)}</td></tr><tr><th>Fabbisogno scoperto</th><td>{euro.format(ownCapitalNeeded)}</td><th>Copertura propria</th><td>{ownCapitalCoveragePct.toFixed(1)}%</td></tr></tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>4. Analisi fatturato previsionale</h2>
                    <p>{consultantRevenueOpinion}</p>
                    <table><tbody>
                      <tr><th>Fatturato annuo previsto</th><td>{euro.format(kpis.revenueAnnual)}</td><th>Spesa media per persona</th><td>{euro.format(inputs.averageTicket)}</td></tr>
                      <tr><th>Clienti/giorno stimati</th><td>{effectiveInputs.coversPerDay.toLocaleString("it-IT")}</td><th>Giorni apertura</th><td>{effectiveOpeningDaysAnnual.toLocaleString("it-IT")}</td></tr>
                      <tr><th>Break even clienti/giorno</th><td>{Math.ceil(breakEvenCustomersDaily).toLocaleString("it-IT")}</td><th>Rotazione tavoli</th><td>{tableRotation.toFixed(1)}x</td></tr>
                    </tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>5. Analisi costi</h2>
                    <p>{consultantCostOpinion}</p>
                    <table><thead><tr><th>Voce</th><th>Importo annuo</th><th>Incidenza / nota</th></tr></thead><tbody>
                      {businessPlanEconomicRows.slice(1).map((row) => (<tr key={row.label}><td>{row.label}</td><td>{euro.format(row.value)}</td><td>{row.note}</td></tr>))}
                    </tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>6. Analisi marginalità</h2>
                    <p>La marginalità viene valutata distinguendo margine operativo lordo, ammortamenti, oneri finanziari e risultato ante imposte. Tale separazione consente di valutare sia la gestione caratteristica sia il peso della struttura finanziaria.</p>
                    <table><tbody>
                      <tr><th>Margine lordo EBITDA</th><td>{euro.format(kpis.ebitdaAnnual)} · {kpis.ebitdaPct.toFixed(1)}%</td><th>EBIT stimato</th><td>{euro.format(kpis.ebitdaAnnual - amortizationAnnual)}</td></tr>
                      <tr><th>Utile ante imposte</th><td>{euro.format(baseProfitAnnual)}</td><th>Cash flow operativo</th><td>{euro.format(kpis.ebitdaAnnual)}</td></tr>
                      <tr><th>Food cost</th><td>{inputs.foodCostPct.toFixed(1)}%</td><th>Costo personale</th><td>{kpis.laborPct.toFixed(1)}%</td></tr>
                    </tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>7. Break even analysis</h2>
                    <p>{businessPlanBreakEvenComment}</p>
                    <table><tbody>
                      <tr><th>Fatturato minimo mensile</th><td>{euro.format(kpis.breakEvenRevenue)}</td><th>Coperti minimi mese</th><td>{Math.ceil(breakEvenCoversMonthly).toLocaleString("it-IT")}</td></tr>
                      <tr><th>Clienti/giorno al pareggio</th><td>{Math.ceil(breakEvenCustomersDaily).toLocaleString("it-IT")}</td><th>Margine contribuzione</th><td>{(contributionRate * 100).toFixed(1)}%</td></tr>
                    </tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>8. Analisi finanziaria</h2>
                    <p>{businessPlanFinanceComment}</p>
                    <table><thead><tr><th>Indicatore</th><th>Valore</th><th>Commento</th></tr></thead><tbody>{businessPlanFinancialIndicatorRows.map((row) => (<tr key={row.indicator}><td>{row.indicator}</td><td>{row.value}</td><td>{row.comment}</td></tr>))}</tbody></table>
                    <table><thead><tr><th>Mese</th><th>Cash flow operativo</th><th>Servizio debito</th><th>Saldo cassa</th></tr></thead><tbody>{cashFlowData.slice(0, 6).map((row) => (<tr key={row.month}><td>{row.month}</td><td>{euro.format(row.operativo)}</td><td>{euro.format(loanPayment)}</td><td>{euro.format(row.saldo)}</td></tr>))}</tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>9. Analisi rischi</h2>
                    <table><thead><tr><th>Rischio</th><th>Probabilità</th><th>Impatto</th><th>Possibili conseguenze</th></tr></thead><tbody>{businessPlanRiskMatrixRows.map((row) => (<tr key={row.risk}><td>{row.risk}</td><td>{row.probability}</td><td>{row.impact}</td><td>{row.mitigation}</td></tr>))}</tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>10. Scenari</h2>
                    <p>Gli scenari hanno funzione di stress test: misurano la resilienza del progetto rispetto a riduzione dei ricavi, incremento costi e minore capacità di assorbire il debito.</p>
                    <table><thead><tr><th>Scenario</th><th>Fatturato</th><th>Risultato</th><th>DSCR</th></tr></thead><tbody>
                      <tr><td>Peggiorativo</td><td>{euro.format(kpis.revenueAnnual * 0.78)}</td><td>{euro.format(baseProfitAnnual * 0.45)}</td><td>{Math.max(minDscrRow.dscr * 0.68, 0).toFixed(2)}</td></tr>
                      {businessPlanScenarioData.slice(0, 2).map((row) => (<tr key={row.name}><td>{row.name}</td><td>{euro.format(row.Fatturato)}</td><td>{euro.format(row.Utile)}</td><td>{row.DSCR.toFixed(2)}</td></tr>))}
                    </tbody></table>
                  </div>

                  <div className="print-section">
                    <h2>11. Valutazione professionale finale</h2>
                    <p><strong>{feasibilityClassification.label}</strong></p>
                    <p>{feasibilityClassification.text}</p>
                    <p>Alla luce delle analisi effettuate, si raccomanda di validare le ipotesi con preventivi, contratti, piano del personale, dati della location e verifica fiscale. Il giudizio resta subordinato alla coerenza dei dati effettivi con le ipotesi qui formulate.</p>
                    <p style={{ fontSize: 11, color: "#64748b" }}>Documento generato con LaunchPilot. Relazione indicativa di fattibilità economica; non sostituisce parere professionale, revisione contabile o consulenza fiscale personalizzata.</p>
                  </div>
                  </>) : (<>
                  <div className="print-section">
                    <h2>Indice del documento</h2>
                    <table>
                      <tbody>
                        {activeReportIndex.map((item, index) => (<tr key={item}><td style={{ width: 38, fontWeight: 700 }}>{index + 1}</td><td>{item}</td></tr>))}
                      </tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>1. Executive summary</h2>
                    <p>{businessPlanExecutiveSummary}</p>
                    <p>Il progetto prevede un investimento iniziale di {euro.format(investmentTotal)}, coperto per il {ownCapitalCoveragePct.toFixed(1)}% da mezzi propri e contributi confermati e per il {debtCoveragePct.toFixed(1)}% da debito o strumenti finanziari. La capacità prospettica di rimborso viene valutata tramite DSCR minimo pari a {minDscrRow.dscr.toFixed(2)}.</p>
                    <table>
                      <tbody>
                        <tr><th>Score documento</th><td>{businessPlanScore}/100 · {businessPlanLevel.label}</td><th>Importo debito</th><td>{euro.format(financingAmount)}</td></tr>
                        <tr><th>Fatturato annuo</th><td>{euro.format(kpis.revenueAnnual)}</td><th>EBITDA</th><td>{euro.format(kpis.ebitdaAnnual)} · {kpis.ebitdaPct.toFixed(1)}%</td></tr>
                        <tr><th>Spesa media persona</th><td>{euro.format(inputs.averageTicket)}</td><th>Food cost</th><td>{inputs.foodCostPct.toFixed(1)}%</td></tr>
                        <tr><th>Rata mensile stimata</th><td>{euro.format(totalMonthlyDebtService)}</td><th>Liquidità minima 6 mesi</th><td>{euro.format(sixMonthMinimumCash)}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>2. Descrizione del progetto</h2>
                    <p>Il progetto riguarda un&apos;attività di ristorazione con format {venueProfile.restaurantFormat.toLowerCase()}, cucina {venueProfile.cuisineType.toLowerCase()} e target prevalente {venueProfile.target.toLowerCase()}. Il modello operativo considera {effectiveOpeningDaysAnnual} giorni di apertura annui, {venuePeakSeats} coperti disponibili e {venueActiveRooms} sale operative.</p>
                    <table>
                      <tbody>
                        <tr><th>Tipologia locale</th><td>{venueProfile.restaurantFormat}</td><th>Target clienti</th><td>{venueProfile.target}</td></tr>
                        <tr><th>Location</th><td>{venueProfile.city} · {venueProfile.zone}</td><th>Passaggio</th><td>{venueProfile.footTraffic}</td></tr>
                        <tr><th>Capacità posti</th><td>{venuePeakSeats.toLocaleString("it-IT")} coperti</td><th>Giorni apertura</th><td>{effectiveOpeningDaysAnnual.toLocaleString("it-IT")}</td></tr>
                        <tr><th>Servizi attivi</th><td colSpan={3}>{activeServiceBandsForVenue.map((band) => band.label).join(", ") || "Da definire"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>3. Analisi del mercato e SWOT</h2>
                    <p>L&apos;analisi è impostata con criterio prudenziale: il settore ristorazione resta attrattivo, ma richiede controllo puntuale di food cost, personale, liquidità e posizionamento. La domanda potenziale va validata con dati locali, flussi, concorrenza diretta e capacità di presidiare le fasce di servizio più redditizie.</p>
                    <table>
                      <thead><tr><th>Area SWOT</th><th>Valutazione</th></tr></thead>
                      <tbody>{businessPlanSwotRows.map((row) => (<tr key={row.area}><td>{row.area}</td><td>{row.text}</td></tr>))}</tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>4. Analisi della location</h2>
                    <p>La location viene valutata considerando visibilità, accessibilità, target area, potenziale commerciale e sostenibilità dell&apos;affitto stimato rispetto al fatturato previsto.</p>
                    <table>
                      <tbody>
                        <tr><th>Potenziale commerciale</th><td>{locationPotentialCopy} · {locationPotentialScore}/100</td><th>Compatibilità format</th><td>{formatCompatibilityCopy}</td></tr>
                        <tr><th>Rischio zona</th><td>{zoneRiskCopy}</td><th>Sostenibilità affitto</th><td>{rentSustainabilityCopy} · {rentSustainabilityPct.toFixed(1)}%</td></tr>
                        <tr><th>Mq locale</th><td>{venueProfile.squareMeters.toLocaleString("it-IT")}</td><th>Mq per coperto</th><td>{sqmPerSeat.toFixed(1)}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>5. Piano investimenti e fonti di copertura</h2>
                    <p>{businessPlanInvestmentComment}</p>
                    <table>
                      <thead><tr><th>Categoria investimento</th><th>Importo confermato</th><th>Peso su totale</th></tr></thead>
                      <tbody>
                        {(businessPlanInvestmentRows.length ? businessPlanInvestmentRows : [{ category: "Investimenti da completare", total: 0 }]).map((row) => (<tr key={row.category}><td>{row.category}</td><td>{euro.format(row.total)}</td><td>{investmentTotal ? ((row.total / investmentTotal) * 100).toFixed(1) : "0.0"}%</td></tr>))}
                        <tr><th>Totale investimento</th><th>{euro.format(investmentTotal)}</th><th>100%</th></tr>
                      </tbody>
                    </table>
                    <table>
                      <tbody>
                        <tr><th>Mezzi propri</th><td>{euro.format(ownCapital)}</td><th>Contributi confermati</th><td>{euro.format(confirmedGrants)}</td></tr>
                        <tr><th>Finanziamenti / leasing / terzi</th><td>{euro.format(financingAmount)}</td><th>Fabbisogno scoperto</th><td>{euro.format(ownCapitalNeeded)}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>6. Analisi economica previsionale</h2>
                    <p>L&apos;analisi economica previsionale separa ricavi, costi operativi, ammortamenti e interessi, così da distinguere redditività industriale e impatto della struttura finanziaria.</p>
                    <table>
                      <thead><tr><th>Voce</th><th>Importo annuo</th><th>Commento</th></tr></thead>
                      <tbody>{businessPlanEconomicRows.map((row) => (<tr key={row.label}><td>{row.label}</td><td>{euro.format(row.value)}</td><td>{row.note}</td></tr>))}</tbody>
                    </table>
                    <table>
                      <thead><tr><th>Scenario</th><th>Fatturato</th><th>Utile / risultato</th><th>DSCR</th></tr></thead>
                      <tbody>{businessPlanScenarioData.map((row) => (<tr key={row.name}><td>{row.name}</td><td>{euro.format(row.Fatturato)}</td><td>{euro.format(row.Utile)}</td><td>{row.DSCR.toFixed(2)}</td></tr>))}</tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>7. Break even analysis</h2>
                    <p>{businessPlanBreakEvenComment}</p>
                    <table>
                      <tbody>
                        <tr><th>Fatturato minimo mensile</th><td>{euro.format(kpis.breakEvenRevenue)}</td><th>Coperti minimi mese</th><td>{Math.ceil(breakEvenCoversMonthly).toLocaleString("it-IT")}</td></tr>
                        <tr><th>Clienti/giorno al pareggio</th><td>{Math.ceil(breakEvenCustomersDaily).toLocaleString("it-IT")}</td><th>Margine di contribuzione</th><td>{(contributionRate * 100).toFixed(1)}%</td></tr>
                        <tr><th>Occupazione estate</th><td>{summerBreakEvenOccupancy.toFixed(1)}%</td><th>Occupazione inverno</th><td>{winterBreakEvenOccupancy.toFixed(1)}%</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>8. Cash flow previsionale</h2>
                    <p>Il cash flow considera margine operativo, servizio del debito e liquidità iniziale. L&apos;obiettivo è individuare eventuali tensioni finanziarie nei primi mesi di attività.</p>
                    <table>
                      <thead><tr><th>Mese</th><th>Cash flow operativo</th><th>Servizio debito</th><th>Saldo cassa stimato</th></tr></thead>
                      <tbody>{cashFlowData.slice(0, 12).map((row) => (<tr key={row.month}><td>{row.month}</td><td>{euro.format(row.operativo)}</td><td>{euro.format(loanPayment)}</td><td>{euro.format(row.saldo)}</td></tr>))}</tbody>
                    </table>
                    <p>{liquidityStressLevel.text}</p>
                  </div>

                  <div className="print-section">
                    <h2>9. Analisi finanziaria bancaria</h2>
                    <p>{businessPlanFinanceComment}</p>
                    <table>
                      <thead><tr><th>Indicatore</th><th>Valore</th><th>Interpretazione</th></tr></thead>
                      <tbody>{businessPlanFinancialIndicatorRows.map((row) => (<tr key={row.indicator}><td>{row.indicator}</td><td>{row.value}</td><td>{row.comment}</td></tr>))}</tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>10. Analisi rischi</h2>
                    <p>L&apos;analisi dei rischi evidenzia le principali aree da monitorare prima della richiesta di finanziamento e durante l&apos;avvio operativo.</p>
                    <table>
                      <thead><tr><th>Rischio</th><th>Probabilità</th><th>Impatto</th><th>Mitigazione</th></tr></thead>
                      <tbody>{businessPlanRiskMatrixRows.map((row) => (<tr key={row.risk}><td>{row.risk}</td><td>{row.probability}</td><td>{row.impact}</td><td>{row.mitigation}</td></tr>))}</tbody>
                    </table>
                    <table>
                      <thead><tr><th>Criticità specifica</th><th>Livello</th><th>Azione consigliata</th></tr></thead>
                      <tbody>{(businessPlanRiskRows.length ? businessPlanRiskRows : [{ level: "Basso", title: "Rischi principali sotto controllo", text: "", action: "Validare preventivi, contratti e dati della location." }]).slice(0, 5).map((risk) => (<tr key={risk.title}><td>{risk.title}</td><td>{risk.level}</td><td>{risk.action}</td></tr>))}</tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>11. Piano rientro finanziamento</h2>
                    <p>Il piano di rientro mostra il peso delle rate, la quota capitale, gli interessi e la capacità del progetto di sostenere il debito nel tempo.</p>
                    <table>
                      <thead><tr><th>Anno</th><th>Capitale iniziale</th><th>Quota capitale</th><th>Interessi</th><th>Rate pagate</th><th>Debito residuo</th><th>DSCR</th></tr></thead>
                      <tbody>{bankLoanSchedule.annual.slice(0, 8).map((row, index) => (<tr key={row.year}><td>{row.year}</td><td>{euro.format(row.openingBalance)}</td><td>{euro.format(row.principalAmount)}</td><td>{euro.format(row.interestAmount)}</td><td>{euro.format(row.paymentAmount)}</td><td>{euro.format(row.closingBalance)}</td><td>{dscrAnnualRows[index]?.dscr.toFixed(2) ?? "-"}</td></tr>))}</tbody>
                    </table>
                  </div>

                  <div className="print-section">
                    <h2>12. Conclusioni professionali</h2>
                    <p>{businessPlanConclusion}</p>
                    <p>Il progetto dovrà essere accompagnato da preventivi, contratti, dati della location, piano assunzioni, dettaglio investimenti e verifica fiscale. Il monitoraggio periodico di food cost, costo lavoro, cash flow e DSCR rappresenta un presidio essenziale per mantenere equilibrio economico e capacità di rimborso.</p>
                    <p style={{ fontSize: 11, color: "#64748b" }}>Documento generato con LaunchPilot. Le valutazioni sono indicative e devono essere validate con dati, contratti, preventivi effettivi e supporto di professionisti abilitati.</p>
                  </div>

                  </>) }
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Modulo Business Plan Bancabile</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">Documento professionale per banca, investitori e partner</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Trasforma i dati del progetto in un piano leggibile, credibile e presentabile. Il testo si adatta automaticamente a investimenti, margini, DSCR, cassa e rischi.</p>
                </div>
                <span className={"rounded-full px-3 py-1.5 text-xs font-semibold ring-1 " + businessPlanLevel.className}>{businessPlanLevel.label}</span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {availableBusinessPlanAudiences.map((audience) => {
                  const copy = businessPlanAudienceCopy[audience];
                  const selected = businessPlanAudience === audience;
                  return (
                    <button key={audience} type="button" onClick={() => setBusinessPlanAudience(audience)} className={(selected ? copy.className : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50") + " rounded-lg p-4 text-left shadow-sm ring-1 transition"}>
                      <span className="text-sm font-semibold">{copy.label}</span>
                      <span className="mt-1 block text-xs leading-5 opacity-80">{copy.focus}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">Executive summary automatico</p>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">{selectedBusinessPlanAudience.label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{businessPlanExecutiveSummary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-500">Score documento</p><p className="lp-card-value-sm mt-1">{businessPlanScore}/100</p></div>
                    <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-500">Investimento / fatturato</p><p className="lp-card-value-sm mt-1">{investmentToRevenuePct.toFixed(1)}%</p></div>
                    <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-500">Debito / impieghi</p><p className="lp-card-value-sm mt-1">{debtCoveragePct.toFixed(1)}%</p></div>
                    <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase text-slate-500">Peso debito / fatturato</p><p className="lp-card-value-sm mt-1">{debtServiceToRevenuePct.toFixed(1)}%</p></div>
                  </div>
                </div>

                <div className="rounded-lg border border-teal-100 bg-gradient-to-br from-white via-teal-50 to-sky-50 p-5 text-slate-950 shadow-sm">
                  <p className="text-sm font-semibold text-teal-700">Conclusione professionale</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{businessPlanConclusion}</p>
                  <div className="mt-4 h-2 rounded-full bg-white ring-1 ring-teal-100"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${businessPlanScore}%` }} /></div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">Indice automatico del business plan</p>
                <p className="mt-1 text-sm text-slate-500">Struttura completa pronta per PDF professionale.</p>
                <div className="mt-4 grid gap-2 text-sm">
                  {activeReportIndex.map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">{index + 1}</span>
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="font-semibold text-slate-950">Analisi professionale automatica</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-950 ring-1 ring-blue-100"><p className="font-semibold">Investimento</p><p className="mt-2 leading-5">{businessPlanInvestmentComment}</p></div>
                    <div className="rounded-md bg-teal-50 p-3 text-sm text-teal-950 ring-1 ring-teal-100"><p className="font-semibold">Sostenibilità finanziaria</p><p className="mt-2 leading-5">{businessPlanFinanceComment}</p></div>
                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-100"><p className="font-semibold">Break even</p><p className="mt-2 leading-5">{businessPlanBreakEvenComment}</p></div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="font-semibold text-slate-950">Principali rischi del progetto</p>
                    <div className="mt-4 space-y-3">
                      {(businessPlanRiskRows.length ? businessPlanRiskRows : [{ level: "Basso", title: "Rischi principali sotto controllo", text: "Non emergono criticità bloccanti dai dati inseriti.", action: "Validare comunque preventivi, contratti e dati della location." }]).map((risk) => (
                        <div key={risk.title} className="rounded-md bg-slate-50 p-3 text-sm ring-1 ring-slate-100">
                          <div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-950">{risk.title}</p><span className={(risk.level === "Alto" ? "bg-rose-50 text-rose-700 ring-rose-200" : risk.level === "Medio" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200") + " rounded-full px-2.5 py-1 text-xs font-semibold ring-1"}>{risk.level}</span></div>
                          <p className="mt-2 leading-5 text-slate-600">{risk.text}</p>
                          <p className="mt-2 text-xs font-semibold text-teal-700">Azione: {risk.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="font-semibold text-slate-950">Punti di forza del progetto</p>
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      {(businessPlanStrengthRows.length ? businessPlanStrengthRows : ["Il progetto ha una base dati completa e può essere migliorato con poche correzioni mirate."]).map((strength) => (
                        <div key={strength} className="flex gap-2 rounded-md bg-emerald-50 p-3 ring-1 ring-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" /><span>{strength}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">Grafico economico per il business plan</p>
                <div className="mt-4 h-72">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={businessPlanChartData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => euro.format(Number(value))} /><Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0f766e" /></BarChart></ResponsiveContainer>
                  ) : <ChartShell />}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">Scenari previsionali bancabili</p>
                <div className="mt-4 h-72">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={businessPlanScenarioData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis yAxisId="left" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 12 }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} /><Tooltip formatter={(value, name) => name === "DSCR" ? Number(value).toFixed(2) : euro.format(Number(value))} /><Bar yAxisId="left" dataKey="Fatturato" fill="#14b8a6" radius={[8, 8, 0, 0]} /><Bar yAxisId="left" dataKey="Utile" fill="#6366f1" radius={[8, 8, 0, 0]} /><Bar yAxisId="right" dataKey="DSCR" fill="#f59e0b" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
                  ) : <ChartShell />}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">Chat AI Business Plan</p><p className="mt-1 text-sm text-slate-500">Domande utili per banca, investitore, consulente, leasing o soci.</p></div><Sparkles className="h-5 w-5 text-teal-600" /></div>
              <div className="mt-4 flex flex-wrap gap-2">{["Il business plan è credibile?", "La banca potrebbe finanziarlo?", "Il DSCR è sufficiente?", "Sto chiedendo troppo finanziamento?", "Cosa migliorerebbe un investitore?"].map((question) => (<button key={question} type="button" onClick={() => submitBusinessPlanQuestion(question)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-teal-50 hover:text-teal-700">{question}</button>))}</div>
              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">{businessPlanChatMessages.map((message, index) => (<div key={index} className={(message.role === "assistant" ? "bg-white text-slate-700 ring-1 ring-slate-200" : "ml-auto bg-teal-600 text-white") + " max-w-[92%] rounded-lg px-3 py-2 text-sm leading-6"}>{message.text}</div>))}</div>
              <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); submitBusinessPlanQuestion(); }}><input value={businessPlanQuestion} onChange={(event) => setBusinessPlanQuestion(event.target.value)} placeholder="Scrivi una domanda sul business plan..." className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500" /><button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">Invia</button></form>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-950">Fonti e impieghi</p>
                <div className="mt-4 space-y-3 text-sm">
                  {fundingCoverageData.map((row) => (
                    <div key={row.name}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">{row.name}</span>
                        <span className="font-semibold text-slate-950">{euro.format(row.value)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white">
                        <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.min(100, (row.value / Math.max(investmentTotal, 1)) * 100).toFixed(0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-teal-100 bg-teal-50 p-5 text-sm text-teal-950">
                <p className="font-semibold">Commento automatico per banca e consulenti</p>
                <p className="mt-3 leading-relaxed">
                  Il progetto prevede un investimento iniziale di <strong className="lp-inline-value">{euro.format(investmentTotal)}</strong>, coperto per il <strong>{`${(((ownCapital + confirmedGrants) / Math.max(investmentTotal, 1)) * 100).toFixed(0)}%`}</strong> da mezzi propri e contributi confermati e per il <strong>{`${((financingAmount / Math.max(investmentTotal, 1)) * 100).toFixed(0)}%`}</strong> da debito o strumenti finanziari. La copertura del debito media simulata risulta pari a <strong>{(dscrAnnualRows.reduce((sum, row) => sum + row.dscr, 0) / Math.max(dscrAnnualRows.length, 1)).toFixed(2)}</strong>, con valore minimo pari a <strong>{minDscrRow.dscr.toFixed(2)}</strong> nell&apos;anno <strong>{minDscrRow.year}</strong>.
                </p>
                <p className="mt-3 font-medium">{dscrCopy.text}</p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Anno</th>
                    <th className="px-4 py-3">Capitale iniziale</th>
                    <th className="px-4 py-3">Quota capitale</th>
                    <th className="px-4 py-3">Interessi</th>
                    <th className="px-4 py-3">Rate pagate</th>
                    <th className="px-4 py-3">Debito residuo</th>
                    <th className="px-4 py-3">Copertura debito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankLoanSchedule.annual.slice(0, 6).map((row, index) => (
                    <tr key={row.year}>
                      <td className="px-4 py-3 font-medium text-slate-950">{row.year}</td>
                      <td className="px-4 py-3">{euro.format(row.openingBalance)}</td>
                      <td className="px-4 py-3">{euro.format(row.principalAmount)}</td>
                      <td className="px-4 py-3">{euro.format(row.interestAmount)}</td>
                      <td className="px-4 py-3">{euro.format(row.paymentAmount)}</td>
                      <td className="px-4 py-3">{euro.format(row.closingBalance)}</td>
                      <td className="px-4 py-3 font-semibold">{dscrAnnualRows[index]?.dscr.toFixed(2) ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={(activePage === "dashboard" || activePage === "report" ? "" : "hidden ") + "rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"}>
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
              <p>
                Prototipo operativo: Supabase, Stripe e generazione report sono
                predisposti con file e API dedicate. Collegando le chiavi ambiente
                si abilita persistenza dati, autenticazione reale e pagamenti.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
