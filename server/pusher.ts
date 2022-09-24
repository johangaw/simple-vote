import Pusher from "pusher";
import { getServerConfig } from "../utils/config";
import { Voting, votingUpdated } from "../utils/pusherEvents";

const config = getServerConfig();
const pusher = new Pusher({
  appId: config.pusher.appId,
  key: config.pusher.appKey,
  secret: config.pusher.appSecret,
  cluster: config.pusher.cluster,
  useTLS: true,
});

const getChannelName = (votingId: string) => `cache-${votingId}`;

export const getCurrentVoting = async (votingId: string) => {
  const channel = getChannelName(votingId);
  return pusher
    .get({
      path: `/channels/${channel}`,
      params: { info: "cache" },
    })
    .then((res) =>
      res.status != 200
        ? Promise.reject(`unable to get cache for ${channel}`)
        : res
    )
    .then((res) => res.json())
    .then((body) => body.cache)
    .then((cache) => (!!cache ? (JSON.parse(cache.data) as Voting) : null));
};

export const updateVoting = async (voting: Voting) => {
  const channel = getChannelName(voting.id);
  return pusher.trigger(channel, votingUpdated, voting);
};
