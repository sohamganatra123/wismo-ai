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
import type * as agent_contracts from "../agent/contracts.js";
import type * as agent_openai from "../agent/openai.js";
import type * as agent_redaction from "../agent/redaction.js";
import type * as agent_toolSchemas from "../agent/toolSchemas.js";
import type * as agentRuns from "../agentRuns.js";
import type * as auth from "../auth.js";
import type * as caseTimeline from "../caseTimeline.js";
import type * as courierReplies from "../courierReplies.js";
import type * as crons from "../crons.js";
import type * as customerUpdates from "../customerUpdates.js";
import type * as domain_access from "../domain/access.js";
import type * as domain_approvals from "../domain/approvals.js";
import type * as domain_courierReply from "../domain/courierReply.js";
import type * as domain_customerUpdate from "../domain/customerUpdate.js";
import type * as domain_fixtures from "../domain/fixtures.js";
import type * as domain_gmail from "../domain/gmail.js";
import type * as domain_identityRequest from "../domain/identityRequest.js";
import type * as domain_inboundClassification from "../domain/inboundClassification.js";
import type * as domain_investigation from "../domain/investigation.js";
import type * as domain_oauthState from "../domain/oauthState.js";
import type * as domain_retries from "../domain/retries.js";
import type * as domain_shopifyCustomer from "../domain/shopifyCustomer.js";
import type * as domain_shopifyNote from "../domain/shopifyNote.js";
import type * as domain_stateMachine from "../domain/stateMachine.js";
import type * as domain_tracking from "../domain/tracking.js";
import type * as env from "../env.js";
import type * as escalations from "../escalations.js";
import type * as gmailData from "../gmailData.js";
import type * as gmailPolling from "../gmailPolling.js";
import type * as http from "../http.js";
import type * as identityRequests from "../identityRequests.js";
import type * as integrationData from "../integrationData.js";
import type * as integrations from "../integrations.js";
import type * as investigations from "../investigations.js";
import type * as lib_caseEvents from "../lib/caseEvents.js";
import type * as lib_escalations from "../lib/escalations.js";
import type * as memories from "../memories.js";
import type * as security_credentials from "../security/credentials.js";
import type * as services_contracts from "../services/contracts.js";
import type * as settings from "../settings.js";
import type * as shopifyData from "../shopifyData.js";
import type * as shopifyMatching from "../shopifyMatching.js";
import type * as shopifyNotes from "../shopifyNotes.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  "agent/contracts": typeof agent_contracts;
  "agent/openai": typeof agent_openai;
  "agent/redaction": typeof agent_redaction;
  "agent/toolSchemas": typeof agent_toolSchemas;
  agentRuns: typeof agentRuns;
  auth: typeof auth;
  caseTimeline: typeof caseTimeline;
  courierReplies: typeof courierReplies;
  crons: typeof crons;
  customerUpdates: typeof customerUpdates;
  "domain/access": typeof domain_access;
  "domain/approvals": typeof domain_approvals;
  "domain/courierReply": typeof domain_courierReply;
  "domain/customerUpdate": typeof domain_customerUpdate;
  "domain/fixtures": typeof domain_fixtures;
  "domain/gmail": typeof domain_gmail;
  "domain/identityRequest": typeof domain_identityRequest;
  "domain/inboundClassification": typeof domain_inboundClassification;
  "domain/investigation": typeof domain_investigation;
  "domain/oauthState": typeof domain_oauthState;
  "domain/retries": typeof domain_retries;
  "domain/shopifyCustomer": typeof domain_shopifyCustomer;
  "domain/shopifyNote": typeof domain_shopifyNote;
  "domain/stateMachine": typeof domain_stateMachine;
  "domain/tracking": typeof domain_tracking;
  env: typeof env;
  escalations: typeof escalations;
  gmailData: typeof gmailData;
  gmailPolling: typeof gmailPolling;
  http: typeof http;
  identityRequests: typeof identityRequests;
  integrationData: typeof integrationData;
  integrations: typeof integrations;
  investigations: typeof investigations;
  "lib/caseEvents": typeof lib_caseEvents;
  "lib/escalations": typeof lib_escalations;
  memories: typeof memories;
  "security/credentials": typeof security_credentials;
  "services/contracts": typeof services_contracts;
  settings: typeof settings;
  shopifyData: typeof shopifyData;
  shopifyMatching: typeof shopifyMatching;
  shopifyNotes: typeof shopifyNotes;
  waitlist: typeof waitlist;
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
