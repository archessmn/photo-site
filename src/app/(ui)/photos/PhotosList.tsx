"use client";

import { api } from "@/trpc/react";
import {
  ActionIcon,
  Box,
  Card,
  Group,
  Image,
  Stack,
  Text,
} from "@mantine/core";
import { File } from "@prisma/client";
import { redirect, useRouter } from "next/navigation";
import { Suspense, use } from "react";
import { LuEye } from "react-icons/lu";

export function PhotosList() {
  const [photos, photosQuery] = api.storage.fetchFiles.useSuspenseQuery({});

  const router = useRouter();

  return (
    <Stack>
      {photos.map((file) => {
        return (
          <Card key={file.id}>
            {/* <Box h={50} w={50}> */}
            <Suspense>
              <PhotoSrc fileId={file.id} />
            </Suspense>
            {/* </Box> */}
            <Group>
              <Text>{file.originalName}</Text>
              <ActionIcon
                onClick={() => {
                  router.push(`/photos/${file.id}`);
                }}
                ml={"auto"}
              >
                <LuEye />
              </ActionIcon>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}

function PhotoSrc(props: { fileId: string }) {
  const [url, urlQuery] = api.photo.getPhotoPresignedUrl.useSuspenseQuery({
    fileId: props.fileId,
    size: "128",
    type: "webp",
  });

  return (
    <>
      <Image src={url.url} h={50} w={50} />
    </>
  );
}
