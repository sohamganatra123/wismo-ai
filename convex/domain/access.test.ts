import { describe, expect, it } from "vitest";
import { assignRoleForSignIn, canManageFounderSettings, normalizeEmail } from "./access";
import { isValidOAuthState } from "./oauthState";

describe("founder and invitation access", () => {
  it("makes the first verified user the founder", () => {
    expect(assignRoleForSignIn({ profileCount: 0, emailVerified: true, hasValidInvite: false })).toBe("founder");
  });

  it("allows later users only with a valid founder invitation", () => {
    expect(assignRoleForSignIn({ profileCount: 1, emailVerified: true, hasValidInvite: true })).toBe("support_agent");
    expect(() => assignRoleForSignIn({ profileCount: 1, emailVerified: true, hasValidInvite: false })).toThrow("Founder invitation required");
  });

  it("rejects unverified Google email addresses", () => {
    expect(() => assignRoleForSignIn({ profileCount: 0, emailVerified: false, hasValidInvite: false })).toThrow("Verified Google email required");
  });

  it("normalizes invitation email addresses", () => {
    expect(normalizeEmail("  Agent@Example.COM ")).toBe("agent@example.com");
  });

  it("limits integration, contact, team, and rule settings to founders", () => {
    expect(canManageFounderSettings("founder")).toBe(true);
    expect(canManageFounderSettings("support_agent")).toBe(false);
  });
});

describe("Google mailbox OAuth state", () => {
  it("accepts one unused, unexpired state value", () => {
    expect(isValidOAuthState({ expected: "abc", received: "abc", expiresAt: 2_000, now: 1_000, usedAt: null })).toBe(true);
  });

  it("rejects mismatched, expired, and reused state values", () => {
    expect(isValidOAuthState({ expected: "abc", received: "xyz", expiresAt: 2_000, now: 1_000, usedAt: null })).toBe(false);
    expect(isValidOAuthState({ expected: "abc", received: "abc", expiresAt: 999, now: 1_000, usedAt: null })).toBe(false);
    expect(isValidOAuthState({ expected: "abc", received: "abc", expiresAt: 2_000, now: 1_000, usedAt: 900 })).toBe(false);
  });
});
