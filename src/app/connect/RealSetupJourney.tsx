"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { makeFunctionReference } from "convex/server";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { autonomyModeContent, autonomyModes } from "./onboardingContent";
import {
  deriveSetupProgress,
  firstIncompleteStage,
  setupStages,
  type SetupDraft,
  type SetupStageId,
} from "./setupJourney";
import { loadSetupDraft, saveSetupDraft } from "./setupStorage";
import styles from "./setup.module.css";

type Profile = { email: string; name: string; role: "founder" | "support_agent" };
type Integration = { kind: "gmail" | "shopify"; accountLabel: string; updatedAt: number };
type Settings = {
  contacts: Array<{ _id: string; name: string; email: string; type: "courier" | "vendor" }>;
  rules: Array<{ _id: string; title: string; guidance: string }>;
};
type Memory = {
  _id: string;
  guidance: string;
  caseId?: string;
  status: "proposed" | "approved" | "rejected";
  proposedByName: string;
  createdAt: number;
};

const profileRef = makeFunctionReference<"query", Record<string, never>, Profile | null>("access:currentProfile");
const integrationsRef = makeFunctionReference<"query", Record<string, never>, Integration[]>("integrationData:getFounderIntegrationStatus");
const settingsRef = makeFunctionReference<"query", Record<string, never>, Settings>("settings:getFounderSettings");
const memoriesRef = makeFunctionReference<"query", Record<string, never>, Memory[]>("memories:listFounderMemories");
const gmailRef = makeFunctionReference<"action", Record<string, never>, string>("integrations:beginGmailConnection");
const shopifyRef = makeFunctionReference<"action", { shopDomain: string; accessToken: string }, { accountLabel: string; storeName: string }>("integrations:connectShopify");
const inviteRef = makeFunctionReference<"action", { email: string }, { token: string; expiresAt: number }>("access:createInvite");
const contactRef = makeFunctionReference<"mutation", { name: string; email: string; type: "courier" | "vendor" }, string>("settings:addContact");
const ruleRef = makeFunctionReference<"mutation", { title: string; guidance: string }, string>("settings:addRule");
const decideMemoryRef = makeFunctionReference<"mutation", { memoryId: string; decision: "approved" | "rejected" }, null>("memories:decideMemory");

export default function RealSetupJourney({ configured }: { configured: boolean }) {
  if (!configured) {
    return (
      <main className={styles.center}>
        <section className={styles.card}>
          <Brand />
          <p className={styles.eyebrow}>Connection required</p>
          <h1>Connect the backend first.</h1>
          <p>Add the values listed in <code>.env.example</code>, then reload this page.</p>
        </section>
      </main>
    );
  }
  return <ConnectedSetup />;
}

function ConnectedSetup() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(profileRef, isAuthenticated ? {} : "skip");

  if (isLoading) return <Loading text="Checking access…" />;
  if (!isAuthenticated) return <SignIn />;
  if (profile === undefined) return <Loading text="Loading your WISMO account…" />;
  if (!profile) {
    return (
      <main className={styles.center}>
        <section className={styles.card}>
          <h1>Access could not be created.</h1>
          <p>Use the Google account that received the founder invitation.</p>
          <SignOut />
        </section>
      </main>
    );
  }
  return profile.role === "founder" ? <FounderSetup profile={profile} /> : <SupportAccess profile={profile} />;
}

