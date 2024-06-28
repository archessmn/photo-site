import { PhotosList } from "./PhotosList";
import { Suspense } from "react";
import { Center, Loader, Space, Text } from "@mantine/core";
import { S3InfoProvider } from "@/app/_components/S3Context";
import { env } from "@/env";
import { IMAGE_SIZES } from "@/utils/photos";

export default function PhotosPage() {
  // const photos = api.storage.fetchFiles.query();

  return (
    <>
      <S3InfoProvider
        value={{
          bucketName: env.S3_BUCKET_NAME,
          isPublic: env.S3_BUCKET_PUBLIC === "true",
          endpoint: env.S3_ENDPOINT,
          ssl: env.S3_USE_SSL === "true",
          imageSizes: IMAGE_SIZES,
        }}
      >
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
      </S3InfoProvider>
    </>
  );
}
