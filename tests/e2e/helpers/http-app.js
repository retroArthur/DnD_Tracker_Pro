// @ts-check
import { test as base, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { basename, extname, resolve, sep } from 'node:path';

const origins = new WeakMap();
const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2'
};

// Nur diese Persistenz-Specs erhalten eine echte HTTP-Origin. Kein externer
// Server und keine Änderung am allgemeinen file://-Testaufbau erforderlich.
export const test = base.extend({
    serviceWorkers: 'block',
    httpOrigin: [
        // Playwright liest Fixture-Abhängigkeiten aus dem destrukturierten Parameter.
        // eslint-disable-next-line no-empty-pattern
        async ({}, use) => {
            const dist = resolve('dist');
            const server = createServer(async (request, response) => {
                try {
                    const pathname = decodeURIComponent(
                        new URL(request.url, 'http://127.0.0.1').pathname
                    );
                    if (pathname === '/favicon.ico') {
                        response.writeHead(204).end();
                        return;
                    }
                    let file = resolve(dist, '.' + pathname);
                    if (!file.startsWith(dist + sep)) {
                        response.writeHead(403).end();
                        return;
                    }
                    // Der Dev-Build enthält die Schriften und sw.js. Manifest
                    // und Icons werden erst beim Pages-Paket nach dist kopiert.
                    let body;
                    try {
                        body = await readFile(file);
                    } catch {
                        if (
                            pathname !== '/manifest.webmanifest' &&
                            !pathname.startsWith('/icons/')
                        ) {
                            response.writeHead(404).end();
                            return;
                        }
                        file = resolve('.' + pathname);
                        body = await readFile(file);
                    }
                    response.writeHead(200, {
                        'Content-Type': mime[extname(file)] || 'application/octet-stream',
                        'Cache-Control': 'no-store'
                    });
                    response.end(request.method === 'HEAD' ? undefined : body);
                } catch {
                    response.writeHead(404).end();
                }
            });
            await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
            const address = server.address();
            try {
                await use(`http://127.0.0.1:${address.port}`);
            } finally {
                await new Promise((resolve, reject) => {
                    server.close(error => (error ? reject(error) : resolve()));
                    server.closeAllConnections();
                });
            }
        },
        { scope: 'worker' }
    ],
    context: async ({ context, httpOrigin }, use) => {
        origins.set(context, httpOrigin);
        await use(context);
    }
});

/** @param {import('@playwright/test').Page} page @param {string} [file] */
export function httpAppUrl(page, file = 'dnd-tracker-bundled.html') {
    const origin = origins.get(page.context());
    if (!origin) throw new Error('HTTP-Testfixture fehlt');
    return `${origin}/${basename(file)}`;
}

export { expect };
