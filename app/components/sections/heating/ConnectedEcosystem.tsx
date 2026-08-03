import Hexagon from "@/app/components/ui/Hexagon";
import {
  FeatureItem,
  SectionLead,
  SectionTitle,
} from "@/app/components/ui/SectionContent";
import { CtaButton } from "@/app/components/ui/Cta";
import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
import deviceImg from "@/public/heating/energiebee-app-smart-thermostat.png";
import ecosystemBeeImg from "@/public/ss-image/ss-small-5.png";
import radiatorValveImg from "@/public/ss-image/ss-small-13.png";
import Image from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export default function ConnectedEcosystem() {
  return (
    <Section spacing="md" className="bg-surface text-foreground">
      {/* Early-access launch banner. An <aside>, not a heading block: it sits
          above the section's own <h2>, so an <h3> here inverted the document
          order. Its headline is also deliberately smaller than SectionTitle —
          at 36px it out-shouted the heading it precedes. */}
      <Container className="mb-20">
        <aside
          aria-label="Early access"
          className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-secondary p-6 shadow-[9px_9px_13px_0_rgba(0,0,0,0.04),-11px_-8px_14px_0_rgba(0,0,0,0.03)] sm:p-8 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between min-[1200px]:p-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Early access
            </p>
            <p className="mt-2 text-2xl font-extrabold leading-tight text-foreground sm:text-[28px]">
              Launching August 2026
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              Be part of the first wave of connected home energy intelligence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* <a
              href="/get-started"
              className="inline-flex shrink-0 h-12 lg:h-[58.66px] items-center justify-center rounded-lg border border-border bg-surface px-6 text-base lg:text-lg leading-[135%] font-semibold text-foreground transition-colors hover:bg-surface-tertiary"
            >
              Pre-order access
            </a> */}
            <CtaButton href="/contact" size="md">
              Register Interest
            </CtaButton>
          </div>
        </aside>
      </Container>
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-2 min-[1200px]:gap-16">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-163.5 flex flex-col min-[550px]:max-[1200px]:items-center z-9">
          <SectionTitle>
            EnergieBee is evolving into a connected home energy ecosystem
          </SectionTitle>
          <SectionLead className="max-w-160.5 min-[550px]:max-[1200px]:text-center">
            Today we optimise and forecast energy. Tomorrow we actively connect
            and control it.
          </SectionLead>
          <div className="mt-6 md:mt-8 space-y-8">
            <FeatureItem
              title="Home Energy Hub Integration"
              description="A central intelligence layer for managing energy across your entire home."
            />
            <FeatureItem
              title="Smart Heating Connectivity"
              description="Real-time coordination between heating systems and energy intelligence."
            />
            <FeatureItem
              title="Advanced Control Layer"
              description="Automation across rooms, devices, and energy sources for full system control."
            />
          </div>
        </div>

        {/* hexagon cluster */}
        <HiveHexCluster
          className="mx-auto w-full max-w-105 sm:max-w-125 lg:max-w-120"
          cornerInset={4}
          left={{ src: ecosystemBeeImg, color: "#C9C3B8" }}
          topRight={{ src: radiatorValveImg, color: "#E8E6E0" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="cosy bee app"
                className="absolute left-1/2 top-[13%] w-[65%] -translate-x-1/2"
              />
            ),
          }}
        />
      </Container>
    </Section>
  );
}
