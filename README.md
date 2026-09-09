# Trainthon

해커톤. GitHub public. PR은 전부 공개 검토된다.

## 무엇을 만드는가

사용자가 자기 브랜드와 상품으로 광고를 만드는 SaaS를 개발한다. 개발 중 만든 광고 예시는 품질 확인용이며, 예시 브랜드의 광고를 대신 제작하는 것이 작업 목표가 아니다.

웹/앱/이커머스 사이트 URL을 넣는다. 사이트의 브랜드를 읽는다. 사용자가 방향을 고른다. 그다음을 만든다.

- 브랜드 에셋
- 인스타에 바로 올릴 수 있는 홍보물
- AI 영상

전부 자동이 아니다. 방향은 사용자가 정한다.

## 플로우

1. 사이트 URL 입력
2. 브랜드 추출
3. 사용자가 방향 선택
4. 산출물 생성

구현 계획: [PLAN.md](docs/PLAN.md)
에이전트 지시: [AGENTS.md](AGENTS.md)

## Figma

- 제품 디자인: [Trainthon 제품 디자인](https://www.figma.com/design/eBAgVuj8yDUEX9zGc6F60s)
- 사용자 흐름: [Trainthon 제품 플로우 FigJam](https://www.figma.com/board/lDjJ4Hm4o5gRf6lOIsMMNx)

## 스킬 명세

여기서 스킬은 Codex나 AI 에이전트용 스킬이 아니다. Trainthon이 수행하는 제품 기능의 이름이다. 각 기능 명세는 `skills/`에 둔다.

- [1번 스킬: 브랜드 정보 수집](skills/01-brand-extraction/README.md)
