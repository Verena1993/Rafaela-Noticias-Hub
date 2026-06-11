import { supabase } from '../lib/supabase';
import type { ConnectionType } from '../types';

/**
 * Parses RSS or Atom XML string into a normalized items array.
 * Runs in the browser using the native DOMParser, or using a regex fallback.
 */
const parseRssXml = (xmlText: string): any[] => {
  // 1. Try DOMParser first if available
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      const parserError = xmlDoc.querySelector("parsererror");
      if (!parserError) {
        // Parse RSS items
        const rssItems = xmlDoc.querySelectorAll("item");
        if (rssItems.length > 0) {
          const items: any[] = [];
          rssItems.forEach(item => {
            const title = item.querySelector("title")?.textContent || "";
            let link = item.querySelector("link")?.textContent || "";
            if (!link) {
              const linkEl = item.querySelector("link");
              if (linkEl) {
                link = linkEl.getAttribute("href") || linkEl.textContent || "";
              }
            }
            const description = item.querySelector("description")?.textContent || "";
            const contentEncoded = item.querySelector("encoded")?.textContent || "";
            const pubDate = item.querySelector("pubDate")?.textContent || item.querySelector("date")?.textContent || "";
            const author = item.querySelector("creator")?.textContent || item.querySelector("author")?.textContent || "";
            
            items.push({
              title: title.trim(),
              pubDate: pubDate.trim(),
              link: link.trim(),
              description: (description || contentEncoded).trim(),
              content: (contentEncoded || description).trim(),
              author: author.trim()
            });
          });
          return items;
        }
        
        // Parse Atom entries
        const atomEntries = xmlDoc.querySelectorAll("entry");
        if (atomEntries.length > 0) {
          const items: any[] = [];
          atomEntries.forEach(entry => {
            const title = entry.querySelector("title")?.textContent || "";
            let link = "";
            const linkEl = entry.querySelector("link");
            if (linkEl) {
              link = linkEl.getAttribute("href") || linkEl.textContent || "";
            }
            const description = entry.querySelector("summary")?.textContent || entry.querySelector("content")?.textContent || "";
            const pubDate = entry.querySelector("published")?.textContent || entry.querySelector("updated")?.textContent || "";
            const author = entry.querySelector("author name")?.textContent || entry.querySelector("author")?.textContent || "";
            
            items.push({
              title: title.trim(),
              pubDate: pubDate.trim(),
              link: link.trim(),
              description: description.trim(),
              content: description.trim(),
              author: author.trim()
            });
          });
          return items;
        }
      }
    } catch (err) {
      console.warn("DOMParser failed, falling back to regex parser:", err);
    }
  }
  
  // 2. Fallback to Regex Parser (Runs everywhere, including Node CLI tests)
  try {
    const items: any[] = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
    if (!itemMatches) return [];
    
    const extractTag = (xml: string, tag: string) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i')) ||
                    xml.match(new RegExp(`<[^>:]+:${tag}[^>]*>([\\s\\S]*?)<\/[^>:]+:${tag}>`, 'i'));
      if (match) {
        return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      }
      return '';
    };
    
    itemMatches.forEach(itemXml => {
      const title = extractTag(itemXml, 'title');
      let link = extractTag(itemXml, 'link');
      if (!link) {
        const hrefMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
        if (hrefMatch) link = hrefMatch[1];
      }
      const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'summary') || extractTag(itemXml, 'encoded');
      const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'published') || extractTag(itemXml, 'updated') || extractTag(itemXml, 'date');
      const author = extractTag(itemXml, 'creator') || extractTag(itemXml, 'author');
      
      items.push({
        title,
        link,
        pubDate,
        description,
        content: description,
        author
      });
    });
    return items;
  } catch (err) {
    console.error("Regex parser failed:", err);
  }
  
  return [];
};

/**
 * Supabase Radar Gateway
 * 
 * Attempts to fetch feeds via local proxy, Supabase Edge Function, or public proxies.
 */
