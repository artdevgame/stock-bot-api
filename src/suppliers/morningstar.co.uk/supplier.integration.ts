import * as supplier from './client';

jest.mock('../../helpers/cache');
jest.mock('../../helpers/logger');
jest.mock('../../helpers/redis');

const expectedInstrument = {
  id: '63fbade6-de1d-5935-b9a2-059e3f1091e7',
  isin: 'US0378331005',
  name: 'Apple Inc',
  symbol: 'AAPL',
};

describe('morningstar.co.uk smoke test', () => {
  test('fetchDividend', async () => {
    const dividend = await supplier.fetchDividend({ instrument: expectedInstrument });
    expect(dividend).toHaveProperty('dividendYield');
    expect(dividend.dividendYield).toEqual(expect.any(Number));
  });

  test('fetchInstrumentWithIsin', async () => {
    const instrument = await supplier.fetchInstrumentWithSymbol({ symbol: 'AAPL' });
    expect(instrument).toEqual(expectedInstrument);
  });
});
