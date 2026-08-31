import { z } from "zod";

const serverEnvironmentSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-5-mini"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  INTEGRATION_ENCRYPTION_KEY: z.string().min(1),
  CONVEX_SITE_URL: z.url(),
  SHOPIFY_API_VERSION: z.string().regex(/^\d{4}-\d{2}$/),
  SITE_URL: z.url(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(environment: Record<string, string | undefined>) {
  return serverEnvironmentSchema.parse(environment);
}
