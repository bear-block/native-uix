import {mkdir, readFile, writeFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const website = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(website, '..');
await mkdir(path.join(website, 'reference'), {recursive: true});
for (const name of await readdir(path.join(root, 'docs'))) {
  if (!name.endsWith('.md')) continue;
  await writeFile(path.join(website, 'reference', name), (await readFile(path.join(root, 'docs', name), 'utf8'))
    .replaceAll('../tests/consumer/README.md', 'https://github.com/bear-block/native-uix/blob/main/tests/consumer/README.md')
    .replaceAll('../example/README.md', 'https://github.com/bear-block/native-uix/blob/main/example/README.md'));
}
for (const name of ['ARCHITECTURE.md', 'CONTRIBUTING.md']) {
  await writeFile(path.join(website, name), (await readFile(path.join(root, name), 'utf8'))
    .replaceAll('docs/NAVIGATION.md', 'reference/NAVIGATION.md')
    .replace('[LICENSE](LICENSE)', '[LICENSE](https://github.com/bear-block/native-uix/blob/main/LICENSE)'));
}
console.log('Synced canonical public reference pages.');
