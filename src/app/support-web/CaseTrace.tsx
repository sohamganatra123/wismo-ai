"use client";
import { useEffect, useRef } from "react";
import styles from "./supportWorld.module.css";
export function CaseTrace({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = dialogRef.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]);
  return <dialog ref={dialogRef} className={styles.trace} onClose={onClose}>
    <div className={styles.traceHead}><div><span>Resolved case</span><strong>WIS-2048 · Amina M.</strong></div><button onClick={onClose} aria-label="Close case trace">Close ×</button></div>
    <h2>Why WISMO prepared this answer</h2>
    <ol>
      <li><b>01</b><div><strong>Understood</strong><p>Amina wants the latest delivery status for order #4921.</p></div><time>00:01</time></li>
      <li><b>02</b><div><strong>Connected context</strong><p>Matched the customer, Shopify order, earlier conversation, and tracking TRK-123.</p></div><time>00:08</time></li>
      <li><b>03</b><div><strong>Verified</strong><p>The newest scan shows a failed delivery attempt at 11:00.</p></div><time>00:31</time></li>
      <li><b>04</b><div><strong>Prepared</strong><p>Another attempt is scheduled. Amina does not need to take action.</p></div><time>00:42</time></li>
    </ol>
  </dialog>;
}
