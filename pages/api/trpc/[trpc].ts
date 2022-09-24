import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { randomUUID } from "crypto";
import { z } from "zod";

export const appRouter = trpc.router().mutation("createVoting", {
  input: z.object({
    name: z.string(),
  }),
  resolve({ input }) {
    const votingId = randomUUID();
    return {
      votingId,
      votingName: input.name,
      votingChannel: votingId,
    };
  },
});

export type AppRouter = typeof appRouter;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
