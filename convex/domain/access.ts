export type AppRole = "founder" | "support_agent";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function assignRoleForSignIn(input: { profileCount: number; emailVerified: boolean; hasValidInvite: boolean }): AppRole {
  if (!input.emailVerified) throw new Error("Verified Google email required");
  if (input.profileCount === 0) return "founder";
  if (!input.hasValidInvite) throw new Error("Founder invitation required");
  return "support_agent";
}

export function canManageFounderSettings(role: AppRole) {
  return role === "founder";
}
