/**
 * Generate a unique identifier for each editor instance
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Escape HTML special characters to prevent XSS attacks.
 * This should be used for all user-supplied content before rendering.
 */
export function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape special regex characters in a string for safe use in RegExp constructor.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simple fuzzy matching algorithm.
 * Returns a score between 0 and 1.
 */
export function fuzzyMatch(pattern: string, text: string): number {
  if (!pattern || !text) return 0;
  if (text.includes(pattern)) return 1; // Exact substring match gets highest score

  let score = 0;
  let patternIdx = 0;
  let textIdx = 0;
  let consecutiveMatches = 0;

  while (patternIdx < pattern.length && textIdx < text.length) {
    if (pattern[patternIdx] === text[textIdx]) {
      score += 1 + consecutiveMatches;
      consecutiveMatches++;
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
    textIdx++;
  }

  if (patternIdx !== pattern.length) return 0; // Pattern not fully matched

  // Normalize score
  const maxScore = pattern.length * (pattern.length + 1) / 2;
  return score / maxScore;
}
