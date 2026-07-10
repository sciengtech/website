import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'electron/oauth-config.generated.json');

config({ path: join(root, '.env') });

const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim() || '';
const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim() || '';
const strict = process.argv.includes('--strict');

if (strict && (!clientId || !clientSecret)) {
  console.error('Cannot package: missing GitHub OAuth credentials.');
  console.error('');
  console.error('Create packages/site-editor/.env with:');
  console.error('  GITHUB_OAUTH_CLIENT_ID=...');
  console.error('  GITHUB_OAUTH_CLIENT_SECRET=...');
  console.error('');
  console.error('Use the SciEngTech GitHub OAuth App (callback http://127.0.0.1:3847/callback).');
  process.exit(1);
}

writeFileSync(
  outPath,
  `${JSON.stringify({ clientId, clientSecret }, null, 2)}\n`,
  'utf8',
);

if (strict) {
  console.log('OAuth credentials embedded for Windows packaging.');
} else if (clientId) {
  console.log('OAuth config updated from .env');
} else {
  console.log('OAuth config cleared (dev will use .env if present).');
}
