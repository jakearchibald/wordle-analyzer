// This script takes https://github.com/rspeer/wordfreq/blob/master/wordfreq/data/large_en.msgpack.gz
// and creates a list of only 5-letter words
import { createRequire } from 'module';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import { createGunzip } from 'zlib';
import { URL } from 'url';
import { decodeAsync } from '@msgpack/msgpack';
import pluralize from 'pluralize';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const wordSet = new Set(allWords);

const sourceData = (await decodeAsync(
  fs
    .createReadStream(new URL('./large_en.msgpack.gz', import.meta.url))
    .pipe(createGunzip()),
)) as any[];

const words = (sourceData.slice(1).flat() as string[]).filter((word) => {
  return (
    /^[a-z]{5}$/.test(word) && wordSet.has(word) && pluralize.isSingular(word)
  );
});

await writeFile(new URL('./en_5letter.txt', import.meta.url), words.join('\n'));
