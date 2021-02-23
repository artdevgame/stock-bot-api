# stock-bot-api

Retrieve info related to dividend stocks.

> You might be also be interested in: [`stock-bot`](https://github.com/artdevgame/stock-bot)

## Requirements

- Node.js (only tested against `v14`)
- Yarn

## Future development tasks

- [ ] Backup key files to GitHub private repo
- [ ] Validate `symbol` and `isin` on fetch functions
- [ ] Remove `suppliers[].enabled` from config (`dividends` & `instruments` determines this)
- [ ] Add more suppliers: _morningstar, openfigi, ycharts_
- [ ] Add smoke tests
- [ ] Log failing smoke tests to Discord
- [ ] Improve readme with examples
