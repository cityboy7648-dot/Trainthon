# 캠페인 1: 시그니처 그리드

## 목적

브랜드 에셋과 웹사이트, 승인된 피드 레퍼런스를 함께 확인해 Instagram 피드 이미지 9장을 만든다. 9장을 모아 봤을 때 브랜드가 한눈에 읽혀야 한다.

장별 역할과 위치는 미리 고정하지 않는다. 에이전트가 브랜드와 레퍼런스에 맞춰 매번 구성한다.

## 받는 결과물

1. Instagram 게시물 이미지 9장: 1:1, 1080×1080
2. 각 게시물의 한국어 캡션 9개
3. 이미지 9장을 3×3으로 배치한 전체 피드 미리보기 1개
4. 완성된 피드가 의도한 순서로 보이게 하는 업로드 순서

실제 Instagram 게시와 예약은 이 캠페인의 범위가 아니다.

## 에이전트가 확인하는 자료

### 1. 브랜드 에셋

저장된 브랜드 프로필을 `brand_id`로 가져온다.

- 브랜드명, 한 줄 소개, 업종
- 로고, 브랜드 색상, 서체 느낌
- 말투와 분위기 키워드
- 제품·서비스 이름, 이미지, 설명, 가격
- 주요 고객과 원본 사이트 주소

DB 접근은 `src/lib/data/`에서만 한다.

### 2. 웹사이트

저장된 프로필만으로 구성하지 않는다. `source_url`의 현재 사이트와 연결된 제품·서비스 페이지를 다시 확인한다.

- 사이트에서 실제로 쓰는 사진 분위기와 구도
- 현재 판매하거나 제공하는 제품·서비스
- 사이트에 실제로 적힌 문구와 가격
- 로고와 브랜드 색상이 쓰이는 방식

사이트에서 확인할 수 없는 할인, 효능, 수치, 후기, 고객 정보는 만들지 않는다. 사이트를 읽지 못하거나 제품 목록 확인이 끝나지 않으면 캠페인 생성을 실패 처리한다.

### 3. 캠페인 레퍼런스

`reference/campaigns/campaign-1/`의 승인된 이미지를 모두 이미지 입력으로 확인한다.

- `brewish-coffee-instagram-feed.jpg`
- `gaea-skincare-instagram-feed.jpg`
- `bakery-coffee-instagram-feed.jpg`
- `skincare-photo-instagram-feed.jpg`

레퍼런스에서는 색감, 빛, 사진 비율, 여백, 텍스트 사용량, 제품·공간·사람 사진의 배치 관계를 읽는다. 레퍼런스 속 브랜드명, 로고, 제품, 문구는 복사하지 않는다.

출처는 [`source.txt`](../../reference/campaigns/campaign-1/source.txt)에 기록한다.

## 에이전트의 판단 순서

1. 브랜드 프로필과 사이트 내용을 비교해 사용할 사실과 이미지를 확정한다.
2. 승인된 레퍼런스에서 반복되는 피드 구성 원칙을 찾는다.
3. 브랜드에 맞는 3×3 전체 흐름을 설계한다.
4. 각 칸에 들어갈 소재, 구도, 문구 사용 여부와 캡션을 정한다.
5. 이미지 9장을 생성하고 전체 피드의 통일성을 다시 확인한다.
6. 피드 미리보기와 실제 업로드 순서를 만든다.

사진을 중심으로 구성하고 글씨는 필요한 칸에만 넣는다. 홀짝 배경색, 같은 로고 위치, 고정된 1~9번 템플릿은 사용하지 않는다.

## API

### 캠페인 생성 시작

`POST /api/campaigns/1/runs`

로그인한 사용자의 브랜드만 사용할 수 있다. 요청을 받으면 `runs` 행을 만든 뒤 캠페인 생성 작업을 시작한다.

요청:

```json
{
  "brand_id": "uuid"
}
```

응답:

```json
{
  "run_id": "uuid",
  "campaign_key": "signature_grid",
  "status": "pending"
}
```

