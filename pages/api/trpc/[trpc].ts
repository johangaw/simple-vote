import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { randomUUID } from "crypto";
import { z } from "zod";
import Pusher from "pusher";
import { getServerConfig } from "../../../utils/config";
import { Voting, votingUpdated } from "../../../utils/pusherEvents";

const config = getServerConfig();
const pusher = new Pusher({
  appId: config.pusher.appId,
  key: config.pusher.appKey,
  secret: config.pusher.appSecret,
  cluster: config.pusher.cluster,
  useTLS: true,
});

export const appRouter = trpc.router().mutation("createVoting", {
  input: z.object({
    name: z.string(),
  }),
  resolve({ input }) {
    const id = randomUUID();
    const channel = `cache-${id}`;

    pusher.trigger(channel, votingUpdated, {
      id,
      name: input.name,
    } as Voting);

    return {
      id,
      channel,
    };
  },
});

export type AppRouter = typeof appRouter;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
