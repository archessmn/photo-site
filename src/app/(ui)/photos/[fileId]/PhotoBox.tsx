"use client";

import { api } from "@/trpc/react";
import { Image } from "@mantine/core";
import { Suspense } from "react";

export function PhotoBox(props: { fileId: string }) {
  const [urlResponse, urlResponseQuery] =
    api.storage.getPresignedUrlToView.useSuspenseQuery({
      fileId: props.fileId,
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
