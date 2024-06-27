import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { createBucketIfNotExists, s3Client } from "@/utils/minio";
import { File } from "@prisma/client";
import { env } from "@/env";

export const storageRouter = createTRPCRouter({
  createPresignedUrlToUpload: publicProcedure
    // .meta({
    //   openapi: { method: "GET", path: "/s3/presignedUrl", tags: ["test"] },
    // })
    .input(
      z.object({ fileName: z.string(), expiry: z.number().default(60 * 60) }),
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
        },
      });

      const presignedUrl = await s3Client.presignedPutObject(
        env.S3_BUCKET_NAME,
        `uploads/${fileUpload.id}`,
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
      await ctx.db.file.update({
        where: {
          id: input.id,
        },
        data: {
          fileName: `uploads/${input.id}`,
          status: input.success ? "uploaded" : "failed",
          size: input.success ? input.size : -1,
        },
      });

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
});