function FounderSetup({ profile }: { profile: Profile }) {
  const searchParams = useSearchParams();
  const integrations = useQuery(integrationsRef, {});
  const settings = useQuery(settingsRef, {});
  const memories = useQuery(memoriesRef, {});
  const [draft, setDraft] = useState<SetupDraft>(() => loadSetupDraft());
  const [selectedStage, setSelectedStage] = useState<SetupStageId>("brief");
  const currentIntegrations = integrations ?? [];
  const currentSettings = settings ?? { contacts: [], rules: [] };
  const currentMemories = memories ?? [];

  useEffect(() => {
    saveSetupDraft(draft);
  }, [draft]);

  const gmailIntegration = currentIntegrations.find((item) => item.kind === "gmail");
  const shopifyIntegration = currentIntegrations.find((item) => item.kind === "shopify");
  const pendingMemories = currentMemories.filter((memory) => memory.status === "proposed");
  const progress = deriveSetupProgress({
    briefConfirmed: draft.briefConfirmed,
    gmailConnected: Boolean(gmailIntegration),
    shopifyConnected: Boolean(shopifyIntegration),
    contactCount: currentSettings.contacts.length,
    ruleCount: currentSettings.rules.length,
    pendingMemoryCount: pendingMemories.length,
    reviewConfirmed: draft.reviewConfirmed,
    activated: draft.activated,
  });
  const fallbackStage = progress.activated ? "activate" : firstIncompleteStage(progress);
  const visibleStage = progress.stageStates[selectedStage] === "locked" ? fallbackStage : selectedStage;
  const activeMode = autonomyModeContent(draft.mode);
  const gmailStatus = searchParams.get("gmail");
  const gmailReason = searchParams.get("reason");
  const statusMessage = gmailStatus === "connected"
    ? { tone: "success" as const, text: "Gmail connected. WISMO can now read the shared support inbox." }
    : gmailStatus === "error"
      ? { tone: "error" as const, text: gmailReason ?? "Gmail connection failed." }
      : null;

  if (integrations === undefined || settings === undefined || memories === undefined) {
    return <Loading text="Loading your setup workspace…" />;
  }

  return (
    <div className={styles.app}>
      <aside className={styles.rail}>
        <Brand />
        <div className={styles.railIntro}>
          <p className={styles.eyebrow}>Founder onboarding</p>
          <strong>{profile.name}</strong>
          <small>{profile.email}</small>
        </div>
        <ol className={styles.progressList}>
          {setupStages.map((stage) => {
            const state = progress.stageStates[stage.id];
            return (
              <li key={stage.id} data-state={state}>
                <button
                  type="button"
                  onClick={() => setSelectedStage(stage.id)}
                  disabled={state === "locked"}
                  aria-current={visibleStage === stage.id ? "step" : undefined}
                >
                  <span>{stage.number}</span>
                  <div>
                    <strong>{stage.label}</strong>
                    <small>{stage.hint}</small>
                  </div>
                  <em>{state === "done" ? "Ready" : state === "current" ? "Open" : "Locked"}</em>
                </button>
              </li>
            );
          })}
        </ol>
        <div className={styles.railCard}>
          <small>Starting mode</small>
          <strong>{activeMode.label}</strong>
          <p>{activeMode.description}</p>
        </div>
        <div className={styles.railCard}>
          <small>Release boundary</small>
          <strong>Manager-controlled actions</strong>
          <p>Customer sends and Shopify writes still stay behind approvals in this build.</p>
        </div>
        <SignOut />
      </aside>

      <main className={styles.workspace}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Setup control room</p>
          <h1>Move through the founder setup in order.</h1>
          <p>
            This path uses the real Gmail and Shopify connection actions that exist today,
            then turns the remaining founder settings into a clear handoff before you open the inbox.
          </p>
        </header>

        {statusMessage ? (
          <div className={styles.statusBanner} data-tone={statusMessage.tone}>
            <strong>{statusMessage.tone === "success" ? "Connection updated" : "Connection needs attention"}</strong>
            <p>{statusMessage.text}</p>
          </div>
        ) : null}

        {visibleStage === "brief" ? (
          <BriefStage
            profile={profile}
            draft={draft}
            onDraftChange={setDraft}
            onContinue={() => setSelectedStage("sources")}
          />
        ) : null}

        {visibleStage === "sources" ? (
          <SourcesStage
            gmailIntegration={gmailIntegration}
            shopifyIntegration={shopifyIntegration}
            onContinue={() => setSelectedStage("learn")}
          />
        ) : null}

        {visibleStage === "learn" ? (
          <LearnStage
            settings={currentSettings}
            pendingMemories={pendingMemories}
            onContinue={() => setSelectedStage("review")}
          />
        ) : null}

        {visibleStage === "review" ? (
          <ReviewStage
            draft={draft}
            modeLabel={activeMode.label}
            settings={currentSettings}
            pendingMemories={pendingMemories}
            onDraftChange={setDraft}
            onContinue={() => setSelectedStage("activate")}
          />
        ) : null}

        {visibleStage === "activate" ? (
          <ActivateStage
            draft={draft}
            gmailIntegration={gmailIntegration}
            shopifyIntegration={shopifyIntegration}
            settings={currentSettings}
            onDraftChange={setDraft}
          />
        ) : null}
      </main>
    </div>
  );
}

