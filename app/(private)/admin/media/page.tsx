import type { Metadata } from "next";
import { connection } from "next/server";
import { adminApi } from "../lib/api";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = {
  title: "Media library",
  robots: { index: false, follow: false },
};

/**
 * Admin media library — a WordPress-style browser for everything uploaded via
 * the `media-library` storage context. The global tag vocabulary is small and
 * stable, so it's fetched server-side and handed to the client surface; the
 * media list and folder tree are interactive and fetched client-side.
 */
export default async function AdminMediaPage() {
  await connection();
  const allTags = await adminApi.getAllTags();

  return <MediaLibrary allTags={allTags} />;
}
