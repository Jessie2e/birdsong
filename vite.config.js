import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import nearbyHandler from './api/nearby-birds.js';
import locationHandler from './api/location-search.js';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Serve the noncommercial experiment only in the local development server.
// Model assets are outside public/ so ordinary builds never publish them.
function localBirdnet() {
  return {
    name: 'local-birdnet-prototype',
    configureServer(server) {
      server.middlewares.use('/birdnet', (req, res, next) => {
        const name = req.url?.split('?')[0]?.slice(1);
        if (!/^(model\.json|labels\.txt|group1-shard\d+of13\.bin|area-model\/(model\.json|group1-shard[12]of2\.bin))$/.test(name || '')) return next();
        const asset = createReadStream(fileURLToPath(new URL(`./.birdnet-local/${name}`, import.meta.url)));
        asset.on('error', () => { if (!res.headersSent) { res.statusCode = 404; res.end('Run npm run listening:setup first.'); } else res.destroy(); });
        res.setHeader('Content-Type', name.endsWith('.json') ? 'application/json' : name.endsWith('.txt') ? 'text/plain' : 'application/octet-stream');
        asset.pipe(res);
      });
    },
  };
}
function localNearby(environment) {
  return {
    name: 'local-nearby-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url, 'http://localhost');
        const handler = url.pathname === '/api/nearby-birds' ? nearbyHandler : url.pathname === '/api/location-search' ? locationHandler : null;
        if (!handler) return next();
        request.query = Object.fromEntries(url.searchParams);
        request.ebirdApiKey = environment.EBIRD_API_KEY;
        response.status = code => { response.statusCode = code; return response; };
        response.json = payload => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(payload)); return response; };
        await handler(request, response);
      });
    },
  };
}
export default defineConfig(({mode}) => ({ plugins: [react(), localBirdnet(), localNearby(loadEnv(mode, process.cwd(), 'EBIRD_'))] }));
