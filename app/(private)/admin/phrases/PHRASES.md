# Phrase of the Week — features & how to use it

`/admin/phrases` controls the small editorial block in the **site footer**: a
quote, who said it, and a "Read article" link to one of our own pages.

A few things to know up front:

- **One phrase per week, in list order.** The site walks the list from top to
  bottom, one entry per ISO week, then starts again. The rotation turns over at
  **Monday 00:00 UTC**.
- **The footer is on every page.** Anything wrong here is wrong sitewide — which
  is why the link is picked from a list of live pages rather than typed.
- **Changes are live immediately.** Saving refreshes every page's footer; you do
  not need to republish anything.

---

## The list

Each row shows, left to right:

| Part | What it is |
|------|------------|
| Drag handle + number | Its slot in the rotation |
| ▲ / ▼ | Move it one slot up or down (the keyboard equivalent of dragging) |
| Badge | `Showing now`, `Next week`, `In N weeks`, or `Paused` |
| Quote + author | Trimmed to two lines; the full text is in the editor |
| Link | The page "Read article" opens — click it to check the target |
| Switch | In or out of the rotation |
| Edit / Delete | |

The row that is live this week is tinted and badged **Showing now**.

## Reordering

Drag a row, or use ▲ / ▼. **The new order saves immediately** — there is no
"save order" button. If the save fails the list snaps back to the order the site
is actually using and shows the error, so what you see is never a lie.

Reordering changes *which week each phrase lands on*, so the badges renumber as
you move things: use them to plan a run of phrases (for example, putting a
solar quote in the week a solar article goes out).

## Adding and editing

**+ New phrase** opens the editor; new phrases are added to the **end** of the
rotation, so they never displace the weeks already planned.

| Field | Notes |
|-------|-------|
| Quote | Up to 600 characters. Shown in quotation marks — don't add your own. |
| Said by | The person, not the work. Rendered as "— Name". |
| Links to | Search **published** pages and articles by title or slug. |
| In the rotation | Off = keep the phrase but skip it (see below). |

The dark panel underneath is a **live preview** of the footer block: quote,
attribution and the link, on the footer's own background. Long quotes are the
usual problem — the preview is where you'll see one wrap badly.

### If a link goes stale

The picker only offers pages that are live now. If a phrase points at something
that has since been unpublished or renamed, the editor keeps the old value
selected and warns you in orange rather than quietly blanking it. Pick a live
page before saving.

## Pausing vs deleting

- **Switch off** — the phrase stays in the list and keeps its slot, but is
  skipped. The weeks after it shuffle up by one. Use this for anything seasonal
  ("Autumn is a second spring…") or temporarily off-message.
- **Delete** — permanent, with a confirmation. The slots below close up.

## If the list is empty

With no active phrases the footer falls back to a small built-in list
(`app/lib/phrase-of-the-week.ts`) rather than showing an empty block. That is a
safety net for a backend outage, not a place to edit content — the site is
supposed to be reading this page.
