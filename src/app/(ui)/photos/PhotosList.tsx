"use client";

import { api } from "@/trpc/react";
import { Card, LoadingOverlay, Stack, Text } from "@mantine/core";
import { File } from "@prisma/client";
import { Suspense, use } from "react";

export function PhotosList() {
  const photos = api.storage.fetchFiles.useQuery({});

  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Stack>
        {photos.isSuccess &&
          photos.data.map((file) => {
            return (
              <Card key={file.id}>
                <Text>{file.originalName}</Text>
              </Card>
            );
          })}
      </Stack>
    </Suspense>
  );
}
