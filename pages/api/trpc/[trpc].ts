import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { randomUUID } from "crypto";
import { string } from "prop-types";
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
        votes: [],
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
  })
  .mutation("vote", {
    input: z.object({
      votingId: z.string(),
      optionId: z.string(),
      clientId: z.string(),
    }),
    async resolve({ input }) {
      const voting = await getCurrentVoting(input.votingId);

      if (!voting) {
        throw new trpc.TRPCError({
          code: "NOT_FOUND",
          message: "no voting found",
        });
      }

      const option = voting.options.find((o) => o.id === input.optionId);
      if (!option) {
        throw new trpc.TRPCError({
          code: "NOT_FOUND",
          message: "no option found",
        });
      }

      const newVoting = {
        ...voting,
        options: voting.options.map((opt) =>
          opt === option
            ? {
                ...option,
                votes: Array.from(new Set(option.votes.concat(input.clientId))),
              }
            : opt
        ),
      };
      await updateVoting(newVoting);

      return newVoting;
    },
  })
  .mutation("unVote", {
    input: z.object({
      votingId: z.string(),
      optionId: z.string(),
      clientId: z.string(),
    }),
    async resolve({ input }) {
      const voting = await getCurrentVoting(input.votingId);

      if (!voting) {
        throw new trpc.TRPCError({
          code: "NOT_FOUND",
          message: "no voting found",
        });
      }

      const option = voting.options.find((o) => o.id === input.optionId);
      if (!option) {
        throw new trpc.TRPCError({
          code: "NOT_FOUND",
          message: "no option found",
        });
      }

      const newVoting = {
        ...voting,
        options: voting.options.map((opt) =>
          opt === option
            ? {
                ...option,
                votes: option.votes.filter(
                  (clientId) => clientId !== input.clientId
                ),
              }
            : opt
        ),
      };
      await updateVoting(newVoting);

      return newVoting;
    },
  });

export type AppRouter = typeof appRouter;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
