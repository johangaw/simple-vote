import { useRouter } from "next/router";
import { FC, useEffect, useState } from "react";
import Pusher from "pusher-js";
import { getClientConfig } from "../../utils/config";
import { Voting, votingUpdated } from "../../utils/pusherEvents";

interface VotingPageProps {}

const useVoting = (votingId: string) => {
  const [voting, setVoting] = useState<Voting | null>(null);

  useEffect(() => {
    const config = getClientConfig();
    const pusher = new Pusher(config.pusher.appKey, {
      cluster: config.pusher.cluster,
    });

    const channel = pusher.subscribe(votingId);

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

  if (!voting) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
      <h1>{voting.name}</h1>
    </>
  );
};

export default VotingPage;
