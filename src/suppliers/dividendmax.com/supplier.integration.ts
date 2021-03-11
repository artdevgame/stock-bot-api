import * as supplier from './client';

jest.mock('../../helpers/cache');
jest.mock('../../helpers/logger');
jest.mock('../../helpers/redis');

const expectedInstrument = {
  id: '26e1da13-50db-510c-8e41-e0bb4585fbde',
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
});
