export interface Dividend {
  dividendYield: number;
}

export interface FetchDividendParams {
  id: string;
}

export interface FetchInstrumentWithIsinParams {
  isin: string;
}

export interface FetchInstrumentWithSymbolParams {
  symbol: string;
}

export interface FetchSupplierDividendParams {
  instrument: Instrument;
}

export interface Instrument {
  id: string;
  isin: string;
  name: string;
  symbol: string;
}
