"use client";

import { makeFunctionReference } from "convex/server";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./waitlist.module.css";

const waitlistJoinRef = makeFunctionReference<
  "mutation",
  { email: string; name?: string; company?: string },
  { status: "created" | "existing" }
>("waitlist:join");

export default function WaitlistForm({ configured }: { configured: boolean }) {
  const joinWaitlist = useMutation(waitlistJoinRef);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid work email.");
      return;
    }

    if (!configured) {
      setError("Waitlist storage is not configured yet.");
      return;
    }

    setWorking(true);
    try {
      const result = await joinWaitlist({
        email: email.trim(),
        name: name.trim() || undefined,
        company: company.trim() || undefined,
      });
      setSuccess(
        result.status === "existing"
          ? "You are already on the waitlist. We saved your latest details."
          : "You are on the waitlist. We’ll reach out when mailbox access opens."
      );
      setEmail("");
      setName("");
      setCompany("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Waitlist signup failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Early access</p>
          <h1>Join the waitlist for mailbox access.</h1>
          <p className={styles.lede}>
            WISMO is opening shared support mailbox connections in small batches.
            Leave your work email and we’ll contact you when your slot is ready.
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
            <small>We only need enough to follow up.</small>
          </div>
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Avery Morgan"
              autoComplete="name"
            />
          </label>
          <label>
            Work email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="avery@northstar-goods.com"
              autoComplete="email"
            />
          </label>
          <label>
            Company
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Northstar Goods"
              autoComplete="organization"
            />
          </label>
          <button className={styles.primary} disabled={working}>
            {working ? "Saving your spot..." : "Join the waitlist"}
          </button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {success ? <p className={styles.success} role="status">{success}</p> : null}
          <small className={styles.caption}>
            No spam. We’ll use this only for access updates.
          </small>
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
            <p>Share your work email and team name.</p>
          </article>
          <article>
            <strong>2. We review fit</strong>
            <p>We’re prioritizing teams with a shared support inbox and live Shopify orders.</p>
          </article>
          <article>
            <strong>3. Start onboarding</strong>
            <p>When your slot opens, you’ll get a direct setup link.</p>
          </article>
        </div>
        <Link className={styles.back} href="/">
          Back to homepage
        </Link>
      </section>
    </main>
  );
}
