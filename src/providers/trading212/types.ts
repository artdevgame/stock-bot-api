export interface BalanceSheet extends FinancialStatement {
  statement: 'total-assets' | 'total-liabilities';
  type: 'BALANCE_SHEET';
}

export interface CashFlow extends FinancialStatement {
  statement: 'cash-from-financing-activities' | 'cash-from-operating-activities';
  type: 'CASH_FLOW';
}

export interface Company {
  generalInformation: CompanyInformation;
  keyFinancialStatements: {
    BALANCE_SHEET: BalanceSheet[];
    CASH_FLOW: CashFlow[];
    INCOME: Income[];
  };
  keyRatios: KeyRatios;
}

export interface CompanyInformation {
  businessDescription: string; // '3M Co is a technology company. The Company operates ...'
  employees: number; // 94987
  headquarters: string; // 'SAINT PAUL, United States'
  sector: string; // 'Technology'
  industry: string; // 'Electronic Instr. & Controls'
  financialDescription: string; // 'BRIEF: For the fiscal year ended 31 December 2020, ...'
  ceo: string; // 'Michael Roman'
}

export interface FinancialStatement {
  period: 'ANNUAL' | 'INTERIM';
  value: number; // 32136000000
  year: number; // 2020
}

export interface Income extends FinancialStatement {
  statement: 'net-income' | 'revenue';
  type: 'INCOME';
}

export interface Instrument {
  id: number; // 2672
  name: string; // 'O'
  prettyName: string; // 'Realty Income'
  code: string; // 'O_US_EQ'
  type: 'STOCK'; // 'STOCK'
  currency: string; // 'USD'
  group: string; // 'BATS US'
  isin: string; // 'US7561091049'
  price: InstrumentPrice; // { buy: 62.44; sell: 62.46; }
  realPrice: InstrumentPrice; // { buy: 62.44; sell: 62.46; }
  minTrade: number; // 0.01
  precision: number; // 2
  minTradeSizeCoefficient: number; // 0
  insignificantDigits: number; // 0
  description: string; // 'Realty Income Corporation'
  enabled: boolean; // true
  suspended: boolean; // false
  marketId: number; // 56
  shortPercent: number; // 0
  baseCode: string; // 'O_US_EQ'
  maxPendingDist: number; // 50.0
  margin: number; // 1.0
  quantity: number; // 0.0
  quantityPrecision: number; // 8
  countryOfOrigin: string; // 'US'
}

export interface InstrumentPrice {
  buy: number; // 62.44
  sell: number; // 62.46
}

export interface KeyRatios {
  marketCap: number; // 104782400000
  peRatio: number; // 19.90237
  revenue: number; // 32184000000
  eps: number; // 9.09138
  dividendYield: number; // 3.2718
  beta: number; // 0.94521
}

export interface Transaction {
  additionalInfo: {
    context: null;
    key: string; // history.order.status.filled | history.order.status.cancelled
    meta: null;
  } | null;
  date: string; // "2021-01-19T15:56:55+02:00"
  detailsPath: string; // '/dividends/ddb02d78-aa48-4213-8f3a-9a28a9c6ea3a';
  heading: TransactionHeadingInstrument | TransactionHeadingDividend;
  mainInfo: {
    key: string; // history.currency-amount | history.blank
    context: {
      amount: number; // 0.38
      applyPositiveSign: boolean;
    };
    meta: null;
  };
  subHeading: TransactionSubHeadingBuy | TransactionSubHeadingInstrument | TransactionSubHeadingSell;
}

export interface TransactionHeadingDividend {
  key: 'history.dividend.heading';
  context: null;
  meta: null;
}

export interface TransactionHeadingInstrument {
  key: 'history.instrument';
  context: {
    quantityPrecision: number; // 8;
    baseCode: null; // null;
    prettyName: string; // 'British Tobacco';
    precision: number; // 0;
    treeType: string; // 'STOCK';
    instrument: string; // 'BATS';
    instrumentBadge: null; // null;
    instrumentCode: string; // 'BATSl_EQ';
  };
  meta: null;
}

export interface TransactionsPayload {
  data: Transaction[];
  hasNext: boolean;
  footer: unknown;
}

export interface TransactionSubHeadingBuy {
  context: {
    amount: number; // 720
    amountPrecision: number; // 2
    quantity: number; // 72.832867
    quantityPrecision: number; // 8
  };
  key: 'history.order.filled.buy';
  meta: null;
}

export interface TransactionSubHeadingInstrument {
  context: {
    baseCode: null;
    instrument: string; // 'GSK'
    instrumentBadge: string; // 'EQ'
    instrumentCode: string; // 'GSKl_EQ'
    precision: number; // 1
    prettyName: string; // 'GlaxoSmithKline'
    quantityPrecision: number; // 8
    treeType: string; // 'STOCK'
  };
  key: 'history.instrument';
  meta: null;
}

export interface TransactionSubHeadingSell {
  context: {
    quantity: number; // 0.38262348
    quantityPrecision: number; // 8
  };
  key: 'history.order.filled.sell';
  meta: null;
}
