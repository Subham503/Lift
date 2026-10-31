import { NextResponse } from "next/server";
import { getReports } from "@/lib/results";

export async function GET() {
  const reports = getReports();
  return NextResponse.json(reports);
}

