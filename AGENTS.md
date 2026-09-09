# AGENTS

코딩 에이전트용. 제품이 뭔지는 `README.md`. 어떻게 만드는지는 `PLAN.md`.

## PR

- 시키지 않은 PR을 만들지 않는다.
- 브랜치를 푸시해도 PR은 사용자가 만들라고 할 때만 만든다.
- PR을 머지하지 않는다. 열고 닫는 것도 시킬 때만.
- 만든 PR은 draft로 만든다.
- PR 본문은 바뀐 것만 적는다.

## 시작 전에

1. `README.md`, `PLAN.md`를 읽는다.
2. 제품 범위를 `README.md` 밖으로 넓히지 않는다.
3. 스택, API, 데이터 구조는 `PLAN.md`를 따른다. `PLAN.md`의 "아직 안 정한 것"은 추측해서 코드에 확정으로 넣지 않는다. 물어본다.
4. 작업은 `PLAN.md`의 "구현 순서"대로. 프론트엔드(A) → 백엔드(B) → 연결(C). 한 단계 = 한 브랜치.
5. A 단계는 디자인 레퍼런스를 받은 뒤 시작한다. 레퍼런스 없이 화면을 만들지 않는다. 레퍼런스는 `reference/<화면>/`에 이미지와 `source.txt`(출처 URL)로 둔다. 화면은 그 이미지와 diff가 최소가 되게 만든다.
6. A 단계에서는 Supabase·OpenAI·Higgsfield를 호출하지 않는다. 데이터는 전부 `src/mock/`.

## 이 레포 규칙

- 해커톤. 데모 한 줄이 우선이다.
- GitHub public. 키, 토큰, 개인정보를 커밋하지 않는다.
- 문서, UI 카피, 커밋, PR에 미사여구를 넣지 않는다.
- 스펙에 없는 기능을 추가하지 않는다.

## 코드

- Next.js 16. API가 학습 데이터와 다를 수 있다. 쓰기 전에 `node_modules/next/dist/docs/`를 읽는다. `middleware`는 `proxy`다.
- shadcn/ui는 Base UI 기반. `asChild` 대신 `render`. `Button`을 `Link`로 렌더할 때 `nativeButton={false}`.
- 변경은 요청된 범위만.
- 생성 API 키는 환경변수. `.env.example`에는 이름만.
- 사이트 수집/생성 실패를 숨기지 않는다.
- ESLint + Prettier 기본 설정. 규칙 커스텀 안 한다. 커밋 전 통과.
- 타입은 `src/lib/types.ts` 한 곳. DB 타입은 Supabase에서 생성한 것을 쓴다. `any` 금지.

## 정리 (AI slop 방지)

- 죽은 코드, 안 쓰는 import, 안 쓰는 의존성을 남기지 않는다. 지운다.
- 한 번 쓰는 로직을 유틸/추상화로 빼지 않는다. 두 번 이상 쓸 때 뺀다.
- 코드가 하는 일을 다시 말하는 주석 금지. 주석은 이유와 제약만.
- 파일 하나에 컴포넌트 하나. 이름은 하는 일 그대로. `Wrapper`, `Container`, `Helper`, `Manager` 같은 이름 금지.
- 같은 문제에 두 가지 방식을 섞지 않는다. 이미 있는 패턴을 따른다.
- try/catch로 감싸고 로그만 찍는 코드 금지. 잡으면 사용자에게 보여 주거나 다시 던진다.
- "나중에 필요할지도"로 넣는 옵션, 설정, prop 금지.
- UI: 그라데이션 배경, 이모지 아이콘, 카드 안의 카드, 의미 없는 애니메이션, 뻔한 마케팅 문구 금지.
- 작업 끝에 자기 diff를 다시 읽고 위 항목을 지운 뒤 커밋한다.

## 프론트엔드

### 스택

- Tailwind 하나로. 인라인 style 금지. 색/간격/라운드는 테마 토큰만. 임의 값(`#333`, `[13px]`) 금지. 다크모드 안 함.
- shadcn/ui. 다른 UI 라이브러리 섞지 않는다.
- 전역 상태 라이브러리 안 쓴다. URL이 상태다. 폼은 React 기본 + Server Action.
- `next/image` 사용. 허용 도메인은 Supabase Storage만. 영상은 `<video>`, 자동재생 무음.

### 폴더

