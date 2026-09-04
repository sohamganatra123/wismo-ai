import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("poll connected Gmail test inbox", { minutes: 1 }, internal.gmailPolling.pollInbox);
crons.interval("process escalation reminders", { minutes: 5 }, internal.escalations.runDueEscalations);
crons.interval("recover expired agent rounds", { minutes: 1 }, internal.agentRuns.recoverExpired);
export default crons;
