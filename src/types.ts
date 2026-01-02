export interface Article {
  title: string;
  url: string;
  summary?: string;
  category?: string;
  imageUrl?: string;
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
