import * as supplier from './client';

jest.mock('../../helpers/cache');
jest.mock('../../helpers/logger');
jest.mock('../../helpers/redis');

const expectedInstrument = {
  isin: 'US7561091049',
  name: 'Realty Income Corp',
  symbol: 'O',
};

describe('investing.com smoke test', () => {
  test('fetchDividend', async () => {
    const dividend = await supplier.fetchDividend({ instrument: expectedInstrument });
    expect(dividend).toHaveProperty('dividendYield');
    expect(dividend.dividendYield).toEqual(expect.any(Number));
  });

  test('fetchInstrumentWithIsin', async () => {
    const instrument = await supplier.fetchInstrumentWithIsin({ isin: 'US7561091049' });
    expect(instrument).toEqual(expectedInstrument);
  });
});
