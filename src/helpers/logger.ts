import fs from 'fs';
import pino from 'pino';
import { multistream, prettyStream, Streams } from 'pino-multi-stream';

const streams: Streams = [
  { stream: fs.createWriteStream('/tmp/info.stream.out') },
  { stream: fs.createWriteStream('/tmp/fatal.stream.out'), level: 'fatal' },
  { stream: prettyStream(), level: 'info' },
];

export const logger = pino({ level: 'debug' }, multistream(streams));
