// MOCK: 예시 데이터. 서버 연결 전 임시.
import type { RecentItem } from "@/lib/types";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const mockRecentBrands: RecentItem[] = [
  { id: "b1", name: "느린 오후", assetCount: 6, updatedAt: minutesAgo(2) },
  { id: "b2", name: "모노 스튜디오", assetCount: 1, updatedAt: minutesAgo(60 * 26) },
  { id: "b3", name: "그린 테이블", assetCount: 0, updatedAt: minutesAgo(60 * 30) },
];

export const mockRecentCampaigns: RecentItem[] = [
  { id: "c1", name: "느린 오후 · 인스타 첫 세팅", assetCount: 6, updatedAt: minutesAgo(2) },
  { id: "c2", name: "모노 스튜디오 · 신제품 소개", assetCount: 1, updatedAt: minutesAgo(60 * 26) },
];
