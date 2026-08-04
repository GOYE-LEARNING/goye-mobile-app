// utils/errorMessages.ts
//
// Mobile port of the web app's utils/errorMessages.ts. Simple, specific
// validation messages are already clear on their own — this is only for raw
// network/server failures that would otherwise surface as "Failed to fetch"
// or a bare "500", which mean nothing to someone using the app.
export function getFriendlyErrorMessage(error: unknown, context?: string): string {
  const raw = String((error as any)?.message ?? error ?? '');
  const suffix = context ? ` ${context}` : '';

  if (raw.includes('Failed to fetch') || raw.includes('Network request failed') || /network/i.test(raw)) {
    return "We couldn't reach the server just now — nothing you've entered has been lost. Please check your connection and try again.";
  }
  if (raw.includes(': 401') || raw.includes(': 403') || /unauthorized/i.test(raw)) {
    return 'Your session needs a refresh. Please log in again — we\'ll be right here when you get back.';
  }
  if (raw.includes(': 500') || raw.includes(': 502') || raw.includes(': 503') || raw.includes(': 504')) {
    return `Something didn't go through on our end${suffix}. Please try again in a moment.`;
  }
  return `We hit a snag${suffix} — please try again.`;
}
