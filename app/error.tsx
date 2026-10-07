"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/feedback/ErrorFallback";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

// Shown when a page crashes.
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorFallback digest={error.digest} onRetry={retry} />;
}