function StageFrame({
  number,
  eyebrow,
  title,
  text,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.stage}>
      <header className={styles.stageHeader}>
        <p><span>{number}</span>{eyebrow}</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </header>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className={styles.summaryCard}>
      <small>{label}</small>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <li data-done={done}>
      <span>{done ? "✓" : "•"}</span>
      <p>{text}</p>
    </li>
  );
}

function BriefStage({
  profile,
  draft,
  onDraftChange,
  onContinue,
}: {
  profile: Profile;
  draft: SetupDraft;
  onDraftChange: Dispatch<SetStateAction<SetupDraft>>;
  onContinue: () => void;
}) {
  return (
    <StageFrame
      number="01"
      eyebrow="Brief"
      title="Set the starting boundary for this workspace."
      text="Choose how much WISMO may do at the start. You can still change this before activation."
    >
      <div className={styles.missionCard}>
        <div>
          <small>Workspace owner</small>
          <strong>{profile.name}</strong>
          <p>{profile.email}</p>
        </div>
        <div>
          <small>Fixed mission</small>
          <strong>Handle delivery-status questions first.</strong>
          <p>Identity, order facts, and tracking still have to line up before any action is considered safe.</p>
        </div>
      </div>

      <fieldset className={styles.modeGrid}>
        <legend>Starting control level</legend>
        {autonomyModes.map((mode) => (
          <label key={mode.id} className={styles.modeCard} data-selected={draft.mode === mode.id}>
            <input
              type="radio"
              name="setup-mode"
              value={mode.id}
              checked={draft.mode === mode.id}
              onChange={() => onDraftChange((current) => ({
                ...current,
                mode: mode.id,
                briefConfirmed: false,
                reviewConfirmed: false,
                activated: false,
              }))}
            />
            <strong>{mode.label}{mode.recommended ? <em>Recommended</em> : null}</strong>
            <p>{mode.description}</p>
            <small>WISMO may: {mode.alone}</small>
          </label>
        ))}
      </fieldset>

      <label className={styles.checkpoint}>
        <input
          type="checkbox"
          checked={draft.briefConfirmed}
          onChange={(event) => onDraftChange((current) => ({
            ...current,
            briefConfirmed: event.target.checked,
            reviewConfirmed: event.target.checked ? current.reviewConfirmed : false,
            activated: event.target.checked ? current.activated : false,
          }))}
        />
        <span>
          <strong>Use this as the starting control level</strong>
          <small>The setup flow will lock later steps until this boundary is confirmed.</small>
        </span>
      </label>

      <div className={styles.stageActions}>
        <button className={styles.primary} type="button" disabled={!draft.briefConfirmed} onClick={onContinue}>
          Continue to sources <span>→</span>
        </button>
      </div>
    </StageFrame>
  );
}

function SourcesStage({
  gmailIntegration,
  shopifyIntegration,
  onContinue,
}: {
  gmailIntegration?: Integration;
  shopifyIntegration?: Integration;
  onContinue: () => void;
}) {
  const ready = Boolean(gmailIntegration && shopifyIntegration);

  return (
    <StageFrame
      number="02"
      eyebrow="Sources"
      title="Connect the evidence WISMO needs."
      text="Gmail provides the customer question. Shopify provides order facts. Both connections below are live."
    >
      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Gmail"
          value={gmailIntegration ? "Connected" : "Required"}
          detail={gmailIntegration?.accountLabel ?? "Read the shared support inbox and prepare approved drafts."}
        />
        <SummaryCard
          label="Shopify"
          value={shopifyIntegration ? "Connected" : "Required"}
          detail={shopifyIntegration?.accountLabel ?? "Use the store's real .myshopify.com domain and admin token."}
        />
      </div>

      <div className={styles.cardsGrid}>
        <GmailCard integration={gmailIntegration} />
        <ShopifyCard integration={shopifyIntegration} />
      </div>

      <div className={styles.stageActions}>
        <button className={styles.primary} type="button" disabled={!ready} onClick={onContinue}>
          Continue to learn <span>→</span>
        </button>
      </div>
    </StageFrame>
  );
}

