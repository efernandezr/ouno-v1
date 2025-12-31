/**
 * Validation utilities for API routes
 */

/**
 * UUID v4 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID v4
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate URL is safe to fetch (prevent SSRF attacks)
 * - Only allows http/https protocols
 * - Blocks localhost, private IPs, and internal addresses
 */
export function isValidExternalUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" };
    }

    // Block internal/private addresses
    const hostname = parsedUrl.hostname.toLowerCase();

    // Block localhost variations
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".localhost")
    ) {
      return { valid: false, error: "Cannot fetch from localhost" };
    }

    // Block private IP ranges
    const ipParts = hostname.split(".");
    if (ipParts.length === 4 && ipParts[0] && ipParts[1]) {
      const firstOctet = parseInt(ipParts[0], 10);
      const secondOctet = parseInt(ipParts[1], 10);

      // 10.x.x.x (Class A private)
      if (firstOctet === 10) {
        return { valid: false, error: "Cannot fetch from private IP addresses" };
      }

      // 172.16.x.x - 172.31.x.x (Class B private)
      if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
        return { valid: false, error: "Cannot fetch from private IP addresses" };
      }

      // 192.168.x.x (Class C private)
      if (firstOctet === 192 && secondOctet === 168) {
        return { valid: false, error: "Cannot fetch from private IP addresses" };
      }

      // 169.254.x.x (Link-local)
      if (firstOctet === 169 && secondOctet === 254) {
        return { valid: false, error: "Cannot fetch from link-local addresses" };
      }
    }

    // Block common internal service hostnames
    const blockedHostnames = [
      "metadata.google.internal",
      "metadata.google",
      "kubernetes.default",
      "internal",
    ];

    if (blockedHostnames.some(blocked => hostname.includes(blocked))) {
      return { valid: false, error: "Cannot fetch from internal service addresses" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validation constants for content limits
 */
export const VALIDATION_LIMITS = {
  // Text content limits
  TRANSCRIPT_MIN_LENGTH: 50,
  TRANSCRIPT_MAX_LENGTH: 100000,
  CONTENT_MIN_LENGTH: 100,
  CONTENT_MAX_LENGTH: 100000,
  WORD_COUNT_MIN: 50,

  // File size limits
  AUDIO_MAX_SIZE_MB: 25,
  URL_FETCH_MAX_SIZE_MB: 5,
  URL_FETCH_TIMEOUT_MS: 10000,

  // Rating limits
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

/**
 * Validate rating is within allowed range
 */
export function isValidRating(rating: number): boolean {
  return (
    Number.isInteger(rating) &&
    rating >= VALIDATION_LIMITS.RATING_MIN &&
    rating <= VALIDATION_LIMITS.RATING_MAX
  );
}
