import fs from 'fs';
import fetch from 'node-fetch';
import pino from 'pino';

const logger = pino({ level: 'debug', prettyPrint: true });

async function run() {
  const micRes = await fetch('https://www.iso20022.org/sites/default/files/ISO10383_MIC/ISO10383_MIC.csv');

  if (!micRes.ok) {
    throw new Error('Unable to retrieve Market Identifier Codes');
  }

  const marketIdentifierCodes = await micRes.text();

  fs.writeFileSync(`${__dirname}/../src/iso-10383-mic.csv`, marketIdentifierCodes, { encoding: 'utf8' });

  logger.info('[Process complete: fetch-iso-10383-mic]');
}

run();
