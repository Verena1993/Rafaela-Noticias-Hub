import type { ConnectionType } from '../data/mockData';

/**
 * NewsGatewayService
 * Architecture ready for Edge Functions (Supabase, Vercel, Cloudflare).
 * This service abstracts the fetching mechanism away from rss2json,
 * allowing media sources with strict CORS policies to be routed through a serverless proxy.
 */

// FUTURE: Set this to your actual Supabase Edge Function URL
const EDGE_FUNCTION_URL = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-rss';

export const newsGatewayService = {
  fetchFeed: async (url: string, connectionType: ConnectionType): Promise<any> => {
    switch (connectionType) {
      case 'rss2json_proxy':
      case 'google_news':
        // Legacy fallback that works for unprotected feeds
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const data = await res.json();
        if (data.status !== 'ok') {
          throw new Error(data.message || 'Error del feed o bloqueado por origen');
        }
        return data;

      case 'edge_function':
        // PREPARED ARCHITECTURE:
        // Currently, since EDGE_FUNCTION_URL is a placeholder, we will simulate a rejection
        // that accurately represents the media block. When the real URL is placed, this block
        // will route the request via the serverless function.
        
        if (EDGE_FUNCTION_URL.includes('YOUR_PROJECT_REF')) {
          // If not configured, we attempt the direct/rss2json route as a last resort,
          // but we know it usually fails for these strict providers.
          try {
            const fbRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
            const fbData = await fbRes.json();
            if (fbData.status !== 'ok') throw new Error('Bloqueado por CORS / Origen.');
            return fbData;
          } catch (e: any) {
            throw new Error(`Conexión bloqueada. Requiere configurar Edge Function en el Gateway. Detalle: ${e.message}`);
          }
        }

        // Real Edge Function implementation
        const edgeRes = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl: url })
        });
        if (!edgeRes.ok) throw new Error(`Edge Function Error: ${edgeRes.status}`);
        return await edgeRes.json();

      case 'rss_direct':
        // Attempt direct browser fetch (will likely fail with CORS but prepared for internal endpoints)
        const directRes = await fetch(url);
        if (!directRes.ok) throw new Error(`Direct Fetch Error ${directRes.status}`);
        // Return raw text, expecting the consumer to parse XML
        return { status: 'raw_xml', content: await directRes.text() };

      default:
        throw new Error(`Connection type ${connectionType} not supported.`);
    }
  }
};
