import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const localRssProxyPlugin = (): Plugin => ({
  name: 'local-rss-proxy',
  configureServer(server) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/rss-local-proxy')) {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          // Detect if this is likely an HTML page (not RSS) based on URL pattern
          const isHtmlPage = !targetUrl.includes('/feed') && !targetUrl.includes('/rss') && !targetUrl.includes('.xml');
          
          const fetchRes = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': isHtmlPage 
                ? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                : 'application/rss+xml, application/xml, text/xml, */*',
              'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache'
            }
          });

          res.setHeader('Access-Control-Allow-Origin', '*');
          const contentType = fetchRes.headers.get('content-type') || (isHtmlPage ? 'text/html; charset=utf-8' : 'text/xml; charset=utf-8');
          res.setHeader('Content-Type', contentType);
          res.statusCode = fetchRes.status;

          const text = await fetchRes.text();
          res.end(text);
        } catch (err: any) {
          res.statusCode = 500;
          res.end(err.message);
        }
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localRssProxyPlugin()]
})
