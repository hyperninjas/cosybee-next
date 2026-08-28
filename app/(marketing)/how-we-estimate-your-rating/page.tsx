import type { Metadata } from "next";
import { Newsreader, Public_Sans, JetBrains_Mono } from "next/font/google";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import { pageMetadata } from "@/app/lib/seo";
import "./rating-estimate.css";

/**
 * The rating-estimate methodology document.
 *
 * Deliberately NOT built from the marketing primitives (Section/Container/
 * Typography). It is a long-form reference that gets read end to end and sent
 * to people who want to check our working, so it keeps its own editorial
 * treatment — serif headings, a ledger, the EPC band scale, the point tables.
 * The site header and footer come from the root layout, so it still sits
 * inside the site rather than beside it.
 *
 * Its stylesheet is a plain .css file whose every selector is prefixed with
 * `.rating-doc` (see the note at the top of rating-estimate.css). That keeps
 * the document's generic class names and bare element rules from leaking into
 * the rest of the app, which is the thing a CSS Module would otherwise buy us.
 */

/* Self-hosted through next/font so the document does not reach out to Google
 * at render time. Each family is bound to a CSS variable and referenced that
 * way in the stylesheet: next/font emits a hashed family name, so a bare
 * "Newsreader" in a font-family stack silently falls through to the fallback
 * (the same trap app/globals.css documents for Manrope). Only the weights the
 * stylesheet actually uses are requested. */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const PATH = "/how-we-estimate-your-rating";

export const metadata: Metadata = pageMetadata({
  title: "How we estimate your energy rating",
  description:
    "The full method behind an EnergieBee rating estimate: the nine questions, the points each answer carries, a worked example, and how the result compares against 583 real EPCs.",
  ogDescription:
    "Every home starts at 55. Here is exactly what moves the score, and how close the estimate lands to a real certificate.",
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "How we estimate your rating", path: PATH },
];

export default function HowWeEstimateYourRatingPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <div
        className={`rating-doc ${newsreader.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
      >
        <div className="wrap">
          <Breadcrumbs items={CRUMBS} className="pt-8" />
          <header className="mast">
            <p className="eyebrow">Methodology · For review</p>
            <h1>How Energiebee estimates an energy rating</h1>
            <p className="standfirst">
              When a home has no official Energy Performance Certificate, we ask the
              resident about their property and produce an estimate. This document sets
              out exactly how that figure is calculated, and how accurate it proves to
              be against real certificates.
            </p>
            <div className="meta">
              <span className="tag"
                >Validated against <strong>583</strong> real certificates</span
              >
              <span className="tag">Average error <strong>11.5 points</strong></span>
              <span className="tag">Scale <strong>A – G</strong></span>
            </div>
          </header>

          <section>
            <div className="sec-head">
              <span className="num">01</span>
              <h2>Why an estimate is needed</h2>
            </div>
            <div className="body-col">
              <p className="lede">
                Every home in England and Wales can have an EPC — a certificate scoring
                it 1 to 100, with a band from A to G. An accredited assessor visits the
                property and the result is lodged on a government register.
              </p>
              <p>
                Certificates are only created when a property is{" "}
                <strong>sold, let or newly built</strong>. A home that has been
                owner-occupied for twenty years may have none at all. When we cannot
                find one for an address, the resident would otherwise be left with an
                empty profile.
              </p>
              <p>
                So we ask them about their home and estimate the rating instead. It is
                labelled as an estimate throughout the app, and is never presented as an
                official certificate.
              </p>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <span className="num">02</span>
              <h2>The calculation</h2>
            </div>
            <div className="body-col">
              <p>
                Every home starts at <strong>55</strong> — a typical UK property. Each
                answer then moves the score up or down.
              </p>
            </div>

            <div className="formula">
              score = <span className="anchor">55</span
              ><span className="note"> ← starting point</span><br />
              + property type<br />
              + built form<br />
              + construction era<br />
              + wall insulation<br />
              + loft insulation<br />
              + glazing<br />
              + main heating<br />
              + hot water<br />
              + solar panels
            </div>

            <div className="body-col">
              <p>
                The result is capped between <strong>1 and 91</strong>. Nothing else is
                applied — no weighting, no adjustment, no hidden step.
              </p>
            </div>

            <h3>The points · the building — what kind of home it is</h3>
            <div className="grid">
              <div className="card">
                <div className="card-h">Property type</div>
                <div className="row"><span>Flat</span><span className="pts pos">+7</span></div>
                <div className="row">
                  <span>Maisonette</span><span className="pts pos">+5</span>
                </div>
                <div className="row"><span>House</span><span className="pts zero">0</span></div>
                <div className="row">
                  <span>Bungalow</span><span className="pts neg">−2</span>
                </div>
              </div>
              <div className="card">
                <div className="card-h">Built form</div>
                <div className="row">
                  <span>Mid terrace</span><span className="pts pos">+4</span>
                </div>
                <div className="row">
                  <span>End terrace</span><span className="pts pos">+1</span>
                </div>
                <div className="row">
                  <span>Semi-detached</span><span className="pts zero">0</span>
                </div>
                <div className="row">
                  <span>Detached</span><span className="pts neg">−3</span>
                </div>
              </div>
              <div className="card">
                <div className="card-h">Construction era</div>
                <div className="row">
                  <span>2003 onwards</span><span className="pts pos">+15</span>
                </div>
                <div className="row">
                  <span>1983 – 2002</span><span className="pts pos">+6</span>
                </div>
                <div className="row">
                  <span>1967 – 1982</span><span className="pts pos">+2</span>
                </div>
                <div className="row">
                  <span>1930 – 1966</span><span className="pts neg">−5</span>
                </div>
                <div className="row">
                  <span>Before 1930</span><span className="pts neg">−12</span>
                </div>
              </div>
            </div>
            <p className="gnote">
              A flat is surrounded by other heated homes, so it loses far less heat. A
              detached house has four walls facing outside; a mid-terrace has two.
            </p>

            <h3>The points · the fabric — how well it holds heat</h3>
            <div className="grid">
              <div className="card">
                <div className="card-h">Wall insulation</div>
                <div className="row">
                  <span>Cavity, filled</span><span className="pts pos">+6</span>
                </div>
                <div className="row">
                  <span>Solid, insulated</span><span className="pts pos">+2</span>
                </div>
                <div className="row">
                  <span>Cavity, none</span><span className="pts neg">−3</span>
                </div>
                <div className="row">
                  <span>Solid, none</span><span className="pts neg">−10</span>
                </div>
              </div>
              <div className="card">
                <div className="card-h">Loft insulation</div>
                <div className="row">
                  <span>Well insulated (200 mm+)</span><span className="pts pos">+8</span>
                </div>
                <div className="row">
                  <span>Another dwelling above</span><span className="pts pos">+6</span>
                </div>
                <div className="row">
                  <span>Partial (50 – 100 mm)</span><span className="pts neg">−3</span>
                </div>
                <div className="row"><span>None</span><span className="pts neg">−10</span></div>
              </div>
              <div className="card">
                <div className="card-h">Glazing</div>
                <div className="row">
                  <span>Triple glazed</span><span className="pts pos">+4</span>
                </div>
                <div className="row">
                  <span>Double glazed</span><span className="pts zero">0</span>
                </div>
                <div className="row">
                  <span>Single glazed</span><span className="pts neg">−8</span>
                </div>
              </div>
            </div>
            <p className="gnote">
              Walls are the largest heat-loss surface. A cavity wall has a gap that can
              be filled; a solid wall has none and is far harder to improve — which is
              why an insulated solid wall still scores below a filled cavity.
            </p>

            <h3>The points · the systems — how it makes heat</h3>
            <div className="grid">
              <div className="card">
                <div className="card-h">Main heating</div>
                <div className="row">
                  <span>Heat pump</span><span className="pts pos">+14</span>
                </div>
                <div className="row">
                  <span>Modern condensing boiler</span><span className="pts pos">+5</span>
                </div>
                <div className="row">
                  <span>Old boiler (pre-2000)</span><span className="pts neg">−3</span>
                </div>
                <div className="row">
                  <span>Oil boiler</span><span className="pts neg">−4</span>
                </div>
                <div className="row">
                  <span>Electric heaters</span><span className="pts neg">−5</span>
                </div>
                <div className="row">
                  <span>LPG boiler</span><span className="pts neg">−5</span>
                </div>
              </div>
              <div className="card">
                <div className="card-h">Hot water</div>
                <div className="row">
                  <span>No tank (combi)</span><span className="pts pos">+3</span>
                </div>
                <div className="row">
                  <span>Tank / cylinder</span><span className="pts zero">0</span>
                </div>
                <div className="row">
                  <span>Immersion heater</span><span className="pts neg">−5</span>
                </div>
              </div>
              <div className="card">
                <div className="card-h">Solar panels</div>
                <div className="row"><span>Yes</span><span className="pts pos">+10</span></div>
                <div className="row"><span>No</span><span className="pts zero">0</span></div>
              </div>
            </div>
            <p className="gnote">
              A heat pump delivers roughly three units of heat per unit of electricity.
              Electric and LPG score worst because the fuel is expensive per unit of
              heat, and EPC ratings follow running cost.
            </p>

            <div className="body-col">
              <p style={{ marginTop: 24 }}>
                Floor area and number of bedrooms are also collected, but do{" "}
                <strong>not</strong> affect the rating. They are used for heat-pump
                sizing and consumption estimates.
              </p>
            </div>

            <h3>Score to band</h3>
            <div className="scale">
              <div className="band b-a off">
                <span className="ltr">A</span><span className="rng">92 – 100</span
                ><span className="lbl">Not awarded</span>
              </div>
              <div className="band b-b">
                <span className="ltr">B</span><span className="rng">81 – 91</span>
              </div>
              <div className="band b-c">
                <span className="ltr">C</span><span className="rng">69 – 80</span>
              </div>
              <div className="band b-d">
                <span className="ltr">D</span><span className="rng">55 – 68</span>
              </div>
              <div className="band b-e">
                <span className="ltr">E</span><span className="rng">39 – 54</span>
              </div>
              <div className="band b-f">
                <span className="ltr">F</span><span className="rng">21 – 38</span>
              </div>
              <div className="band b-g">
                <span className="ltr">G</span><span className="rng">1 – 20</span>
              </div>
            </div>

            <div className="note-box">
              <p className="h">Why band A is never awarded</p>
              <p>
                The estimate is capped at 91, the top of band B. Fewer than 1% of UK
                homes reach band A, and a rating built from nine self-reported answers
                should not make that claim. Band A requires an official assessment.
              </p>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <span className="num">03</span>
              <h2>Worked example</h2>
            </div>
            <div className="body-col">
              <p>
                <strong>20 Bargrove Avenue, Hemel Hempstead HP1 1QP</strong> — a real
                property whose official certificate rates it{" "}
                <strong>34, band F</strong>.
              </p>
            </div>

            <div className="ledger">
              <div className="lr start">
                <span>Starting point</span><span></span><span className="pts">55</span
                ><span className="run">55</span>
              </div>
              <div className="lr">
                <span>Property type</span><span>House</span
                ><span className="pts zero">0</span><span className="run">55</span>
              </div>
              <div className="lr">
                <span>Built form</span><span>Detached</span
                ><span className="pts neg">−3</span><span className="run">52</span>
              </div>
              <div className="lr">
                <span>Construction era</span><span>1930 – 1966</span
                ><span className="pts neg">−5</span><span className="run">47</span>
              </div>
              <div className="lr">
                <span>Wall insulation</span><span>Solid, none</span
                ><span className="pts neg">−10</span><span className="run">37</span>
              </div>
              <div className="lr">
                <span>Loft insulation</span><span>None</span
                ><span className="pts neg">−10</span><span className="run">27</span>
              </div>
              <div className="lr">
                <span>Glazing</span><span>Double</span><span className="pts zero">0</span
                ><span className="run">27</span>
              </div>
              <div className="lr">
                <span>Main heating</span><span>Condensing boiler</span
                ><span className="pts pos">+5</span><span className="run">32</span>
              </div>
              <div className="lr">
                <span>Hot water</span><span>Cylinder</span
                ><span className="pts zero">0</span><span className="run">32</span>
              </div>
              <div className="lr">
                <span>Solar panels</span><span>No</span><span className="pts zero">0</span
                ><span className="run">32</span>
              </div>
              <div className="lr total">
                <span>Estimate</span><span></span><span className="pts">32</span
                ><span className="run"></span>
              </div>
            </div>
            <p className="verdict">
              <span className="chip" style={{ background: "var(--band-f)" }}>32 · F</span>{" "}
              estimated{" "}
              <span className="chip" style={{ background: "var(--band-f)" }}>34 · F</span>{" "}
              official certificate
            </p>
            <div className="body-col">
              <p style={{ marginTop: 16 }}>Two points apart, same band.</p>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <span className="num">04</span>
              <h2>When only one question is answered</h2>
            </div>
            <div className="body-col">
              <p className="lede">
                To keep sign-up short, onboarding asks a single question: when the home
                was built. The remaining answers are filled in with what a property of
                that age typically has.
              </p>
            </div>

            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Era</th>
                    <th>Walls</th>
                    <th>Loft</th>
                    <th>Glazing</th>
                    <th>Heating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Before 1930</td>
                    <td>Solid, uninsulated</td>
                    <td>Partial</td>
                    <td>Double</td>
                    <td>Old boiler</td>
                  </tr>
                  <tr>
                    <td>1930 – 1966</td>
                    <td>Cavity, unfilled</td>
                    <td>Partial</td>
                    <td>Double</td>
                    <td>Condensing</td>
                  </tr>
                  <tr>
                    <td>1967 – 1982</td>
                    <td>Cavity, unfilled</td>
                    <td>Partial</td>
                    <td>Double</td>
                    <td>Condensing</td>
                  </tr>
                  <tr>
                    <td>1983 – 2002</td>
                    <td>Cavity, filled</td>
                    <td>Well insulated</td>
                    <td>Double</td>
                    <td>Condensing</td>
                  </tr>
                  <tr>
                    <td>2003 onwards</td>
                    <td>Cavity, filled</td>
                    <td>Well insulated</td>
                    <td>Double</td>
                    <td>Condensing</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="body-col">
              <p>
                The resident can improve the estimate at any point through{" "}
                <strong>“Refine my estimate”</strong>, which asks all eleven questions.
              </p>
            </div>

            <div className="note-box">
              <p className="h">This mirrors official practice</p>
              <p>
                An assessor who cannot inspect part of a property does not guess — the
                official methodology supplies a value based on the property’s age. On
                real certificates,
                <strong
                  >57% of building-fabric entries are recorded as “assumed”</strong
                >
                for exactly this reason.
              </p>
              <p style={{ marginTop: 14 }}>
                Assumptions are never chosen to flatter the result. They reflect what is
                typical. If an assumption scored better than the true answer, a resident
                would be penalised for answering honestly.
              </p>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <span className="num">05</span>
              <h2>Answers we reject or query</h2>
            </div>
            <div className="body-col">
              <p>
                Some combinations describe a home that cannot exist. Others are possible
                but unusual. We treat the two differently.
              </p>
            </div>

            <h3>Rejected — not possible</h3>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Combination</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Built 2003+, single glazing</td>
                    <td className="why">
                      Single glazing has not been permitted in new homes since 1994
                    </td>
                  </tr>
                  <tr>
                    <td>Built 2003+, pre-2000 boiler</td>
                    <td className="why">The boiler would predate the house</td>
                  </tr>
                  <tr>
                    <td>“Another dwelling above” on a house</td>
                    <td className="why">
                      A house is the whole building — nothing sits above it
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Queried — the resident confirms and continues</h3>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Combination</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Built 2003+, uninsulated walls</td>
                    <td className="why">
                      Wall insulation required in new homes since 1995
                    </td>
                  </tr>
                  <tr>
                    <td>Built 2003+, little or no loft insulation</td>
                    <td className="why">
                      Loft insulation required in new homes since 2002
                    </td>
                  </tr>
                  <tr>
                    <td>Built before 1930, cavity walls</td>
                    <td className="why">
                      Cavity construction became common only from the 1930s
                    </td>
                  </tr>
                  <tr>
                    <td>Solid walls, built 1967 or later</td>
                    <td className="why">Solid wall construction had largely stopped</td>
                  </tr>
                  <tr>
                    <td>Flat with oil or LPG heating</td>
                    <td className="why">Both need an outdoor storage tank</td>
                  </tr>
                  <tr>
                    <td>Flat with a heat pump</td>
                    <td className="why">Needs an outdoor unit and permission to install</td>
                  </tr>
                  <tr>
                    <td>Heat pump with a combi system</td>
                    <td className="why">Heat pumps need a hot water cylinder</td>
                  </tr>
                  <tr>
                    <td>Solar panels on a flat</td>
                    <td className="why">Block roofs are usually communal</td>
                  </tr>
                  <tr>
                    <td>Floor area outside a plausible range</td>
                    <td className="why">Catches a mistyped figure</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="body-col">
              <p>
                We deliberately query rather than reject in these cases. UK housing has
                genuine exceptions everywhere, and refusing an unusual-but-real answer
                would lock out real homes.
              </p>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <span className="num">06</span>
              <h2>How accurate it is</h2>
            </div>
            <div className="body-col">
              <p className="lede">
                We test by taking homes that <em>do</em> have an official certificate,
                entering their details into our estimator, and comparing the two.
              </p>
            </div>

            <div className="stats">
              <div className="stat lead">
                <p className="k">Energiebee</p>
                <p className="v">11.5</p>
                <p className="s">Average error, 583 certificates</p>
              </div>
              <div className="stat">
                <p className="k">epcguide.com</p>
                <p className="v">11.8</p>
                <p className="s">Comparable public tool</p>
              </div>
              <div className="stat">
                <p className="k">Two assessors</p>
                <p className="v">≈11</p>
                <p className="s">How far real surveys of the same home differ</p>
              </div>
            </div>

            <h3>A sample across the full range</h3>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th className="n">Official EPC</th>
                    <th className="n">Energiebee</th>
                    <th className="n">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2d Milner Road, SW19</td>
                    <td className="n">87 · B</td>
                    <td className="n">90 · B</td>
                    <td className="n">+3</td>
                  </tr>
                  <tr>
                    <td>2 Cobden Close, BB7</td>
                    <td className="n">84 · B</td>
                    <td className="n">91 · B</td>
                    <td className="n">+7</td>
                  </tr>
                  <tr>
                    <td>17 Chronicle House, CH1</td>
                    <td className="n">81 · B</td>
                    <td className="n">84 · B</td>
                    <td className="n">+3</td>
                  </tr>
                  <tr>
                    <td>59 Bleasdale Street, OL2</td>
                    <td className="n">74 · C</td>
                    <td className="n">72 · C</td>
                    <td className="n">−2</td>
                  </tr>
                  <tr>
                    <td>53 Bleasdale Street, OL2</td>
                    <td className="n">69 · C</td>
                    <td className="n">72 · C</td>
                    <td className="n">+3</td>
                  </tr>
                  <tr>
                    <td>1 Delaval Terrace, NE3</td>
                    <td className="n">58 · D</td>
                    <td className="n">64 · D</td>
                    <td className="n">+6</td>
                  </tr>
                  <tr>
                    <td>37 Delaval Terrace, NE3</td>
                    <td className="n">57 · D</td>
                    <td className="n">51 · E</td>
                    <td className="n">−6</td>
                  </tr>
                  <tr>
                    <td>32 Bargrove Avenue, HP1</td>
                    <td className="n">45 · E</td>
                    <td className="n">42 · E</td>
                    <td className="n">−3</td>
                  </tr>
                  <tr>
                    <td>18 Bargrove Avenue, HP1</td>
                    <td className="n">36 · F</td>
                    <td className="n">45 · E</td>
                    <td className="n">+9</td>
                  </tr>
                  <tr className="hl">
                    <td><strong>20 Bargrove Avenue, HP1</strong></td>
                    <td className="n"><strong>34 · F</strong></td>
                    <td className="n"><strong>32 · F</strong></td>
                    <td className="n"><strong>−2</strong></td>
                  </tr>
                  <tr>
                    <td>Flat 7, BN2</td>
                    <td className="n">32 · F</td>
                    <td className="n">37 · F</td>
                    <td className="n">+5</td>
                  </tr>
                  <tr>
                    <td>18 Milner Road, SW19</td>
                    <td className="n">21 · F</td>
                    <td className="n">25 · F</td>
                    <td className="n">+4</td>
                  </tr>
                  <tr>
                    <td>Westwood, BB7</td>
                    <td className="n">18 · G</td>
                    <td className="n">19 · G</td>
                    <td className="n">+1</td>
                  </tr>
                  <tr>
                    <td>Flat 2, LE2</td>
                    <td className="n">12 · G</td>
                    <td className="n">20 · G</td>
                    <td className="n">+8</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="body-col">
              <p>
                Fourteen of thirty shown. Across all thirty the average error is 8.6
                points, with the correct band in 17 cases.
              </p>
            </div>

            <div className="note-box">
              <p className="h">Context for these figures</p>
              <p>
                An estimate cannot match a survey exactly — and surveys do not match
                each other either. Published research finds that
                <strong
                  >two accredited assessors inspecting the same property differ by
                  around 11 points on average</strong
                >, and that between 36% and 62% of official certificates contain at
                least one identifiable error.
              </p>
              <p style={{ marginTop: 14 }}>
                Our average error sits within the range by which two qualified
                professionals disagree.
              </p>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <span className="num">07</span>
              <h2>Where it is weakest</h2>
            </div>
            <div className="body-col">
              <p>We are open about the limitations.</p>
              <ul>
                <li>
                  <strong>Older homes are under-rated.</strong> The model treats age as
                  a strong negative, but most pre-1930 homes have been improved — 93%
                  have a modern condensing boiler and 42% a well-insulated loft. This is
                  the largest known issue; a correction has been measured but not yet
                  applied.
                </li>
                <li>
                  <strong>Poorly performing homes are over-rated</strong> by roughly 12
                  points. Homes are poor in ways nine questions cannot capture —
                  draughts, unheated rooms, faulty controls.
                </li>
                <li>
                  <strong>Flats are less accurate than houses.</strong> A flat in a
                  block is surrounded by heated neighbours, and the model does not fully
                  capture that.
                </li>
                <li>
                  <strong>It is a rating, not a survey.</strong> Use it to guide
                  decisions and prioritise improvements. Selling, letting and most grant
                  applications require an official EPC.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="sec-head">
              <span className="num">08</span>
              <h2>Basis of the method</h2>
            </div>
            <div className="body-col">
              <p>
                The scoring reflects the same factors an official assessment considers —
                insulation, heating, glazing, hot water and property form — and uses the
                standard UK band scale.
              </p>
              <p>
                It is <strong>not</strong> the government’s official SAP/RdSAP
                calculation, which requires 50 to 100 measured inputs and a property
                inspection. It is a simplified model, benchmarked against a comparable
                public estimator and validated against 583 real certificates as set out
                above.
              </p>
            </div>
          </section>

          <div className="doc-foot">
            <p>
              Every figure in this document traces to the underlying calculation and to
              the certificates used to validate it.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
