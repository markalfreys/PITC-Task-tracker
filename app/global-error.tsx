"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/feedback/ErrorFallback";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

// Shown when the root layout crashes, so it needs its own <html> and <body>.
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <title>Something went wrong · Task Tracker</title>
        <main className="container">
          <ErrorFallback digest={error.digest} onRetry={retry} />
        </main>
      </body>
    </html>
  );
}
