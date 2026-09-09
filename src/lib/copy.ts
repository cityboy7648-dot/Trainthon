export const copy = {
  app: {
    name: "Trainthon",
    description:
      "사이트 URL을 넣으면 브랜드를 읽고, 방향을 고르면 브랜드 에셋 / 인스타 홍보물 / AI 영상을 만든다.",
  },
  nav: {
    home: "홈",
    brands: "브랜드",
    campaigns: "캠페인",
    assets: "결과물",
    new: "신규",
  },
  sidebar: {
    onboarding: (done: number, total: number) => `시작 가이드 ${done}/${total}`,
    support: "문의하기",
    account: "계정 설정",
    signOut: "로그아웃",
    openMenu: "메뉴 열기",
  },
  home: {
    greeting: (name: string) => `${name}님, 어떤 사이트를 알릴까요?`,
    urlPlaceholder: "사이트 URL을 붙여 넣으세요",
    urlHint: "예: https://example.com",
    submit: "분석 시작",
    actions: {
      analyze: "브랜드 분석",
      campaign: "캠페인 만들기",
      assets: "결과물 보기",
    },
    recent: {
      brands: "최근 브랜드",
      campaigns: "최근 캠페인",
      viewAll: "전체 보기",
      assetCount: (n: number) => `결과물 ${n}개`,
    },
  },
  brands: {
    title: "브랜드",
    emptyTitle: "아직 분석한 브랜드가 없다",
    emptyDescription: "홈에서 사이트 URL을 넣으면 여기에 쌓인다.",
  },
  campaigns: {
    title: "캠페인",
    emptyTitle: "아직 만든 캠페인이 없다",
    emptyDescription: "브랜드를 분석한 뒤 캠페인을 고르면 여기에 쌓인다.",
  },
  assets: {
    title: "결과물",
    emptyTitle: "아직 결과물이 없다",
    emptyDescription: "캠페인을 실행하면 브랜드 에셋, 피드, 영상이 여기에 쌓인다.",
  },
  common: {
    retry: "다시 시도",
    goHome: "홈으로",
  },
  time: {
    justNow: "방금",
  },
  dev: {
    mockBadge: "MOCK 데이터",
  },
} as const;
