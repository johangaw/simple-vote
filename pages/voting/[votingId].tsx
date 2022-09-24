import { useRouter } from "next/router";
import { FC } from "react";
import { Voting } from "../../components/Voting";

interface VotingPageProps {}

const VotingPage: FC<VotingPageProps> = () => {
  const router = useRouter();
  const votingId = router.query.votingId as string;

  return <Voting votingId={votingId} />;
};

export default VotingPage;
