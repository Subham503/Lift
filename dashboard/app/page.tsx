import React from "react";

export default function OverviewPage() {
  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Simulation Overview</h1>
      <div className="card">
        <h3>Active Pack</h3>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          {"\u2014"}
        </p>
      </div>
      <div className="card">
        <h3>Top Performing Policy</h3>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          {"\u2014"}
        </p>
      </div>
    </div>
  );
}
