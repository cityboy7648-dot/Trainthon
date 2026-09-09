import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const { campaignZip } = await import("./campaign-zip.ts");
test("ZIP을 일반 압축 도구로 열면 파일과 한글 캡션이 보존된다", () => {
  const dir = mkdtempSync(join(tmpdir(), "campaign-zip-test-"));
  try {
    const file = join(dir, "test.zip");
    writeFileSync(
      file,
      campaignZip([
        { name: "captions.txt", bytes: Buffer.from("브랜드 캡션") },
        { name: "post-01.png", bytes: Buffer.from([1, 2, 3]) },
      ]),
    );
    assert.match(execFileSync("unzip", ["-t", file], { encoding: "utf8" }), /No errors/);
    assert.equal(
      execFileSync("unzip", ["-p", file, "captions.txt"], { encoding: "utf8" }),
      "브랜드 캡션",
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});
