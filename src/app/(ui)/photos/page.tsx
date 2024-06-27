import { PhotosList } from "./PhotosList";
import { Suspense } from "react";
import { Center, Loader, Space, Text } from "@mantine/core";

export default function PhotosPage() {
  // const photos = api.storage.fetchFiles.query();

  return (
    <>
      <Text size="lg">Uploaded Photos:</Text>
      <Space h={"sm"} />
      <Suspense
        fallback={
          <Center>
            <Loader />
          </Center>
        }
      >
        <PhotosList />
      </Suspense>
    </>
  );
}
