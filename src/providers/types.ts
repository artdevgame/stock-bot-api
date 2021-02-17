export interface Dividend {
  dividendYield: number;
  instrument: Instrument;
}

export interface FetchDividend {
  isin: string;
}

export interface Instrument {
  isin: string;
  name: string;
  symbol: string;
}
