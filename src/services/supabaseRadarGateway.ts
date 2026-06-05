import { supabase } from '../lib/supabase';
import type { ConnectionType } from '../data/mockData';

/**
 * Supabase Radar Gateway
 * 
 * Attempts to fetch feeds via Supabase Edge Function ('radar-feed').
 * If it fails or is not ready, falls back to public proxies or direct fetches.
 */
export const supabaseRadarGateway = {
  fetchFromSupabaseGateway: async (url: string, preferredType: ConnectionType): Promise<{ data: any; methodUsed: ConnectionType | string; responseTimeMs: number }> => {
    
    if (preferredType === 'pending') {
      return { data: { status: 'error', message: 'URL no configurada', items: [] }, methodUsed: 'pending', responseTimeMs: 0 };
    }

    const start = performance.now();

    if (preferredType === 'google_news') {
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.status === 'ok') return { data, methodUsed: 'google_news', responseTimeMs: Math.round(performance.now() - start) };
      } catch (e) {}
    }

    try {
      // Attempt 1: Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('radar-feed', {
        body: { targetUrl: url },
      });

      if (!error && data && data.status === 'ok') {
        return { data, methodUsed: 'edge_function', responseTimeMs: Math.round(performance.now() - start) };
      }
    } catch (e) {
      // Silent catch, move to fallback
    }

    // Attempt 2: Fallback to rss2json
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      if (data.status === 'ok') {
        return { data, methodUsed: 'rss2json_proxy', responseTimeMs: Math.round(performance.now() - start) };
      } else {
        throw new Error(data.message || 'Error del feed o bloqueado por origen');
      }
    } catch (e: any) {
      // Attempt 3: Direct fetch as absolute last resort
      if (preferredType === 'rss_direct') {
        try {
          const directRes = await fetch(url);
          if (directRes.ok) {
            return { data: { status: 'raw_xml', content: await directRes.text() }, methodUsed: 'rss_direct', responseTimeMs: Math.round(performance.now() - start) };
          }
        } catch (directErr) {}
      }
      
      throw new Error(e.message || 'Conexión bloqueada por CORS o Error 500.');
    }
  }
};
