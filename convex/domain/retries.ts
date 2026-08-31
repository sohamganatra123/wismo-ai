export type RetryPolicy = Readonly<{ maxAttempts: number; delayMs: number }>;

export const courierRetryPolicy: RetryPolicy = Object.freeze({
  maxAttempts: 3,
  delayMs: 3 * 60 * 60 * 1000,
});

export const shopifyRetryPolicy: RetryPolicy = Object.freeze({
  maxAttempts: 3,
  delayMs: 5 * 60 * 1000,
});

export function nextRetryAt(policy: RetryPolicy, completedAttempts: number, now: number) {
  if (!Number.isInteger(completedAttempts) || completedAttempts < 0) throw new Error("Invalid attempt count");
  if (completedAttempts >= policy.maxAttempts) return null;
  return now + policy.delayMs;
}
