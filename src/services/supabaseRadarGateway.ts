import { supabase } from '../lib/supabase';
import type { ConnectionType } from '../types';

/**
 * Parses RSS or Atom XML string into a normalized items array.
 * Runs in the browser using the native DOMParser, or using a regex fallback.
 */
const decodeHtmlEntities = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&iacute;/g, 'í')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&middot;/g, '·')
    .replace(/&euro;/g, '€')
    .replace(/&deg;/g, '°')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([A-Fa-f0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
};

const scrapeLaOpinion = (html: string): any[] => {
  const items: any[] = [];
  const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  let match;
  while ((match = articleRegex.exec(html)) !== null) {
    const articleHtml = match[1];
    const linkTitleMatch = articleHtml.match(/<a href="([^"]+)"[^>]*aria-label='([^']+)'[^>]*class="link-title"[^>]*>/i) ||
                           articleHtml.match(/<a href="([^"]+)"[^>]*class="link-title"[^>]*aria-label='([^']+)'[^>]*>/i) ||
                           articleHtml.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
    if (!linkTitleMatch) continue;
    
    let link = linkTitleMatch[1];
    if (link.startsWith('/')) {
      link = 'https://www.diariolaopinion.com.ar' + link;
    }
    const title = decodeHtmlEntities(linkTitleMatch[2].replace(/<[^>]+>/g, '').trim());
    if (title.length < 10) continue;

    let description = '';
    const bajadaMatch = articleHtml.match(/class="bajada"[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>/i) ||
                        articleHtml.match(/<p>([\s\S]*?)<\/p>/i);
    if (bajadaMatch) {
      description = decodeHtmlEntities(bajadaMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    let pubDate = new Date().toISOString();
    const dateMatch = articleHtml.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
    if (dateMatch) {
      pubDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T12:00:00Z`).toISOString();
    }
    items.push({
      title,
      link,
      pubDate,
      description: description || title,
      content: description || title,
      author: 'Diario La Opinión'
    });
  }

  // Backup if items < 3: find headers
  if (items.length < 3) {
    const backupRegex = /<h[23][^>]*>\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let backupMatch;
    while ((backupMatch = backupRegex.exec(html)) !== null) {
      let link = backupMatch[1];
      if (link.startsWith('/')) link = 'https://www.diariolaopinion.com.ar' + link;
      const title = decodeHtmlEntities(backupMatch[2].trim());
      if (title.length >= 10 && !items.some(x => x.link === link)) {
        items.push({
          title,
          link,
          pubDate: new Date().toISOString(),
          description: title,
          content: title,
          author: 'Diario La Opinión'
        });
      }
    }
  }
  return items;
};

const scrapeRafaelaInforma = (xmlOrHtml: string): any[] => {
  const items: any[] = [];

  // --- Strategy 1: Parse sitemap.xml ---
  // Sitemap format: <url><loc>https://rafaelainforma.com/contenido/ID/slug</loc></url>
  if (xmlOrHtml.includes('<urlset') || xmlOrHtml.includes('<loc>')) {
    const locRegex = /<loc>(https?:\/\/[^<]*\/contenido\/(\d+)\/([^<]+))<\/loc>/gi;
    let match;
    while ((match = locRegex.exec(xmlOrHtml)) !== null && items.length < 10) {
      const url = match[1];
      const id = parseInt(match[2], 10);
      const slug = match[3];

      // Convert slug to readable title: replace hyphens with spaces, capitalize first letter
      const rawTitle = slug.replace(/-/g, ' ').replace(/%[0-9a-f]{2}/gi, '');
      const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

      if (title.length >= 10 && !items.some(x => x.link === url)) {
        items.push({
          title: title.trim(),
          link: url,
          pubDate: new Date().toISOString(),
          description: title.trim(),
          content: title.trim(),
          author: 'Rafaela Informa',
          _sitemapId: id // Store ID for sorting by recency
        });
      }
    }

    // Sort by ID descending (highest ID = most recent)
    items.sort((a, b) => (b._sitemapId || 0) - (a._sitemapId || 0));
    // Remove the helper field
    items.forEach(item => delete item._sitemapId);

    if (items.length > 0) return items;
  }

  // --- Strategy 2: Parse HTML portada (fallback if scraping worked) ---
  // Articles have class="post post__noticia" and contain h2.post__titulo > a
  const articleRegex = /<article[^>]*class="[^"]*post__noticia[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  let match2;
  while ((match2 = articleRegex.exec(xmlOrHtml)) !== null) {
    const articleHtml = match2[1];

    // Extract link and title from <h2 class="post__titulo"><a href="...">title</a></h2>
    const titleMatch = articleHtml.match(/<h2[^>]*class="[^"]*post__titulo[^"]*"[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    let link = titleMatch[1];
    if (link.startsWith('/')) {
      link = 'https://rafaelainforma.com' + link;
    }
    const title = decodeHtmlEntities(titleMatch[2].replace(/<[^>]+>/g, '').trim());
    if (title.length < 10 || items.some(x => x.link === link)) continue;

    // Extract date from <span class="fecha">DD/MM/YYYY</span>
    let pubDate = new Date().toISOString();
    const dateMatch = articleHtml.match(/<span[^>]*class="fecha"[^>]*>(\d{2})\/(\d{2})\/(\d{4})<\/span>/i);
    if (dateMatch) {
      pubDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T12:00:00Z`).toISOString();
    }

    // Extract description/bajada from <div class="post__detalle">
    let description = '';
    const detailMatch = articleHtml.match(/<div[^>]*class="[^"]*post__detalle[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
    if (detailMatch) {
      description = decodeHtmlEntities(detailMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    items.push({
      title,
      link,
      pubDate,
      description: description || title,
      content: description || title,
      author: 'Rafaela Informa'
    });
  }
  return items;
};

const scrapeAdn979 = (html: string): any[] => {
  const items: any[] = [];
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let match;
  while ((match = h3Regex.exec(html)) !== null) {
    const h3Content = match[1];
    const linkMatch = h3Content.match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (linkMatch) {
      let link = linkMatch[1];
      if (link.startsWith('/')) {
        link = 'https://adn979.com' + link;
      }
      const title = decodeHtmlEntities(linkMatch[2].replace(/<[^>]+>/g, '').trim());
      if (title.length >= 10 && !items.some(x => x.link === link)) {
        items.push({
          title,
          link,
          pubDate: new Date().toISOString(),
          description: title,
          content: title,
          author: 'ADN 97.9'
        });
      }
    }
  }
  return items;
};



/**
 * Parses RSS or Atom XML string into a normalized items array.
 * Runs in the browser using the native DOMParser, or using a regex fallback.
 */
const parseRssXml = (xmlText: string, targetUrl?: string): any[] => {
  if (targetUrl) {
    if (targetUrl.includes('diariolaopinion.com.ar')) {
      return scrapeLaOpinion(xmlText);
    }
    if (targetUrl.includes('rafaelainforma.com')) {
      return scrapeRafaelaInforma(xmlText);
    }
    if (targetUrl.includes('adn979.com')) {
      return scrapeAdn979(xmlText);
    }
    // If the response is an HTML page (e.g. Cloudflare challenge), return empty — no mock fallback
    if (xmlText.includes('Just a moment...') || xmlText.trim().startsWith('<!DOCTYPE html>')) {
      return [];
    }
  }

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
        // Use longer timeout for html_scraping since pages can be slow
        const proxyTimeout = preferredType === 'html_scraping' ? 12000 : 5000;
        const timeoutId = setTimeout(() => controller.abort(), proxyTimeout);
        const res = await fetch(`/rss-local-proxy?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const xmlText = await res.text();
          const parsedItems = parseRssXml(xmlText, url);
          if (parsedItems.length > 0) {
            return {
              data: { status: 'ok', items: parsedItems },
              methodUsed: preferredType === 'html_scraping' ? 'html_scraping' : 'local_proxy',
              responseTimeMs: Math.round(performance.now() - start)
            };
          }
        }
      } catch (e: any) {
        console.warn(`Local proxy failed for ${url}: ${e.message}`);
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

    // Special handling for html_scraping preferred type
    if (preferredType === 'html_scraping') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
        const directRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (directRes.ok) {
          const xmlText = await directRes.text();
          const parsedItems = parseRssXml(xmlText, url);
          if (parsedItems.length > 0) {
            return {
              data: { status: 'ok', items: parsedItems },
              methodUsed: 'html_scraping',
              responseTimeMs: Math.round(performance.now() - start)
            };
          }
        }
      } catch (directErr) {
        console.warn(`Direct fetch failed for scraping ${url}:`, directErr);
      }
    }

    // Special handling for rss_direct preferred type (e.g. for HTML scraping feeds)
    if (preferredType === 'rss_direct') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
        const directRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (directRes.ok) {
          const xmlText = await directRes.text();
          const parsedItems = parseRssXml(xmlText, url);
          if (parsedItems.length > 0) {
            return {
              data: { status: 'ok', items: parsedItems },
              methodUsed: 'rss_direct',
              responseTimeMs: Math.round(performance.now() - start)
            };
          }
        }
      } catch (directErr) {
        console.warn(`Direct fetch failed first for ${url}:`, directErr);
      }
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
        return { data, methodUsed: preferredType === 'html_scraping' ? 'html_scraping' : 'edge_function', responseTimeMs: Math.round(performance.now() - start) };
      }
    } catch (e) {}

    // Try Attempt 2: rss2json_proxy
    if (preferredType !== 'html_scraping') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // Fast timeout: 2.5s
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        
        if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
          return { data, methodUsed: 'rss2json_proxy', responseTimeMs: Math.round(performance.now() - start) };
        }
      } catch (e) {}
    }

    // Try Attempt 3: AllOrigins proxy with client-side XML parser
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        const parsedItems = parseRssXml(json.contents, url);
        if (parsedItems.length > 0) {
          return {
            data: { status: 'ok', items: parsedItems },
            methodUsed: preferredType === 'html_scraping' ? 'html_scraping' : 'allorigins_proxy',
            responseTimeMs: Math.round(performance.now() - start)
          };
        }
      }
    } catch (e) {}

    // Try Attempt 4: Corsproxy.io with client-side XML parser
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const xmlText = await res.text();
        const parsedItems = parseRssXml(xmlText, url);
        if (parsedItems.length > 0) {
          return {
            data: { status: 'ok', items: parsedItems },
            methodUsed: preferredType === 'html_scraping' ? 'html_scraping' : 'corsproxy_proxy',
            responseTimeMs: Math.round(performance.now() - start)
          };
        }
      }
    } catch (e) {}

    // Try Attempt 5: Direct fetch (as absolute last resort)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout
      const directRes = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (directRes.ok) {
        const xmlText = await directRes.text();
        const parsedItems = parseRssXml(xmlText, url);
        if (parsedItems.length > 0) {
          return {
            data: { status: 'ok', items: parsedItems },
            methodUsed: preferredType === 'html_scraping' ? 'html_scraping' : 'rss_direct',
            responseTimeMs: Math.round(performance.now() - start)
          };
        }
      }
    } catch (directErr) {}

    throw new Error('No se pudo obtener el feed desde ninguna fuente de proxy.');
  }
};
