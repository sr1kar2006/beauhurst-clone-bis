import type { FinTableId, FinValue, FinYear } from './types';

export interface FinLine { id: string; label: string; tip: string; subtotal?: boolean; kind?: 'money' | 'ratio' | 'pct' | 'int' | 'text' | 'bool' }
export interface FinTable { id: FinTableId; title: string; lines: FinLine[] }

const L = (id: string, label: string, tip: string, extra: Partial<FinLine> = {}): FinLine => ({ id, label, tip, kind: 'money', ...extra });

export const FIN_TABLES: FinTable[] = [
  { id: 'pl', title: 'Profit & loss', lines: [
    L('turnover', 'Turnover', 'Total revenue from the sale of goods and services in the period.'),
    L('costOfSales', 'Cost of sales', 'Direct costs of producing the goods or services sold.'),
    L('grossProfit', 'Gross profit', 'Turnover less cost of sales.', { subtotal: true }),
    L('employeeWagesTotal', 'Employee wages total', 'All staff costs: wages, social security, pensions and other staff costs, less capitalised costs.'),
    L('socialSecurity', 'Social security', 'Employer national insurance contributions.'),
    L('capitalisedStaff', 'Capitalised staff costs', 'Staff costs capitalised onto the balance sheet (for example, development work).'),
    L('pension', 'Pension costs', 'Employer contributions to pension schemes.'),
    L('otherStaff', 'Other staff costs', 'Benefits and other employment costs.'),
    L('wages', 'Wages & salaries', 'Gross pay to employees.'),
    L('directorEmoluments', 'Director emoluments', 'Pay and benefits received by directors.'),
    L('operatingProfit', 'Operating profit', 'Profit from trading activities before interest and tax.', { subtotal: true }),
    L('amortisation', 'Amortisation', 'Write-down of intangible assets.'),
    L('ebitda', 'EBITDA', 'Earnings before interest, tax, depreciation and amortisation.', { subtotal: true }),
    L('depreciation', 'Depreciation', 'Write-down of tangible fixed assets.'),
    L('auditFees', 'Audit fees', 'Fees paid to auditors for the statutory audit.'),
    L('nonAuditFees', 'Non audit fees', 'Fees paid to auditors for other services.'),
    L('interestPayments', 'Interest payments', 'Interest paid on borrowings.'),
    L('interestReceivable', 'Interest receivable', 'Interest earned on cash and lending.'),
    L('netInterest', 'Net interest', 'Interest receivable less interest payable.'),
    L('preTaxProfit', 'Pre-tax profit', 'Operating profit plus net interest.', { subtotal: true }),
    L('taxation', 'Taxation', 'Corporation tax charge for the period.'),
    L('profitAfterTax', 'Profit after tax', 'Pre-tax profit less taxation.', { subtotal: true }),
    L('dividendsPayable', 'Dividends payable', 'Dividends declared to shareholders.'),
    L('retainedProfit', 'Retained profit', 'Profit after tax less dividends.', { subtotal: true }),
  ] },
  { id: 'balance', title: 'Balance sheet', lines: [
    L('tangibleAssets', 'Tangible assets', 'Property, equipment and other physical assets.'),
    L('intangibleAssets', 'Intangible assets', 'Software, goodwill and other non-physical assets.'),
    L('investments', 'Investments', 'Long-term financial investments.'),
    L('fixedAssets', 'Fixed assets', 'Total of tangible, intangible and investment assets.', { subtotal: true }),
    L('stock', 'Stock', 'Inventory and work in progress.'),
    L('tradeDebtors', 'Trade debtors', 'Money owed by customers.'),
    L('cash', 'Cash', 'Cash at bank and in hand.'),
    L('otherDebtors', 'Other debtors', 'Prepayments and other amounts owed to the company.'),
    L('miscCurrentAssets', 'Miscellaneous current assets', 'Other short-term assets, such as loans to customers.'),
    L('totalCurrentAssets', 'Total current assets', 'Assets expected to be realised within a year.', { subtotal: true }),
    L('tradeCreditors', 'Trade creditors', 'Money owed to suppliers.'),
    L('bankLoans', 'Bank loans & overdrafts', 'Short-term bank borrowing.'),
    L('otherShortTermFinance', 'Other short term finance', 'Other borrowing due within a year.'),
    L('miscCurrentLiabilities', 'Miscellaneous current liabilities', 'Other liabilities due within a year, such as customer deposits.'),
    L('totalCurrentLiabilities', 'Total current liabilities', 'Liabilities due within a year.', { subtotal: true }),
    L('otherLongTermFinance', 'Other long term finance', 'Borrowing due after more than a year.'),
    L('pensionLiabilities', 'Pension liabilities', 'Deficit on defined-benefit pension schemes.'),
    L('deferredTax', 'Deferred tax', 'Tax that will become payable in future periods.'),
    L('totalLongTermLiabilities', 'Total long term liabilities', 'Liabilities due after more than a year.', { subtotal: true }),
    L('totalLiabilities', 'Total liabilities', 'Current plus long-term liabilities.', { subtotal: true }),
    L('workingCapital', 'Working capital', 'Total current assets less total current liabilities.'),
    L('totalAssets', 'Total assets', 'Fixed assets plus current assets.'),
    L('netAssets', 'Net assets', 'Total assets less total liabilities.', { subtotal: true }),
  ] },
  { id: 'capital', title: 'Capital & reserve', lines: [
    L('shareCapital', 'Called up share capital', 'Nominal value of issued shares.'),
    L('plReserve', 'P&L account reserve', 'Accumulated retained profits (or losses).'),
    L('revaluationReserve', 'Revaluation reserve', 'Gains from revaluing assets.'),
    L('sharePremium', 'Share premium', 'Amount paid for shares above their nominal value.'),
    L('otherReserves', 'Other reserves', 'Any other reserves.'),
    L('shareholderFunds', 'Shareholder funds', 'Total equity: equals net assets.', { subtotal: true }),
  ] },
  { id: 'cashflow', title: 'Cash flow', lines: [
    L('acquisitionDisposal', 'Acquisition & disposal', 'Cash spent on buying or received from selling businesses.'),
    L('managementLiquid', 'Management & liquid resources', 'Cash moved into or out of short-term deposits.'),
    L('capex', 'Capital expenditure', 'Cash spent on fixed assets.'),
    L('dividendsPaid', 'Equity dividends paid', 'Cash dividends paid to shareholders.'),
    L('investingActivities', 'Investing activities', 'Other investing cash flows.'),
    L('netCashInvestments', 'Net cash flow from investments', 'Total cash used in investing.', { subtotal: true }),
    L('netCashOperations', 'Net cash flow from operations', 'Cash generated by trading.'),
    L('netCashBeforeFinancing', 'Net cash flow before financing', 'Operations plus investing plus dividends.', { subtotal: true }),
    L('netCashFinancing', 'Net cash flow from financing', 'Cash raised from or repaid to lenders and shareholders.'),
    L('increaseInCash', 'Increase in cash', 'Change in cash over the period.', { subtotal: true }),
  ] },
  { id: 'ratios', title: 'Ratios', lines: [
    L('currentRatio', 'Current ratio', 'Current assets divided by current liabilities.', { kind: 'ratio' }),
    L('quickRatio', 'Quick ratio', 'Current assets excluding stock, divided by current liabilities.', { kind: 'ratio' }),
    L('gearing', 'Gearing (%)', 'Borrowing as a percentage of net assets.', { kind: 'pct' }),
    L('roce', 'Return on capital employed (%)', 'Pre-tax profit over total assets less current liabilities.', { kind: 'pct' }),
    L('debtorDays', 'Debtor days', 'Average days to collect from customers.', { kind: 'int' }),
    L('creditorDays', 'Creditor days', 'Average days to pay suppliers.', { kind: 'int' }),
    L('preTaxMargin', 'Pre-tax profit margin (%)', 'Pre-tax profit as a percentage of turnover.', { kind: 'pct' }),
    L('stockTurnover', 'Stock turnover ratio (%)', 'Stock as a percentage of turnover.', { kind: 'pct' }),
    L('salesNwc', 'Sales net working capital', 'Turnover divided by working capital.', { kind: 'ratio' }),
  ] },
  { id: 'misc', title: 'Miscellaneous', lines: [
    L('weeks', 'Number of weeks', 'Length of the accounting period.', { kind: 'int' }),
    L('currency', 'Currency', 'Reporting currency.', { kind: 'text' }),
    L('employees', 'Number of employees', 'Average number of employees in the period.', { kind: 'int' }),
    L('exportValue', 'Export', 'Turnover from exports.'),
    L('rnd', 'R&D expenditure', 'Research and development spend.'),
    L('gva', 'GVA', 'Gross value added: operating profit plus staff costs.'),
    L('runwayWeeks', 'Runway weeks', 'Weeks of cash left at the current loss rate. Blank if profitable.', { kind: 'int' }),
    L('auditors', 'Auditors', 'Firm that audited the accounts.', { kind: 'text' }),
    L('seniorAuditor', 'Senior auditor', 'Senior statutory auditor.', { kind: 'text' }),
    L('consolidated', 'Consolidated accounts', 'Whether the accounts consolidate subsidiaries.', { kind: 'bool' }),
  ] },
];

