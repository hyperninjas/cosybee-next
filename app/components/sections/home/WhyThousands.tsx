import Image from "next/image";
import { SectionHeader } from "../../ui/SectionContent";
import hexaChart from "@/public/hexa-wand-icon.svg";
import hexaSun from "@/public/hexa-connector-icon.svg";
import hexaDollar from "@/public/hexa-dollar.svg";
import Hexagon from "../../ui/Hexagon";

const POINTS = [
  {
    icon: hexaChart,
    title: "See Where Your Money Goes",
    description:
      "Track heating, solar, and energy use in real-time. Know exactly what's costing you money.",
  },
  {
    icon: hexaSun,
    title: "Control From Anywhere",
    description:
      "Adjust heating, monitor solar production, and manage energy — all from your phone.",
  },
  {
    icon: hexaDollar,
    title: "Reduce Your Bills",
    description:
      "Get smart insights that show you how to cut energy costs. Start saving from day one.",
  },
];

/**
 * "Why thousands choose Energiebee" — centered header followed by a
 * 3-column grid of icon + title + short description.
 */
export default function WhyThousands() {
  return (
    <section className="bg-[linear-gradient(117.77deg,#F6F9FB_12.42%,#F3F9F5_51.01%,#EFF7FB_73.68%,#F0F0FB_95.76%)] overflow-hidden">
      <div className="max-w-360 mx-auto relative py-20 lg:py-25  px-6 sm:px-10 lg:px-30">
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#fff"
          className="pointer-events-none absolute -right-24 top-9 w-[18rem] sm:-right-36 sm:w-88 lg:w-67.5"
        />
        <div className="relative z-9">
          <SectionHeader
            title="Why thousands choose Energiebee"
            description="Simple insights that help you save money from day one"
          />
          <div className="relative z-9 mx-auto min-[1000px]:mt-10 grid max-w-360 grid-cols-1 py-9 max-[1000px]:pb-0 min-[1000px]:grid-cols-3">
            {POINTS.map((p) => (
              <div
                key={p.title}
                className="min-[1000px]:border-r border-b min-[1000px]:border-b-0  border-[#EBEBEB] p-10 text-center last:border-r-0 last:border-b-0"
              >
                <Image
                  src={p.icon}
                  alt=""
                  aria-hidden
                  className="mx-auto h-12.5 w-auto"
                />
                <h3 className="mt-4 text-[22px] font-semibold text-black">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#545454]">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
