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
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': ''',
    '&rsquo;': ''',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '…',
    '&euro;': '€',
    '&pound;': '£',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&deg;': '°',
    '&plusmn;': '±',
    '&frac12;': '½',
    '&frac14;': '¼',
    '&frac34;': '¾',
    '&times;': '×',
    '&divide;': '÷',
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

  // Fix common encoding issues
  const encodingFixes: Record<string, string> = {
    'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä', 'Ã¥': 'å',
    'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
    'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
    'Ã§': 'ç', 'Ã±': 'ñ',
    'Ã': 'Á', 'Ã€': 'À', 'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã„': 'Ä', 'Ã…': 'Å',
    'Ã‰': 'É', 'Ãˆ': 'È', 'ÃŠ': 'Ê', 'Ã‹': 'Ë',
    'Ã': 'Í', 'ÃŒ': 'Ì', 'ÃŽ': 'Î', 'Ã': 'Ï',
    'Ã"': 'Ó', 'Ã'': 'Ò', 'Ã"': 'Ô', 'Ã•': 'Õ', 'Ã–': 'Ö',
    'Ãš': 'Ú', 'Ã™': 'Ù', 'Ã›': 'Û', 'Ãœ': 'Ü',
    'Ã‡': 'Ç', 'Ã'': 'Ñ',
    'â€"': '–', 'â€"': '—',
    'â€œ': '"', 'â€': '"',
    'â€˜': ''', 'â€™': ''',
    'â€¦': '…',
    'â€¢': '•',
    'Â ': ' ', 'Â': '',
    'â‚¬': '€',
  };

  for (const [broken, fixed] of Object.entries(encodingFixes)) {
    result = result.split(broken).join(fixed);
  }

  // Normalize special characters that might cause issues
  result = result
    .replace(/[\u0080-\u009F]/g, '') // Remove control characters
    .replace(/\u00A0/g, ' ')         // Non-breaking space to regular space
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .replace(/^\s+|\s+$/g, '');      // Trim

  // Normalize quotes and dashes
  result = result
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, '-');

  return result;
}

/**
 * Escape HTML for safe display
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
}

/**
 * Calculate article priority based on various signals
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
