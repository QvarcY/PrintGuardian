import { readFile } from 'node:fs/promises';
import { ZipArchive } from '../src/lib/zip.ts';

for (const path of ['fixtures/bambu-style-smoke-test.3mf', 'fixtures/bambu-style-profile-diff-test.3mf']) {
  const bytes = await readFile(path);
  const file = new File([bytes], path.split('/').pop(), { type: 'model/3mf' });
  const archive = await ZipArchive.fromFile(file);
  if (!archive.has('Metadata/project_settings.config')) throw new Error(`${path}: project_settings.config missing`);
  JSON.parse(await archive.readText('Metadata/project_settings.config'));
  console.log(`PASS  ${path} (${archive.entries.length} entries)`);
}
