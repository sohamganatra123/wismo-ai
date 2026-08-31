import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

export const proxy = convexAuthNextjsMiddleware();

export const config = { matcher: ["/connect/:path*", "/api/auth"] };
