import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { createBucketIfNotExists, s3Client } from "@/utils/minio";
import { File } from "@prisma/client";
import { env } from "@/env";
import { resizeS3Upload } from "@/utils/photos";
import { BucketItemStat } from "minio";

export const storageRouter = createTRPCRouter({
  createPresignedUrlToUpload: publicProcedure
    // .meta({
    //   openapi: { method: "GET", path: "/s3/presignedUrl", tags: ["test"] },
    // })
    .input(
      z.object({
        fileName: z.string(),
        expiry: z.number().default(60 * 60),
        orientation: z.enum(["portrait", "landscape", "square"]),
      }),
    )
    .output(z.object({ url: z.string(), id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await createBucketIfNotExists(env.S3_BUCKET_NAME);

      const fileUpload = await ctx.db.file.create({
        data: {
          bucket: env.S3_BUCKET_NAME,
          status: "ready",
          originalName: input.fileName,
          size: -1,
          fileName: "",
          orientation: input.orientation,
          etag: "",
        },
      });

      const presignedUrl = await s3Client.presignedPutObject(
        env.S3_BUCKET_NAME,
        `uploads/${fileUpload.id}/original`,
        input.expiry,
      );

      return {
        url: presignedUrl,
        id: fileUpload.id,
      };
    }),
  updateFileOnceUploaded: publicProcedure
    .input(
      z.object({
        success: z.boolean(),
        size: z.number().default(0),
        id: z.string(),
      }),
    )
    .output(z.object({ ok: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      let s3Stat: BucketItemStat | undefined = undefined;

      if (input.success) {
        s3Stat = await s3Client.statObject(
          env.S3_BUCKET_NAME,
          `uploads/${input.id}/original`,
        );
      }

      await ctx.db.file.update({
        where: {
          id: input.id,
        },
        data: {
          fileName: `uploads/${input.id}/original`,
          status: input.success ? "uploaded" : "failed",
          size: s3Stat ? s3Stat.size : -1,
          etag: s3Stat?.etag,
        },
      });

      if (input.success) {
        resizeS3Upload(input.id);
      }

      return {
        ok: true,
      };
    }),
  fetchFiles: publicProcedure
    .input(z.any())
    .output(z.array(z.custom<File>()))
    .query(async ({ input, ctx }) => {
      const photos = await ctx.db.file.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      return photos;
    }),
  getPresignedUrlToView: publicProcedure
    .input(z.object({ fileId: z.string() }))
    .output(z.object({ ok: z.boolean(), url: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const file = await ctx.db.file.findUnique({
        where: {
          id: input.fileId,
        },
      });

      if (file == null) {
        return {
          ok: false,
        };
      }

      const presignedUrl = await s3Client.presignedGetObject(
        file.bucket,
        file.fileName,
        60 * 60,
      );

      return {
        ok: true,
        url: presignedUrl,
      };
    }),
});
