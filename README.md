# stock-bot-api

Retrieve info related to dividend stocks.

> You might also be interested in: [`stock-bot`](https://github.com/artdevgame/stock-bot)

## Requirements

- Docker
- Node.js (only tested against `v14`)
- Yarn

## Setup

To get started, run: `docker-compose up`, which will start a Redis instance and Fastify + GraphQL server.

## Usage

To retrieve a dividend, you must first acquire an instrument to query against.

All requests must be [authenticated](#authentication)

### Retrieve an instrument with an ISIN

<small>Request</small>

```
curl --location --request POST 'http://localhost:3000/graphql' \
--header 'x-api-key: [YOUR API KEY]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "query { fetchInstrumentWithIsin(isin: \"US5949181045\") { isin name symbol } }"
}'
```

<small>Response</small>

```
{
    "data": {
        "fetchInstrumentWithSymbol": {
            "isin": "US5949181045",
            "name": "Microsoft",
            "symbol": "MSFT"
        }
    }
}
```

### Retrieve an instrument with a stock symbol (ticker)

<small>Request</small>

```
curl --location --request POST 'http://localhost:3000/graphql' \
--header 'x-api-key: [YOUR API KEY]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "query { fetchInstrumentWithSymbol(symbol: \"MSFT\") { isin name symbol } }"
}'
```

<small>Response</small>

```
{
    "data": {
        "fetchInstrumentWithSymbol": {
            "isin": "US5949181045",
            "name": "Microsoft",
            "symbol": "MSFT"
        }
    }
}
```

Now that you have an instrument, you can use this to retrieve a dividend

### Retrieve a dividend

<small>Request</small>

```
curl --location --request POST 'http://localhost:3000/graphql' \
--header 'x-api-key: c7dd7869-d701-4259-8d36-18dd295ebb49' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "query { fetchDividend(instrument: { isin: \"US5949181045\", name: \"Microsoft\", symbol: \"MSFT\" }){ dividendYield } }"
}'
```

<small>Response</small>

```
{
    "data": {
        "fetchDividend": {
            "dividendYield": 0.009189
        }
    }
}
```

#### Why do I need to pass in the entire instrument when retrieving dividend information?

The API is an aggregator of data across different suppliers. Some of these suppliers identify stocks using the ISIN, others use the stock symbol (ticker). If one supplier can't find the information, the API takes care of asking another one for it, so we need as many possible identifiers for the same stock as possible to enable more fallback options.

The company name is used for logging purposes, it helps me identify problems should they occur.

## <a name="authentication"></a> Authentication

An API key is used as an anonymous way to rate limit the service.

In order to generate API keys, you must set a value in the config under the `server.authKey` property.

Once this value is set, API keys can be generated using the following request:

```
curl --location --request POST 'http://localhost:3000/api/key-store' \
--header 'Content-Type: application/json' \
--data-raw '{
    "authKey": "[YOUR server.authKey VALUE]"
}'
```

<small>Response</small>

```
{
    "created": "2021-02-25T11:01:52.189Z",
    "isBanned": false,
    "key": "47ccf4d9-1ff8-453a-8286-5a96d7f842c3",
    "lastUsed": "2021-02-25T11:01:52.189Z"
}
```

## Rate Limits

If a consumer makes more requests than the `server.apiLimit.maxRequestsPerMinute` value in the config (default: 300), they will receive a HTTP 429 response.

If the consumer continues to make requests whilst limited, and exceeds the `server.apiLimit.banAfterMaxHttp429Responses` value in the config (default: 30), the API key will be banned and the response code will be HTTP 409.

## Future development tasks

- [ ] Add more suppliers: _morningstar, openfigi, ycharts_
- [ ] Add smoke tests
- [ ] Log failing smoke tests to Discord