export interface YearDriver {
  yearEnd: string;
  turnover: number;
  operatingProfit: number;
  amortDep: number;
  totalAssets: number;
  netAssets: number;
  cash: number;
  employees: number;
}
export interface FinOpts { totalRaised: number; exportShare: number; auditors: string; seniorAuditor: string; consolidated: boolean; bank?: boolean }

const R = Math.round;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Build every table from a few drivers so subtotals always reconcile. Drivers are oldest first. */
export function buildFinancials(drivers: YearDriver[], o: FinOpts): FinYear[] {
  let prevCash: number | null = null;
  return drivers.map((y) => {
    const v: Record<string, FinValue> = {};
    // ---- P&L
    const T = R(y.turnover);
    const cos = R(T * (o.bank ? 0.22 : 0.42));
    v.turnover = T; v.costOfSales = cos; v.grossProfit = T - cos;
    const wages = R(y.employees * 52_000);
    v.wages = wages;
    v.socialSecurity = R(wages * 0.12);
    v.pension = R(wages * 0.06);
    v.otherStaff = R(wages * 0.03);
    v.capitalisedStaff = -R(wages * 0.02);
    v.employeeWagesTotal = wages + (v.socialSecurity as number) + (v.pension as number) + (v.otherStaff as number) + (v.capitalisedStaff as number);
    v.directorEmoluments = R(Math.min(wages * 0.015, 9_000_000));
    v.operatingProfit = R(y.operatingProfit);
    v.amortisation = R(y.amortDep * 0.4);
    v.depreciation = R(y.amortDep) - (v.amortisation as number);
    v.ebitda = (v.operatingProfit as number) + (v.amortisation as number) + (v.depreciation as number);
    v.auditFees = R(Math.max(18_000, T * 0.0006));
    v.nonAuditFees = R((v.auditFees as number) * 0.3);
    v.interestPayments = R(T * (o.bank ? 0.09 : 0.01));
    v.interestReceivable = R(T * (o.bank ? 0.12 : 0.004));
    v.netInterest = (v.interestReceivable as number) - (v.interestPayments as number);
    v.preTaxProfit = (v.operatingProfit as number) + (v.netInterest as number);
    v.taxation = -R(Math.max(0, (v.preTaxProfit as number) * 0.25));
    v.profitAfterTax = (v.preTaxProfit as number) + (v.taxation as number);
    v.dividendsPayable = 0;
    v.retainedProfit = (v.profitAfterTax as number) - (v.dividendsPayable as number);

    // ---- balance sheet
    const TA = R(y.totalAssets);
    const cash = R(Math.min(y.cash, TA * 0.7));
    v.tangibleAssets = R(TA * 0.012);
    v.intangibleAssets = R(TA * 0.009);
    v.investments = R(TA * (o.bank ? 0.24 : 0.02));
    v.fixedAssets = (v.tangibleAssets as number) + (v.intangibleAssets as number) + (v.investments as number);
    v.stock = o.bank ? 0 : R(TA * 0.04);
    v.tradeDebtors = R(TA * 0.03);
    v.cash = cash;
    v.otherDebtors = R(TA * 0.02);
    v.totalCurrentAssets = TA - (v.fixedAssets as number);
    v.miscCurrentAssets = (v.totalCurrentAssets as number) - (v.stock as number) - (v.tradeDebtors as number) - cash - (v.otherDebtors as number);
    const TL = TA - R(y.netAssets);
    v.otherLongTermFinance = R(TL * 0.08);
    v.pensionLiabilities = R(TL * 0.002);
    v.deferredTax = R(TL * 0.001);
    v.totalLongTermLiabilities = (v.otherLongTermFinance as number) + (v.pensionLiabilities as number) + (v.deferredTax as number);
    v.totalCurrentLiabilities = TL - (v.totalLongTermLiabilities as number);
    v.tradeCreditors = R((v.totalCurrentLiabilities as number) * 0.02);
    v.bankLoans = R((v.totalCurrentLiabilities as number) * 0.03);
    v.otherShortTermFinance = R((v.totalCurrentLiabilities as number) * 0.05);
    v.miscCurrentLiabilities = (v.totalCurrentLiabilities as number) - (v.tradeCreditors as number) - (v.bankLoans as number) - (v.otherShortTermFinance as number);
    v.totalLiabilities = TL;
    v.workingCapital = (v.totalCurrentAssets as number) - (v.totalCurrentLiabilities as number);
    v.totalAssets = TA;
    v.netAssets = TA - TL;

    // ---- capital & reserve (P&L reserve is the plug so shareholder funds = net assets)
    v.shareCapital = R(Math.max(100, o.totalRaised * 0.00002));
    v.sharePremium = R(o.totalRaised * 0.97);
    v.revaluationReserve = 0;
    v.otherReserves = R(Math.abs(v.netAssets as number) * 0.01);
    v.plReserve = (v.netAssets as number) - (v.shareCapital as number) - (v.sharePremium as number) - (v.revaluationReserve as number) - (v.otherReserves as number);
    v.shareholderFunds = v.netAssets;

    // ---- cash flow (financing is the plug so the increase in cash matches the balance sheet)
    v.netCashOperations = R((v.ebitda as number) * 0.9);
    v.acquisitionDisposal = 0;
    v.managementLiquid = -R(T * 0.01);
    v.capex = -R((v.depreciation as number) * 1.2);
    v.investingActivities = -R(T * 0.005);
    v.netCashInvestments = (v.acquisitionDisposal as number) + (v.managementLiquid as number) + (v.capex as number) + (v.investingActivities as number);
    v.dividendsPaid = -(v.dividendsPayable as number);
    v.netCashBeforeFinancing = (v.netCashOperations as number) + (v.netCashInvestments as number) + (v.dividendsPaid as number);
    const pc = prevCash ?? R(cash * 0.8);
    v.increaseInCash = cash - pc;
    v.netCashFinancing = (v.increaseInCash as number) - (v.netCashBeforeFinancing as number);
    prevCash = cash;

    // ---- ratios
    const tcl = v.totalCurrentLiabilities as number;
    const tca = v.totalCurrentAssets as number;
    v.currentRatio = tcl ? r2(tca / tcl) : null;
    v.quickRatio = tcl ? r2((tca - (v.stock as number)) / tcl) : null;
    v.gearing = v.netAssets ? r2((((v.bankLoans as number) + (v.otherShortTermFinance as number) + (v.otherLongTermFinance as number)) / (v.netAssets as number)) * 100) : null;
    v.roce = TA - tcl ? r2(((v.preTaxProfit as number) / (TA - tcl)) * 100) : null;
    v.debtorDays = T ? R(((v.tradeDebtors as number) / T) * 365) : null;
    v.creditorDays = cos ? R(((v.tradeCreditors as number) / cos) * 365) : null;
    v.preTaxMargin = T ? r2(((v.preTaxProfit as number) / T) * 100) : null;
    v.stockTurnover = T ? r2(((v.stock as number) / T) * 100) : null;
    v.salesNwc = v.workingCapital ? r2(T / (v.workingCapital as number)) : null;

    // ---- misc
    v.weeks = 52;
    v.currency = 'GBP';
    v.employees = y.employees;
    v.exportValue = o.exportShare ? R(T * o.exportShare) : null;
    v.rnd = R(T * 0.04);
    v.gva = (v.operatingProfit as number) + (v.employeeWagesTotal as number);
    v.runwayWeeks = (v.preTaxProfit as number) < 0 ? R(cash / (-(v.preTaxProfit as number) / 52)) : null;
    v.auditors = o.auditors;
    v.seniorAuditor = o.seniorAuditor;
    v.consolidated = o.consolidated;

    return { yearEnd: y.yearEnd, values: v };
  });
}

/** Headline metrics for the summary card (8 tiles). */
export const SUMMARY_METRICS: { id: string; label: string; kind: 'money' | 'int' }[] = [
  { id: 'turnover', label: 'Turnover', kind: 'money' },
  { id: 'operatingProfit', label: 'Operating profit', kind: 'money' },
  { id: 'ebitda', label: 'EBITDA', kind: 'money' },
  { id: 'totalAssets', label: 'Total assets', kind: 'money' },
  { id: 'totalLiabilities', label: 'Total Liabilities', kind: 'money' },
  { id: 'netAssets', label: 'Net assets', kind: 'money' },
  { id: 'cash', label: 'Cash', kind: 'money' },
  { id: 'employees', label: 'Employee Count', kind: 'int' },
];
