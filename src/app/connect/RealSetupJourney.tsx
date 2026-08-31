"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { makeFunctionReference } from "convex/server";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./setup.module.css";

type Profile = { email: string; name: string; role: "founder" | "support_agent" };
type Integration = { kind: "gmail" | "shopify"; accountLabel: string; updatedAt: number };
type Settings = { contacts: Array<{ _id: string; name: string; email: string; type: "courier" | "vendor" }>; rules: Array<{ _id: string; title: string; guidance: string }> };
const profileRef = makeFunctionReference<"query", Record<string, never>, Profile | null>("access:currentProfile");
const integrationsRef = makeFunctionReference<"query", Record<string, never>, Integration[]>("integrationData:getFounderIntegrationStatus");
const settingsRef = makeFunctionReference<"query", Record<string, never>, Settings>("settings:getFounderSettings");
const gmailRef = makeFunctionReference<"action", Record<string, never>, string>("integrations:beginGmailConnection");
const shopifyRef = makeFunctionReference<"action", { shopDomain: string; accessToken: string }, { accountLabel: string; storeName: string }>("integrations:connectShopify");
const inviteRef = makeFunctionReference<"action", { email: string }, { token: string; expiresAt: number }>("access:createInvite");
const contactRef = makeFunctionReference<"mutation", { name: string; email: string; type: "courier" | "vendor" }, string>("settings:addContact");
const ruleRef = makeFunctionReference<"mutation", { title: string; guidance: string }, string>("settings:addRule");

export default function RealSetupJourney({ configured }: { configured: boolean }) {
  if (!configured) return <main className={styles.center}><section className={styles.card}><Brand /><p className={styles.eyebrow}>Connection required</p><h1>Connect the backend first.</h1><p>Add the values listed in <code>.env.example</code>, then reload this page.</p></section></main>;
  return <ConnectedSetup />;
}

function ConnectedSetup() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(profileRef, isAuthenticated ? {} : "skip");
  if (isLoading) return <Loading text="Checking access…" />;
  if (!isAuthenticated) return <SignIn />;
  if (profile === undefined) return <Loading text="Loading your WISMO account…" />;
  if (!profile) return <main className={styles.center}><section className={styles.card}><h1>Access could not be created.</h1><p>Use the Google account that received the founder invitation.</p><SignOut /></section></main>;
  return profile.role === "founder" ? <FounderSetup profile={profile} /> : <SupportAccess profile={profile} />;
}

function Brand() { return <Link href="/" className={styles.brand}><i />WISMO</Link>; }
function Loading({ text }: { text: string }) { return <main className={styles.center}><p className={styles.status}>{text}</p></main>; }

function SignIn() {
  const { signIn } = useAuthActions(); const [working, setWorking] = useState(false); const [error, setError] = useState("");
  async function start() { setWorking(true); setError(""); try { await signIn("google", { redirectTo: "/connect" }); } catch (reason) { setError(message(reason, "Google sign-in could not start")); setWorking(false); } }
  return <main className={styles.center}><section className={styles.card}><Brand /><p className={styles.eyebrow}>Manager access</p><h1>Connect your support mailbox.</h1><p>Sign in with Google first. The first verified account becomes the founder; later accounts need a founder invitation.</p><button className={styles.primary} disabled={working} onClick={start}>{working ? "Opening Google…" : "Connect support mailbox"}<span>→</span></button>{error ? <p className={styles.error}>{error}</p> : null}<small>Customer and courier messages, and Shopify changes, always wait for manager approval in V1.</small></section></main>;
}

function FounderSetup({ profile }: { profile: Profile }) {
  const integrations = useQuery(integrationsRef, {}); const settings = useQuery(settingsRef, {});
  return <div className={styles.app}><aside className={styles.rail}><Brand /><div><p className={styles.eyebrow}>Founder setup</p><strong>{profile.name}</strong><small>{profile.email}</small></div><nav><Link href="/inbox">Human attention</Link><a href="#integrations">Integrations</a><a href="#team">Team</a><a href="#contacts">Contacts</a><a href="#rules">Rules</a></nav><SignOut /></aside><main className={styles.workspace}><header className={styles.header}><p className={styles.eyebrow}>Control room</p><h1>Connect what WISMO needs.</h1><p>Only the founder can change these settings. Every external message and Shopify change still needs manager approval.</p></header><SetupSection id="integrations" number="01" title="Integrations" text="Connect the shared Gmail inbox and Shopify store."><div className={styles.grid}><GmailCard integration={integrations?.find((item) => item.kind === "gmail")} /><ShopifyCard integration={integrations?.find((item) => item.kind === "shopify")} /></div></SetupSection><SetupSection id="team" number="02" title="Team access" text="Invite one support agent by their Google email."><InviteForm /></SetupSection><SetupSection id="contacts" number="03" title="Courier contacts" text="Use these addresses when order information is not enough."><ContactForm /><ItemList items={settings?.contacts.map((item) => ({ title: item.name, detail: `${item.type} · ${item.email}` }))} empty="No courier or vendor contacts yet." /></SetupSection><SetupSection id="rules" number="04" title="Reusable rules" text="Founder-managed guidance for future recommendations."><RuleForm /><ItemList items={settings?.rules.map((item) => ({ title: item.title, detail: item.guidance }))} empty="No reusable rules yet." /></SetupSection></main></div>;
}

function SetupSection({ id, number, title, text, children }: { id: string; number: string; title: string; text: string; children: React.ReactNode }) { return <section id={id} className={styles.section}><header className={styles.sectionTitle}><span>{number}</span><div><h2>{title}</h2><p>{text}</p></div></header>{children}</section>; }

