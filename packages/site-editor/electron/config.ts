/** OAuth config — getters read process.env at call time (after env.ts loads .env). */
export const GITHUB_OAUTH = {
  get clientId() {
    return process.env.GITHUB_OAUTH_CLIENT_ID?.trim() || '';
  },
  get clientSecret() {
    return process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim() || '';
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
