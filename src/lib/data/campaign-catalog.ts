import { randomInt } from "node:crypto";
import { campaigns } from "../../definitions/campaigns.ts";

export function getCampaignCandidates() {
  const candidates = [...campaigns];
  for (let index = candidates.length - 1; index > 0; index--) {
    const target = randomInt(index + 1);
    [candidates[index], candidates[target]] = [candidates[target], candidates[index]];
  }
  return candidates.slice(0, 3);
}
