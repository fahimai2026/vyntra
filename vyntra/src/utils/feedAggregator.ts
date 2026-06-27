import { GoogleGenAI, Type } from "@google/genai";

export interface FeedItem {
  source: "NEWS" | "REDDIT" | "AI" | "RSS";
  title: string;
  content: string;
  image: string | null;
  url: string;
  author: string;
  time: string; // ISO string or human string; we'll provide ISO so frontend can format dynamically
  timestamp: number; // Unix epoch ms
  likes: number;
  comments: number;
}

// In-Memory cache
let cachedFeed: FeedItem[] = [];
let lastFeedFetchTime = 0;

// In-Memory AI Posts Store (which accumulates over time, keeping the latest 50-100)
let aiPostsStore: Array<{
  title: string;
  content: string;
  author: string;
  topic: string;
  image: string | null;
  timestamp: number;
}> = [];
let lastAiFetchTime = 0;

// Fallback images for different topics/genres
const FALLBACK_IMAGES: Record<string, string> = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80",
  science: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500&auto=format&fit=crop&q=80",
  business: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80",
  bangladesh: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=500&auto=format&fit=crop&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=80",
  entertainment: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80"
};

// Simple text cleaner to sanitize description lengths and remove tags
function sanitizeText(html: string, maxLen: number = 280): string {
  if (!html) return "";
  const text = html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

// RSS XML parser using basic string slicing (highly robust and ultra fast)
function parseRssXml(xml: string, sourceName: string): FeedItem[] {
  const items: FeedItem[] = [];
  let currentIndex = 0;
  
  while (true) {
    const itemStart = xml.indexOf("<item>", currentIndex);
    if (itemStart === -1) break;
    const itemEnd = xml.indexOf("</item>", itemStart);
    if (itemEnd === -1) break;
    
    const itemXml = xml.slice(itemStart + 6, itemEnd);
    currentIndex = itemEnd + 7;
    
    // Extract nodes
    const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemXml.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemXml.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const creatorMatch = itemXml.match(/<dc:creator><!\[CDATA\[([\s\S]*?)\]\]><\/dc:creator>/) || itemXml.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/);
    
    // Extract Image
    const mediaContentMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/);
    const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/);
    const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/);
    
    let image = mediaContentMatch ? mediaContentMatch[1] : (mediaThumbnailMatch ? mediaThumbnailMatch[1] : (enclosureMatch ? enclosureMatch[1] : null));
    
    const title = sanitizeText(titleMatch ? titleMatch[1] : "", 150);
    const link = (linkMatch ? linkMatch[1] : "").trim();
    const content = sanitizeText(descMatch ? descMatch[1] : "", 280);
    const author = sanitizeText(creatorMatch ? creatorMatch[1] : "", 80) || sourceName;
    const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : "";
    let timestamp = Date.now();
    
    if (pubDateStr) {
      try {
        const parsed = Date.parse(pubDateStr);
        if (!isNaN(parsed)) {
          timestamp = parsed;
        }
      } catch (err) {
        // use default
      }
    }
    
    // If no image, set a nice category default image or null
    if (!image) {
      image = FALLBACK_IMAGES.technology;
    }
    
    // Generate organic pseudo-random counts based on title length
    const likes = Math.floor(10 + (title.length * 7) + (Math.random() * 50));
    const comments = Math.floor(2 + (title.length % 5) + (Math.random() * 15));
    
    items.push({
      source: "RSS",
      title,
      content: content || title,
      image,
      url: link,
      author,
      time: new Date(timestamp).toISOString(),
      timestamp,
      likes,
      comments
    });
    
    if (items.length >= 8) break; // Limit to 8 items per RSS source
  }
  
  return items;
}

