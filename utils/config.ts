const getEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw Error(`No env variable ${name}`);
  }

  return value;
};

const assertPresence = (value?: string) => {
  if (!value) {
    throw Error("missing value");
  }
  return value;
};

export const getClientConfig = () => ({
  pusher: {
    appKey: assertPresence(process.env.NEXT_PUBLIC_PUSHER_APP_KEY),
    cluster: assertPresence(process.env.NEXT_PUBLIC_PUSHER_CLUSTER),
  },
});

export const getServerConfig = () => ({
  pusher: {
    appId: getEnv("PUSHER_APP_ID"),
    appSecret: getEnv("PUSHER_APP_SECRET"),
    appKey: getEnv("NEXT_PUBLIC_PUSHER_APP_KEY"),
    cluster: getEnv("NEXT_PUBLIC_PUSHER_CLUSTER"),
  },
});
