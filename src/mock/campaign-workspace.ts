// MOCK: 예시 데이터. 서버 연결 전 임시.
import type { SavedCampaign } from "@/lib/types";

// 관리자에게 저장한 V1 결과의 로컬 미리보기. 배포 화면에는 사용하지 않는다.
export const previewCampaign: SavedCampaign = {
  id: "preview-signature-grid",
  key: "signature_grid",
  name: "시그니처 그리드",
  brand: "havehad",
  status: "done",
  startDate: "2026-09-14",
  posts: [
    {
      id: "preview-9",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-9.png",
      meta: {
        position: 9,
        day: 1,
        format: "feed",
        title: "피드 마무리에서 도시 속 움직임의 여운 생성",
        caption: "도시의 바깥 공기까지 이어지는 하루의 옷.",
      },
    },
    {
      id: "preview-8",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-8.png",
      meta: {
        position: 8,
        day: 2,
        format: "feed",
        title: "셔츠 제품 정보와 컬러 전개 안내",
        caption: "기본 컬러로 준비한 에브리데이 컴포트 셔츠.",
      },
    },
    {
      id: "preview-7",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-7.png",
      meta: {
        position: 7,
        day: 3,
        format: "feed",
        title: "아침 통근자의 표정과 리듬 포착",
        caption: "시작은 조용하게, 움직임은 자연스럽게.",
      },
    },
    {
      id: "preview-6",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-6.png",
      meta: {
        position: 6,
        day: 4,
        format: "feed",
        title: "재킷의 유틸리티 무드 강조",
        caption: "가볍게 걸치고 움직이기 좋은 드리즐러 재킷.",
      },
    },
    {
      id: "preview-5",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-5.png",
      meta: {
        position: 5,
        day: 5,
        format: "feed",
        title: "그리드 중앙에서 브랜드 캠페인 메시지 고정",
        caption: "하루의 속도에 맞춘 도시 생활 복장.",
      },
    },
    {
      id: "preview-4",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-4.png",
      meta: {
        position: 4,
        day: 6,
        format: "feed",
        title: "제품 정보 카드로 피드에 편집감 부여",
        caption: "데일리 유니폼으로 제안하는 시티 워커 셋업.",
      },
    },
    {
      id: "preview-3",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-3.png",
      meta: {
        position: 3,
        day: 7,
        format: "feed",
        title: "강변 이동 장면으로 봄빛과 도시성을 연결",
        caption: "격식과 여유 사이, 오늘의 이동복.",
      },
    },
    {
      id: "preview-2",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-2.png",
      meta: {
        position: 2,
        day: 8,
        format: "feed",
        title: "소재와 실루엣의 차분한 클로즈업",
        caption: "매일 입기 좋은 셔츠의 기본적인 선.",
      },
    },
    {
      id: "preview-1",
      status: "done",
      image_url: "/campaigns/signature-grid/preview/post-1.png",
      meta: {
        position: 1,
        day: 9,
        format: "feed",
        title: "캠페인의 첫인상과 시간대 제시",
        caption: "아침 8시, 각자의 속도로 도시를 시작합니다.",
      },
    },
  ],
};