function LearnStage({
  settings,
  pendingMemories,
  onContinue,
}: {
  settings: Settings;
  pendingMemories: Memory[];
  onContinue: () => void;
}) {
  const ready = settings.contacts.length > 0 && settings.rules.length > 0;

  return (
    <StageFrame
      number="03"
      eyebrow="Learn"
      title="Fill in the human rules around the agent."
      text="This stage uses founder-owned setup details so WISMO knows who to escalate to and what guidance should repeat."
    >
      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Courier contacts"
          value={String(settings.contacts.length)}
          detail={settings.contacts.length ? "At least one escalation contact is saved." : "Add at least one courier or vendor contact."}
        />
        <SummaryCard
          label="Reusable rules"
          value={String(settings.rules.length)}
          detail={settings.rules.length ? "Founder guidance is ready for repeat cases." : "Add at least one rule before activation."}
        />
        <SummaryCard
          label="Pending memories"
          value={String(pendingMemories.length)}
          detail={pendingMemories.length ? "Review these before activation." : "No memory proposals are waiting."}
        />
      </div>

      <div className={styles.sectionStack}>
        <SetupSection title="Team access" text="Invite one support agent if someone else will review approvals.">
          <InviteForm />
        </SetupSection>

        <SetupSection title="Courier contacts" text="These are used when order records are not enough.">
          <ContactForm />
          <ItemList
            items={settings.contacts.map((item) => ({ title: item.name, detail: `${item.type} · ${item.email}` }))}
            empty="No courier or vendor contacts yet."
          />
        </SetupSection>

        <SetupSection title="Reusable rules" text="Founder guidance that can be reused later.">
          <RuleForm />
          <ItemList
            items={settings.rules.map((item) => ({ title: item.title, detail: item.guidance }))}
            empty="No reusable rules yet."
          />
        </SetupSection>
      </div>

      {!ready ? (
        <div className={styles.inlineNotice}>
          <strong>Finish both setup requirements to continue.</strong>
          <ul className={styles.checklist}>
            <ChecklistItem done={settings.contacts.length > 0} text="At least one courier or vendor contact is saved." />
            <ChecklistItem done={settings.rules.length > 0} text="At least one reusable rule is saved." />
          </ul>
        </div>
      ) : null}

      <div className={styles.stageActions}>
        <button className={styles.primary} type="button" disabled={!ready} onClick={onContinue}>
          Continue to review <span>→</span>
        </button>
      </div>
    </StageFrame>
  );
}

