export interface Dividend {
  symbolInput: string; // 'O'
  basic: {
    symbol: string; // 'O:NYQ'
    name: string; // 'Realty Income Corp'
    exchange: string; // 'New York Consolidated'
    exhangeCode: string; // 'NYQ'
    bridgeExchangeCode: string; // 'USN'
    currency: string; // 'USD'
  };
  dividendData: {
    yield_TTM?: number; // 4.58157
    growth?: number; // 3.08061;
    smartText: string; // 'In 2020, Realty Income Corp reported a dividend of 2.79 USD...
    issued: DividendIssueData[];
    forecasted: DividendForecast[];
  };
}

export interface DividendIssueData {
  fiscalYear: number; // 2019
  divConsensus: number; // 2.71
  consensusCurrency: string; // 'USD'
  interim: number; // 1.35
  interimCurrency: string; // 'USD'
  divQ1: number; // 0.672
  divQ2: number; // 0.678
  divQ3: number; // 0.68
  divQ4: number; // 0.68
  total: number; // 2.71
}

export interface DividendForecast {
  forecastYear: number; // 2021
  forecastCurrency: string; // 'USD'
  forecastConsensus: number; // 2.849
}
