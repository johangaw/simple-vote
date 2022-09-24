import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { randomUUID } from "crypto";
import { z } from "zod";
import { updateVoting, getCurrentVoting } from "../../../server/pusher";
import { VotingOption } from "../../../utils/pusherEvents";

export const appRouter = trpc
  .router()
  .mutation("createVoting", {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ input }) {
      const id = randomUUID();

      await updateVoting({
        id,
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
    async resolve({ input }) {
      const option: VotingOption = {
        id: randomUUID(),
        name: input.optionName,
      };

      const currentVoting = await getCurrentVoting(input.votingId);

      if (!currentVoting) {
        throw Error("Could not find voting value");
      }

      const newVoting = {
        ...currentVoting,
        options: currentVoting.options.concat(option),
      };
      updateVoting(newVoting);

      return newVoting;
    },
  });

export type AppRouter = typeof appRouter;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
