/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as domain_access from "../domain/access.js";
import type * as domain_approvals from "../domain/approvals.js";
import type * as domain_fixtures from "../domain/fixtures.js";
import type * as domain_gmail from "../domain/gmail.js";
import type * as domain_oauthState from "../domain/oauthState.js";
import type * as domain_retries from "../domain/retries.js";
import type * as domain_stateMachine from "../domain/stateMachine.js";
import type * as domain_tracking from "../domain/tracking.js";
import type * as env from "../env.js";
import type * as gmailData from "../gmailData.js";
import type * as gmailPolling from "../gmailPolling.js";
import type * as http from "../http.js";
import type * as integrationData from "../integrationData.js";
import type * as integrations from "../integrations.js";
import type * as security_credentials from "../security/credentials.js";
import type * as services_contracts from "../services/contracts.js";
import type * as settings from "../settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  auth: typeof auth;
  crons: typeof crons;
  "domain/access": typeof domain_access;
  "domain/approvals": typeof domain_approvals;
  "domain/fixtures": typeof domain_fixtures;
  "domain/gmail": typeof domain_gmail;
  "domain/oauthState": typeof domain_oauthState;
  "domain/retries": typeof domain_retries;
  "domain/stateMachine": typeof domain_stateMachine;
  "domain/tracking": typeof domain_tracking;
  env: typeof env;
  gmailData: typeof gmailData;
  gmailPolling: typeof gmailPolling;
  http: typeof http;
  integrationData: typeof integrationData;
  integrations: typeof integrations;
  "security/credentials": typeof security_credentials;
  "services/contracts": typeof services_contracts;
  settings: typeof settings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
