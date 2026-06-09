import { supabase } from '../lib/supabase';
import type { ConnectionType } from '../types';

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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.status === 'ok') return { data, methodUsed: 'google_news', responseTimeMs: Math.round(performance.now() - start) };
      } catch (e) {}
    }

    try {
      // Attempt 1: Supabase Edge Function with 10s timeout
      const controller = new AbortController();
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          controller.abort();
          reject(new Error('Edge Function timeout'));
        }, 10000);
      });

      const fetchPromise = supabase.functions.invoke('radar-feed', {
        body: { targetUrl: url },
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (!error && data && data.status === 'ok') {
        return { data, methodUsed: 'edge_function', responseTimeMs: Math.round(performance.now() - start) };
      }
    } catch (e) {
      // Silent catch, move to fallback
    }

    // Attempt 2: Fallback to rss2json
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
          const directRes = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (directRes.ok) {
            return { data: { status: 'raw_xml', content: await directRes.text() }, methodUsed: 'rss_direct', responseTimeMs: Math.round(performance.now() - start) };
          }
        } catch (directErr) {}
      }
      
      if (e.name === 'AbortError') {
         throw new Error('Timeout: El servidor o proxy no respondió (8s).');
      }
      throw new Error(e.message || 'Conexión bloqueada o Timeout alcanzado.');
    }
  }
};
