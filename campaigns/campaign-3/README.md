# 캠페인 3: 드롭 위크

상태: 승인 레퍼런스·예시 2장·카드 등록 완료. 카드 Storage 업로드, 사용자 입력→기획→이미지 생성·저장→결과 재조회·개별 재시도 코드 연결 완료. 테스트 12개·ESLint·타입 검사·프로덕션 빌드 통과. 로그인한 실제 계정으로 유료 생성 전 과정 검증은 남아 있다.

## 현재 작업과 다음 단계

사용자가 자기 브랜드의 드롭 위크 캠페인을 실행하는 SaaS 기능을 만든다. `output/examples/teaser.png`와 `reveal.png`는 해브해드 재킷으로 만든 시각 확인용 샘플이며 사용자가 승인했다. 내장 이미지 생성 도구로 만든 것으로 앱 API 실행 검증 결과가 아니다.

드롭 위크 소개용 대표 이미지를 `public/campaigns/drop-week/card-thumbnail-soft.png`에 저장했다. 기존 카드와 같은 흰색·연한 하늘색 톤으로 7일 일정과 티저→공개→디테일을 표현한다. 내장 이미지 생성 도구로 만든 UI 소개 이미지다.

`src/definitions/campaign-3.ts`에 이미지 경로·목표·산출물·필수 입력을 등록하고 `src/lib/data/campaign-catalog.ts`를 통해 카드와 상세에 같은 정보를 전달한다. 추천 모델 연결 완료를 의미하지 않는다. 카드 이미지는 공개 `campaign-covers` 버킷의 `drop-week/card-thumbnail-soft.png`에 업로드했고 공개 URL 응답을 확인했다. 고객 생성 이미지는 비공개 `assets` 버킷에 저장한다.

카드의 선택 버튼은 `/campaigns/3`으로 이동한다. 본인 브랜드·상품·공개일을 입력하면 생성 후 `/campaigns/3?runId=...`에서 결과를 확인한다. 같은 화면의 최근 드롭 위크 목록에서 다시 열 수 있다. 다음은 로그인한 실제 계정에서 이 흐름을 검증하는 것이다. 예시 브랜드의 나머지 8장을 납품하는 작업이 아니다.

## 기준

