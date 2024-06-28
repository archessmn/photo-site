"use client";

import { S3Image } from "@/app/_components/S3Image";
import { api } from "@/trpc/react";
import {
  ActionIcon,
  Box,
  Card,
  Center,
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
            {/* </Box> */}
            <Group>
              <Box h={64} w={64}>
                <Center>
                  <Suspense>
                    <S3Image id={file.id} h={64} />
                  </Suspense>
                </Center>
              </Box>
              <Stack>
                <Text>{file.originalName}</Text>
                <Text c={"dimmed"} size="xs">
                  {file.id}
                </Text>
              </Stack>
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

// function PhotoSrc(props: { fileId: string }) {
//   const [url, urlQuery] = api.photo.getPhotoPresignedUrl.useSuspenseQuery({
//     fileId: props.fileId,
//     size: "128",
//     type: "webp",
//   });

//   return (
//     <>
//       <Image src={url.url} h={50} w={50} />
//     </>
//   );
// }
