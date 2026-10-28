import React from "react";

export default function TransactionPage() {
  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Transaction Inspector</h1>
      <div className="card">
        <p style={{ color: "var(--text-muted)" }}>
          Detailed step-by-step audit viewer for individual transaction decisions and guardrail overrides.
        </p>
      </div>
    </div>
  );
}
