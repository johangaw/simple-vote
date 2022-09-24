import { useRouter } from "next/router";
import { FC, useEffect, useState } from "react";
import Pusher from "pusher-js";
import { getClientConfig } from "../../utils/config";
import { Voting, VotingOption, votingUpdated } from "../../utils/pusherEvents";
import { trpc } from "../../utils/trpc";

interface VotingPageProps {}

const useVoting = (votingId: string) => {
  const [voting, setVoting] = useState<Voting | null>(null);

  useEffect(() => {
    const config = getClientConfig();
    const pusher = new Pusher(config.pusher.appKey, {
      cluster: config.pusher.cluster,
    });

    const channel = pusher.subscribe(`cache-${votingId}`);

    channel.bind(votingUpdated, (data: Voting) => {
      setVoting(data);
    });
  }, [votingId]);

  return voting;
};

const VotingPage: FC<VotingPageProps> = () => {
  const router = useRouter();
  const votingId = router.query.votingId as string;
  const voting = useVoting(votingId);
  const addOptionToVoting = trpc.useMutation(["addOptionToVoting"]);

  if (!voting) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
      <h1>{voting.name}</h1>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const optionName = (ev.target as HTMLFormElement).optionName.value;
          addOptionToVoting.mutate({ optionName, votingId });
        }}
      >
        <label>
          Option name
          <input name="optionName" />
        </label>
        <button>Add</button>
      </form>
      <div>
        {voting.options.map((opt) => (
          <Option key={opt.id} option={opt} />
        ))}
      </div>
    </>
  );
};

const Option: FC<{ option: VotingOption }> = ({ option }) => (
  <div>
    <h3>{option.name}</h3>
  </div>
);

export default VotingPage;
