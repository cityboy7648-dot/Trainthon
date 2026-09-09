# AGENTS

코딩 에이전트용.

- 제품: `SPEC.md`
- 구현: `IMPLEMENTATION.md`
- 개요: `README.md`

## 시작 전에

1. `SPEC.md`와 `IMPLEMENTATION.md`를 읽는다.
2. 제품 범위를 `SPEC.md` 밖으로 넓히지 않는다.
3. 구현 상세는 `IMPLEMENTATION.md`에 있는 것만 따른다. 비어 있으면 추측해서 채우지 않는다.

## 이 레포 규칙

- 해커톤. 데모 한 줄이 우선이다.
- GitHub public. 키, 토큰, 개인정보를 커밋하지 않는다.
- 문서, UI 카피, 커밋, PR에 미사여구를 넣지 않는다.
- 스펙에 없는 기능을 추가하지 않는다.

## 코드

- 변경은 요청된 범위만.
- 생성 API 키는 환경변수. `.env.example`에는 이름만.
- 사이트 수집/생성 실패를 숨기지 않는다.

## 하지 말 것

- `SPEC.md`에 구현 상세를 적기
- `IMPLEMENTATION.md`가 비어 있는데 스택/포맷/API를 확정으로 코드에 넣기
- README를 랜딩 페이지처럼 다시 쓰기
- 관련 없는 리팩터
