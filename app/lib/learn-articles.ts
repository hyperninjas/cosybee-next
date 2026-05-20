import beeFlowerImg from "@/public/bee-flower.png";
import { type Article, createBlog } from "./articles";

/** Categories shown in the learn filter bar. */
export const LEARN_CATEGORIES = [
  "All",
  "Heating",
  "Solar",
  "EPC",
  "Tariffs",
] as const;

/**
 * Learn-section articles. Independent from the hive blog — content here
 * does not overlap with `HIVE_ARTICLES`.
 */
export const LEARN_ARTICLES: Article[] = [
  {
    slug: "should-i-upgrade-to-a-heat-pump",
    category: "Heating",
    readTime: "6 min read",
    title: "Should I Upgrade to a Heat Pump?",
    description:
      "How a heat pump works with your home's insulation, heat distribution, and even solar to deliver steady, efficient warmth.",
    image: beeFlowerImg,
    imageAlt: "A heat pump unit outside a home",
    author: { name: "Mina Frost", date: "18 May 2026" },
    carouselIntro:
      "A heat pump is a different way for your home to work with energy.",
    carouselBody:
      "Using existing environmental heat — from air, ground, or water — and guiding it into your living spaces. With the right insulation and distribution, it delivers steady comfort and efficient energy flow.",
    body: {
      sections: [
        {
          heading: "Quick answer",
          paragraphs: [
            "A heat pump introduces a different way for your home to work with energy, using existing environmental heat and guiding it into your living spaces. When your home has the right balance of insulation and heat distribution, this system supports steady comfort and efficient energy flow.",
          ],
        },
        {
          heading: "Why this matters",
          paragraphs: [
            "Homes today are part of a wider energy ecosystem where comfort and efficiency move together.",
            "A heat pump connects your home to surrounding natural energy sources, drawing warmth from air, ground, or water and guiding it into your indoor environment. This creates a closer relationship between your home and the natural energy flows around it.",
            "In many homes, this shift supports a more balanced way of managing warmth across seasons.",
          ],
        },
        {
          heading: "How a heat pump works with your home",
          paragraphs: [
            "A heat pump integrates into your home like a living extension of its energy system.",
            "Homes with strong insulation tend to retain warmth for longer periods, allowing energy to circulate smoothly through rooms. Heat moves in a gentle and continuous way, similar to how temperature changes in nature follow gradual patterns rather than sharp shifts.",
            "Radiators and distribution systems shape how this energy travels, guiding warmth across each space so every room contributes to overall comfort.",
            "When these elements work together, your home develops a more stable and natural thermal rhythm.",
          ],
        },
        {
          heading: "What you can do",
          paragraphs: [
            "Understanding your home's readiness for a heat pump starts with observing how it holds warmth throughout the day.",
            "Many homes reveal clear patterns: how sunlight interacts with spaces, how long rooms stay comfortable after heating cycles, and how energy flows between different areas.",
            "From there, it becomes easier to see how your home aligns with a system that works with environmental heat and supports long-term efficiency.",
            "Small improvements in insulation or heat distribution often enhance this alignment even further.",
          ],
        },
        {
          heading: "How energiebee helps",
          paragraphs: [
            "energiebee helps you understand how your home interacts with natural energy flows and how a heat pump would integrate into that system.",
            "By mapping insulation, heating patterns, and energy movement across your home, energiebee reveals how warmth circulates and where balance can be improved.",
          ],
        },
        {
          heading: "Key insight",
          paragraphs: [
            "Heat pumps use electric rather than gas. If your home has solar panels, some of the energy used for heating during the day can come directly from what your home generates itself. It's a bit like using sunlight that your roof has already collected earlier in the day.",
            "And in winter, if you have a heat pump energy tariff, you can heat your home with off peak energy.",
          ],
        },
      ],
      cta: { label: "Check your home with energiebee" },
    },
  },
  {
    slug: "whats-a-trv-and-is-it-right-for-me",
    category: "Heating",
    readTime: "5 min read",
    title: "What's a TRV and Is It Right for Me?",
    description:
      "What a thermostatic radiator valve does, and how room-by-room control creates a home where warmth follows how you live.",
    image: beeFlowerImg,
    imageAlt: "A thermostatic radiator valve on a radiator",
    author: { name: "Mina Frost", date: "18 May 2026" },
    body: {
      sections: [
        {
          heading: "Quick answer",
          paragraphs: [
            "A TRV (Thermostatic Radiator Valve) gives each room its own way of responding to heat. It supports a home where warmth moves with intention, adapting to how each space is used throughout the day.",
            "This creates a more balanced energy flow across rooms, where comfort follows your daily life patterns.",
          ],
        },
        {
          heading: "Why this matters",
          paragraphs: [
            "Every home behaves like a small ecosystem of spaces, each with its own rhythm.",
            "Some rooms stay active throughout the day, while others rest quietly for longer periods. When heat flows evenly without distinction, energy spreads across the whole home in the same way, regardless of use.",
            "TRVs introduce a more natural distribution of warmth, closer to how temperature adjusts in nature depending on exposure, activity, and time.",
          ],
        },
        {
          heading: "How TRVs shape your home energy flow",
          paragraphs: [
            "A TRV sits on each radiator and responds to the conditions of the room, helping your home guide heat where it brings the most comfort.",
            "Rooms that are part of daily life receive steady warmth, supporting comfort where activity is higher. Spaces that remain unused for longer periods follow a lighter energy rhythm, allowing heat to circulate where it is most needed.",
            "Over time, this creates a more harmonious distribution of energy across the home, where each room contributes to the overall balance.",
          ],
        },
        {
          heading: "What you can do",
          paragraphs: [
            "Understanding TRVs starts with noticing how your home feels throughout the day.",
            "You can explore how different rooms respond when warmth is adjusted, shaping each space according to how it is lived in. Living areas and bedrooms often become the first reference points for comfort, while other spaces follow their own natural setting.",
            "With small adjustments over time, your home gradually finds a more balanced thermal flow.",
          ],
        },
        {
          heading: "How energiebee helps",
          paragraphs: [
            "energiebee helps you see how heat moves through each part of your home and how TRVs influence that flow.",
            "By bringing all radiator settings into one view, energiebee helps your home respond as a connected system, where every room plays a role in overall comfort and efficiency.",
            "This creates clarity in how energy is distributed and how each adjustment shapes the home's wider balance.",
          ],
        },
        {
          heading: "Key insight",
          paragraphs: [
            "Room-by-room control creates a home where warmth follows life, and energy flows with greater intention.",
          ],
        },
      ],
      cta: { label: "Explore energiebee" },
    },
  },
  {
    slug: "whats-my-home-epc-rating",
    category: "EPC",
    readTime: "5 min read",
    title: "What's My Home's EPC Rating?",
    description:
      "What an EPC rating really tells you about your home's energy, and where small changes make a meaningful difference.",
    image: beeFlowerImg,
    imageAlt: "An energy performance certificate rating chart",
    author: { name: "Elliot Smith", date: "19 May 2026" },
    body: {
      sections: [
        {
          heading: "Quick answer",
          paragraphs: [
            "An EPC rating gives a simple view of how efficiently your home uses energy. It reflects how your home keeps warmth, uses heating systems, and manages energy across everyday life.",
            "It's a way of understanding how your home performs today and, most importantly: where small changes can make a meaningful difference.",
          ],
        },
        {
          heading: "Why this matters",
          paragraphs: [
            "Every home has its own energy personality.",
            "Some homes hold warmth easily and feel stable through the day. Others need more energy to stay comfortable, especially in colder months. The EPC rating helps make that visible in a simple way.",
            "Like a snapshot of how your home and its energy systems work together.",
            "When you understand this, decisions like improving insulation, upgrading heating, or adding solar become much clearer and more intentional.",
          ],
        },
        {
          heading: "How your home's EPC comes together",
          paragraphs: [
            "Your EPC rating is shaped by how energy moves through your home, almost like a rhythm you can't always see but you can feel.",
            "Homes with higher efficiency tend to hold warmth naturally, like a well-insulated space that stays comfortable without constant heating. Homes with lower efficiency often let that warmth escape more easily, which means the system has to work harder to maintain comfort.",
            "Things like walls, windows, heating systems, and insulation all contribute to this overall balance. Together, they define how your home behaves energetically throughout the year.",
          ],
        },
        {
          heading: "What you can do",
          paragraphs: [
            "Understanding your EPC is often the first step toward improving it.",
            "Many people start by noticing small things: rooms that cool down too quickly, heating that needs to stay on longer than expected, or areas of the home that feel harder to keep comfortable.",
            "From there, improvements usually follow a natural path: better insulation, smarter heating control, or upgrades that help your home retain energy more effectively.",
            "You don't need to change everything at once. You can start by understanding how your home energy flows, and find the right balance for that flow.",
          ],
        },
        {
          heading: "How energiebee helps",
          paragraphs: [
            "energiebee helps you connect your EPC rating with how your home actually behaves day to day.",
            "Numbers can feel too static. Not easy to read. So energiebee was designed to help you understand what those numbers mean in real life: how your home uses energy, where it performs well, and where there's potential to improve.",
            "With energiebee, your EPC becomes part of a living picture of your home's energy system, helping you make decisions that feel clearer and more grounded.",
          ],
        },
        {
          heading: "Key insight",
          paragraphs: [
            "Your EPC rating is really a reflection of how your home and energy work together — and how much easier that relationship can become with small, smart improvements.",
          ],
        },
      ],
      cta: { label: "View your home insights" },
    },
  },
  {
    slug: "how-to-reduce-heating-energy-waste",
    category: "Heating",
    readTime: "6 min read",
    title: "How to Reduce Heating Energy Waste",
    description:
      "Small, intentional adjustments that cut wasted heat and bring your home's energy use back into balance.",
    image: beeFlowerImg,
    imageAlt: "A warm, balanced living room",
    author: { name: "Mina Frost", date: "19 May 2026" },
    body: {
      sections: [
        {
          heading: "Quick answer",
          paragraphs: [
            "Heating efficiency improves when energy flows are balanced across your home. Small adjustments in how rooms are heated and used can significantly improve comfort while reducing unnecessary energy use.",
          ],
        },
        {
          heading: "Why this matters",
          paragraphs: [
            "Homes often use more energy than needed due to uneven heating patterns, unused heated spaces, or unstable temperature changes.",
            "When heating becomes more intentional, your home operates as a more balanced and efficient energy system.",
          ],
        },
        {
          heading: "How energy waste appears in your home",
          paragraphs: [
            "Energy waste often comes from how heat is distributed and maintained.",
          ],
        },
        {
          heading: "How heat spreads across rooms",
          blocks: [
            {
              items: [
                "Empty rooms can still receive heat flow",
                "Energy spreads beyond areas of use",
                "Heat distribution becomes less focused",
              ],
            },
          ],
        },
        {
          heading: "How temperature stability affects efficiency",
          blocks: [
            {
              items: [
                "Sudden changes in temperature increase energy demand",
                "Steady heating supports more balanced energy use",
                "Consistency improves overall system performance",
              ],
            },
          ],
        },
        {
          heading: "How insulation and control shape efficiency",
          blocks: [
            {
              items: [
                "Drafts affect heat retention",
                "Room control improves distribution",
                "System balance improves with targeted adjustments",
              ],
            },
          ],
        },
        {
          heading: "What you can do",
          blocks: [
            {
              items: [
                "Close doors in unused spaces",
                "Adjust room-level heating with TRVs",
                "Maintain steady temperature levels",
                "Avoid large sudden heating changes",
              ],
            },
          ],
        },
        {
          heading: "How energiebee helps",
          blocks: [
            "energiebee helps your home identify where energy is being overused and how heating can become more balanced across rooms.",
            "With energiebee you can:",
            {
              items: [
                "Track room-level energy patterns",
                "Identify inefficient heating zones",
                "Optimize temperature settings over time",
                "Improve overall home energy balance",
              ],
            },
          ],
        },
        {
          heading: "Key insight",
          paragraphs: [
            "Energy efficiency increases when your home distributes heat with intention rather than uniform flow.",
          ],
        },
      ],
      cta: { label: "Reduce waste with energiebee" },
    },
  },
  {
    slug: "is-solar-right-for-my-home",
    category: "Solar",
    readTime: "8 min read",
    title: "Is Solar Right for My Home?",
    description:
      "Find out if solar energy is right for your home. Learn how sunlight, roof structure, and energy usage affect solar performance and discover how your home could become a smarter energy system with EnergieBee.",
    image: beeFlowerImg,
    imageAlt: "Solar panels on a home roof at midday",
    author: { name: "Lila Del Ray", date: "19 May 2026" },
    carouselIntro:
      "Solar can turn your home into a small, local energy producer.",
    carouselBody:
      "But its real value depends on how your home receives sunlight, how it uses energy, and how well those two systems align. The best results come when your home conditions and solar potential work together intelligently.",
    body: {
      sections: [
        {
          heading: "Quick answer",
          paragraphs: [
            "Solar energy can turn your home into a small, local energy producer — but its real value depends on how your home receives sunlight, how it uses energy, and how well those two systems align. The best results come when your home conditions and solar potential work together intelligently.",
          ],
        },
        {
          heading: "Why this matters",
          paragraphs: [
            "Most homes consume energy without really understanding how it's generated or wasted.",
            "Solar changes that dynamic. It shifts your home from being a passive energy user to becoming a small energy system that can also produce power.",
            "But this only works well when the system is right for your specific home — because every home has its own energy behavior.",
            "Understanding this avoids unrealistic expectations and helps you make smarter, long-term decisions.",
          ],
        },
        {
          heading: "What shapes your home's solar potential",
          paragraphs: [
            "Your home is a living energy environment shaped by several factors:",
          ],
        },
        {
          heading: "How your home receives sunlight",
          blocks: [
            {
              items: [
                "South-facing surfaces capture more consistent solar energy",
                "East and west exposure creates different production patterns throughout the day",
                "The sun doesn't just hit your roof — it shapes your energy rhythm",
              ],
            },
          ],
        },
        {
          heading: "How your environment interacts with light",
          blocks: [
            {
              items: [
                "Trees, buildings, or shadows interrupt energy flow",
                "Even partial shading can change how efficiently your home collects energy",
                "Your surroundings are part of your energy system",
              ],
            },
          ],
        },
        {
          heading: "Your home's physical structure",
          blocks: [
            {
              items: [
                "Roof size determines how much energy your home can generate",
                "Shape and angles define how effectively solar can integrate",
                "Every home has a different energy surface",
              ],
            },
          ],
        },
        {
          heading: "How your home uses energy",
          blocks: [
            {
              items: [
                "Homes that use energy during the day benefit more from solar production",
                "When production and consumption align, efficiency increases",
                "The real optimization happens when your home's usage pattern matches its generation pattern",
              ],
            },
          ],
        },
        {
          heading: "What you can do",
          blocks: [
            "Before deciding on solar, start by understanding your home's energy reality:",
            {
              items: [
                "Observe how much sunlight your roof actually receives throughout the day",
                "Estimate your current energy consumption patterns",
                "Check how much usable roof space you have for solar installation",
                "Compare potential installation cost with long-term energy savings",
              ],
            },
            "This turns solar from a guess into a measurable decision.",
          ],
        },
        {
          heading: "How energiebee helps",
          blocks: [
            "Energiebee helps you understand your home as an energy-aware system.",
            "Instead of guessing, you can:",
            {
              items: [
                "Simulate how much solar energy your home could produce in real time",
                "See how your location and roof conditions affect generation",
                "Understand how your energy usage aligns with solar production",
                "Track how your home could evolve into a more efficient, self-aware energy system",
              ],
            },
            "Installing solar is not enough: understanding how your home and energy can work together intelligently will make the difference.",
          ],
        },
        {
          heading: "Key insight",
          paragraphs: [
            "Your home is already part of an energy system. Solar doesn't just add panels — it changes how your home participates in that system.",
            "The real question is not only \"Can I install solar?\" It's \"How intelligently can my home generate and use its own energy?\"",
          ],
        },
      ],
      cta: { label: "Check Your Home's Solar Potential Now" },
    },
  },
  {
    slug: "should-i-upgrade-my-boiler",
    category: "Heating",
    readTime: "7 min read",
    title: "Should I Upgrade My Boiler?",
    description:
      "Find out if you should upgrade your boiler. Learn how boiler efficiency affects heating performance, energy usage, and home comfort — and how upgrading can improve your home's energy system with energiebee.",
    image: beeFlowerImg,
    imageAlt: "A modern home boiler unit",
    author: { name: "Mina Frost", date: "20 May 2026" },
    body: {
      sections: [
        {
          heading: "Quick answer",
          paragraphs: [
            "Upgrading your boiler can make your home significantly more energy-efficient by reducing wasted heat and improving how consistently your home reaches the right temperature. Whether you should upgrade depends on the age, efficiency, and behavior of your current heating system.",
          ],
        },
        {
          heading: "Why this matters",
          paragraphs: [
            "Heating is one of the most energy-intensive parts of a home.",
            "Older boilers use more energy. And they often heat your home in a less intelligent way, with more waste and less control over how warmth is distributed.",
            "Upgrading will shift how your home manages energy: from reactive heating to more efficient, responsive performance.",
          ],
        },
        {
          heading: "How your boiler affects your home's energy system",
          paragraphs: [
            "Your boiler is a core part of your home's energy engine. When it's outdated, the entire system feels it.",
          ],
        },
        {
          heading: "How efficiently your home produces heat",
          blocks: [
            {
              items: [
                "Modern boilers convert energy into heat more effectively",
                "Less fuel is wasted during the heating process",
                "Your home reaches comfortable temperatures faster and with more stability",
              ],
            },
          ],
        },
        {
          heading: "How your home maintains comfort",
          blocks: [
            {
              items: [
                "New systems regulate temperature more precisely",
                "Rooms heat up in a more balanced way",
                "Comfort becomes consistent rather than fluctuating",
              ],
            },
          ],
        },
        {
          heading: "How predictable your energy usage is",
          blocks: [
            {
              items: [
                "Upgraded systems behave more consistently over time",
                "Energy consumption becomes easier to understand and manage",
                "Your home's heating pattern becomes more structured",
              ],
            },
          ],
        },
        {
          heading: "What you can do",
          blocks: [
            "If you're considering a boiler upgrade, start by understanding your current system:",
            {
              items: [
                "Check the age and efficiency rating of your boiler",
                "Review how stable and consistent your heating feels",
                "Compare energy consumption with modern alternatives",
                "Plan upgrades during low-demand seasons to minimise disruption",
              ],
            },
            "This helps you move from uncertainty to a clear, informed decision.",
          ],
        },
        {
          heading: "How energiebee helps",
          blocks: [
            "energiebee helps you understand how your heating system behaves as part of your home's overall energy system.",
            "Instead of guessing, you can:",
            {
              items: [
                "Monitor how efficiently your current boiler is performing",
                "Identify where energy is being wasted in your heating system",
                "Simulate potential savings from upgrading",
                "Understand how a more modern system would improve your home's energy intelligence",
              ],
            },
            "This turns a boiler upgrade into a clear optimisation decision. And energiebee can help you with that.",
          ],
        },
        {
          heading: "Key insight",
          paragraphs: [
            "Your boiler doesn't just heat your home — it defines how efficiently your home uses energy.",
          ],
        },
      ],
      cta: { label: "Learn More" },
    },
  },
  {
    slug: "am-i-on-the-best-energy-tariff",
    category: "Tariffs",
    readTime: "7 min read",
    title: "Am I on the Best Energy Tariff?",
    description:
      "Find out if you are on the best energy tariff. Learn how tariff structures influence energy costs and how your home usage patterns affect savings with energiebee.",
    image: beeFlowerImg,
    imageAlt: "An energy bill and tariff comparison",
    author: { name: "Elliot Smith", date: "20 May 2026" },
    carouselIntro:
      "The best energy tariff depends on how and when you use energy.",
    carouselBody:
      "Different plans reward different usage patterns, and the right match can unlock significant savings and better alignment between your home and the energy system it connects to.",
    body: {
      sections: [
        {
          heading: "Quick answer",
          paragraphs: [
            "The best energy tariff for your home depends on how and when you use energy. Different plans reward different usage patterns, and the right match can unlock significant savings and better alignment between your home and the energy system it connects to.",
          ],
        },
        {
          heading: "Why this matters",
          paragraphs: [
            "Energy tariffs influence how your home connects to the energy system around it.",
            "Different plans create different conditions for how energy is priced and used. When you understand these conditions, your home can adapt its energy use in a more intentional and efficient way.",
            "This creates better alignment between consumption habits and energy costs.",
          ],
        },
        {
          heading: "How tariffs shape your home energy system",
          paragraphs: [
            "Each tariff creates a different operating environment for your home.",
          ],
        },
        {
          heading: "When energy is valued differently",
          blocks: [
            {
              items: [
                "Some plans reward energy use during specific hours",
                "Others distribute cost evenly across the day",
                "Time-based structures allow your home to adjust usage patterns",
              ],
            },
          ],
        },
        {
          heading: "How pricing structures affect your monthly energy flow",
          blocks: [
            {
              items: [
                "Fixed plans create stable and predictable costs",
                "Variable plans reflect changes in energy market conditions",
                "Each structure interacts differently with your daily consumption",
              ],
            },
          ],
        },
        {
          heading: "How usage patterns connect to savings potential",
          blocks: [
            {
              items: [
                "Homes with flexible consumption benefit from time-based pricing",
                "Shifting usage to specific moments improves efficiency outcomes",
                "Understanding usage patterns helps identify better alignment opportunities",
              ],
            },
          ],
        },
        {
          heading: "What you can do",
          blocks: [
            "To understand your optimal tariff setup:",
            {
              items: [
                "Review your current energy plan details",
                "Compare available alternatives in your region",
                "Observe when your home uses the most energy",
                "Match your consumption rhythm with tariff structure",
              ],
            },
            "This gives a clearer view of how your home interacts with energy pricing.",
          ],
        },
        {
          heading: "How energiebee helps",
          blocks: [
            "energiebee helps your home understand its energy usage patterns and how they align with different tariff structures.",
            "With energiebee you can:",
            {
              items: [
                "Track when and how your home consumes energy",
                "Identify usage patterns that influence tariff suitability",
                "Explore tariff options based on your real consumption profile",
                "Receive insights when better alignment opportunities appear",
              ],
            },
            "This turns tariff selection into a data-driven home energy decision.",
          ],
        },
        {
          heading: "Key insight",
          paragraphs: [
            "Your home's energy use and your tariff structure work together as one system.",
            "When both are aligned, your home operates with greater efficiency and more balanced energy costs.",
          ],
        },
      ],
      cta: { label: "Check Your Home's Potential Savings" },
    },
  },
];

const learn = createBlog(LEARN_ARTICLES);

export const getLearnArticleBySlug = learn.getBySlug;
export const getFeaturedLearnArticles = learn.getFeatured;
export const getLatestLearnArticles = learn.getLatest;
export const getRelatedLearnArticles = learn.getRelated;
export const getPublishedLearnSlugs = learn.getPublishedSlugs;
