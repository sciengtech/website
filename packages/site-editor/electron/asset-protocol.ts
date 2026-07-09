import { protocol, net } from 'electron';
import { existsSync } from 'fs';
import { join, normalize } from 'path';
import { pathToFileURL } from 'url';
import { getWorkspacePaths } from './workspace';

const SCHEME = 'site-editor';

export function registerAssetProtocolScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

export function registerAssetProtocolHandler(): void {
  protocol.handle(SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      const relative = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      if (!relative) {
        return new Response('Bad request', { status: 400 });
      }

      const { root } = getWorkspacePaths();
      const abs = normalize(join(root, ...relative.split('/')));
      const rootNorm = normalize(root);

      if (!abs.toLowerCase().startsWith(rootNorm.toLowerCase())) {
        return new Response('Forbidden', { status: 403 });
      }
      if (!existsSync(abs)) {
        return new Response('Not found', { status: 404 });
      }

      return net.fetch(pathToFileURL(abs).toString());
    } catch {
      return new Response('Error', { status: 500 });
    }
  });
}

export function toAssetUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '').replace(/\\/g, '/');
  return `${SCHEME}://local/${encodeURI(normalized)}`;
}
