/**
 * Sanitize and normalize text from web scraping
 * Handles HTML entities, special characters, and encoding issues
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  let result = text;

  // Decode HTML entities
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '-',
    '&mdash;': '-',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '...',
    '&euro;': 'EUR',
    '&pound;': 'GBP',
    '&copy;': '(c)',
    '&reg;': '(R)',
    '&trade;': '(TM)',
    '&deg;': ' deg',
    '&plusmn;': '+/-',
    '&frac12;': '1/2',
    '&frac14;': '1/4',
    '&frac34;': '3/4',
    '&times;': 'x',
    '&divide;': '/',
  };

  // Replace named HTML entities
  for (const [entity, char] of Object.entries(htmlEntities)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }

  // Decode numeric HTML entities (&#123; or &#x7B;)
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  // Normalize special characters that might cause issues
  result = result
    .replace(/[\u0080-\u009F]/g, '') // Remove control characters
    .replace(/\u00A0/g, ' ')         // Non-breaking space to regular space
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .replace(/^\s+|\s+$/g, '');      // Trim

  // Normalize quotes and dashes to ASCII equivalents
  result = result
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // Smart single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // Smart double quotes
    .replace(/[\u2013\u2014\u2015]/g, '-')        // En/em dashes
    .replace(/\u2026/g, '...')                    // Ellipsis
    .replace(/\u00B7/g, '-')                      // Middle dot
    .replace(/\u2022/g, '-')                      // Bullet
    .replace(/~/g, '-');                          // Tilde to dash

  return result;
}

/**
 * Escape HTML for safe display in email
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Calculate article priority based on various signals
 * Returns a score from 1-10 (higher = more important)
 */
export function calculatePriority(
  position: number,
  isMainHeadline: boolean,
  hasImage: boolean,
  titleLength: number,
  hasSummary: boolean
): number {
  let priority = 5; // Base priority

  // Position bonus (first articles are more important)
  if (position === 0) priority += 3;
  else if (position === 1) priority += 2;
  else if (position < 5) priority += 1;

  // Main headline bonus
  if (isMainHeadline) priority += 2;

  // Articles with images tend to be more important
  if (hasImage) priority += 1;

  // Very short titles might be teasers, longer ones are usually more substantive
  if (titleLength > 40 && titleLength < 120) priority += 1;

  // Having a summary indicates editorial importance
  if (hasSummary) priority += 1;

  // Cap at 10
  return Math.min(10, Math.max(1, priority));
}
