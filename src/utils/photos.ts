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

  const presignedUrl = await s3Client.presignedGetObject(
    file.bucket,
    file.fileName,
    60 * 60,
  );

  const fileResponse = await fetch(presignedUrl);

  if (!fileResponse.body) {
    return {
      ok: false,
    };
  }

  if (!existsSync(tempPath)) await mkdir(tempPath);
  if (!existsSync(filePath)) await mkdir(filePath);

  const originalDestination = path.resolve(filePath, "original");

  const fileStream = createWriteStream(originalDestination, { flags: "wx" });

  await finished(
    Readable.fromWeb(fileResponse.body as ReadableStream<any>).pipe(fileStream),
  );

  if (!existsSync(`${filePath}/png`)) await mkdir(`${filePath}/png`);
  if (!existsSync(`${filePath}/webp`)) await mkdir(`${filePath}/webp`);

  // [128].map((size) => {
  [128, 256, 512, 1024].map((size) => {
    sharp(originalDestination)
      .resize(size, size, { fit: "inside" })
      .keepExif()
      .png()
      .toFile(path.resolve(filePath, `png/${size}.png`), async (err, info) => {
        uploadAndSave({
          err,
          info,
          file,
          filePath,
          size,
          extension: "png",
        });
      })
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
      });
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
  console.log(`Attempting to upload ${data.filePath}`);

  if (data.err == null) {
    console.log("No apparent error in image conversion");
    const imageFile = await readFile(
      path.resolve(
        data.filePath,
        `${data.extension}/${data.size}.${data.extension}`,
      ),
    );

    const resizedS3Path = `resized/${data.file.id}/${data.extension}/${data.size}.${data.extension}`;

    const presignedPutUrl = await s3Client.presignedPutObject(
      env.S3_BUCKET_NAME,
      resizedS3Path,
      60 * 60,
    );

    const putResponse = await fetch(presignedPutUrl, {
      method: "PUT",
      headers: {
        "Content-Type": `image/${data.extension}`,
      },
      body: imageFile,
    });

    if (putResponse.status == 200) {
      const presignedGetUrl = await s3Client.presignedGetObject(
        env.S3_BUCKET_NAME,
        resizedS3Path,
        60 * 60,
      );

      await db.downscaledImage.create({
        data: {
          bucket: env.S3_BUCKET_NAME,
          fileName: resizedS3Path,
          presignedUrl: presignedGetUrl,
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