캠페인 종류와 레퍼런스는 서버의 캠페인 1 정의로 고정한다. 클라이언트가 프롬프트, 모델명, 레퍼런스 경로를 보내지 않는다.

### 진행 상태와 결과 조회

`GET /api/campaigns/1/runs/{run_id}`

생성 중에는 완료된 항목부터 반환한다.

```json
{
  "run_id": "uuid",
  "campaign_key": "signature_grid",
  "status": "processing",
  "feed_preview_url": null,
  "posts": [
    {
      "position": 1,
      "status": "done",
      "image_url": "https://storage.example/image-1.png",
      "caption": "게시물 캡션",
      "upload_order": 9
    },
    {
      "position": 2,
      "status": "processing",
      "image_url": null,
      "caption": null,
      "upload_order": 8
    }
  ],
  "error": null
}
```

`position`은 완성된 3×3 피드에서 왼쪽 위부터 오른쪽 아래까지 1~9다. `upload_order`는 실제 Instagram에 올리는 순서다. 모든 항목이 완료되면 `feed_preview_url`과 게시물 9개를 반환한다.

## 내부 에이전트 출력

LLM 출력은 자유 텍스트로 파싱하지 않고 zod 구조화 출력으로 받는다.

```ts
type SignatureGridPlan = {
  campaign_key: "signature_grid";
  concept: string;
  reference_direction: {
    colors: string[];
    lighting: string;
    photography: string;
    typography: string;
    layout: string;
  };
  posts: Array<{
    position: number;
    purpose: string;
    source_facts: string[];
    source_image_urls: string[];
    image_brief: string;
    text_in_image: string | null;
    caption: string;
    upload_order: number;
  }>;
};
```

`posts`는 정확히 9개여야 한다. `position`과 `upload_order`는 각각 1~9를 한 번씩만 사용한다. `source_facts`와 `source_image_urls`에는 사이트와 브랜드 에셋에서 확인한 근거만 넣는다.

## 생성 흐름

```text
POST 요청
  → 사용자와 브랜드 소유권 확인
  → run과 pending assets 생성
  → 브랜드 프로필 조회
  → 사이트 재확인
  → 승인된 레퍼런스 이미지 분석
  → 9장 구성안을 구조화 출력으로 생성
  → gpt-image-2로 이미지 생성
  → Supabase Storage 저장
  → 완료된 asset부터 done 처리
  → 3×3 미리보기 생성
  → run을 done 처리
```

OpenAI 호출은 `src/lib/providers/openai.ts`에서만 한다. 에이전트 프롬프트는 `src/lib/agents/signature-grid/prompt.ts`에 둔다. 이미지 생성은 반드시 `run`과 `asset`에 귀속한다.

OpenAI Responses API는 텍스트와 이미지를 함께 입력하고 JSON 구조의 출력을 받을 수 있으므로, 브랜드 정보와 레퍼런스 이미지를 한 요청의 입력으로 전달한다. 구현 기준은 [OpenAI Responses API 공식 문서](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)다.

## 상태와 실패 처리

- 상태는 DB의 `runs.status`와 `assets.status`만 사용한다.
- 상태는 `pending → processing → done | failed` 순서로만 바뀐다.
- 실패한 이미지는 해당 asset을 `failed`로 두고 원인을 결과 API에 표시한다.
- 재시도는 기존 asset 상태를 되돌리지 않고 새 asset 행을 만든다.
- 사이트 확인 실패, 구조화 출력 검증 실패, 이미지 생성 실패를 서로 구분한다.
- 스택, API 키, 내부 URL은 사용자 응답에 포함하지 않는다.

## 완료 기준

1. 브랜드 프로필, 현재 사이트, 승인된 레퍼런스를 모두 확인했다.
2. 사이트에 없는 사실을 만들지 않았다.
3. 9장 각각의 이미지와 캡션이 생성됐다.
4. 3×3 전체 피드에서 색감과 사진 분위기가 한 브랜드처럼 이어진다.
5. 전체 피드 미리보기와 업로드 순서를 제공한다.
6. 실패한 항목과 이유를 숨기지 않는다.
