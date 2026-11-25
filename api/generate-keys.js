import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const data = JSON.parse(await readFile(new URL('../data.json', import.meta.url), 'utf8'));
const keys = data.people.flatMap(person => person.items.map(item => createHash('sha256').update(`${person.slug}:${item.url}`).digest('hex')));
await writeFile(new URL('./item-keys.json', import.meta.url), JSON.stringify(keys, null, 2) + '\n');
console.log(`Prepared ${keys.length} item keys`);
