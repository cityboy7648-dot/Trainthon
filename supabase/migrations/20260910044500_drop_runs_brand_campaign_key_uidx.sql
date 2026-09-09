-- docs/PLAN.md 스키마에 없는 인덱스가 운영 DB에만 들어가 있었다.
-- 브랜드당 캠페인 하나로 막혀 실패한 캠페인을 다시 만들 수 없었다.
drop index if exists public.runs_brand_campaign_key_uidx;