```
src/app/            라우트만. 로직 없음
src/components/ui/  shadcn 원본
src/components/     우리 컴포넌트. 화면별 폴더
src/lib/data/       DB 접근
src/lib/providers/  openai.ts, higgsfield.ts
src/lib/agents/     분석·추천 에이전트. <이름>/prompt.ts
src/lib/supabase/   클라이언트 생성. admin.ts는 서버 전용
src/lib/            env.ts, log.ts, types.ts, errors.ts, copy.ts
src/mock/           예시 데이터
src/definitions/    레퍼런스·캠페인 정의
supabase/migrations/ 스키마 변경
```

### 서버/클라이언트 경계

- 기본은 서버 컴포넌트. `'use client'`는 상호작용이 있는 최소 단위에만.
- 데이터 fetch는 서버 컴포넌트 또는 Server Action.
- 클라이언트에서 Supabase를 직접 부르는 건 `assets` 상태 실시간 구독만.

### 서버 데이터와 예시 데이터 구분

- 예시 데이터는 `src/mock/` 한 곳에만 둔다. 다른 곳에 하드코딩된 예시 값을 두지 않는다.
- `src/mock/` 안의 파일은 첫 줄에 `// MOCK: 예시 데이터. 서버 연결 전 임시.`를 쓴다.
- 예시 데이터를 쓰는 컴포넌트는 import 줄에 `// MOCK` 주석을 붙이고, 루트 요소에 `data-source="mock"`을 단다.
- 서버 데이터를 받는 컴포넌트는 루트 요소에 `data-source="server"`를 단다.
- 서버 데이터 접근은 `src/lib/data/`의 함수/훅으로만 한다. 컴포넌트에서 직접 fetch하지 않는다.
- 서버 연결이 끝나면 그 컴포넌트의 `// MOCK` 주석과 `data-source="mock"`을 지운다. 데모 전 `MOCK` 검색 결과는 0이어야 한다.

### 로딩

- 기본 로딩은 스켈레톤. 스피너를 기본으로 쓰지 않는다.
- 서버 데이터를 받는 컴포넌트마다 같은 레이아웃의 스켈레톤을 함께 만든다. 컴포넌트 `X`의 스켈레톤은 `XSkeleton`.
- 라우트 단위는 `loading.tsx`, 컴포넌트 단위는 `Suspense`에 스켈레톤을 넣는다.
- 영상처럼 오래 걸리는 생성은 스켈레톤 위에 상태 문구를 함께 보여 준다.

### 오류

- 오류 표시는 공용 `ErrorState` 컴포넌트 하나로 한다. 각 화면에서 임의로 만들지 않는다.
- 오류 문구는 `src/lib/errors.ts` 한 곳에 모은다. 종류: 네트워크, 인증, 사이트 분석 실패, 생성 실패, 결과 없음.
- `ErrorState`는 디자인에 맞춰 먼저 만들어 둔다. 재시도 액션을 받을 수 있게 한다.
- 실패 원인이 있으면 문구 아래 그대로 보여 준다. 뭉개지 않는다.
- 데이터 0개는 오류가 아니다. 공용 `EmptyState` 하나로 따로 보여 준다.

### 생성 중 화면

- 진행 상태는 `assets.status`로만 판단. 클라이언트 타이머로 추측하지 않는다.
- 완료된 항목부터 즉시 보여 준다.
- 실패한 항목은 그 자리에서 `ErrorState` + 재시도.

### 문구

- UI 문구는 한국어. 컴포넌트에 직접 쓰지 않고 `src/lib/copy.ts`에 모은다.

### 반응형

- 데스크톱 우선. 모바일은 깨지지 않을 정도.
- 인스타 결과물 미리보기는 실제 비율(1:1, 4:5, 9:16) 고정.

### 접근성 최소선

- 버튼은 `<button>`, 링크는 `<a>`. 아이콘만 있는 버튼은 `aria-label`. 이미지는 `alt`.

### 개발용 표시

- mock 여부 배지는 `NODE_ENV=development`에서만 켠다. 배포에는 안 나온다.

## 백엔드

### 스키마

