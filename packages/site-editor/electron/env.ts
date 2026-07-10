import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

/** Load .env before any module reads process.env for OAuth. */
const candidates = [
  join(process.cwd(), '.env'),
  join(__dirname, '../../.env'),
];

if (process.resourcesPath) {
  candidates.push(join(process.resourcesPath, '.env'));
}

for (const envPath of candidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}
