"use client";

import { env } from "@/env";
import { Image } from "@mantine/core";
import { useS3Info } from "./S3Context";
import { api } from "@/trpc/react";
import { useElementSize } from "@mantine/hooks";
import { useEffect, useState } from "react";

export function S3Image(props: { id: string; w?: number; h?: number }) {
  const { ref, width, height } = useElementSize();

  const s3Info = useS3Info();

  const greaterResolution = width > height ? width : height;

  const [resolution, setResolution] = useState(128);

  let webpUrl: string;
  let jpegUrl: string;

  useEffect(() => {
    const greaterResolution = width > height ? width : height;

    setResolution(
      s3Info.imageSizes?.find(
        (size, index) =>
          greaterResolution <= size || index == s3Info.imageSizes?.length,
      ) ?? 128,
    );
  }, [width, height]);

  if (s3Info.isPublic) {
    const baseUrl = `http${s3Info.ssl ? "s" : ""}://${s3Info.endpoint}/${s3Info.bucketName}/resized/${props.id}`;

    webpUrl = `${baseUrl}/webp/${resolution}.webp`;
    jpegUrl = `${baseUrl}/jpg/${resolution}.jpg`;
  } else {
    const [webpPresignedUrl, webpPresignedUrlQuery] =
      api.photo.getPhotoPresignedUrl.useSuspenseQuery({
        fileId: props.id,
        type: "webp",
        size: resolution.toString(),
      });
    const [jpegPresignedUrl, jpegPresignedUrlQuery] =
      api.photo.getPhotoPresignedUrl.useSuspenseQuery({
        fileId: props.id,
        type: "jpg",
        size: resolution.toString(),
      });

    webpUrl = webpPresignedUrl.url!;
    jpegUrl = jpegPresignedUrl.url!;
  }

  return (
    <Image
      src={webpUrl}
      fallbackSrc={jpegUrl}
      w={props.w ?? "auto"}
      h={props.h ?? 128}
      fit="contain"
      ref={ref}
    />
  );
}
