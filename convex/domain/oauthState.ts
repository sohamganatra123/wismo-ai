export function isValidOAuthState(input: {
  expected: string;
  received: string;
  expiresAt: number;
  now: number;
  usedAt: number | null;
}) {
  return input.expected.length >= 3 && input.expected === input.received && input.expiresAt > input.now && input.usedAt === null;
}
