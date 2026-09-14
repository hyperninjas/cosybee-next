import { Button, Card } from "@heroui/react";
import { CircleCheck, ThunderboltFill } from "@gravity-ui/icons";
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
 */

const UNLOCKS = [
  "Your import and export rates",
  "What today has cost so far",
  "How that compares with yesterday",
] as const;

export function ConnectOctopusCostCard() {
  return (
    <Card variant="default" className="h-full justify-center">
      <Card.Header className="items-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-[color:var(--efh-grid)]/10 text-[color:var(--efh-grid)]">
          <ThunderboltFill className="size-5" aria-hidden="true" />
        </span>
        <Card.Title className="text-lg leading-snug">
          Connect Octopus to see your tariff and daily cost
        </Card.Title>
        <Card.Description className="max-w-xs">
          We read your rates and meter readings from Octopus, so these figures
          stay empty until it&apos;s linked.
        </Card.Description>
      </Card.Header>

      <Card.Content className="items-center">
        <ul className="flex flex-col gap-2">
          {UNLOCKS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-muted">
              <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </Card.Content>

      <Card.Footer className="justify-center">
        <ConnectOctopusModal>
          <Button variant="primary">Connect Octopus</Button>
        </ConnectOctopusModal>
      </Card.Footer>
    </Card>
  );
}
