import { useRouter } from "next/router";
import Pusher from "pusher-js";
import { FC, useEffect, useState } from "react";
import { getClientConfig } from "../../utils/config";
import { Voting, VotingOption, votingUpdated } from "../../utils/pusherEvents";
import { trpc } from "../../utils/trpc";
import QRCode from "react-qr-code";

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

const useClientId = () => {
  const storageKey = "simple-vote-client-id";

  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let clientId = localStorage.getItem(storageKey);
    if (!clientId) {
      clientId = window.crypto.randomUUID();
      localStorage.setItem(storageKey, clientId);
    }
    setClientId(clientId);
  }, []);

  return clientId;
};

const VotingPage: FC<VotingPageProps> = () => {
  const router = useRouter();
  const clientId = useClientId();
  const votingId = router.query.votingId as string;
  const voting = useVoting(votingId);
  const addOptionToVoting = trpc.useMutation(["addOptionToVoting"]);
  const selectVote = trpc.useMutation(["selectVote"]);
  const toggleShowVotes = trpc.useMutation(["toggleShowVotes"]);

  if (!voting || !clientId) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
      <h1>{voting.name}</h1>
      <p>
        <div
          style={{
            height: "auto",
            maxWidth: 100,
            width: "100%",
          }}
        >
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={`${
              process.env.NEXT_PUBLIC_VERCEL_URL ?? "http://localhost:3000"
            }/voting/${votingId}`}
            viewBox={`0 0 256 256`}
          />
        </div>
      </p>

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
            selected={opt.votes.includes(clientId)}
            select={() => {
              selectVote.mutate({
                clientId,
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
  select: () => void;
  selected: boolean;
}> = ({ option, select, showVotes, selected }) => (
  <div>
    <h3>
      {option.name}
      {showVotes ? ` (${option.votes.length})` : null}
    </h3>
    <button onClick={select} disabled={selected}>
      Select
    </button>
  </div>
);

export default VotingPage;
