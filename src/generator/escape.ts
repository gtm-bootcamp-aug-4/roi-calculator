const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for interpolation into HTML element content or attributes. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Escapes a URL for use in an href. Only http(s) URLs are allowed through;
 * anything else (javascript:, data:, malformed) collapses to "#" so a bad
 * research result cannot inject script into a generated page.
 */
export function safeUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return '#';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return '#';
  }
  return escapeHtml(parsed.toString());
}

/** Serializes a value for embedding in an inline <script> block. */
export function toScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
