# PLAN

구현 계획. 제품이 뭔지는 `README.md`. 최종 목표에서 역으로 내려왔고, 구현은 아래에서 위로 올라간다.

## 최종 목표

로그인한 사용자가 사이트 URL을 넣고, 추천 캠페인과 레퍼런스를 고르면, 한 화면에서 브랜드 에셋 / 인스타 피드 / 영상을 받는다. 영상은 "생성 중"으로 시작해 완료되면 같은 화면에서 재생된다. 결과는 저장되어 다시 볼 수 있다.

## 확정

| 항목 | 결정 |
| --- | --- |
| 형태 | 웹앱. 실제 사용자 대상 |
| 프레임워크 | Next.js (App Router) + TypeScript |
| 배포 | Vercel |
| DB / 인증 / 스토리지 | Supabase (Postgres, Auth, Storage) |
| 로그인 | Supabase Auth. 이메일 + 비밀번호 가입 |
| LLM | OpenAI `gpt-5.5` |
| 이미지 | OpenAI `gpt-image-2` |
| 영상 | Higgsfield API. 기본 `veo3.1/image-to-video`. 엔드포인트 문자열만 바꿔 교체 가능 |
| 사이트 분석 | 사이트별 파서 없음. 에이전트가 HTML/이미지를 직접 읽고 브랜드 프로필을 낸다 |
| 방향 선택 | 레퍼런스 라이브러리(우리가 만든 고정 목록)에서 고른다 |
| 캠페인 | 내부 고정 목록. 에이전트가 브랜드에 맞는 3개를 추천. 목록 전체는 사용자에게 안 보임 |
| 캠페인 → 산출물 | 캠페인 정의가 산출물 구성을 정한다. 사진형 / 글 들어간 형 등 |
| 캠페인 상세 | 나중. 인터페이스만 먼저 고정 |

## 역순 사슬

```
6. 결과 화면    브랜드 에셋 / 피드 / 영상(생성 중 → 완료)   저장·재방문·다운로드
5. 캠페인 실행  캠페인 정의 → 산출물 목록 → 생성기 호출 → assets 저장
4. 생성기       텍스트(캡션/카피) / 이미지(gpt-image-2) / 영상(Higgsfield)
3. 선택 화면    캠페인 추천 3개 → 선택,  레퍼런스 라이브러리 → 선택
2. 분석 에이전트 URL → 브랜드 프로필
1. 뼈대         Next.js, Supabase, Auth, env, API 클라이언트, 정의 파일
```

사슬은 무엇이 무엇에 의존하는지다. 실제 구현 순서는 아래 "구현 순서".

## 데이터

### 브랜드 프로필 (분석 에이전트 출력 = 생성기 입력)

```
name, tagline, industry,
logo_url, palette[], font_feel,
voice, mood_keywords[],
products[] { name, image_url, description },
target_audience,
source_url, analyzed_at
```

### 레퍼런스 (라이브러리 항목. 코드에 정의)

```
key, name, description,
sample_images[]        // 레포에 포함. gpt-image-2로 1회 생성
image_prompt_hints,    // 이미지 생성에 붙는 스타일 지시
voice_hints            // 캡션 말투 지시
```

초기 6개. 미니멀 화이트 / 따뜻한 필름 / 볼드 컬러 / 다크 프리미엄 / 내추럴 라이프 / 팝 일러스트. 개수·구성은 바뀔 수 있다.

### 캠페인 (내부 목록. 코드에 정의)

```
key, name, goal,
fit_hints,             // 추천 에이전트가 브랜드와 맞춰 볼 기준
outputs[]              // 이 캠페인이 만드는 산출물 선언
  { kind: brand_kit | feed_image | caption | video,
    count, aspect, text_in_image: bool, brief }
```

초기 자리 6개. 데모용 최소 2개는 산출물 형태가 달라야 한다 (사진형 / 글 들어간 형). 상세 내용은 나중에 채운다. `outputs[]`만 채우면 실행기가 나머지를 처리한다.

### Supabase 테이블

이 표가 스키마의 기준이다. 테이블·컬럼을 추가하려면 이 표를 먼저 고친다.

```
brands      id, user_id, source_url, profile jsonb, created_at
runs        id, brand_id, campaign_key, reference_key, status, created_at
assets      id, run_id, kind, status, storage_path, provider_request_id, meta jsonb, created_at
```

`status` 값: `pending`, `processing`, `done`, `failed`.

Storage 버킷 `assets`. 이미지·영상 결과는 제공자 URL에서 받아 여기로 옮긴다 (Higgsfield 결과 보관 7일).
RLS: 본인 `user_id` 행만.

## 분석 에이전트

서버 라우트에서 실행. LLM + 도구.

