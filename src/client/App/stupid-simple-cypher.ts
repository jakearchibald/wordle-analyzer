// Please never use this to encode anything important.
// It's just to visually disguise the guesses in the URL.

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(rand: () => number, array: any[]) {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(rand() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

const letters = [...'abcdefghijklmnopqrstuvwxyz'];

// Could do it by char code, but this seems more readable.
const lettersMap = Object.fromEntries(letters.map((letter, i) => [letter, i]));

export function encode(seed: number, word: string): string {
  const shuffledLetters = letters.slice();
  shuffle(mulberry32(seed), shuffledLetters);

  const wordLetters = [...word];
  return wordLetters
    .map(
      (letter, i) =>
        shuffledLetters[(lettersMap[letter] + i) % shuffledLetters.length],
    )
    .join('');
}

export function decode(seed: number, word: string): string {
  const shuffledLetters = letters.slice();
  shuffle(mulberry32(seed), shuffledLetters);

  const shuffledMap = Object.fromEntries(
    shuffledLetters.map((letter, i) => [letter, i]),
  );
  const wordLetters = [...word];
  const max =
    Math.ceil(word.length / shuffledLetters.length) * shuffledLetters.length;

  return wordLetters
    .map(
      (letter, i) =>
        letters[(shuffledMap[letter] - i + max) % shuffledLetters.length],
    )
    .join('');
}