- 테이블은 `PLAN.md`의 "Supabase 테이블"에 있는 것만. 그 표가 스키마의 기준이다.
- 새 테이블·컬럼이 필요하면 코드 전에 `PLAN.md`를 고치는 PR을 먼저. 왜 필요한지 적는다.
- 스키마 변경은 `supabase/migrations/` 파일로만. 대시보드에서 손으로 고치지 않는다. 마이그레이션 하나 = 변경 하나.
- 구조가 안 정해진 값은 새 컬럼 대신 `meta jsonb`에 넣는다. 세 곳 이상에서 쿼리하게 되면 그때 컬럼으로 뺀다.
- 컬럼 삭제·이름 변경 금지. 새로 만들고 옮긴 뒤 다음 PR에서 지운다.
- 모든 테이블 공통: `id uuid`, `created_at`. `user_id`는 `brands`에만. `runs`, `assets`는 join으로 소유자를 찾는다. 같은 값을 두 테이블에 복사하지 않는다.
- 이름: 테이블 복수 snake_case, 컬럼 snake_case, FK는 `<단수>_id`. 상태 컬럼은 `status text` + `check` 제약. Postgres enum 안 쓴다.

### 접근 경계

- DB 접근은 `src/lib/data/` 안에서만. 라우트, 컴포넌트, 에이전트 코드에서 Supabase 클라이언트를 직접 만들지 않는다.
- `service_role` 키는 `src/lib/supabase/admin.ts`에서만. 웹훅·백그라운드 작업에서만 쓴다. 사용자 요청은 anon + RLS.
- RLS는 모든 테이블에 켠다. 정책은 마이그레이션에 같이 들어간다. RLS 없는 테이블은 머지하지 않는다.

### 외부 API

- OpenAI는 `src/lib/providers/openai.ts`, Higgsfield는 `src/lib/providers/higgsfield.ts` 한 파일씩. 다른 곳에서 SDK를 직접 import하지 않는다.
- 모델 이름·엔드포인트 문자열은 그 파일 상단 상수.
- 제공자 응답을 그대로 밖으로 내보내지 않는다. 우리 타입으로 바꿔서 반환.
- 타임아웃과 재시도는 provider 파일에서 한 번만 정한다. 호출하는 쪽에서 다시 감싸지 않는다.
- 비용 나가는 호출(이미지·영상)은 `runs` 없이는 못 부른다. 항상 run에 귀속.

### 비동기 작업

- 상태는 DB(`assets.status`)가 유일한 진실. 메모리·전역 변수에 작업 상태를 두지 않는다. Vercel은 요청마다 프로세스가 다르다.
- 상태값: `pending → processing → done | failed`. 되돌아가지 않는다. 재시도는 새 `assets` 행.
- Higgsfield 완료는 웹훅으로 받는다. 시크릿 확인 후 `provider_request_id`로 assets를 찾는다. 폴링은 웹훅 실패 대비 보조.
- 웹훅·후처리는 멱등하게. 같은 이벤트가 두 번 와도 결과가 같아야 한다.

### 에이전트

- LLM 출력은 항상 구조화 출력(zod 스키마)으로 받는다. 자유 텍스트 파싱 금지.
- 프롬프트는 `src/lib/agents/<이름>/prompt.ts` 한 파일. 코드 중간에 문자열로 흩어 두지 않는다.
- 가져온 외부 HTML·이미지는 DB에 저장하지 않는다. 결과 프로필만 저장.

### 에러

- 서버 에러는 `src/lib/errors.ts`의 코드 중 하나로 던진다. 프론트 `ErrorState`가 그 코드로 문구를 찾는다. 새 코드 추가는 그 파일에서만.
- 사용자에게 보내는 에러에 스택·키·내부 URL을 넣지 않는다. 원인 문구는 넣는다.

### 검증·로깅

- 라우트·Server Action 입력은 전부 zod로 검증. 검증 전 값은 DB에 안 들어간다.
- 로그는 `src/lib/log.ts` 한 곳. `console.*` 직접 호출 금지. run id, asset id를 항상 같이 찍는다.
- 비용 호출은 모델·소요시간·(있으면) 비용을 로그에 남긴다.

### 환경변수

- `process.env`는 `src/lib/env.ts`에서만 읽고 zod로 검증. 다른 파일은 여기서 import. 없는 변수는 시작 시점에 실패.

## 하지 말 것

- 시키지 않은 PR 생성
- README를 랜딩 페이지처럼 다시 쓰기
- 시키지 않은 문서 파일 추가
- 관련 없는 리팩터