function ReviewStage({
  draft,
  modeLabel,
  settings,
  pendingMemories,
  onDraftChange,
  onContinue,
}: {
  draft: SetupDraft;
  modeLabel: string;
  settings: Settings;
  pendingMemories: Memory[];
  onDraftChange: Dispatch<SetStateAction<SetupDraft>>;
  onContinue: () => void;
}) {
  const clearToContinue = pendingMemories.length === 0;

  return (
    <StageFrame
      number="04"
      eyebrow="Review"
      title="Check the workspace before activation."
      text="This is the final founder check: connected sources, saved guidance, and any memory proposals that still need a decision."
    >
      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Starting mode"
          value={modeLabel}
          detail="This is the control level that will be shown when the inbox opens."
        />
        <SummaryCard
          label="Contacts"
          value={String(settings.contacts.length)}
          detail="Courier and vendor contacts available to founder actions."
        />
        <SummaryCard
          label="Rules"
          value={String(settings.rules.length)}
          detail="Reusable founder guidance saved for later cases."
        />
      </div>

      <div className={styles.inlineNotice}>
        <strong>Activation stays blocked until every pending memory is reviewed.</strong>
        <ul className={styles.checklist}>
          <ChecklistItem done={pendingMemories.length === 0} text="No proposed memories are waiting for a founder decision." />
          <ChecklistItem done={settings.contacts.length > 0} text="Courier or vendor contacts are available." />
          <ChecklistItem done={settings.rules.length > 0} text="Reusable guidance is saved." />
        </ul>
      </div>

      <SetupSection title="Memory review" text="Approve or reject founder-visible memory proposals before activation.">
        <MemoryReviewList memories={pendingMemories} />
      </SetupSection>

      <label className={styles.checkpoint}>
        <input
          type="checkbox"
          checked={draft.reviewConfirmed}
          disabled={!clearToContinue}
          onChange={(event) => onDraftChange((current) => ({
            ...current,
            reviewConfirmed: event.target.checked,
            activated: event.target.checked ? current.activated : false,
          }))}
        />
        <span>
          <strong>I reviewed the founder checklist for this workspace</strong>
          <small>{clearToContinue ? "You can move to activation now." : "Clear the pending memories first."}</small>
        </span>
      </label>

      <div className={styles.stageActions}>
        <button className={styles.primary} type="button" disabled={!draft.reviewConfirmed || !clearToContinue} onClick={onContinue}>
          Continue to activation <span>→</span>
        </button>
      </div>
    </StageFrame>
  );
}

function ActivateStage({
  draft,
  gmailIntegration,
  shopifyIntegration,
  settings,
  onDraftChange,
}: {
  draft: SetupDraft;
  gmailIntegration?: Integration;
  shopifyIntegration?: Integration;
  settings: Settings;
  onDraftChange: Dispatch<SetStateAction<SetupDraft>>;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const selected = autonomyModeContent(draft.mode);

  if (draft.activated) {
    return (
      <StageFrame
        number="05"
        eyebrow="Activated"
        title="The founder setup is complete on this device."
        text="Your live connections and founder settings are in place. Open the inbox to review cases with the chosen starting boundary."
      >
        <div className={styles.receiptCard}>
          <div className={styles.receiptStamp}>Setup<br />ready</div>
          <dl className={styles.receiptGrid}>
            <div><dt>Mode</dt><dd>{selected.label}</dd></div>
            <div><dt>Inbox</dt><dd>{gmailIntegration?.accountLabel ?? "Missing"}</dd></div>
            <div><dt>Store</dt><dd>{shopifyIntegration?.accountLabel ?? "Missing"}</dd></div>
            <div><dt>Contacts</dt><dd>{settings.contacts.length}</dd></div>
            <div><dt>Rules</dt><dd>{settings.rules.length}</dd></div>
          </dl>
          <div className={styles.receiptActions}>
            <Link className={styles.primaryLink} href="/inbox">Open the inbox <span>→</span></Link>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => onDraftChange((current) => ({ ...current, activated: false }))}
            >
              Reopen activation
            </button>
          </div>
        </div>
      </StageFrame>
    );
  }

  return (
    <StageFrame
      number="05"
      eyebrow="Activate"
      title="Mark the founder setup complete."
      text="This final step stores the completion state on this device and opens the inbox with the boundary you selected earlier."
    >
      <div className={styles.summaryGrid}>
        <SummaryCard label="WISMO may" value={selected.alone} detail="This is the most WISMO should attempt at the start." />
        <SummaryCard label="Human control" value={selected.approval} detail="Anything outside this stays with a manager." />
        <SummaryCard label="Always blocked" value="Refunds, address changes, delivery conflicts" detail="These remain outside the scope of this setup flow." />
      </div>

      <label className={styles.checkpoint}>
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        <span>
          <strong>I want to finish setup with this starting boundary</strong>
          <small>The inbox will still show manager-controlled actions as approvals in this release.</small>
        </span>
      </label>

      <div className={styles.stageActions}>
        <button
          className={styles.primary}
          type="button"
          disabled={!confirmed}
          onClick={() => onDraftChange((current) => ({ ...current, activated: true }))}
        >
          Finish setup <span>→</span>
        </button>
      </div>
    </StageFrame>
  );
}

