// In-memory store for active print jobs (server-side only)
// Each job: { id, cancelled: boolean, printed: number, total: number }
export const activePrintJobs = new Map();
