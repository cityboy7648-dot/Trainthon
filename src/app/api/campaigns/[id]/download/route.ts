import { getCampaignArchive } from "@/lib/data/campaign-download";
import { AppError } from "@/lib/errors";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const archive = await getCampaignArchive(id);
    return new Response(new Uint8Array(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="campaign-${id}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "download_failed" },
      { status: error instanceof AppError && error.code === "auth" ? 401 : 404 },
    );
  }
}
