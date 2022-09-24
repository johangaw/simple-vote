import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { randomUUID } from "crypto";
import { z } from "zod";
import { updateVoting, getCurrentVoting } from "../../../server/pusher";
import { ClientVote, Voting, VotingOption } from "../../../utils/pusherEvents";

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
        showResult: false,
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
      await updateVoting(newVoting);

      return newVoting;
    },
  })
  .mutation("selectVote", {
    input: z.object({
      votingId: z.string(),
      optionId: z.string(),
      clientId: z.string(),
      clientName: z.string(),
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

      const onlyOthers = (vote: ClientVote) => vote.clientId !== input.clientId;

      const newVoting = {
        ...voting,
        options: voting.options.map((opt) =>
          opt.id === option.id
            ? {
                ...opt,
                votes: opt.votes.filter(onlyOthers).concat({
                  clientId: input.clientId,
                  clientName: input.clientName,
                }),
              }
            : {
                ...opt,
                votes: opt.votes.filter(onlyOthers),
              }
        ),
      };
      await updateVoting(newVoting);

      return newVoting;
    },
  })
  .mutation("toggleShowVotes", {
    input: z.object({
      votingId: z.string(),
    }),
    async resolve({ input }) {
      const voting = await getCurrentVoting(input.votingId);

      if (!voting) {
        throw new trpc.TRPCError({
          code: "NOT_FOUND",
          message: "no voting found",
        });
      }

      const newVoting = {
        ...voting,
        showResult: !voting.showResult,
      };
      await updateVoting(newVoting);

      return newVoting;
    },
  })
  .mutation("updateName", {
    input: z.object({
      votingId: z.string(),
      clientId: z.string(),
      clientName: z.string(),
    }),
    async resolve({ input }) {
      const voting = await getCurrentVoting(input.votingId);

      if (!voting) {
        throw new trpc.TRPCError({
          code: "NOT_FOUND",
          message: "no voting found",
        });
      }

      const newVoting: Voting = {
        ...voting,
        options: voting.options.map((o) => ({
          ...o,
          votes: o.votes.map((v) =>
            v.clientId === input.clientId
              ? { ...v, clientName: input.clientName }
              : v
          ),
        })),
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
