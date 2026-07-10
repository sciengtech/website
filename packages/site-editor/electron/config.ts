/** OAuth config — .env in dev; baked oauth-config.generated.json in packaged builds. */
import oauthBuilt from './oauth-config.generated.json';

export const GITHUB_OAUTH = {
  get clientId() {
    return process.env.GITHUB_OAUTH_CLIENT_ID?.trim() || oauthBuilt.clientId || '';
  },
  get clientSecret() {
    return process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim() || oauthBuilt.clientSecret || '';
  },
  redirectUri: 'http://127.0.0.1:3847/callback',
  scope: 'repo',
};

export const REPO = {
  owner: 'sciengtech',
  name: 'website',
  branch: 'main',
  url: 'https://github.com/sciengtech/website.git',
  actionsUrl: 'https://github.com/sciengtech/website/actions',
};

export const OAUTH_PORT = 3847;
