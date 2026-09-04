"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./login.module.css";

export default function LoginForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (isAuthenticated) router.replace("/setup"); }, [isAuthenticated, router]);

  async function logIn() {
    setWorking(true);
    setError("");
    try { await signIn("google", { redirectTo: "/setup" }); }
    catch { setError("Google login could not start. Try again."); setWorking(false); }
  }

  return (
    <main className={styles.page}>
      <section className={styles.label}>
        <Link className={styles.brand} href="/">WISMO.ai</Link>
        <p className={styles.eyebrow}>EXISTING WORKSPACE</p>
        <h1>Welcome back.</h1>
        <p>Log in with the Google account connected to your Wismo workspace.</p>
        <button className={styles.primary} type="button" onClick={logIn} disabled={working || isLoading}>{working || isLoading ? "Opening Wismo…" : "Log in with Google"}<span>↗</span></button>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <Link className={styles.secondary} href="/setup">Need workspace setup?</Link>
        <small>Customer messages and Shopify changes require manager approval in v1.</small>
      </section>
    </main>
  );
}
