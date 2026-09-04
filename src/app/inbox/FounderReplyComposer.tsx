"use client";

import { useAction } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

const sendFounderReplyRef = makeFunctionReference<
  "action",
  { caseId: string; requestId: string; text: string },
  { status: "sent" | "already_sent" }
>("founderReplies:sendFounderReply");

function requestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `reply_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function FounderReplyComposer({
  caseId,
  recipientName,
}: {
  caseId: string;
  recipientName: string;
}) {
  const sendFounderReply = useAction(sendFounderReplyRef);
  const [text, setText] = useState("");
  const [sendRequestId, setSendRequestId] = useState(requestId);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const remaining = 4_000 - text.length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reply = text.trim();
    if (!reply || sending) return;

    setSending(true);
    setFeedback("");
    try {
      const result = await sendFounderReply({ caseId, requestId: sendRequestId, text: reply });
      setText("");
      setSendRequestId(requestId());
      setFeedbackTone("success");
      setFeedback(
        result.status === "already_sent"
          ? "This reply was already sent."
          : "Reply sent in Gmail. The case is resolved and this reply is saved as an agent example.",
      );
    } catch (error) {
      setSendRequestId(requestId());
      setFeedbackTone("error");
      setFeedback(error instanceof Error ? error.message : "The reply could not be sent");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={styles.replyComposer} aria-labelledby={`reply-title-${caseId}`}>
      <header>
        <div>
          <small>Founder reply</small>
          <strong id={`reply-title-${caseId}`}>Reply to {recipientName}</strong>
        </div>
        <span>Saved as an example after Gmail confirms the send.</span>
      </header>
      <form onSubmit={submit}>
        <label htmlFor={`reply-${caseId}`}>Message</label>
        <textarea
          id={`reply-${caseId}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={4_000}
          rows={7}
          placeholder="Write the reply you want the customer to receive…"
          disabled={sending}
          required
        />
        <footer>
          <span>{remaining.toLocaleString()} characters left · Sends in the original Gmail thread</span>
          <button className={styles.actionButton} type="submit" disabled={sending || !text.trim()}>
            {sending ? "Sending…" : "Send reply and resolve"}
          </button>
        </footer>
      </form>
      {feedback ? (
        <p
          className={styles.replyFeedback}
          data-tone={feedbackTone}
          role={feedbackTone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
