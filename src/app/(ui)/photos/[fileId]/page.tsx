import { PhotoBox } from "./PhotoBox";

export default function SinglePhotoView({
  params,
}: {
  params: {
    fileId: string;
  };
}) {
  return <PhotoBox fileId={params.fileId} />;
}
