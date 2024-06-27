import { postRouter } from "@/server/api/routers/post";
import { createTRPCRouter } from "@/server/api/trpc";
import { storageRouter } from "./routers/storage";
import { photoRouter } from "./routers/photo";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  storage: storageRouter,
  photo: photoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
