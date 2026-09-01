"use client";

import { makeFunctionReference } from "convex/server";
import { useMutation } from "convex/react";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import styles from "./waitlist.module.css";

const waitlistJoinRef = makeFunctionReference<
  "mutation",
  { email: string; name?: string; company?: string },
  { status: "created" | "existing" }
>("waitlist:join");

export default function WaitlistForm({ configured }: { configured: boolean }) {
  const joinWaitlist = useMutation(waitlistJoinRef);
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const started = useRef(false);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    track("Waitlist Form Started", { field: "work_email" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid work email.");
      track("Waitlist Form Error", { reason: "invalid_email" });
      return;
    }

    if (!configured) {
      setError("Waitlist storage is not configured yet.");
      track("Waitlist Form Error", { reason: "storage_unavailable" });
      return;
    }

    setWorking(true);
    try {
      const result = await joinWaitlist({
        email: email.trim(),
      });
      track("Waitlist Signup Completed", { result: result.status });
      setSuccess(
        result.status === "existing"
          ? "You are already on the waitlist. We saved your latest details."
          : "You are on the waitlist. We’ll reach out when mailbox access opens."
      );
      setEmail("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Waitlist signup failed.");
      track("Waitlist Form Error", { reason: "submission_failed" });
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Early access</p>
          <h1>Join Wismo early access.</h1>
          <p className={styles.lede}>
            WISMO is opening shared support mailbox connections in small batches.
            Leave your work email now. We’ll collect company and connection details
            with you later, before anything is connected.
          </p>
          <div className={styles.notes}>
            <span>Shared Gmail inbox support</span>
            <span>Founder-led onboarding</span>
            <span>Manager approval stays in the loop</span>
          </div>
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.formIntro}>
            <p>Request access</p>
            <small>One field. No mailbox connection yet.</small>
          </div>
          <label>
            Work email
            <input
              required
              type="email"
              value={email}
              onFocus={markStarted}
              onChange={(event) => {
                markStarted();
                setEmail(event.target.value);
              }}
              placeholder="avery@northstar-goods.com"
              autoComplete="email"
            />
          </label>
          <button className={styles.primary} disabled={working}>
            {working ? "Saving your spot..." : "Join early access"}
          </button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {success ? <p className={styles.success} role="status">{success}</p> : null}
          <small className={styles.caption}>
            We store your work email only for access updates. Reply to any access
            email to ask for deletion.
          </small>
          <Link className={styles.safetyLink} href="/#privacy-security">
            Read the privacy and security boundary
          </Link>
        </form>
      </section>

      <section className={styles.detail}>
        <div>
          <p className={styles.kicker}>What happens next</p>
          <h2>We’ll reach out when your mailbox can be activated.</h2>
        </div>
        <div className={styles.steps}>
          <article>
            <strong>1. Request access</strong>
            <p>Share only your work email.</p>
          </article>
          <article>
            <strong>2. We review fit</strong>
            <p>We’ll ask about your company, shared support inbox, and live Shopify orders.</p>
          </article>
          <article>
            <strong>3. Start onboarding</strong>
            <p>We explain permissions and data handling before anything connects.</p>
          </article>
        </div>
        <Link className={styles.back} href="/">
          Back to homepage
        </Link>
      </section>
    </main>
  );
}
