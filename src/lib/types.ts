export type SessionUser = {
  name: string;
  email: string;
};

export type OnboardingProgress = {
  done: number;
  total: number;
};

export type RecentItem = {
  id: string;
  name: string;
  assetCount: number;
  updatedAt: string;
};
