export interface SearchResults {
  quotes: Quote[];
  total: {
    allResults: number; // 5
    quotes: number; // 5
  };
}

export interface Quote {
  pairId: number; // 39175;
  name: string; // 'Royal Bank of Canada';
  flag: string; // 'USA';
  link: string; // '/equities/royal-bank-of-canada-rbc';
  symbol: string; // 'RY';
  type: string; // 'Share - NYSE';
  pair_type_raw: string; // 'Equities';
  pair_type: string; // 'equities';
  countryID: number; // 5;
  sector: number; // 1;
  region: number; // 1;
  industry: number; // 25;
  isCrypto: boolean; // false;
  exchange: string; // 'NYSE';
  exchangeID: number; // 1;
}
