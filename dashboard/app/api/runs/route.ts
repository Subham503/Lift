import { NextResponse } from "next/server";
import { getRuns } from "@/lib/results";

export async function GET() {
  const runs = getRuns();
  return NextResponse.json(runs);
}

