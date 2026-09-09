import { copy } from "@/lib/copy";
import type { Campaign4SavedPlan } from "@/lib/types";

export function Campaign4PlanResult({ product, plan }: Campaign4SavedPlan) {
  const text = copy.campaigns.realUsage;
  const posts = [plan.day1, plan.day2, plan.day3, plan.day4, plan.day5];
  return (
    <section data-source="server" className="mt-8">
      <h2 className="text-shell-ink text-xl font-semibold">{text.ready}</h2>
      <p className="text-shell-ink mt-2 text-sm font-medium">{product.name}</p>
      <p className="text-shell-muted mt-2 text-sm">{text.planOnly}</p>
      <h3 className="text-shell-ink mt-6 text-sm font-semibold">{text.direction}</h3>
      <p className="text-shell-muted mt-2 text-sm leading-6">{plan.visualDirection}</p>
      <ol className="divide-shell-border mt-6 divide-y">
        {posts.map((post, index) => (
          <li key={index} className="py-5">
            <h3 className="text-shell-ink font-semibold">{copy.campaigns.day(index + 1)}</h3>
            <dl className="mt-3 space-y-3 text-sm leading-6">
              <div>
                <dt className="text-shell-muted">{text.scene}</dt>
                <dd>{post.scene}</dd>
              </div>
              <div>
                <dt className="text-shell-muted">{text.caption}</dt>
                <dd className="whitespace-pre-wrap">{post.caption}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}
