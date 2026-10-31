import { NextRequest, NextResponse } from "next/server";
import { getTransactions } from "@/lib/results";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q")?.toLowerCase() || "";
  const status = searchParams.get("status") || "all";
  const overrideOnly = searchParams.get("override") === "true";
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let list = getTransactions();

  if (status !== "all") {
    list = list.filter((t) => t.final_decision.toLowerCase() === status.toLowerCase());
  }

  if (overrideOnly) {
    list = list.filter((t) => t.guardrail.override);
  }

  if (q) {
    list = list.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.customer_id.toLowerCase().includes(q) ||
        t.payment_method.toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        t.guardrail.rule_name.toLowerCase().includes(q) ||
        (t.hidden.true_label && String(t.hidden.true_label).toLowerCase().includes(q))
    );
  }

  const total = list.length;
  const items = list.slice(offset, offset + limit);

  return NextResponse.json({
    total,
    offset,
    limit,
    items,
  });
}

