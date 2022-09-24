export interface Voting {
  id: string;
  name: string;
  options: VotingOption[];
}

export interface VotingOption {
  id: string;
  name: string;
}

export const votingUpdated = "votingUpdated";
