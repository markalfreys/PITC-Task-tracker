import Link from "next/link";
import MessageCard from "@/components/feedback/MessageCard";

export default function NotFound() {
  return (
    <MessageCard
      title="Not found"
      actions={
        <Link href="/" className="button primary">
          Back to tasks
        </Link>
      }
    >
      <p>This page or task doesn&apos;t exist. A task may have been deleted.</p>
    </MessageCard>
  );
}
