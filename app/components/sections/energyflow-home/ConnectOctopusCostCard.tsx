import { Button, Card } from "@heroui/react";
import { ArrowRight, Check, ThunderboltFill } from "@gravity-ui/icons";
import { ConnectOctopusModal } from "@/app/components/sections/connect/ConnectOctopusModal";

/**
 * Right-column empty state for a dashboard with no Octopus connection.
 *
 * Takes the place of BOTH {@link TariffCard} and {@link DailyCostCard}.
 * Those two used to render regardless, and without Octopus there is no
 * tariff to read and no consumption to price — so they showed the demo
 * fixture ("Octopus Agile", 22.50p, £1.97, "£2.15 saved vs yesterday")
 * under a "Live" chip, which read as this customer's real bill.
 *
 * The button opens the same {@link ConnectOctopusModal} as the Octopus tile
 * in the provider strip, so there is one connect flow, not two.
 *
 * ### Layout
 *
 * Three-band vertical stack inside a single {@link Card}:
 *
 *  1. Centred hero — tinted circle icon, bold headline, muted lead.
 *  2. A soft inset panel listing what the user unlocks by connecting.
 *     Each bullet uses a small filled success chip instead of a bare
 *     checkmark glyph so the row scans as "confirmed benefit".
 *  3. A two-column footer — the "octopus energy" wordmark on the left,
 *     the primary CTA on the right. The wordmark tags who the button
 *     will hand the user off to; it is intentionally text-only (no
 *     mascot asset in the repo) and coloured against Octopus brand
 *     purple.
 *
 * A faint wave decoration is painted along the bottom edge as a
 * pointer-events-none pseudo layer so the CTA still looks like the
 * mockup without adding an asset dependency.
 */

const UNLOCKS = [
  "Your import and export rates",
  "What today has cost so far",
  "How that compares with yesterday",
] as const;

export function ConnectOctopusCostCard() {
  return (
    // Both axes centred: `items-center` on the horizontal, and
    // `justify-center` on the vertical. Card.Content was stretching to
    // fill the column (HeroUI's default), which prevented the stack
    // from moving as a group — with the content back to shrink-to-fit
    // (see the `flex-none` below), the three bands cluster together
    // and float to the middle with even space above and below.
    <Card
      variant="default"
      className="flex h-full w-full flex-col items-center justify-center gap-2"
    >
      <Card.Header className="items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft ring-8 ring-primary-soft/40">
          <ThunderboltFill className="size-6 text-primary" aria-hidden />
        </span>
        <Card.Title className="text-balance text-xl leading-tight font-bold sm:text-2xl">
          Connect Octopus to see your tariff and daily cost
        </Card.Title>
        <Card.Description className="text-balance text-sm leading-relaxed sm:text-base">
          We read your rates and meter readings from Octopus, so these figures
          stay empty until it&apos;s linked.
        </Card.Description>
      </Card.Header>

      {/* `flex-none` so Content sizes to the ul and doesn't stretch to
          fill the column — otherwise the header + footer can't cluster
          with it in a single centred group. */}
      <Card.Content className="!flex-none">
        <ul className="mx-auto flex w-full max-w-md flex-col gap-3 rounded-2xl bg-surface-secondary p-4 sm:p-5">
          {UNLOCKS.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-white shadow-sm"
              >
                <Check className="size-3.5" />
              </span>
              <span className="text-sm leading-6 text-foreground sm:text-base">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </Card.Content>

      <Card.Footer className="flex-row items-center justify-center gap-6">
        <span
          aria-label="Octopus Energy"
          className="text-lg leading-none font-bold tracking-tight"
        >
          <span style={{ color: "#100030" }}>octopus</span>
          <span className="font-normal text-muted"> energy</span>
        </span>
        <ConnectOctopusModal>
          <Button variant="primary" className="rounded-full">
            Connect Octopus
            <ArrowRight className="ms-1 size-4" aria-hidden />
          </Button>
        </ConnectOctopusModal>
      </Card.Footer>
    </Card>
  );
}
