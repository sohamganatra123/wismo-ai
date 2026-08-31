import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("poll connected Gmail test inbox", { minutes: 1 }, internal.gmailPolling.pollInbox);
export default crons;