// Generate fresh AI Feed Posts using Gemini
async function generateAiPosts(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
    
    const systemInstruction = `You are a social media generation simulation. Generate exactly 3 realistic social media micro-posts mimicking authentic user uploads on Vyntra. 
The areas the user covers are: technology (innovative updates), Bangladesh (vibrant tech startups, lifestyle, cricket, foodie culture, capital updates), sports (football, cricket), or entertainment (movies, gaming, local music releases).
Provide your response strictly as a JSON array containing exactly 3 objects.
JSON Schema structure:
[
  {
    "title": "A highly catchy thread title or main hook",
    "content": "Authentic personal update, commentary, or short opinion (under 280 characters length)",
    "author": "Vyntra User (invent an authentic-sounding English or Bengali-origin full name, e.g., Shayan Ahmed, Emily Watson, Nafis Karim, Tanvir Rahman, Sarah Jenkins)",
    "topic": "technology" | "bangladesh" | "sports" | "entertainment",
    "image": "suggested image keyword (e.g., 'cricket', 'dhaka', 'smartphone', 'gaming') or null"
  }
]
Do not return any markdown wraps, ticks, or text other than the pure raw JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate 3 fresh social media micro-posts right now.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              author: { type: Type.STRING },
              topic: { type: Type.STRING },
              image: { type: Type.STRING }
            },
            required: ["title", "content", "author", "topic"]
          }
        },
        temperature: 0.8
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        // Prepend to our in-memory global store with fresh sequential timestamps (staggered slightly)
        const baseTime = Date.now();
        parsed.forEach((p: any, idx: number) => {
          let imageLink = null;
          if (p.image) {
            imageLink = FALLBACK_IMAGES[p.topic.toLowerCase()] || FALLBACK_IMAGES.technology;
          }
          aiPostsStore.unshift({
            title: sanitizeText(p.title, 120),
            content: sanitizeText(p.content, 280),
            author: sanitizeText(p.author, 80),
            topic: p.topic.toLowerCase(),
            image: imageLink,
            timestamp: baseTime - (idx * 20000) // Spread timestamps 20s apart
          });
        });
        
        // Keep store capped at 50 posts to manage memory
        if (aiPostsStore.length > 50) {
          aiPostsStore = aiPostsStore.slice(0, 50);
        }
      }
    }
  } catch (err) {
    // Fail silently or safely
    // Rather than full error, populate inside console securely without keys
    // do not print process.env or sensitive variables
  }
}

// Get the unified merged feed
export async function getUnifiedFeed(): Promise<FeedItem[]> {
  const now = Date.now();
  
  // Cache check: return immediately if within 60 seconds
  if (cachedFeed.length > 0 && (now - lastFeedFetchTime < 60000)) {
    return cachedFeed;
  }
  
  const newsApiKey = process.env.NEWS_API_KEY || "ef3d3399927a4927ad4a1d648310523e";
  const results: FeedItem[] = [];
  
  // 1. Trigger AI Generation in Background if needed
  if (aiPostsStore.length === 0 || (now - lastAiFetchTime >= 60000)) {
    lastAiFetchTime = now;
    // Generate AI posts
    await generateAiPosts().catch(() => {});
  }
  
  // Mix in current AI Posts Store
  aiPostsStore.forEach((aiPost) => {
    const likes = Math.floor(10 + Math.random() * 800);
    const comments = Math.floor(3 + Math.random() * 120);
    results.push({
      source: "AI",
      title: aiPost.title,
      content: aiPost.content,
      image: aiPost.image,
      url: "#",
      author: aiPost.author,
      time: new Date(aiPost.timestamp).toISOString(),
      timestamp: aiPost.timestamp,
      likes,
      comments
    });
  });

  // Helper fetch functions with robust error boundaries
  const fetchNewsApi = async () => {
    try {
      // Fetch for business, science, technology (all mixed or separate, let's use mixed or main technology block)
      const res = await fetch(`https://newsapi.org/v2/top-headlines?category=technology&country=us&pageSize=10&apiKey=${newsApiKey}`, {
         headers: { "User-Agent": "VyntraPlatform/1.0" }
      });
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await res.json() : {};
      if (data.articles && Array.isArray(data.articles)) {
        data.articles.forEach((art: any) => {
          if (!art.title || art.title.includes("[Removed]")) return;
          const ts = art.publishedAt ? Date.parse(art.publishedAt) : Date.now();
          const likes = Math.floor(20 + Math.random() * 1200);
          const comments = Math.floor(5 + Math.random() * 140);
          results.push({
            source: "NEWS",
            title: sanitizeText(art.title, 150),
            content: sanitizeText(art.description || art.title, 280),
            image: art.urlToImage || FALLBACK_IMAGES.technology,
            url: art.url,
            author: art.author || art.source?.name || "Global News",
            time: new Date(ts).toISOString(),
            timestamp: ts,
            likes,
            comments
          });
        });
      }
    } catch (e) {
      // Ignore
    }
  };

  const fetchRssFeed = async (url: string, sourceName: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const xmlText = await res.text();
      const items = parseRssXml(xmlText, sourceName);
      results.push(...items);
    } catch (e) {
      // Ignore
    }
  };

  const fetchReddit = async (subreddit: string) => {
    try {
      const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=8`, {
         headers: { "User-Agent": "VyntraPlatform/1.0.0 (by /u/custom_vyntra)" }
      });
      if (!res.ok) return;
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await res.json() : {};
      if (data.data && data.data.children) {
        data.data.children.forEach((child: any) => {
          const item = child.data;
          if (!item) return;
          const ts = item.created_utc ? item.created_utc * 1000 : Date.now();
          const likes = item.ups || Math.floor(15 + Math.random() * 950);
          const comments = item.num_comments || Math.floor(2 + Math.random() * 80);
          
          let image = null;
          if (item.thumbnail && item.thumbnail.startsWith("http")) {
            image = item.thumbnail;
          } else {
            image = FALLBACK_IMAGES[subreddit.toLowerCase()] || FALLBACK_IMAGES.technology;
          }

          results.push({
            source: "REDDIT",
            title: sanitizeText(item.title, 150),
            content: sanitizeText(item.selftext || item.title, 280),
            image,
            url: item.url.startsWith("http") ? item.url : `https://reddit.com${item.permalink}`,
            author: `u/${item.author}`,
            time: new Date(ts).toISOString(),
            timestamp: ts,
            likes,
            comments
          });
        });
      }
    } catch (e) {
      // Ignore
    }
  };

  // Run all proxy lookups concurrently using Promise.allSettled for failure protection
  await Promise.allSettled([
    fetchNewsApi(),
    fetchRssFeed("https://techcrunch.com/feed/", "TechCrunch"),
    fetchRssFeed("https://feeds.bbci.co.uk/news/technology/rss.xml", "BBC Tech"),
    fetchRssFeed("https://feeds.reuters.com/reuters/technologyNews", "Reuters Tech"),
    fetchReddit("technology"),
    fetchReddit("science"),
    fetchReddit("worldnews")
  ]);

  // Sort unified lists newest first
  results.sort((a, b) => b.timestamp - a.timestamp);

  // Store in cache
  cachedFeed = results;
  lastFeedFetchTime = Date.now();

  return cachedFeed;
}