export const supabaseRadarGateway = {
  fetchFromSupabaseGateway: async (url: string, preferredType: ConnectionType): Promise<{ data: any; methodUsed: ConnectionType | string; responseTimeMs: number }> => {
    
    if (preferredType === 'pending') {
      return { data: { status: 'error', message: 'URL no configurada', items: [] }, methodUsed: 'pending', responseTimeMs: 0 };
    }

    const start = performance.now();
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname.startsWith('192.168.'));

    // Attempt 0: Local Dev RSS Proxy (High Priority fallback for local development)
    if (isLocal) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const res = await fetch(`/rss-local-proxy?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        // Fast fail: if the target returned 404 or 403, we know it's dead or Cloudflare-blocked.
        // Bypasses other proxies to prevent cascading timeouts.
        if (res.status === 404 || res.status === 403) {
          throw new Error(`Upstream returned status ${res.status} (dead or blocked)`);
        }

        if (res.ok) {
          const xmlText = await res.text();
          const parsedItems = parseRssXml(xmlText);
          if (parsedItems.length > 0) {
            return {
              data: { status: 'ok', items: parsedItems },
              methodUsed: 'local_proxy',
              responseTimeMs: Math.round(performance.now() - start)
            };
          }
        }
      } catch (e: any) {
        // If it was a dead URL or blocked status, re-throw to abort immediately and skip other proxies!
        if (e.message?.includes('dead or blocked')) {
          throw e;
        }
        // For other network/connection errors, proceed to standard fallback chain
      }
    }

    // Special handling for google_news preferred type
    if (preferredType === 'google_news') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
          return { data, methodUsed: 'google_news', responseTimeMs: Math.round(performance.now() - start) };
        }
      } catch (e) {}
    }

    // Try Attempt 1: Supabase Edge Function
    try {
      const controller = new AbortController();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          controller.abort();
          reject(new Error('Edge Function timeout'));
        }, 4000); // Fast timeout: 4s
      });

      const fetchPromise = supabase.functions.invoke('radar-feed', {
        body: { targetUrl: url },
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (!error && data && data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        return { data, methodUsed: 'edge_function', responseTimeMs: Math.round(performance.now() - start) };
      }
    } catch (e) {
      // Fail silently and move to fallback
    }

    // Try Attempt 2: rss2json_proxy
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // Fast timeout: 2.5s
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        return { data, methodUsed: 'rss2json_proxy', responseTimeMs: Math.round(performance.now() - start) };
      }
    } catch (e) {
      // Fail silently and move to fallback
    }

    // Try Attempt 3: AllOrigins proxy with client-side XML parser
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        const parsedItems = parseRssXml(json.contents);
        if (parsedItems.length > 0) {
          return {
            data: { status: 'ok', items: parsedItems },
            methodUsed: 'allorigins_proxy',
            responseTimeMs: Math.round(performance.now() - start)
          };
        }
      }
    } catch (e) {
      // Fail silently and move to fallback
    }

    // Try Attempt 4: Corsproxy.io with client-side XML parser
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const xmlText = await res.text();
        const parsedItems = parseRssXml(xmlText);
        if (parsedItems.length > 0) {
          return {
            data: { status: 'ok', items: parsedItems },
            methodUsed: 'corsproxy_proxy',
            responseTimeMs: Math.round(performance.now() - start)
          };
        }
      }
    } catch (e) {
      // Fail silently and move to fallback
    }

    // Try Attempt 5: Direct fetch (as absolute last resort)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout
      const directRes = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (directRes.ok) {
        const xmlText = await directRes.text();
        const parsedItems = parseRssXml(xmlText);
        if (parsedItems.length > 0) {
          return {
            data: { status: 'ok', items: parsedItems },
            methodUsed: 'rss_direct',
            responseTimeMs: Math.round(performance.now() - start)
          };
        }
      }
    } catch (directErr) {
      // Fail silently
    }

    // If all attempts failed, throw final error
    throw new Error('No se pudo obtener ni procesar el feed de noticias desde ninguna fuente de proxy.');
  }
};
