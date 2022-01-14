import { createRequire } from 'module';
import { cpus } from 'os';
import { writeEliminations } from './worker.js';

const require = createRequire(import.meta.url);
const cpuCount = cpus().length - 1;
/*const allWords = (require('./answers.json') as string[]).slice(0, 400);
const answers = (require('./answers.json') as string[]).slice(0, 400);*/
const allWords = ['awake'];
const answers = ['awake'];

const groupSize = Math.ceil(answers.length / cpuCount);
const allWordsGroups = Array.from({ length: cpuCount }, (_, i) =>
  allWords.slice(i * groupSize, (i + 1) * groupSize),
);

console.log(allWordsGroups.map((group) => group.length));

const promises = allWordsGroups.map(async (wordGroup, i) => {
  writeEliminations(wordGroup, groupSize * i, answers);
});

Promise.all(promises).then(async () => {
  console.log('done!');
});
