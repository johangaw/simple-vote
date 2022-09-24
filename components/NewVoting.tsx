import { useRouter } from "next/router";
import { FC } from "react";
import { trpc } from "../utils/trpc";

interface NewVotingProps {}

export const NewVoting: FC<NewVotingProps> = () => {
  const createVoting = trpc.useMutation(["createVoting"]);
  const router = useRouter();

  return (
    <form
      onSubmit={async (ev) => {
        ev.preventDefault();
        const name = (ev.target as HTMLFormElement).votingName.value;
        const voting = await createVoting.mutateAsync({ name });

        router.push(`voting/${voting.id}`);
      }}
    >
      <input name="votingName" />
      <button>Create</button>
    </form>
  );
};
