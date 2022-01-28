import { Transform } from 'stream';

export function lines() {
  let buffer = '';

  return new Transform({
    transform(chunk: string, encoding, callback) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) this.push(line);
      callback();
    },
    objectMode: true,
  });
}

export function addNewline() {
  return new Transform({
    transform(line: string, encoding, callback) {
      this.push(line + '\n');
      callback();
    },
    objectMode: true,
  });
}
