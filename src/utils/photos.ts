import { db } from "@/server/db";
import { s3Client } from "./minio";
// import * as fs from "fs"
import { mkdir, readFile } from "fs/promises";
import { Readable } from "stream";
import { finished } from "stream/promises";
import path from "path";
import { createWriteStream, existsSync } from "fs";
import { ReadableStream } from "stream/web";
import sharp from "sharp";
import { env } from "@/env";
import { File } from "@prisma/client";

// Must contain 128 as it is the default fallback until I fix it
// Must also be in ascending order
export const IMAGE_SIZES = [128, 256, 512, 1024];

export async function resizeS3Upload(id: string) {
  const file = await db.file.findUnique({
    where: {
      id: id,
    },
  });

  if (!file) {
    return {
      ok: false,
    };
  }

  const tempPath = `${process.cwd()}/temp`;
  const filePath = `${tempPath}/${id}`;

  const fileObject = await s3Client.getObject(file.bucket, file.fileName);

  if (!existsSync(tempPath)) await mkdir(tempPath);
  if (!existsSync(filePath)) await mkdir(filePath);

  const originalDestination = path.resolve(filePath, "original");

  let finalDestination = originalDestination;

  const fileStream = createWriteStream(originalDestination, { flags: "wx" });

  await finished(fileObject.pipe(fileStream));

  let image = sharp(originalDestination).keepMetadata();
  const imageMeta = await image.metadata();

  const orientation =
    (imageMeta.width ?? 0) > (imageMeta.height ?? 0) ? "landscape" : "portrait";

  if (orientation !== file.orientation) {
    finalDestination += "-rotated";
    image = image.rotate(90);
    await image.toFile(finalDestination);
  }

  if (!existsSync(`${filePath}/webp`)) await mkdir(`${filePath}/webp`);
  if (!existsSync(`${filePath}/jpg`)) await mkdir(`${filePath}/jpg`);

  // [128].map((size) => {
  IMAGE_SIZES.map((size) => {
    sharp(finalDestination)
      .keepExif()
      .withMetadata()
      .resize(size, size, { fit: "inside" })
      .webp()
      .toFile(path.resolve(filePath, `webp/${size}.webp`), (err, info) => {
        uploadAndSave({
          err,
          info,
          file,
          filePath,
          size,
          extension: "webp",
        });
      })
      .jpeg()
      .toFile(path.resolve(filePath, `jpg/${size}.jpg`), async (err, info) => {
        uploadAndSave({
          err,
          info,
          file,
          filePath,
          size,
          extension: "jpg",
        });
      });
  });
}

export async function resizeS3UploadBetter(id: string) {
  const file = await db.file.findUnique({
    where: {
      id: id,
    },
  });

  if (!file) {
    return {
      ok: false,
    };
  }

  s3Client.getObject(file.bucket, file.fileName).then((data) => {
    sharp(data.read());
  });
}

async function uploadAndSave(data: {
  err: Error;
  info: sharp.OutputInfo;
  filePath: string;
  size: number;
  file: File;
  extension: string;
}) {
  if (data.err == null) {
    const imageFile = await readFile(
      path.resolve(
        data.filePath,
        `${data.extension}/${data.size}.${data.extension}`,
      ),
    );

    const resizedS3Path = `resized/${data.file.id}/${data.extension}/${data.size}.${data.extension}`;

    const putResponse = await s3Client.putObject(
      env.S3_BUCKET_NAME,
      resizedS3Path,
      imageFile,
    );

    if (putResponse.etag) {
      await db.downscaledImage.create({
        data: {
          bucket: env.S3_BUCKET_NAME,
          fileName: resizedS3Path,
          resolution: data.size,
          size: data.info.size,
          file: { connect: { id: data.file.id } },
        },
      });
    }
  } else {
    console.log(data.err);
  }
}
