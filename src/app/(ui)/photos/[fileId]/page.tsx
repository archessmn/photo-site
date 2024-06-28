import { S3InfoProvider } from "@/app/_components/S3Context";
import { PhotoBox } from "./PhotoBox";
import { env } from "@/env";
import { S3Image } from "@/app/_components/S3Image";
import { IMAGE_SIZES } from "@/utils/photos";

export default function SinglePhotoView({
  params,
}: {
  params: {
    fileId: string;
  };
}) {
  return (
    <S3InfoProvider
      value={{
        bucketName: env.S3_BUCKET_NAME,
        isPublic: env.S3_BUCKET_PUBLIC === "true",
        endpoint: env.S3_ENDPOINT,
        ssl: env.S3_USE_SSL === "true",
        imageSizes: IMAGE_SIZES,
      }}
    >
      <S3Image id={params.fileId} />
    </S3InfoProvider>
  );
}