- 피그마: [03 드롭 위크](https://www.figma.com/design/eBAgVuj8yDUEX9zGc6F60s?node-id=33-12)
- 확인일: 2026-09-09
- 대상: 이커머스
- 필수 입력: 공개일, 대상 상품
- 기간: 7일 (D-3~D+3)
- 채널: Instagram 피드·스토리

브랜드는 알지만 새 상품과 지금 사야 할 이유를 모르는 사람에게 공개 전 기대부터 구매 판단에 필요한 정보까지 준다.

하나의 신상품 또는 컬렉션을 티저로 시작해 공개한 뒤 디테일과 사용 장면으로 구매 확신을 만든다. 할인은 필수 조건이 아니다.

## 일정과 산출물

| 일자  | 내용                     |
| ----- | ------------------------ |
| D-3   | 디테일 티저              |
| D-2   | 분위기                   |
| D-1   | 첫 공개                  |
| D-day | 피드                     |
| D+1   | 소재·기능                |
| D+2   | 사용 장면                |
| D+3   | 정리와 구매 연결         |

총 피드 이미지 7장, 스토리 이미지 3장, 캡션 7개, 업로드 순서.

피드는 매일 1장(4:5), 스토리는 D-3·D-day·D+3에 1장씩(9:16) 배치한다. 스토리 날짜는 사용자 승인으로 확정했다.

## 생성 API와 화면 연결

`POST /api/campaigns/3/runs`는 로그인 후 `brandId`(UUID), `productIndex`(선택 상품 순번, 0부터), `launchDate`(YYYY-MM-DD)를 받는다. 공개일과 상품은 생략할 수 없다.

본인 소유의 저장된 브랜드와 선택 상품, 승인 이미지 3개로 기획한다. key는 `drop_week`다. 브랜드 프로필의 확인된 정보만 사용하고 할인·효능·재고를 추측하지 않는다.

POST 응답은 `{ runId }`다. 기획·이미지 10개의 pending 행을 저장한 뒤 서버의 `after` 작업으로 두 장씩 생성한다. 화면도 동일한 데이터 함수에 연결된 Server Action을 사용한다. 창을 다시 열면 DB 상태를 읽고 남은 pending 작업을 이어 간다. 원격 DB의 기존 소유권 정책과 카드 업로드, 재시도 중복 방지 인덱스 적용을 확인했다. 실제 OpenAI 이미지 호출은 로그인 세션이 없어 아직 검증하지 않았다.

기획은 기존 `assets`의 `kind: caption`, `meta.stage: planning`에 저장한다. 생성 이미지는 `kind: image`, `meta.stage: image`로 저장하며 게시 날짜·순서·포맷·캡션·상품 스냅샷을 함께 보관한다. 각 asset은 pending → processing → done/failed다. 이미지 생성 전 run은 pending이며 생성 중 processing, 전부 완료하면 done이다. 기획 실패는 run도 failed로 기록하고, 이미지 실패는 개별 asset에 원인을 남겨 재시도를 기다린다.

완료 이미지는 본인만 접근 가능한 1시간 서명 URL로 표시한다. 재조회할 때 URL을 갱신한다. 재시도는 새 asset을 만들고 이전 실패·완료 행을 되돌리지 않는다. `assets_image_retry_once` 인덱스로 같은 실패 행에 대한 동시 재시도를 하나로 제한한다. processing 시작 후 180초 넘게 끝나지 않은 장은 재조회 시 실패로 기록하고 재시도할 수 있게 한다. 클라이언트의 추정 진행률은 사용하지 않는다.

검증: 게시 일정·필수 입력·소유권 차단·동시 생성 중복 방지·실패 재시도·완료 재조회·중단 복구 테스트 12개 통과. 브라우저에서 상세→선택→입력 화면의 로그인 차단, HTTP에서 미로그인 생성 요청 401 응답을 확인했다. 실계정 생성·다운로드 전 과정은 미검증이다.

## 승인된 레퍼런스

사용자가 2026-09-09에 아래 개별 이미지 3개를 선택했다. 파일은 `reference/campaigns/campaign-3/`에 저장하고 출처와 선택 내역은 해당 폴더의 `source.txt`에 기록한다.

1. `paris-elysees-teaser.jpg`: 어두운 배경에서 제품 윤곽을 일부 드러내는 티저 구도.
2. `rhode-product-reveal.png`: 제품 색과 연결된 천과 빛으로 대표 상품을 강조하는 공개 구도.
3. `glossier-shades-texture.png`: 제품과 내용물을 나란히 배치해 색상과 제형을 보여 주는 디테일 구도.

브랜드명·문구·제품을 복사하지 않고 구도·빛·색·디테일 표현을 참고한다. 레퍼런스 선택이 캠페인 대상을 뷰티 업종으로 제한하지는 않는다.

## 이전 미승인 후보

아래는 미승인 후보다. 선택된 자료만 `reference/campaigns/campaign-3/`에 파일로 저장한다.

1. [XXAN STUDIOS 티저 이미지](https://www.xxanstudios.com/cdn/shop/collections/TokyoAMpromo1d.jpg?v=1670977828) — [원문](https://www.xxanstudios.com/collections/ss23-spring-tokyo-a-m-collection): 원단을 크게 보여 주고 컬렉션명과 공개 상태만 적은 세로 이미지.
2. [BIMANI 컬렉션 공개 이미지](https://bimani.com/cdn/shop/files/Modulo_02_Mobile.jpg?v=1739441151&width=1500) — [원문](https://bimani.com/en-int): 착장 사진, 원단 디테일, 공개일, 구매 버튼을 한 장에 배치한 세로 이미지.
3. [BLCKORCHID 공개 이미지](https://cdn.shopify.com/s/files/1/0693/7454/2137/files/launch_post.jpg?v=1682924169&width=750) — [원문](https://blckorchid.in/): 상품 세 개를 겹쳐 놓고 `DROP//002 LIVE NOW`만 크게 적은 정사각 이미지.
4. [Shabbir Fabrics 소재 이미지](https://shabbirfabrics.com/cdn/shop/collections/6.jpg?v=1748954199&width=3840) — [원문](https://shabbirfabrics.com/products/storm): 손으로 원단을 잡은 클로즈업에 짧은 출시 문구를 얹은 정사각 이미지.
5. [Chapter 2 착장 공개 이미지](https://cdn.shopify.com/s/files/1/0656/0691/0124/files/IMG_0520.jpg?crop=center&height=1422&v=1738323434&width=800) — [원문](https://chapter2drip.com/): 두 모델의 실제 착장을 전면에 두고 공개 상태를 짧게 표시한 세로 이미지.

위 이전 후보는 승인되지 않았으며 에이전트 입력에 넣지 않는다.

## PLAN 차이

캠페인 번호는 오래된 목록의 배열 순서가 아니라 피그마 기준이다. `docs/PLAN.md`에 03 드롭 위크의 key·일정·산출물을 별도로 명시했다.
