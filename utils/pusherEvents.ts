export interface Voting {
  id: string;
  name: string;
  options: VotingOption[];
}

export interface VotingOption {
  id: string;
  name: string;
  votes: string[];
}

export const votingUpdated = "votingUpdated";
