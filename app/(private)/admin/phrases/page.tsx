import { connection } from "next/server";
import { isoWeek } from "@/app/lib/phrase-of-the-week";
import { adminApi } from "../lib/api";
import { getLinkTargets } from "../lib/queries";
import { PhrasesManager } from "./PhrasesManager";

export default async function AdminPhrasesPage() {
  // Render per-request: the reads below are live and uncached, and the week
  // number must be today's, not the build's.
  await connection();

  const [phrases, linkTargets] = await Promise.all([
    adminApi.listPhrases(),
    getLinkTargets(),
  ]);

  return (
    <div className="space-y-6">
      <PhrasesManager
        phrases={phrases}
        linkTargets={linkTargets}
        // Derived here rather than in the browser so the "Showing now" badge
        // renders identically on the server and after hydration.
        isoWeek={isoWeek(new Date())}
      />
    </div>
  );
}
