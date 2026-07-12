import { cookies } from "next/headers";

const COOKIE_NAME = "ax_sid";

/**
 * Anonymous session id for analytics (searches, impressions, clicks).
 * Random id, no personal data – GDPR-friendly. Read-only helper for
 * server components; the id is set by middleware.
 */
export async function getSessionId(): Promise<string> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? "";
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
