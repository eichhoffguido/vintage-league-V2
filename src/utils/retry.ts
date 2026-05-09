/**
 * Retry an async operation with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delayMs - Initial delay in milliseconds (default: 100)
 * @returns The result of the function
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const backoffDelay = delayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError || new Error("Unknown error");
}
