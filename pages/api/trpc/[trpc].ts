import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { randomUUID } from "crypto";
import { z } from "zod";
import Pusher from "pusher";
import { getServerConfig } from "../../../utils/config";
import {
  Voting,
  VotingOption,
  votingUpdated,
} from "../../../utils/pusherEvents";

const config = getServerConfig();
const pusher = new Pusher({
  appId: config.pusher.appId,
  key: config.pusher.appKey,
  secret: config.pusher.appSecret,
  cluster: config.pusher.cluster,
  useTLS: true,
});

const updateVoting = async (
  id: string,
  voting: Partial<Omit<Voting, "id">>
) => {
  const channel = `cache-${id}`;
  const currentVoting: Partial<Voting> = await pusher
    .get({
      path: `/channels/${channel}`,
      params: { info: "cache" },
    })
    .then((res) =>
      res.status != 200
        ? Promise.reject(`unable to get cache for ${channel}`)
        : res
    )
    .then((res) => res.json())
    .then((body) => {
      console.log(body);
      return body.cache;
    })
    .then((cache) => (!!cache ? JSON.parse(cache.data) : {}));

  return pusher.trigger(channel, votingUpdated, {
    ...currentVoting,
    ...voting,
    options: (currentVoting.options ?? []).concat(voting.options ?? []),
    id,
  } as Voting);
};

export const appRouter = trpc
  .router()
  .mutation("createVoting", {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input }) {
      const id = randomUUID();

      await updateVoting(id, {
        name: input.name,
        options: [],
      });

      return {
        id,
      };
    },
  })
  .mutation("addOptionToVoting", {
    input: z.object({
      votingId: z.string(),
      optionName: z.string(),
    }),
    resolve({ input }) {
      const option: VotingOption = {
        id: randomUUID(),
        name: input.optionName,
      };

      updateVoting(input.votingId, { options: [option] });
    },
  });

export type AppRouter = typeof appRouter;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
