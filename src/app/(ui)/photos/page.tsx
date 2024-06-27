import { db } from "@/server/db";
import { PhotosList } from "./PhotosList";
import { api } from "@/trpc/server";

export default function PhotosPage() {
  const photos = api.storage.fetchFiles.query();

  return <PhotosList />;
}
