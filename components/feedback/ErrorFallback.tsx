import MessageCard from "./MessageCard";

interface ErrorFallbackProps {
  digest?: string; // matches the error in the server log
  onRetry: () => void;
}

export default function ErrorFallback({ digest, onRetry }: ErrorFallbackProps) {
  return (
    <MessageCard
      title="Something went wrong"
      actions={
        <>
          <button type="button" className="button primary" onClick={onRetry}>
            Try again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload to start fresh */}
          <a href="/" className="button secondary">
            Go to tasks
          </a>
        </>
      }
    >
      <p>Sorry, this page couldn&apos;t be shown. Try again, or go back to your tasks.</p>
      {digest && (
        <p className="muted">
          Error reference: <code>{digest}</code>
        </p>
      )}
    </MessageCard>
  );
}