- 도구: HTML 가져오기, 링크된 이미지/OG/파비콘 수집, CSS 색상 추출, 필요 시 하위 페이지 1~2개 추가 fetch
- 출력: 브랜드 프로필 스키마에 맞춘 구조화 출력
- 실패는 그대로 화면에 보여 준다. 빈 프로필로 넘어가지 않는다.

스크린샷은 1차에서 뺀다. HTML+이미지로 부족하면 추가한다.

## 캠페인 추천

브랜드 프로필 + 캠페인 목록 전체 → LLM → 상위 3개 + 각 한 줄 이유. 사용자에게는 3개만.

## 생성 흐름

1. 사용자가 캠페인 1개, 레퍼런스 1개 선택 → `runs` 생성
2. 실행기가 캠페인 `outputs[]`를 순회하며 `assets` 행을 `pending`으로 만든다
3. 텍스트/이미지: 동기 생성 → Storage 업로드 → `done`
4. 영상: Higgsfield 요청 → `provider_request_id` 저장 → `processing`. 웹훅 또는 폴링으로 완료 시 다운로드 → Storage → `done`
5. 결과 화면은 `assets`를 구독해 완료되는 대로 채운다

영상 입력 이미지는 같은 run에서 만든 피드 이미지 중 하나를 쓴다.

## 구현 순서

프론트엔드 먼저, 백엔드 다음, 마지막에 연결. 각 단계는 브랜치 하나, 끝나면 화면에서 확인 가능해야 한다.

### A. 프론트엔드 (디자인 레퍼런스를 받은 뒤 시작. 데이터는 전부 `src/mock/`)

| 단계 | 내용 | 완료 기준 |
| --- | --- | --- |
| A1 뼈대 | Next.js, Tailwind, shadcn, 폴더 구조, `copy.ts`, `errors.ts`, `ErrorState`, `EmptyState`, 스켈레톤 기본 | 빈 화면이 뜬다. 린트 통과 |
| A2 로그인 | 이메일+비밀번호 가입/로그인 화면. 제출은 mock | 화면 완성 |
| A3 대시보드 | 브랜드 목록(0개/N개), URL 입력 | mock으로 두 상태 모두 보인다 |
| A4 브랜드 프로필 | 분석 결과 화면. 분석 중 스켈레톤 | mock 프로필 표시 |
| A5 선택 | 캠페인 추천 3개 카드, 레퍼런스 카드, 선택 | 선택 → 결과 화면으로 이동 |
| A6 결과 | 에셋 / 피드 / 영상. 생성 중 → 완료 → 실패 세 상태 | mock으로 세 상태 모두 보인다 |

### B. 백엔드

| 단계 | 내용 | 완료 기준 |
| --- | --- | --- |
| B1 기반 | `env.ts`, `log.ts`, Supabase 클라이언트, 마이그레이션(테이블·check·RLS·버킷), 타입 생성 | 마이그레이션 적용, 타입 생성 |
| B2 Auth | 이메일+비밀번호 가입/로그인/로그아웃 Server Action, `proxy.ts`로 보호 라우트 | 가입 → 로그인 → 보호 라우트 |
| B3 분석 | 분석 에이전트, `brands` 저장 | 임의 사이트 3개에서 프로필이 나온다 |
| B4 추천 | 캠페인 추천 에이전트 | 브랜드 → 3개 + 이유 |
| B5 생성기 | 캡션/카피, `gpt-image-2`, Higgsfield 영상 각각 단독 호출 + Storage 업로드 | 세 종류 파일이 Storage에 들어간다 |
| B6 실행기 | `runs` 생성, `outputs[]` → `assets`, 생성기 호출, 영상 웹훅·폴링 | run 하나에서 assets가 전부 `done` |

### C. 연결

| 단계 | 내용 | 완료 기준 |
| --- | --- | --- |
| C1 | A2 ↔ B2, A3 ↔ B1·B3 | 실제 로그인, 실제 분석 |
| C2 | A4·A5 ↔ B3·B4·B6 | 실제 추천, run 생성 |
| C3 | A6 ↔ B5·B6, 실시간 구독 | 데모 한 줄이 끝까지 돌아간다. `MOCK` 검색 결과 0 |

C 단계마다 해당 컴포넌트의 `// MOCK`, `data-source="mock"`을 지운다.

## 환경변수

```
OPENAI_API_KEY
HF_API_KEY_ID
HF_API_KEY_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`.env.example`에는 이름만.

## 나중에 우리가 채울 것

- 디자인 레퍼런스. 앱 셸·홈은 `reference/dashboard/` 확정. 나머지 화면(로그인, 프로필, 선택, 결과)은 미정
- 레퍼런스 6개의 실제 이름·이미지
- 캠페인 6개의 실제 내용
- Supabase, Vercel 프로젝트 생성과 키 연결 (기존 계정의 다른 프로젝트와 분리. B1 시작 조건)
