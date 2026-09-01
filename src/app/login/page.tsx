import Link from "next/link";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const metadata = { title: "Log in · Wismo.ai" };

export default function LoginPage() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <main className={styles.page}>
        <section className={styles.label}>
          <Link className={styles.brand} href="/">WISMO.ai</Link>
          <p className={styles.eyebrow}>LOCAL ENVIRONMENT</p>
          <h1>Login needs a configured Convex environment.</h1>
          <p>The local simulation is still available through the connect flow.</p>
          <Link className={styles.primary} href="/connect">Open connect flow <span>↗</span></Link>
        </section>
      </main>
    );
  }
  return <LoginForm />;
}
