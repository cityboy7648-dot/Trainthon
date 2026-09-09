// MOCK: 예시 데이터. 서버 연결 전 임시.
import type { CampaignPreview, CreatedCampaignPreview } from "@/lib/types";

// 피그마의 ‘캠페인 후보군 V2 — 일정형’에 적힌 일정만 사용한다.
export const mockCampaigns: CampaignPreview[] = [
  {
    key: "brand-awareness",
    name: "7일 브랜드 각인",
    goal: "브랜드 인지와 기억",
    duration_days: 7,
    channels: ["Instagram", "TikTok"],
    image: "/mock/campaigns/campaign-1.png",
    schedule: [
      { day: 1, channel: "Instagram", format: "Reel", purpose: "브랜드가 존재하는 이유" },
      { day: 2, channel: "Instagram", format: "Story", purpose: "브랜드 한눈에 보기" },
      { day: 3, channel: "Instagram", format: "Carousel", purpose: "핵심 가치 3가지" },
      { day: 5, channel: "Instagram · TikTok", format: "Reel", purpose: "브랜드 무드와 대표 장면" },
      { day: 7, channel: "Instagram", format: "Feed", purpose: "대표 비주얼과 브랜드 메시지" },
    ],
  },
  {
    key: "product-discovery",
    name: "7일 제품·서비스 발견",
    goal: "제공 가치 이해와 관심 유도",
    duration_days: 7,
    channels: ["Instagram", "TikTok"],
    image: "/mock/campaigns/campaign-2.png",
    schedule: [
      { day: 1, channel: "Instagram", format: "Reel", purpose: "티저" },
      { day: 2, channel: "Instagram", format: "Story", purpose: "고객 문제 투표" },
      { day: 3, channel: "Instagram", format: "Carousel", purpose: "문제와 해결 방식" },
      { day: 5, channel: "Instagram", format: "Feed", purpose: "대표 제품·기능·서비스" },
      { day: 7, channel: "Instagram · TikTok", format: "Reel", purpose: "핵심 효용과 CTA" },
    ],
  },
  {
    key: "engagement",
    name: "7일 참여 유도",
    goal: "댓글·투표·저장·공유 유도",
    duration_days: 7,
    channels: ["Instagram"],
    image: "/mock/campaigns/campaign-3.png",
    schedule: [
      { day: 1, channel: "Instagram", format: "Reel", purpose: "고객 공감 상황" },
      { day: 2, channel: "Instagram", format: "Story", purpose: "투표" },
      { day: 4, channel: "Instagram", format: "Carousel", purpose: "저장할 만한 팁·체크리스트" },
      { day: 5, channel: "Instagram", format: "Story", purpose: "질문 받기" },
      { day: 7, channel: "Instagram", format: "Feed", purpose: "의견을 묻는 게시물" },
    ],
  },
];

export const mockCreatedCampaigns: CreatedCampaignPreview[] = [
  {
    id: "campaign-brand-awareness-autumn",
    status: "processing",
    campaign: mockCampaigns[0]!,
  },
  {
    id: "campaign-product-discovery-launch",
    status: "processing",
    campaign: mockCampaigns[1]!,
  },
  {
    id: "campaign-engagement-week",
    status: "processing",
    campaign: mockCampaigns[2]!,
  },
  {
    id: "campaign-brand-awareness-summer",
    status: "done",
    campaign: mockCampaigns[0]!,
  },
  {
    id: "campaign-product-discovery-spring",
    status: "done",
    campaign: mockCampaigns[1]!,
  },
  {
    id: "campaign-brand-awareness-draft",
    status: "draft",
    campaign: mockCampaigns[0]!,
  },
];

export const mockRecentTasks = mockCreatedCampaigns
  .filter((item) => item.status === "done")
  .flatMap(({ id, campaign }) =>
    campaign.schedule
      .slice(-2)
      .reverse()
      .map((task) => ({
        ...task,
        id: `${id}-${task.day}`,
        campaignName: campaign.name,
        campaignImage: campaign.image,
      })),
  );
