import { prisma } from "@/app/lib/db";

// Serves an uploaded image stored in the database. Content is
// content-addressed by id (immutable), so it's safe to cache hard.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
