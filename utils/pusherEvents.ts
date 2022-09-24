export interface Voting {
  id: string;
  name: string;
  showResult: boolean;
  options: VotingOption[];
}

export interface VotingOption {
  id: string;
  name: string;
  votes: ClientVote[];
}

export interface ClientVote {
  clientId: string;
  clientName: string;
}

export const votingUpdated = "votingUpdated";
