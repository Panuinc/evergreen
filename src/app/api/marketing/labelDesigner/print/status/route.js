import { NextResponse } from "next/server";
import { activePrintJobs } from "../jobStore";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Missing jobId" },
      { status: 400 },
    );
  }

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
