import Link from "next/link";
import { DropWeekForm } from "./drop-week-form";
import { DropWeekResults } from "./drop-week-results";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import {
  getCampaign3Brands,
  getCampaign3Result,
  getRecentDropWeeks,
} from "@/lib/data/campaign-3-images";
import { AppError } from "@/lib/errors";
import { copy } from "@/lib/copy";
import type {
  Campaign3ScreenProps,
  Campaign3Brand,
  Campaign3Result,
  Campaign3RecentRun,
} from "@/lib/types";

export async function DropWeekScreen({ searchParams }: Campaign3ScreenProps) {
  const { runId } = await searchParams;
  const text = copy.campaigns.dropWeek;
  let brands: Campaign3Brand[] = [];
  let recent: Campaign3RecentRun[] = [];
  let result: Campaign3Result | undefined;
  let failure: AppError | undefined;
  try {
    if (runId) result = await getCampaign3Result(runId);
    else {
      brands = await getCampaign3Brands();
      recent = await getRecentDropWeeks();
    }
  } catch (error) {
    failure = error instanceof AppError ? error : new AppError("network");
  }
  return (
    <main data-source="server" className="font-shell mx-auto max-w-4xl space-y-8 px-6 py-10">
      <Link
        href={runId ? "/campaigns/3" : "/campaigns/new"}
        className="text-shell-muted text-sm underline"
      >
        {runId ? text.back : copy.campaigns.backToSelection}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">{text.title}</h1>
        <p className="text-shell-muted mt-2 text-sm">{text.description}</p>
      </header>
      {failure ? (
        <ErrorState code={failure.code} cause={failure.cause} />
      ) : result ? (
        <DropWeekResults initial={result} />
      ) : brands.length ? (
        <DropWeekForm brands={brands} />
      ) : (
        <EmptyState
          title={text.noBrands}
          description={text.noBrandsDescription}
          action={<Link href="/">{text.home}</Link>}
        />
      )}
      {!!recent.length && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-semibold">{text.recent}</h2>
          <ul className="space-y-2">
            {recent.map((run) => (
              <li key={run.id}>
                <Link className="text-sm underline" href={`/campaigns/3?runId=${run.id}`}>
                  {text.title} · {run.date}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
