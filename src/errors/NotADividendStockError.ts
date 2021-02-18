export class NotADividendStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotADividendStockError';
  }
}
