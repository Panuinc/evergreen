"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100vh",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "400px",
              textAlign: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "96px",
                height: "96px",
                borderRadius: "12px",
                backgroundColor: "#fee2e2",
              }}
            >
              <CircleAlert style={{ width: "48px", height: "48px", color: "#ef4444" }} />
            </div>
            <p style={{ fontSize: "20px", color: "#111" }}>
              Something went wrong
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                backgroundColor: "#006FEE",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
