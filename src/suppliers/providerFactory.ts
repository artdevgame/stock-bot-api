import fs from 'fs';

enum Providers {
  DIVIDEND_MAX = 'dividendmax',
  FINKIO = 'finkio',
  INVESTING = 'investing.com',
  TRADING212 = 'trading212',
}

export async function providerFactory(provider: Providers) {
  const providerPath = `${__dirname}/${provider}`;
  if (!fs.statSync(providerPath)) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  const client = await import(`${__dirname}/${provider}/client`);

  return {
    fetchDividend: client.fetchDividend,
    fetchInstrument: client.fetchInstrument,
  };
}
