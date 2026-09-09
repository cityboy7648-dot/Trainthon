import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("상세 화면은 뷰포트 높이로 고정하고 일정만 내부 스크롤한다", () => {
  const source = readFileSync(
    new URL("../components/campaigns/campaign-workspace.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /h-dvh/);
  assert.match(source, /data-campaign-schedule[\s\S]*?overflow-y-auto/);
  assert.match(source, /@container-size/);
});
test("미리보기 크기는 남은 패널 높이를 따르고 긴 캡션은 내부 스크롤한다", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const preview = readFileSync(
    new URL("../components/campaigns/campaign-post-preview.tsx", import.meta.url),
    "utf8",
  );
  assert.match(css, /--spacing-campaign-preview:.*100cqh/);
  assert.match(preview, /max-h-16.*overflow-y-auto/);
});
