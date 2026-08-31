import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { assignRoleForSignIn, normalizeEmail } from "./domain/access";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId, profile }) {
      const db = ctx.db as unknown as MutationCtx["db"];
      const typedUserId = userId as Id<"users">;
      const email = profile.email ? normalizeEmail(profile.email) : "";
      const emailVerified = profile.emailVerified === true;
      if (!email) throw new Error("Google account email is required");

      const currentProfile = await db.query("profiles").withIndex("by_user", (q) => q.eq("userId", typedUserId)).unique();
      if (currentProfile) {
        await db.patch(currentProfile._id, { email, name: String(profile.name ?? currentProfile.name) });
        return;
      }

      const firstProfile = await db.query("profiles").first();
      const invites = await db.query("invites").withIndex("by_email", (q) => q.eq("email", email)).collect();
      const invite = invites.find((candidate: { acceptedAt?: number }) => candidate.acceptedAt === undefined) ?? null;
      const hasValidInvite = invite !== null && invite.expiresAt > Date.now();
      const role = assignRoleForSignIn({ profileCount: firstProfile ? 1 : 0, emailVerified, hasValidInvite });

      await db.insert("profiles", {
        userId: typedUserId,
        email,
        name: String(profile.name ?? email),
        role,
        createdAt: Date.now(),
      });
      if (invite) await db.patch(invite._id, { acceptedAt: Date.now() });

      if (existingUserId && existingUserId !== userId) throw new Error("Unexpected linked user account");
    },
  },
});
