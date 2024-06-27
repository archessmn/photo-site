import { string, z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { createBucketIfNotExists, s3Client } from "@/utils/minio";
import { File } from "@prisma/client";
import { env } from "@/env";
import { resizeS3Upload } from "@/utils/photos";

export const photoRouter = createTRPCRouter({
  getPhotoPresignedUrl: publicProcedure
    .input(
      z.object({
        type: z.string().optional().nullable(),
        size: z.string().optional().nullable(),
        fileId: z.string(),
      }),
    )
    .output(z.object({ ok: z.boolean(), url: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const photo = await ctx.db.file.findUnique({
        where: {
          id: input.fileId,
        },
        include: {
          downscaledImages: {
            orderBy: {
              resolution: "desc",
            },
          },
        },
      });

      if (!photo) {
        return { ok: false };
      }

      const type = input.type ?? "original";
      let size = Number(input.size);
      size = isNaN(size) || size <= 128 ? 128 : size;

      let presignedGetUrl: string;

      if (type == "original") {
        presignedGetUrl = await s3Client.presignedGetObject(
          photo.bucket,
          photo.fileName,
          60 * 60,
        );
      } else {
        console.log(photo.downscaledImages);
        console.log(type);
        console.log(size);

        const correctDownscale = photo.downscaledImages.find(
          (entry) => entry.fileName.endsWith(type) && entry.resolution <= size,
        );

        console.log(correctDownscale);

        if (!correctDownscale) {
          presignedGetUrl = await s3Client.presignedGetObject(
            photo.bucket,
            photo.fileName,
            60 * 60,
          );
        } else {
          presignedGetUrl = await s3Client.presignedGetObject(
            correctDownscale.bucket,
            correctDownscale.fileName,
            60 * 60,
          );
        }
      }

      return {
        ok: true,
        url: presignedGetUrl,
      };
    }),
});