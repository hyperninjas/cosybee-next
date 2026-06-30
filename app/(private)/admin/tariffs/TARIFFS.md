# Tariff Catalog — features & how to use it

The Tariff manager (`/admin/tariffs`) is where you browse and maintain the UK
energy **tariff catalog**: each **provider**, their **tariffs** (packages), and
each tariff's **prices broken down by the 14 GB electricity regions**.

A few things to know up front:
- **Prices are in pence.** Unit rates are **p/kWh**; standing charges are
  **p/day** (e.g. `27.883` = 27.883p per kWh). Values keep up to **3 decimals**.
- **Great Britain only** — the 14 distribution regions cover England, Scotland
  and Wales. Northern Ireland isn't included.
- Rate data is **sparse** — a tariff may have electricity but no gas, or only
  some regions filled in. Blank cells (`—`) are normal.

---

## Finding a tariff

There are **two linked dropdowns** at the top:

1. **Provider** — pick the supplier. It shows the **full provider list as soon
   as you focus it** (each row shows a ★ if the provider is *popular* and its
   tariff count); start typing to filter.
2. **Tariff** — enabled once a provider is chosen; it shows **all of that
   provider's tariffs** on focus and filters as you type.

Pick a tariff to load its rates. (Both dropdowns list everything up front, so
you can browse without knowing the exact name.)

## Viewing a tariff's rates

Selecting a tariff shows its **regional rates table** — one row per GB region
(all 14), with columns:

| Group | Columns |
|-------|---------|
| Electricity | Unit (p/kWh), Standing charge (p/day) |
| Economy 7 | Day, Night (p/kWh), Standing charge (p/day) |
| Time of use | Peak, Off-peak (p/kWh) |
| Gas | Unit (p/kWh), Standing charge (p/day) |

Empty values show as **—**. The header shows the tariff's **type**, **fuel**,
and its **provider**.

## Editing a region's rates

Rates are edited **one region at a time**:

1. Click the **Edit** (pencil) action on a region's row.
2. A panel opens — on desktop it slides in **beside the table**; on small
   screens it opens as a **popup**. It groups the inputs (Electricity / Economy
   7 / Time of use / Gas).
3. Enter values (pence; up to 3 decimals; leave a field **blank to clear** it).
4. **Save region** — the change is written and the table updates immediately.

Guards:
- If you have **unsaved changes** and try to switch to another region, close the
  panel, or leave the page, you'll get a **confirm** so you don't lose edits.
  (A browser reload shows the browser's own “leave site?” prompt.)
- Values must be **0 or more** and **≤ 9999.999**; out-of-range entries are
  rejected with a message.

## Creating a new tariff

Click **+ New tariff**. A tariff is a package a provider offers, so you set:

- **Provider** — pick an existing one, **or type a new name** to create it on
  the fly (find-or-create).
- **Name**, **Type** (Fixed / Variable / Tracker / Agile / Economy 7 / Time of
  use / EV / Heat pump / Export), **Payment** (Direct debit / On receipt),
  **Fuel** (Dual fuel / Electricity only — optional).
- Optional free-text: **Term**, **Effective date**, **Exit fee**, **Off-peak
  hours**, **Note**, and a **Smart meter required** toggle.

It's created without rates — then **select it and fill in the regional rates**
using the table above.

## Editing a provider

With a tariff selected, click **Edit provider** (next to the provider name) to
change the provider itself:

- **Name**
- **Acquired by** — set the acquiring brand to mark the provider *acquired*
  (bought out, no new tariffs); leave blank to keep it active.
- **Note**
- **Popular provider** toggle — controls the ★ star.

## Deleting a tariff

With a tariff selected, click **Delete**. To prevent accidents, it's a
**type-to-confirm** dialog: you must type the tariff's exact name (it also shows
how many regional rates will be removed) before the delete button enables.

## Where the data comes from

The catalog was first **imported in bulk** from a dataset, then maintained here.
Providers shared with the rest of the app are the same records, so edits here
are consistent everywhere. (Deeper notes live in the backend docs.)

---

### Tips
- **Search by provider** to pull up all of a company's tariffs at once.
- Fill **electricity + standing charge** at minimum; add gas/E7/TOU only where
  the tariff actually offers them.
- Re-typing an existing provider name in **New tariff** reuses that provider —
  it won't create a duplicate (exact-name match).
- Use **Edit provider → Popular** to surface key suppliers (★).