function SetupSection({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className={styles.setupSection}>
      <header className={styles.setupSectionHeader}>
        <h3>{title}</h3>
        <p>{text}</p>
      </header>
      {children}
    </section>
  );
}

function Brand() {
  return <Link href="/" className={styles.brand}><i />WISMO</Link>;
}

function Loading({ text }: { text: string }) {
  return <main className={styles.center}><p className={styles.status}>{text}</p></main>;
}

function SignIn() {
  const { signIn } = useAuthActions();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setWorking(true);
    setError("");
    try {
      await signIn("google", { redirectTo: "/setup" });
    } catch (reason) {
      setError(message(reason, "Google sign-in could not start"));
      setWorking(false);
    }
  }

  return (
    <main className={styles.center}>
      <section className={styles.card}>
        <Brand />
        <p className={styles.eyebrow}>Manager access</p>
        <h1>Connect your support mailbox.</h1>
        <p>Sign in with Google first. The first verified account becomes the founder; later accounts need a founder invitation.</p>
        <button className={styles.primary} type="button" disabled={working} onClick={start}>
          {working ? "Opening Google…" : "Connect support mailbox"}
          <span>→</span>
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
        <small>Customer and courier messages, and Shopify changes, always wait for manager approval in V1.</small>
      </section>
    </main>
  );
}

function GmailCard({ integration }: { integration?: Integration }) {
  const begin = useAction(gmailRef);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setWorking(true);
    setError("");
    try {
      window.location.assign(await begin({}));
    } catch (reason) {
      setError(message(reason, "Gmail connection failed"));
      setWorking(false);
    }
  }

  return (
    <article className={styles.connection}>
      <Service icon="M" kind="gmail" label="Shared support inbox" name="Gmail" connected={Boolean(integration)} />
      <p>{integration?.accountLabel ?? "Read support requests and send approved replies from one mailbox."}</p>
      <button type="button" onClick={connect} disabled={working}>
        {working ? "Opening Google…" : integration ? "Reconnect Gmail" : "Connect Gmail"}
      </button>
      {error ? <p className={styles.error}>{error}</p> : null}
    </article>
  );
}

function ShopifyCard({ integration }: { integration?: Integration }) {
  const connect = useAction(shopifyRef);
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setFeedback("");
    try {
      const result = await connect({ shopDomain: domain, accessToken: token });
      setFeedback(`Connected ${result.storeName}.`);
      setToken("");
    } catch (reason) {
      setFeedback(message(reason, "Shopify connection failed"));
    } finally {
      setWorking(false);
    }
  }

  return (
    <article className={styles.connection}>
      <Service icon="S" kind="shopify" label="Order source" name="Shopify" connected={Boolean(integration)} />
      <p>{integration?.accountLabel ?? "Use a founder-created Shopify custom-app token."}</p>
      <form onSubmit={submit}>
        <Field label=".myshopify.com domain">
          <input required value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="northstar-goods.myshopify.com" />
        </Field>
        <Field label="Admin API access token">
          <input required type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" placeholder="shpat_…" />
        </Field>
        <button disabled={working}>{working ? "Checking Shopify…" : integration ? "Replace connection" : "Connect Shopify"}</button>
      </form>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
    </article>
  );
}

