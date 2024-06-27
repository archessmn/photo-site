import { db } from "@/server/db";
import { api } from "@/trpc/server";
import { s3Client } from "@/utils/minio";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { photoId: string } },
) {
  const searchParams = req.nextUrl.searchParams;

  const type = searchParams.get("type");
  const size = searchParams.get("size");

  const urlResponse = await api.photo.getPhotoPresignedUrl.query({
    fileId: params.photoId,
    size,
    type,
  });

  if (!urlResponse.ok) {
    return Response.json(
      { error: "Unable to find requested file" },
      { status: 404 },
    );
  }

  redirect(urlResponse.url!);
}
