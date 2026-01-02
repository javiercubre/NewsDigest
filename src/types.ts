export interface Article {
  title: string;
  url: string;
  summary?: string;
  category?: string;
  imageUrl?: string;
  priority: number; // 1-10, higher = more important
  isHeadline: boolean; // Was this a main headline on the page?
  source?: string; // Source name for top headlines section
}

export interface SourceDigest {
  source: string;
  sourceUrl: string;
  articles: Article[];
  scrapedAt: Date;
  error?: string;
}

export interface DigestConfig {
  recipientEmail: string;
  sources: string[];
}
