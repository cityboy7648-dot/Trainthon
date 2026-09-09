"use client";

import { FormEvent, Fragment, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCampaignBriefAnswer, getCampaignBriefProgress } from "@/lib/campaign-brief";
import { copy } from "@/lib/copy";
import type { CampaignBriefProps } from "@/lib/types";

export function CampaignBrief({ campaign }: CampaignBriefProps) {
  const [answers, setAnswers] = useState<readonly string[]>([]);
  const [notes, setNotes] = useState<readonly string[]>([]);
  const [draft, setDraft] = useState("");
  const questions = copy.campaigns.briefQuestions;
  const progress = getCampaignBriefProgress(questions, answers);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();

    if (!value) return;

    if (progress.complete) {
      setNotes((current) => [...current, value]);
    } else {
      setAnswers((current) => addCampaignBriefAnswer(current, value, questions.length));
    }
    setDraft("");
  }

  return (
    <section aria-labelledby="campaign-brief-title" className="mt-10 border-t pt-9">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-shell-muted text-xs font-semibold tracking-wide uppercase">
            {copy.campaigns.briefEyebrow}
          </p>
          <h2 id="campaign-brief-title" className="text-shell-ink mt-2 text-xl font-semibold">
            {copy.campaigns.briefTitle}
          </h2>
        </div>
        <span className="bg-shell-active text-shell-muted rounded-full px-3 py-1.5 text-xs font-medium">
          {progress.complete
            ? copy.campaigns.briefComplete
            : copy.campaigns.briefProgress(progress.questionNumber, progress.totalQuestions)}
        </span>
      </div>

      <div className="mt-8 space-y-5" aria-live="polite">
        <div className="max-w-xl">
          <p className="text-shell-muted mb-1.5 text-xs font-medium">Margo</p>
          <p className="text-shell-ink leading-7">{copy.campaigns.briefIntro(campaign.name)}</p>
        </div>

        {answers.map((answer, index) => (
          <Fragment key={`${index}-${answer}`}>
            <div className="max-w-xl">
              <p className="text-shell-muted mb-1.5 text-xs font-medium">Margo</p>
              <p className="text-shell-ink leading-7">{questions[index]}</p>
            </div>
            <div className="bg-shell-button ml-auto max-w-lg rounded-2xl rounded-br-md px-4 py-3 text-sm leading-6 text-white">
              {answer}
            </div>
          </Fragment>
        ))}

        {progress.currentQuestion && (
          <div className="max-w-xl">
            <p className="text-shell-muted mb-1.5 text-xs font-medium">Margo</p>
            <p className="text-shell-ink leading-7">{progress.currentQuestion}</p>
          </div>
        )}

        {progress.complete && (
          <div className="max-w-xl">
            <p className="text-shell-muted mb-1.5 text-xs font-medium">Margo</p>
            <p className="text-shell-ink leading-7">{copy.campaigns.briefReady}</p>
          </div>
        )}

        {notes.map((note, index) => (
          <div
            key={`${index}-${note}`}
            className="bg-shell-button ml-auto max-w-lg rounded-2xl rounded-br-md px-4 py-3 text-sm leading-6 text-white"
          >
            {note}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-2 border-t pt-5">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            progress.complete
              ? copy.campaigns.briefNotePlaceholder
              : copy.campaigns.briefAnswerPlaceholder
          }
          aria-label={copy.campaigns.briefInputLabel}
          className="border-shell-border h-11 rounded-full bg-white px-4"
        />
        <Button
          type="submit"
          size="icon-lg"
          aria-label={copy.campaigns.briefSend}
          disabled={!draft.trim()}
          className="bg-shell-button hover:bg-shell-button-hover size-11 rounded-full text-white"
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}
