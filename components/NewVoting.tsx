import { FC } from "react";
import { trpc } from "../utils/trpc";

interface NewVotingProps {}

export const NewVoting: FC<NewVotingProps> = () => {
  const createVoting = trpc.useMutation(["createVoting"]);

  return (
    <form
      onSubmit={async (ev) => {
        ev.preventDefault();
        const name = (ev.target as HTMLFormElement).votingName.value;
        const voting = await createVoting.mutateAsync({ name });
      }}
    >
      <input name="votingName" />
      <button>Create</button>
    </form>
  );
};
