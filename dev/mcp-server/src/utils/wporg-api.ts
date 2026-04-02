export interface WpOrgPluginInfo {
  name: string;
  slug: string;
  version: string;
  active_installs: number;
  rating: number;
  num_ratings: number;
  last_updated: string;
  tested: string;
  requires: string;
  requires_php: string;
  support_threads: number;
  support_threads_resolved: number;
}

export interface WpOrgReview {
  rating: number;
  date: string;
  reviewer: string;
  content: string;
}

const API_BASE = "https://api.wordpress.org/plugins/info/1.2/";

export async function fetchPluginInfo(slug: string): Promise<WpOrgPluginInfo | null> {
  try {
    const url = `${API_BASE}?action=plugin_information&request[slug]=${slug}&request[fields][active_installs]=1&request[fields][ratings]=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    if (data.error) return null;

    return {
      name: String(data.name || ""),
      slug: String(data.slug || ""),
      version: String(data.version || ""),
      active_installs: Number(data.active_installs || 0),
      rating: Number(data.rating || 0),
      num_ratings: Number(data.num_ratings || 0),
      last_updated: String(data.last_updated || ""),
      tested: String(data.tested || ""),
      requires: String(data.requires || ""),
      requires_php: String(data.requires_php || ""),
      support_threads: Number(data.support_threads || 0),
      support_threads_resolved: Number(data.support_threads_resolved || 0),
    };
  } catch {
    return null;
  }
}

export async function fetchReviews(
  slug: string,
  count = 10
): Promise<WpOrgReview[]> {
  try {
    const url = `https://wordpress.org/support/plugin/${slug}/reviews/feed/`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const xml = await res.text();

    const reviews: WpOrgReview[] = [];
    const items = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const item of items) {
      if (reviews.length >= count) break;
      const body = item[1];
      const title = body.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const date = body.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const creator = body.match(/<dc:creator>(.*?)<\/dc:creator>/)?.[1] || "";

      const stars = (title.match(/&#9733;/g) || []).length || parseInt(title.match(/\[(\d)/)?.[1] || "0", 10);

      reviews.push({
        rating: stars || 5,
        date: date ? new Date(date).toISOString().split("T")[0] : "",
        reviewer: creator.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1"),
        content: title.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").slice(0, 200),
      });
    }

    return reviews;
  } catch {
    return [];
  }
}
