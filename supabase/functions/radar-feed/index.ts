import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Parser from "https://esm.sh/rss-parser@3.13.0";

const parser = new Parser();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'targetUrl is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch the RSS feed from the actual origin, bypassing browser CORS
    const feedResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    if (!feedResponse.ok) {
      throw new Error(`Upstream responded with ${feedResponse.status}`);
    }

    const xmlData = await feedResponse.text();
    
    // Parse the XML to a JavaScript object
    const feed = await parser.parseString(xmlData);

    // Normalize output to match rss2json format expected by the frontend
    const normalizedData = {
      status: 'ok',
      feed: {
        url: targetUrl,
        title: feed.title,
        link: feed.link,
      },
      items: feed.items.map((item: any) => ({
        title: item.title,
        pubDate: item.pubDate || item.isoDate,
        link: item.link,
        guid: item.guid || item.id,
        author: item.creator || item.author,
        thumbnail: '', // Optional: Add parsing for enclosures if needed
        description: item.contentSnippet || item.content,
        content: item.content || item.contentSnippet
      }))
    };

    return new Response(JSON.stringify(normalizedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