function GmailCard({ integration }: { integration?: Integration }) {
  const begin = useAction(gmailRef); const [working, setWorking] = useState(false); const [error, setError] = useState("");
  async function connect() { setWorking(true); setError(""); try { window.location.assign(await begin({})); } catch (reason) { setError(message(reason, "Gmail connection failed")); setWorking(false); } }
  return <article className={styles.connection}><Service icon="M" kind="gmail" label="Shared support inbox" name="Gmail" connected={Boolean(integration)} /><p>{integration?.accountLabel ?? "Read support requests and send approved replies from one mailbox."}</p><button onClick={connect} disabled={working}>{working ? "Opening Google…" : integration ? "Reconnect Gmail" : "Connect Gmail"}</button>{error ? <p className={styles.error}>{error}</p> : null}</article>;
}

function ShopifyCard({ integration }: { integration?: Integration }) {
  const connect = useAction(shopifyRef); const [domain, setDomain] = useState(""); const [token, setToken] = useState(""); const [working, setWorking] = useState(false); const [feedback, setFeedback] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setWorking(true); setFeedback(""); try { const result = await connect({ shopDomain: domain, accessToken: token }); setFeedback(`Connected ${result.storeName}.`); setToken(""); } catch (reason) { setFeedback(message(reason, "Shopify connection failed")); } finally { setWorking(false); } }
  return <article className={styles.connection}><Service icon="S" kind="shopify" label="Order source" name="Shopify" connected={Boolean(integration)} /><p>{integration?.accountLabel ?? "Use a founder-created Shopify custom-app token."}</p><form onSubmit={submit}><Field label=".myshopify.com domain"><input required value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="northstar-goods.myshopify.com" /></Field><Field label="Admin API access token"><input required type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" placeholder="shpat_…" /></Field><button disabled={working}>{working ? "Checking Shopify…" : integration ? "Replace connection" : "Connect Shopify"}</button></form>{feedback ? <p className={styles.feedback}>{feedback}</p> : null}</article>;
}

function Service({ icon, kind, label, name, connected }: { icon: string; kind: string; label: string; name: string; connected: boolean }) { return <div className={styles.service}><b data-kind={kind}>{icon}</b><div><small>{label}</small><strong>{name}</strong></div><span data-connected={connected}>{connected ? "Connected" : "Required"}</span></div>; }
function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? styles.wide : undefined}>{label}{children}</label>; }

function InviteForm() {
  const invite = useAction(inviteRef); const [email, setEmail] = useState(""); const [link, setLink] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { const result = await invite({ email }); setLink(`${window.location.origin}/connect?invite=${result.token}`); } catch (reason) { setError(message(reason, "Invite could not be created")); } }
  return <form className={styles.form} onSubmit={submit}><Field label="Support agent Google email"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="agent@example.com" /></Field><button>Create invite</button>{link ? <div className={styles.result}><p>Send this private link to {email}. It expires in seven days.</p><code>{link}</code><button type="button" onClick={() => void navigator.clipboard.writeText(link)}>Copy invite link</button></div> : null}{error ? <p className={styles.error}>{error}</p> : null}</form>;
}

function ContactForm() {
  const save = useMutation(contactRef); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [type, setType] = useState<"courier" | "vendor">("courier"); const [feedback, setFeedback] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { await save({ name, email, type }); setName(""); setEmail(""); setFeedback("Contact saved."); } catch (reason) { setFeedback(message(reason, "Contact could not be saved")); } }
  return <form className={styles.form} onSubmit={submit}><Field label="Name"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Colissimo support" /></Field><Field label="Email"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="support@courier.com" /></Field><Field label="Type"><select value={type} onChange={(event) => setType(event.target.value as "courier" | "vendor")}><option value="courier">Courier</option><option value="vendor">Vendor</option></select></Field><button>Save contact</button>{feedback ? <p className={styles.feedback}>{feedback}</p> : null}</form>;
}

function RuleForm() {
  const save = useMutation(ruleRef); const [title, setTitle] = useState(""); const [guidance, setGuidance] = useState(""); const [feedback, setFeedback] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { await save({ title, guidance }); setTitle(""); setGuidance(""); setFeedback("Rule saved."); } catch (reason) { setFeedback(message(reason, "Rule could not be saved")); } }
  return <form className={styles.form} onSubmit={submit}><Field label="Rule name"><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Failed delivery" /></Field><Field label="Guidance" wide><textarea required value={guidance} onChange={(event) => setGuidance(event.target.value)} placeholder="Explain the newest scan and next confirmed step." /></Field><button>Save rule</button>{feedback ? <p className={styles.feedback}>{feedback}</p> : null}</form>;
}

function ItemList({ items, empty }: { items?: Array<{ title: string; detail: string }>; empty: string }) { return <div className={styles.list}>{items?.length ? items.map((item) => <article key={`${item.title}-${item.detail}`}><strong>{item.title}</strong><p>{item.detail}</p></article>) : <p>{empty}</p>}</div>; }
function SupportAccess({ profile }: { profile: Profile }) { return <main className={styles.center}><section className={styles.card}><Brand /><p className={styles.eyebrow}>Support agent</p><h1>Your access is ready.</h1><p>{profile.email} can review and approve cases. Founder settings are locked for this role.</p><Link className={styles.primary} href="/inbox">Open human attention <span>→</span></Link><div className={styles.locked}>Integrations, contacts, team access, and reusable rules require the founder.</div><SignOut /></section></main>; }
function SignOut() { const { signOut } = useAuthActions(); return <button className={styles.signOut} onClick={() => void signOut()}>Sign out</button>; }
function message(reason: unknown, fallback: string) { return reason instanceof Error ? reason.message : fallback; }
