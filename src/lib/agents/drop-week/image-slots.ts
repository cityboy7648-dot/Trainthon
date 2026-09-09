import { campaign3 } from "../../../definitions/campaign-3.ts";
import type { BrandProduct, Campaign3ImageMeta, Campaign3Plan } from "../../types.ts";

export function dropWeekImageSlots(
  plan: Campaign3Plan,
  product: BrandProduct,
  launchDate: string,
): Campaign3ImageMeta[] {
  const slots: Campaign3ImageMeta[] = [];
  for (const day of campaign3.schedule) {
    const content = plan.days[day.key];
    const date = new Date(`${launchDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + day.offset);
    const common = {
      stage: "image" as const,
      date: date.toISOString().slice(0, 10),
      product,
      error: null,
      retryOf: null,
      startedAt: null,
    };
    slots.push({
      ...common,
      position: slots.length + 1,
      format: "feed",
      prompt: content.feed.imagePrompt,
      caption: content.feed.caption,
    });
    if ("storyPrompt" in content)
      slots.push({
        ...common,
        position: slots.length + 1,
        format: "story",
        prompt: content.storyPrompt,
        caption: "",
      });
  }
  return slots;
}
