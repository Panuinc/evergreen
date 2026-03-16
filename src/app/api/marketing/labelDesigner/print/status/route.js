import { NextResponse } from "next/server";
import { activePrintJobs, printJobHistory } from "../jobStore";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  // If specific jobId requested, return that job's status
  if (jobId) {
    const job = activePrintJobs.get(jobId);
    if (!job) {
      return NextResponse.json({
        success: true,
        data: { status: "completed", printed: 0, total: 0 },
      });
    }
    return NextResponse.json({
      success: true,
      data: {
        status: job.cancelled ? "cancelled" : "printing",
        printed: job.printed,
        total: job.total,
      },
    });
  }

  // Return all active jobs + recent history
  const activeJobs = [];
  for (const [, job] of activePrintJobs) {
    activeJobs.push({
      id: job.id,
      designName: job.designName || "-",
      status: job.cancelled ? "cancelling" : "printing",
      printed: job.printed,
      total: job.total,
      startedAt: job.startedAt,
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      active: activeJobs,
      history: printJobHistory.slice(0, 10),
    },
  });
}
