import { Card, LoadingOverlay, Stack, Text } from "@mantine/core";
import { File } from "@prisma/client";
import { Suspense, use } from "react";

export function PhotosList(props: { files: Promise<File[]> }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Stack>
        {use(props.files).map((file) => {
          return (
            <Card>
              <Text>{file.originalName}</Text>
            </Card>
          );
        })}
      </Stack>
    </Suspense>
  );
}
