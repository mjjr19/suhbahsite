import { createClient } from "next-sanity";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2024-01-01";

// Fallback placeholder project ID so the app builds and runs before a real
// Sanity project exists. `hasSanityConfig` gates real queries; see fetch below.
export const hasSanityConfig = Boolean(projectId);

export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
});

const originalFetch = client.fetch.bind(client);

/**
 * Wraps next-sanity's client.fetch so pages render an empty state instead of
 * throwing when NEXT_PUBLIC_SANITY_PROJECT_ID hasn't been configured yet.
 */
client.fetch = (async (...args: Parameters<typeof originalFetch>) => {
  if (!hasSanityConfig) {
    const query = String(args[0] ?? "");
    // Queries ending in `[0] { ... }` fetch a single document; everything
    // else in this project fetches a list.
    const isSingleDocQuery = /\]\s*\[0\]/.test(query);
    return (isSingleDocQuery ? null : []) as never;
  }
  return originalFetch(...args);
}) as typeof originalFetch;
