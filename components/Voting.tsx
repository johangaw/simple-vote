import { FC } from "react";

interface VotingProps {
  votingId: string;
}

export const Voting: FC<VotingProps> = ({ votingId }) => {
  return <h1>{votingId}</h1>;
};
