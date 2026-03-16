// In-memory store for active print jobs (server-side only)
// Each job: { id, cancelled: boolean, printed: number, total: number, designName: string, startedAt: number }
export const activePrintJobs = new Map();

// History of recent print jobs (keeps last 20)
export const printJobHistory = [];
const MAX_HISTORY = 20;

export function addToHistory(job) {
  printJobHistory.unshift({
    id: job.id,
    designName: job.designName || "-",
    total: job.total,
    printed: job.printed,
    cancelled: job.cancelled,
    startedAt: job.startedAt,
    finishedAt: Date.now(),
  });
  if (printJobHistory.length > MAX_HISTORY) {
    printJobHistory.pop();
  }
}
