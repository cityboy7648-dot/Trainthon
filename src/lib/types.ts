export type SessionUser = {
  name: string;
  email: string;
};

export type NavUserProps = {
  user: SessionUser;
};

export type RecentItem = {
  id: string;
  name: string;
  assetCount: number;
  updatedAt: string;
};
