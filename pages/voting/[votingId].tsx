import { useRouter } from "next/router";
import Pusher from "pusher-js";
import { FC, useEffect, useState } from "react";
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

    () => channel.unsubscribe();
  }, [votingId]);

  return voting;
};

const getClientId = () => {
  const storageKey = "simple-vote-client-id";

  let clientId = localStorage.getItem(storageKey);
  if (!clientId) {
    clientId = window.crypto.randomUUID();
    localStorage.setItem(storageKey, clientId);
  }

  return clientId;
};

const VotingPage: FC<VotingPageProps> = () => {
  const router = useRouter();
  const votingId = router.query.votingId as string;
  const voting = useVoting(votingId);
  const addOptionToVoting = trpc.useMutation(["addOptionToVoting"]);
  const vote = trpc.useMutation(["vote"]);
  const unVote = trpc.useMutation(["unVote"]);
  const toggleShowVotes = trpc.useMutation(["toggleShowVotes"]);

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
          Option name:
          <br />
          <input name="optionName" />
        </label>
        <button>Add</button>
      </form>
      <div>
        {voting.options.map((opt) => (
          <Option
            key={opt.id}
            showVotes={voting.showResult}
            option={opt}
            vote={() => {
              vote.mutate({
                clientId: getClientId(),
                optionId: opt.id,
                votingId,
              });
            }}
            unVote={() => {
              unVote.mutate({
                clientId: getClientId(),
                optionId: opt.id,
                votingId,
              });
            }}
          />
        ))}
      </div>
      <p>
        <button
          onClick={() => {
            toggleShowVotes.mutate({ votingId });
          }}
        >
          {voting.showResult ? "Hide Votes" : "Show Votes"}
        </button>
      </p>
    </>
  );
};

const Option: FC<{
  option: VotingOption;
  showVotes: boolean;
  vote: () => void;
  unVote: () => void;
}> = ({ option, vote, unVote, showVotes }) => (
  <div>
    <h3>
      {option.name}
      {showVotes ? ` (${option.votes.length})` : null}
    </h3>
    <button onClick={vote}>Vote</button>
    <button onClick={unVote}>Unvote</button>
  </div>
);

export default VotingPage;
