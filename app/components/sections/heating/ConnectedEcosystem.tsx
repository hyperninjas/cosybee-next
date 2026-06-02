import Hexagon from "../../ui/Hexagon";
import {
  FeatureItem,
  SectionLead,
  SectionTitle,
} from "../../ui/SectionContent";
import { CtaButton } from "../../ui/Cta";
import HiveHexCluster from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/device-snap-heating-eco-system.png";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";

export default function ConnectedEcosystem() {
  return (
    <section className="relative overflow-hidden bg-white py-20 pb-10 text-black lg:py-25 lg:pb-12.5">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-163.5 flex flex-col max-[1200px]:items-center z-9">
          <SectionTitle>
            EnergieBee is evolving into a connected home energy ecosystem
          </SectionTitle>
          <SectionLead className="max-w-163.5 max-[1200px]:text-center">
            Today we optimise and forecast energy. Tomorrow we actively connect
            and control it.
          </SectionLead>
          <div className="mt-8 space-y-8">
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
          left={{ src: windTurbineImg.src, color: "#7FA9C9" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017" }}
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
      </div>

      {/* early-access launch banner */}
      <div className="mx-auto mt-12 max-w-360 px-6 sm:px-10 lg:px-30">
        <div className="flex flex-col gap-5 rounded-2xl border border-[#DAE7ED] bg-[#FAFBFC] p-6 shadow-[9px_9px_13px_0_rgba(0,0,0,0.04),-11px_-8px_14px_0_rgba(0,0,0,0.03)] sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
          <div>
            <h3 className="text-xl font-extrabold leading-tight text-black sm:text-[36px] whitespace-pre-line">
              {"Launching August 2026 \n Early Access Available."}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#545454] sm:text-base">
              Be part of the first wave of connected home energy intelligence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/get-started"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#DAE7ED] bg-white px-6 py-3 text-base font-semibold text-black transition-colors hover:bg-neutral-50"
            >
              Pre-order access
            </a>
            <CtaButton href="/get-started" size="md" className="text-base!">
              Register interest
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
