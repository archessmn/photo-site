"use client";

import { api } from "@/trpc/react";
import { Image } from "@mantine/core";
import { Suspense } from "react";

export function PhotoBox(props: { fileId: string }) {
  const [urlResponse, urlResponseQuery] =
    api.photo.getPhotoPresignedUrl.useSuspenseQuery({
      fileId: props.fileId,
      type: "webp",
      size: "1024",
    });

  if (!urlResponse.ok) {
    return <>Invalid Image ID</>;
  }

  return (
    <Suspense>
      <Image src={urlResponse.url} />
    </Suspense>
  );
}
