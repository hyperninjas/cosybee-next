/**
 * FAQ content for the marketing pages. Each array powers BOTH the visible
 * <Faq> accordion and the FAQPage JSON-LD on that page — the two must always
 * match (Google requires FAQ schema to mirror on-page content).
 *
 * Keep answers factual and aligned with on-page claims; don't assert numbers
 * the product can't back up.
 */

export type FaqItem = { question: string; answer: string };

/** General "About EnergieBee" FAQ — the product overview for the home/about pages. */
export const GENERAL_FAQ: FaqItem[] = [
  {
    question: "What is EnergieBee?",
    answer:
      "EnergieBee helps people and businesses use energy more intelligently and in better balance with the environment. Our mission is to make energy management simpler, clearer, and more accessible through practical tools that help you save time, reduce costs, and make informed decisions.",
  },
  {
    question: "What is the EnergieBee app?",
    answer:
      "The EnergieBee app is our first product. It brings together your energy data, usage, costs, and solar insights in one place, helping you understand how energy works in your home or business and what actions can make the biggest difference.",
  },
  {
    question: "How can the EnergieBee app help me save money?",
    answer:
      "The app analyses your energy use, bills, and tariffs to identify opportunities to reduce costs. It also provides personalised recommendations tailored to your situation, so you can focus on the actions that are most likely to deliver savings.",
  },
  {
    question: "Can I monitor my energy use in real time?",
    answer:
      "Yes. The EnergieBee app connects with compatible smart meters, giving you real-time visibility of your energy consumption and helping you understand where and when you're using the most energy.",
  },
  {
    question: "Does the app work with solar energy systems?",
    answer:
      "Yes. EnergieBee provides highly accurate solar forecasting to help you make the most of your solar generation. You can better understand when solar energy will be available and plan your energy use accordingly.",
  },
  {
    question: "What if I don't have solar panels yet?",
    answer:
      "EnergieBee can help you understand your energy usage patterns and explore whether solar could be a good fit for your home or business. Our goal is to help you make informed decisions based on real data, not guesswork.",
  },
  {
    question: "Do I need to be an energy expert?",
    answer:
      "Not at all. Energy can be complicated, but understanding it shouldn't be. EnergieBee translates complex data into clear information and practical recommendations that anyone can use.",
  },
  {
    question: "Is EnergieBee for homes or businesses?",
    answer:
      "Both. Whether you're managing a family budget or running a business, EnergieBee helps you gain greater visibility, confidence, and control over your energy decisions.",
  },
  {
    question: "How do I get started?",
    answer:
      "Download the EnergieBee app, create your account, and connect your energy data. In just a few minutes, you'll have a clearer view of your energy use and personalised recommendations to help you make smarter energy decisions.",
  },
];

export const ENERGY_FAQ: FaqItem[] = [
  {
    question: "What does EnergieBee's energy monitoring actually track?",
    answer:
      "EnergieBee brings grid, solar, battery, and individual device usage into a single dashboard, so you can see exactly where every watt goes in real time and over time.",
  },
  {
    question: "How does EnergieBee help cut my energy bill?",
    answer:
      "It uses AI-driven tariff shifting, bill forecasting, and battery arbitrage to move flexible usage to cheaper periods. Savings depend on your tariff, hardware, and habits.",
  },
  {
    question: "Does EnergieBee work with my existing energy setup?",
    answer:
      "Yes. EnergieBee is designed to work with a wide range of smart meters, solar inverters, batteries, and EV chargers, so you don't need to replace your existing hardware.",
  },
  {
    question: "Is EnergieBee a good alternative to tado?",
    answer:
      "EnergieBee combines heating control with whole-home energy monitoring, solar forecasting, and automated optimisation in one app — going beyond heating-only solutions like tado.",
  },
];

export const SOLAR_FAQ: FaqItem[] = [
  {
    question: "How does EnergieBee's solar forecasting work?",
    answer:
      "EnergieBee forecasts your expected solar generation using weather data and your system's profile, then schedules flexible loads like EV charging and hot water to use that energy first.",
  },
  {
    question: "Will EnergieBee help me use more of my own solar power?",
    answer:
      "Yes. By predicting generation and automating when high-power devices run, EnergieBee increases self-consumption so you export less and rely on the grid less.",
  },
  {
    question: "Do I need a specific solar inverter or battery brand?",
    answer:
      "EnergieBee supports a broad range of inverters and home batteries. Check the supported-hardware list or contact us to confirm compatibility with your setup.",
  },
];

export const HEATING_FAQ: FaqItem[] = [
  {
    question: "Can EnergieBee control my smart heating?",
    answer:
      "Yes. EnergieBee manages smart heating schedules and adapts them to your routine, the weather, and energy prices to keep you comfortable for less.",
  },
  {
    question: "Does smart heating with EnergieBee need new radiators or a new boiler?",
    answer:
      "No. EnergieBee works with compatible smart thermostats and heating controls, so you can add intelligent heating without replacing your heating system.",
  },
  {
    question: "How does EnergieBee save money on heating?",
    answer:
      "It avoids heating empty rooms, pre-heats during cheaper tariff windows where possible, and tunes schedules to real conditions instead of fixed timers.",
  },
];

export const SMART_FAQ: FaqItem[] = [
  {
    question: "What is the EnergieBee smart home hub?",
    answer:
      "It's one app that connects your energy devices — heating, solar, battery, EV charging, and monitoring — so you can control and automate your whole home from a single place.",
  },
  {
    question: "Which devices and systems does EnergieBee work with?",
    answer:
      "EnergieBee is built to work with a wide range of smart meters, thermostats, inverters, batteries, and EV chargers, so it fits around the hardware you already own.",
  },
  {
    question: "Do I need technical knowledge to set up EnergieBee?",
    answer:
      "No. EnergieBee is designed for everyday homeowners — you connect your devices in the app and it handles the optimisation automatically.",
  },
];
