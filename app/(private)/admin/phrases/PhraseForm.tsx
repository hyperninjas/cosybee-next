"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert, Button, Card, Input, Switch, TextArea } from "@heroui/react";
import type { LinkTarget } from "@/app/lib/link-targets";
import type { AdminPhrase } from "../lib/api";
import { initialSaveState } from "../lib/form-state";
import { savePhrase } from "./actions";
import { ArticleLinkPicker } from "./ArticleLinkPicker";

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-foreground">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      isDisabled={pending}
      isPending={pending}
    >
      {label}
    </Button>
  );
}

/**
 * Create / edit one entry of the footer rotation.
 *
 * The article link goes through a picker rather than a text field — see
 * ArticleLinkPicker for why. The preview underneath renders the same three
 * parts the footer does (quote, attribution, "Read article"), because the only
 * thing that reliably catches an over-long quote is seeing it wrap.
 */
export default function PhraseForm({
  phrase,
  linkTargets,
  onSaved,
  onCancel,
}: {
  phrase?: AdminPhrase;
  linkTargets: LinkTarget[];
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState(savePhrase, initialSaveState);
  const errors = state?.fieldErrors ?? {};

  const [quote, setQuote] = useState(phrase?.quote ?? "");
  const [author, setAuthor] = useState(phrase?.author ?? "");
  const [articlePath, setArticlePath] = useState(phrase?.articlePath ?? "");
  const [articleLabel, setArticleLabel] = useState<string | null>(
    phrase?.articleLabel ?? null,
  );
  const [isActive, setIsActive] = useState(phrase?.isActive ?? true);

  // Fire onSaved once per successful submit, keyed on the state object rather
  // than on the callback: an inline arrow from the parent is a new function
  // every render, and depending on it here re-runs the effect (and the
  // router.refresh() behind it) in a loop.
  const savedRef = useRef<unknown>(null);
  useEffect(() => {
    if (state?.ok && savedRef.current !== state) {
      savedRef.current = state;
      onSaved?.();
    }
  }, [state, onSaved]);

  return (
    <form action={formAction} className="space-y-5">
      {phrase && <input type="hidden" name="id" value={phrase.id} />}
      <input type="hidden" name="articlePath" value={articlePath} />
      <input type="hidden" name="articleLabel" value={articleLabel ?? ""} />
      {/* The Switch below drives this rather than carrying `name` itself: a
          React Aria switch omits its field entirely when off, so "off" and
          "the control wasn't rendered" would arrive identically. */}
      <input type="hidden" name="isActive" value={isActive ? "on" : "off"} />

      {state?.error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{state.error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">Phrase</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled
            label="Quote"
            hint="Shown in quotation marks. Keep it short enough to read at a glance."
            error={errors.quote}
          >
            <TextArea
              variant="secondary"
              fullWidth
              name="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
              placeholder="Nature does not hurry, yet everything is accomplished."
            />
            <span className="mt-1 block text-xs text-muted">
              {quote.length}/600 characters
            </span>
          </Labeled>

          <Labeled label="Said by" error={errors.author}>
            <Input
              variant="secondary"
              fullWidth
              name="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Lao Tzu"
            />
          </Labeled>

          <Labeled
            label="Links to"
            hint="The page “Read article” opens. Only published pages are listed."
            error={errors.articlePath}
          >
            <ArticleLinkPicker
              targets={linkTargets}
              value={articlePath}
              label={articleLabel}
              onChange={(path, title) => {
                setArticlePath(path);
                setArticleLabel(title);
              }}
            />
          </Labeled>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Switch
            isSelected={isActive}
            className="justify-between"
            onChange={setIsActive}
          >
            <Switch.Content>
              <span className="block text-sm font-semibold text-foreground">
                In the rotation
              </span>
              <span className="block text-xs text-muted">
                Turn off to retire this phrase without deleting it. It keeps its
                place in the order and is skipped when its week comes round.
              </span>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </Card.Header>
      </Card>

      {/* Preview — the same three parts the footer renders, on the footer's
          own dark ground so the contrast is the real one. */}
      <div className="rounded-lg bg-black p-5">
        <div className="  max-w-83">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">
            Phrase of the Week
          </h3>
          <blockquote className="mt-3 text-balance text-[15px] italic leading-relaxed text-white/90">
            &ldquo;{quote || "Your quote appears here."}&rdquo;
          </blockquote>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
            <span className="font-medium text-white/60">
              &mdash; {author || "Author"}
            </span>
            <span className="font-semibold text-[#FF8A7A]">Read article →</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <SaveButton label={phrase ? "Update phrase" : "Create phrase"} />
      </div>
    </form>
  );
}
