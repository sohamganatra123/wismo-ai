import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { gmailOAuthCallback } from "./integrations";

const http = httpRouter();
auth.addHttpRoutes(http);
http.route({ path: "/gmail/oauth/callback", method: "GET", handler: gmailOAuthCallback });

export default http;
