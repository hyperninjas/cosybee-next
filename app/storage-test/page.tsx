"use client";

import { useState } from "react";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import { PublicFileUpload } from "@/app/components/storage/PublicFileUpload";
import { deleteObject } from "@/app/lib/storage";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function Panel({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-gray-500">{desc}</p>
      {children}
    </section>
  );
}

export default function StorageTestPage() {
  const [cover, setCover] = useState<string | null>(null);
  const [contentImage, setContentImage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // Inline closure (not a module-level helper): the React Compiler runs in
  // compilationMode 'all', which instruments every top-level function with a
  // memo-cache hook — calling such a helper from an event handler throws
  // "Invalid hook call". Keeping it inside the component avoids that.
  function keyFromUrl(url: string): string {
    try {
      return new URL(url).pathname.replace(/^\/+/, "");
    } catch {
      return url;
    }
  }

  function note(msg: string) {
    setLog((prev) => [msg, ...prev].slice(0, 20));
  }

  async function handleDelete(label: string, key: string, clear: () => void) {
    try {
      const res = await deleteObject(key);
      note(`Deleted ${label}: ${res.key} (${res.deleted})`);
      clear();
    } catch (e) {
      note(`Delete failed for ${label}: ${e instanceof Error ? e.message : e}`);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <header>
        <h1 className="text-2xl font-bold">Storage module test</h1>
        <p className="mt-1 text-sm text-gray-500">
          API base: <code className="rounded bg-gray-100 px-1">{API}</code> — all
          calls send <code>credentials: &quot;include&quot;</code>. Blog contexts
          require an admin session; you must be logged in for these to succeed.
        </p>
      </header>

      <Panel
        title="blog-cover (public, 5 MB, images)"
        desc="Returns a stable public fileUrl. Store the URL and render it directly."
      >
        <PublicImageUpload context="blog-cover" value={cover} onChange={setCover} />
        {cover && (
          <div className="mt-2 space-y-1 text-sm">
            <p className="break-all">
              fileUrl: <code>{cover}</code>
            </p>
            <button
              type="button"
              className="text-red-600 underline"
              onClick={() =>
                handleDelete("blog-cover", keyFromUrl(cover), () => setCover(null))
              }
            >
              Delete from S3
            </button>
          </div>
        )}
      </Panel>

      <Panel
        title="blog-content-image (public, 8 MB, images)"
        desc="In-content editor images. Same flow as cover, larger size cap."
      >
        <PublicImageUpload
          context="blog-content-image"
          value={contentImage}
          onChange={setContentImage}
        />
        {contentImage && (
          <div className="mt-2 space-y-1 text-sm">
            <p className="break-all">
              fileUrl: <code>{contentImage}</code>
            </p>
            <button
              type="button"
              className="text-red-600 underline"
              onClick={() =>
                handleDelete("blog-content-image", keyFromUrl(contentImage), () =>
                  setContentImage(null),
                )
              }
            >
              Delete from S3
            </button>
          </div>
        )}
      </Panel>

      <Panel
        title="user-avatar (public, 2 MB, images)"
        desc="Any logged-in user (not just admin). Returns a public fileUrl."
      >
        <PublicImageUpload
          context="user-avatar"
          value={avatar}
          onChange={setAvatar}
        />
        {avatar && (
          <div className="mt-2 space-y-1 text-sm">
            <p className="break-all">
              fileUrl: <code>{avatar}</code>
            </p>
            <button
              type="button"
              className="text-red-600 underline"
              onClick={() =>
                handleDelete("user-avatar", keyFromUrl(avatar), () =>
                  setAvatar(null),
                )
              }
            >
              Delete from S3
            </button>
          </div>
        )}
      </Panel>

      <Panel
        title="blog-document (public, 20 MB, PDF)"
        desc="Returns a stable public fileUrl — store the URL and link/embed it directly, no signed URL."
      >
        <PublicFileUpload value={docUrl} onChange={setDocUrl} />
        {docUrl && (
          <div className="mt-2 space-y-1 text-sm">
            <p className="break-all">
              fileUrl: <code>{docUrl}</code>
            </p>
            <button
              type="button"
              className="text-red-600 underline"
              onClick={() =>
                handleDelete("blog-document", keyFromUrl(docUrl), () =>
                  setDocUrl(null),
                )
              }
            >
              Delete from S3
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Activity log" desc="Most recent delete results / errors.">
        {log.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {log.map((line, i) => (
              <li key={i} className="font-mono text-gray-700">
                {line}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </main>
  );
}
