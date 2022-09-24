import { useRouter } from "next/router";
import Pusher from "pusher-js";
import { FC, useCallback, useEffect, useState } from "react";
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

const useClient = () => {
  const idStorageKey = "simple-vote-client-id";
  const nameStorageKey = "simple-vote-client-name";

  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    let clientId = localStorage.getItem(idStorageKey);
    if (!clientId) {
      clientId = window.crypto.randomUUID();
      localStorage.setItem(idStorageKey, clientId);
    }
    setClientId(clientId);

    setClientName(localStorage.getItem(nameStorageKey) ?? "");
  }, []);

  const storeClientName = useCallback((newName: string) => {
    localStorage.setItem(nameStorageKey, newName);
    setClientName(newName);
  }, []);

  return { clientId, clientName, setClientName: storeClientName };
};

const VotingPage: FC<VotingPageProps> = () => {
  const router = useRouter();
  const { clientId, clientName, setClientName } = useClient();
  const votingId = router.query.votingId as string;
  const voting = useVoting(votingId);
  const addOptionToVoting = trpc.useMutation(["addOptionToVoting"]);
  const selectVote = trpc.useMutation(["selectVote"]);
  const toggleShowVotes = trpc.useMutation(["toggleShowVotes"]);
  const updateName = trpc.useMutation(["updateName"]);

  if (!voting || !clientId) {
    return <h1>Loading...</h1>;
  }

  if (!clientName) {
    return (
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const clientName = (ev.target as HTMLFormElement).clientName.value;
          setClientName(clientName);
          updateName.mutate({ clientId, clientName, votingId });
        }}
      >
        <label>
          What&apos;s your name?
          <br />
          <input name="clientName" />
        </label>
        <button>Submit</button>
      </form>
    );
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
              process.env.NEXT_PUBLIC_HOST_URL ?? "http://localhost:3000"
            }/voting/${votingId}`}
            viewBox={`0 0 256 256`}
          />
        </div>
      </p>
      <p>
        <button
          onClick={() => {
            toggleShowVotes.mutate({ votingId });
          }}
        >
          {voting.showResult ? "Hide Votes" : "Show Votes"}
        </button>
        <button onClick={() => setClientName("")}>Change name</button>
      </p>

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const optionName = (ev.target as HTMLFormElement).optionName.value;
          addOptionToVoting.mutate({ optionName, votingId });
        }}
      >
        <label>
          New option:
          <br />
          <input name="optionName" />
        </label>
        <button>Add</button>
      </form>
      <div style={{ paddingTop: "24px" }}>
        {voting.options.map((opt) => (
          <Option
            key={opt.id}
            showVotes={voting.showResult}
            option={opt}
            selected={opt.votes.map((cv) => cv.clientId).includes(clientId)}
            select={() => {
              selectVote.mutate({
                clientId,
                clientName,
                optionId: opt.id,
                votingId,
              });
            }}
          />
        ))}
      </div>
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
    <button
      onClick={select}
      style={{ background: "transparent", border: "none", cursor: "pointer" }}
    >
      <h2 style={{ textDecoration: selected ? "underline" : "none" }}>
        {option.name}
        {showVotes ? ` (${option.votes.length})` : null}
      </h2>
    </button>
    {showVotes && (
      <ul style={{ margin: 0 }}>
        {option.votes.map((v, i) => (
          <li key={i}>{v.clientName}</li>
        ))}
      </ul>
    )}
  </div>
);

export default VotingPage;
