import type { NextPage } from "next";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const createVoting = trpc.useMutation(["createVoting"]);
  const router = useRouter();

  return (
    <>
      <h1>Create a new Voting</h1>
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
    </>
  );
};

export default Home;
