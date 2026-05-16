import Image from "next/image";
import { SectionHeader } from "../../ui/SectionContent";
import hexaChart from "@/public/hexa-chart.svg";
import hexaSun from "@/public/hexa-sun.svg";
import hexaDollar from "@/public/hexa-dollar.svg";

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
    <section className="bg-[#F7F7F7] py-20 lg:py-25">
      <SectionHeader
        title="Why thousands choose Energiebee"
        description="Simple insights that help you save money from day one"
      />
      <div className="mx-auto mt-12 grid max-w-360 grid-cols-1 gap-10 px-6 sm:px-10 sm:grid-cols-3 lg:px-30">
        {POINTS.map((p) => (
          <div key={p.title} className="text-center">
            <Image
              src={p.icon}
              alt=""
              aria-hidden
              className="mx-auto h-12 w-auto"
            />
            <h3 className="mt-4 text-lg font-bold text-black">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#545454]">
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