function InviteForm() {
  const invite = useAction(inviteRef);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await invite({ email });
      setLink(`${window.location.origin}/setup`);
    } catch (reason) {
      setError(message(reason, "Invite could not be created"));
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Field label="Support agent Google email">
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="agent@example.com" />
      </Field>
      <button>Create invite</button>
      {link ? (
        <div className={styles.result}>
          <p>Send this private link to {email}. It expires in seven days.</p>
          <code>{link}</code>
          <button type="button" onClick={() => void navigator.clipboard.writeText(link)}>Copy invite link</button>
        </div>
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}

function ContactForm() {
  const save = useMutation(contactRef);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"courier" | "vendor">("courier");
  const [feedback, setFeedback] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await save({ name, email, type });
      setName("");
      setEmail("");
      setFeedback("Contact saved.");
    } catch (reason) {
      setFeedback(message(reason, "Contact could not be saved"));
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Field label="Name"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Colissimo support" /></Field>
      <Field label="Email"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="support@courier.com" /></Field>
      <Field label="Type">
        <select value={type} onChange={(event) => setType(event.target.value as "courier" | "vendor")}>
          <option value="courier">Courier</option>
          <option value="vendor">Vendor</option>
        </select>
      </Field>
      <button>Save contact</button>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
    </form>
  );
}

function RuleForm() {
  const save = useMutation(ruleRef);
  const [title, setTitle] = useState("");
  const [guidance, setGuidance] = useState("");
  const [feedback, setFeedback] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await save({ title, guidance });
      setTitle("");
      setGuidance("");
      setFeedback("Rule saved.");
    } catch (reason) {
      setFeedback(message(reason, "Rule could not be saved"));
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Field label="Rule name"><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Failed delivery" /></Field>
      <Field label="Guidance" wide><textarea required value={guidance} onChange={(event) => setGuidance(event.target.value)} placeholder="Explain the newest scan and next confirmed step." /></Field>
      <button>Save rule</button>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
    </form>
  );
}

function MemoryReviewList({ memories }: { memories: Memory[] }) {
  const decide = useMutation(decideMemoryRef);
  const [feedback, setFeedback] = useState("");

  async function review(memoryId: string, decision: "approved" | "rejected") {
    setFeedback("");
    try {
      await decide({ memoryId, decision });
      setFeedback(decision === "approved" ? "Memory approved." : "Memory rejected.");
    } catch (reason) {
      setFeedback(message(reason, "Memory review failed"));
    }
  }

  return (
    <div className={styles.list}>
      {memories.length ? memories.map((memory) => (
        <article key={memory._id}>
          <strong>{memory.guidance}</strong>
          <p>Proposed by {memory.proposedByName}{memory.caseId ? ` from case ${memory.caseId}` : ""}.</p>
          <div className={styles.inlineActions}>
            <button type="button" onClick={() => void review(memory._id, "approved")}>Approve memory</button>
            <button type="button" onClick={() => void review(memory._id, "rejected")}>Reject</button>
          </div>
        </article>
      )) : <p>No pending memory proposals.</p>}
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
    </div>
  );
}

function ItemList({ items, empty }: { items?: Array<{ title: string; detail: string }>; empty: string }) {
  return (
    <div className={styles.list}>
      {items?.length ? items.map((item) => (
        <article key={`${item.title}-${item.detail}`}>
          <strong>{item.title}</strong>
          <p>{item.detail}</p>
        </article>
      )) : <p>{empty}</p>}
    </div>
  );
}

function Service({
  icon,
  kind,
  label,
  name,
  connected,
}: {
  icon: string;
  kind: string;
  label: string;
  name: string;
  connected: boolean;
}) {
  return (
    <div className={styles.service}>
      <b data-kind={kind}>{icon}</b>
      <div>
        <small>{label}</small>
        <strong>{name}</strong>
      </div>
      <span data-connected={connected}>{connected ? "Connected" : "Required"}</span>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? styles.wide : undefined}>{label}{children}</label>;
}

function SupportAccess({ profile }: { profile: Profile }) {
  return (
    <main className={styles.center}>
      <section className={styles.card}>
        <Brand />
        <p className={styles.eyebrow}>Support agent</p>
        <h1>Your access is ready.</h1>
        <p>{profile.email} can review and approve cases. Founder settings are locked for this role.</p>
        <Link className={styles.primaryLink} href="/inbox">Open human attention <span>→</span></Link>
        <div className={styles.locked}>Integrations, contacts, team access, and reusable rules require the founder.</div>
        <SignOut />
      </section>
    </main>
  );
}

function SignOut() {
  const { signOut } = useAuthActions();
  return <button className={styles.signOut} type="button" onClick={() => void signOut()}>Sign out</button>;
}

function message(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}
