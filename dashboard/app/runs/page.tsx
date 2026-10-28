import React from "react";

export default function RunsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Simulation Runs</h1>
      <div className="card">
        <p style={{ color: "var(--text-muted)" }}>
          Lists serialized runs discovered in <code>results/</code>.
        </p>
      </div>
    </div>
  );
}
